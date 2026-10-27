import { useCallback, useEffect, useRef, useState } from 'react';

import {
  HttpError,
  InspectResult,
  TrackedMappingError,
  UploadEntity,
  UploadJobStatus,
  UploadMetadata,
  inspectBatchedContributions,
  pollUploadJob,
  uploadBatchedContributions,
} from '@/fetch/contributeFetch/batchUploadApi';
import { useDownloadCsvTemplate } from '@/hooks/useDownloadCsvTemplate';

const POLL_INTERVAL_MS = 5000;

export const SUPPORTED_ENTITIES: UploadEntity[] = ['Voyage'];

/**
 * Parse the header row of a CSV file (client-side, first 64 KB only) and
 * return the header names that appear more than once. The backend inspect
 * endpoint only reports missing/unknown columns — it cannot tell the user
 * that a "missing" column is actually present under a duplicated name
 * (e.g. a second `arrport` column that should have been `arrport2`).
 */
async function findDuplicateHeaders(file: File): Promise<string[]> {
  // The header row is always the first line; 64 KB is more than enough.
  const text = await file.slice(0, 64 * 1024).text();
  const firstLine = text.split(/\r?\n/, 1)[0].replace(/^\uFEFF/, '');

  // Minimal CSV field parser for a single line (handles quoted fields).
  const headers: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < firstLine.length; i++) {
    const ch = firstLine[i];
    if (inQuotes) {
      if (ch === '"') {
        if (firstLine[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      headers.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  headers.push(current);

  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const raw of headers) {
    const name = raw.trim();
    if (!name) continue;
    if (seen.has(name)) duplicates.add(name);
    seen.add(name);
  }
  return [...duplicates];
}

export interface UseBatchUploadOptions {
  /**
   * Called when a job finishes with status "completed".
   * Useful for modals that want to auto-close on success without polling
   * jobStatus themselves.
   */
  onUploadSuccess?: () => void;
  /** Existing batch titles used to warn about duplicates. */
  existingBatchTitles?: string[];
}

export interface UseBatchUploadReturn {
  // Template download
  templateLoading: boolean;
  templateError: string | null;
  downloadTemplate: (entity: UploadEntity) => void;

  // Entity selection
  selectedEntity: UploadEntity;
  setSelectedEntity: (entity: UploadEntity) => void;

  // File selection
  selectedFile: File | null;
  dragging: boolean;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: () => void;
  clearFile: () => void;

  // Inspect (pre-upload validation)
  inspecting: boolean;
  inspectResult: InspectResult | null;
  inspectError: string | null;
  /** Header names that appear more than once in the CSV — blocks upload. */
  duplicateColumns: string[];
  /**
   * True when the file has missing required columns or duplicate headers —
   * blocks upload.
   */
  hasBlockingErrors: boolean;
  /** Non-null when the auto-generated batch title matches an existing batch. */
  duplicateTitleWarning: string | null;

  // Upload & polling
  uploading: boolean;
  uploadError: string | null;
  jobStatus: UploadJobStatus | null;
  /**
   * Start the upload. Pass optional overrides for the batch title and comments
   * so callers (e.g. CreateBatchModal) can use their own form values instead of
   * the auto-generated ones.
   */
  handleUpload: (
    batchTitleOverride?: string,
    batchCommentsOverride?: string,
  ) => Promise<void>;

  // Derived state
  progressPercent: number;
  isTerminal: boolean;

  // Import warnings dialog: non-null when the first ('abort') attempt reported
  // mapping problems and imported nothing. The editor then either cancels or
  // imports anyway (re-uploads with 'continue').
  importWarnings: TrackedMappingError[] | null;
  importAnyway: () => Promise<void>;
  dismissWarnings: () => void;
}

export function useBatchUpload(
  options?: UseBatchUploadOptions,
): UseBatchUploadReturn {
  const {
    download: downloadTemplate,
    loading: templateLoading,
    error: templateError,
  } = useDownloadCsvTemplate();

  const [selectedEntity, setSelectedEntity] = useState<UploadEntity>('Voyage');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  // Inspect state — populated automatically after a file is selected
  const [inspecting, setInspecting] = useState(false);
  const [inspectResult, setInspectResult] = useState<InspectResult | null>(
    null,
  );
  const [inspectError, setInspectError] = useState<string | null>(null);

  // Headers that appear more than once in the CSV (detected client-side)
  const [duplicateColumns, setDuplicateColumns] = useState<string[]>([]);

  // Warning when the auto-generated title already exists in a batch
  const [duplicateTitleWarning, setDuplicateTitleWarning] = useState<
    string | null
  >(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<UploadJobStatus | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeJobIdRef = useRef<string | null>(null);

  // Clean up polling timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  // ── Inspect (pre-upload validation) ────────────────────────────────────────

  /**
   * Call the backend inspect endpoint for the given file + entity and store
   * the result. Non-fatal — an inspect error shows a warning but does not
   * prevent upload (the backend will catch the real errors on submit).
   */
  const runInspect = useCallback(async (file: File, entity: UploadEntity) => {
    setInspecting(true);
    setInspectResult(null);
    setInspectError(null);
    try {
      const result = await inspectBatchedContributions(entity, file);
      setInspectResult(result);
    } catch (err) {
      if (err instanceof HttpError && err.status === 403) {
        setInspectError(
          'Your account needs Editor privileges to validate files. ' +
            'Ask your admin to grant the Editor role in Supabase (Authentication → Users → edit app_metadata).',
        );
      } else {
        setInspectError(
          'Could not validate your file against the schema. You may still upload, but errors may occur.',
        );
      }
    } finally {
      setInspecting(false);
    }
  }, []);

  const checkDuplicateTitle = (file: File, entity: UploadEntity) => {
    const baseName = file.name.replace(/\.csv$/i, '');
    const autoTitle = `${entity} import – ${baseName}`;
    const existing = options?.existingBatchTitles ?? [];
    if (
      existing.some(
        (t) => t.trim().toLowerCase() === autoTitle.trim().toLowerCase(),
      )
    ) {
      setDuplicateTitleWarning(
        `A batch named "${autoTitle}" already exists. Rename the file or update the existing batch before uploading.`,
      );
    } else {
      setDuplicateTitleWarning(null);
    }
  };

  // Re-inspect and re-check duplicate title when the entity or the async
  // existingBatchTitles list changes. Logic is inlined to avoid depending on
  // the checkDuplicateTitle function reference (which changes every render).
  useEffect(() => {
    if (!selectedFile) return;
    runInspect(selectedFile, selectedEntity);
    const baseName = selectedFile.name.replace(/\.csv$/i, '');
    const autoTitle = `${selectedEntity} import – ${baseName}`;
    const existing = options?.existingBatchTitles ?? [];
    if (
      existing.some(
        (t) => t.trim().toLowerCase() === autoTitle.trim().toLowerCase(),
      )
    ) {
      setDuplicateTitleWarning(
        `A batch named "${autoTitle}" already exists. Rename the file or update the existing batch before uploading.`,
      );
    } else {
      setDuplicateTitleWarning(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntity, options?.existingBatchTitles]);

  // ── File selection ──────────────────────────────────────────────────────────

  const acceptFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError(
        'Only CSV files are supported. Please export your data as CSV before uploading.',
      );
      return;
    }
    setSelectedFile(file);
    setUploadError(null);
    setJobStatus(null);
    setInspectResult(null);
    setDuplicateColumns([]);
    setDuplicateTitleWarning(null);

    checkDuplicateTitle(file, selectedEntity);
    // Kick off pre-upload validation immediately so the user gets feedback
    // before they click Upload.
    runInspect(file, selectedEntity);
    // Detect duplicated header names client-side — the backend inspect only
    // reports missing/unknown columns, so without this the user can't tell
    // that a "missing" column is actually a mis-named duplicate.
    findDuplicateHeaders(file)
      .then(setDuplicateColumns)
      .catch(() => setDuplicateColumns([]));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) acceptFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) acceptFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const clearFile = () => {
    setSelectedFile(null);
    setUploadError(null);
    setJobStatus(null);
    setInspectResult(null);
    setInspectError(null);
    setDuplicateColumns([]);
    setDuplicateTitleWarning(null);
  };

  // ── Upload & polling ────────────────────────────────────────────────────────

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    activeJobIdRef.current = null;
  };

  const startPolling = (jobId: string) => {
    activeJobIdRef.current = jobId;
    // We use recursive setTimeout instead of setInterval so that we always
    // wait for the previous GET response before scheduling the next request.
    // This prevents overlapping requests if the server is slow to respond.
    const tick = async () => {
      // Bail out if a newer upload has superseded this polling loop.
      if (activeJobIdRef.current !== jobId) return;
      try {
        // Ask the backend how the job is progressing.
        const status = await pollUploadJob(jobId);
        // Guard again after the await — a new upload may have started while
        // this request was in-flight.
        if (activeJobIdRef.current !== jobId) return;
        setJobStatus(status);

        if (status.status === 'completed' || status.status === 'failed') {
          // Job is done — stop polling and let the UI show the final result.
          setUploading(false);
          stopPolling();
          // Notify the caller (e.g. a modal) so it can auto-close on success.
          if (status.status === 'completed') {
            options?.onUploadSuccess?.();
          }
        } else {
          // Job is still running — wait POLL_INTERVAL_MS then check again.
          pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
        }
      } catch {
        if (activeJobIdRef.current !== jobId) return;
        // Network or server error — stop polling and surface the message.
        setUploading(false);
        setUploadError(
          'Failed to poll job status. Please refresh and check your batches.',
        );
        stopPolling();
      }
    };

    // Kick off the first poll after the initial delay.
    pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
  };

  // The title/comments of the last upload, so "Import anyway" can re-send the
  // same file with the same batch name (onError: 'continue') after the first
  // 'abort' attempt reported problems.
  const lastUploadRef = useRef<{ title: string; comments: string } | null>(
    null,
  );

  const startUpload = async (
    batchTitle: string,
    batchComments: string,
    onError: 'abort' | 'continue',
  ) => {
    if (!selectedFile) return;
    stopPolling();
    setUploading(true);
    setUploadError(null);
    setJobStatus(null);

    const metadata: UploadMetadata = {
      contribStatus: 0,
      onError,
      batchTitle,
      batchComments,
    };

    try {
      const { jobId } = await uploadBatchedContributions(
        selectedEntity,
        selectedFile,
        metadata,
      );
      setJobStatus({
        jobId,
        status: 'pending',
        entityName: selectedEntity,
        filename: selectedFile.name,
        progress: { total: 0, processed: 0 },
      });
      startPolling(jobId);
    } catch (err) {
      setUploading(false);
      setUploadError(
        err instanceof Error ? err.message : 'Upload failed. Please try again.',
      );
    }
  };

  const handleUpload = async (
    batchTitleOverride?: string,
    batchCommentsOverride?: string,
  ) => {
    if (!selectedFile) return;
    const baseName = selectedFile.name.replace(/\.csv$/i, '');
    // Use caller-supplied title/comments when available (e.g. CreateBatchModal
    // passes the values the user typed in Step 1). Fall back to auto-generated
    // names for the standalone BatchUploadPage.
    const batchTitle =
      batchTitleOverride?.trim() || `${selectedEntity} import – ${baseName}`;
    const batchComments =
      batchCommentsOverride?.trim() ||
      `Bulk import of ${selectedEntity} from ${selectedFile.name}`;
    lastUploadRef.current = { title: batchTitle, comments: batchComments };
    // First attempt aborts on any mapping problem, so nothing is written while
    // there is still a question to put to the editor (the import warnings).
    await startUpload(batchTitle, batchComments, 'abort');
  };

  // "Import anyway": re-send the same file and batch name, this time importing
  // every row the server can read (onError: 'continue'). The aborted first
  // attempt created no batch and no contributions, so re-using the title is safe.
  const importAnyway = async () => {
    const last = lastUploadRef.current;
    if (!last) return;
    await startUpload(last.title, last.comments, 'continue');
  };

  // "Cancel" the warnings: discard the aborted job (nothing was imported) and
  // return to the file view so the editor can fix the CSV and upload again.
  const dismissWarnings = () => {
    stopPolling();
    setUploading(false);
    setJobStatus(null);
  };

  // ── Derived state ───────────────────────────────────────────────────────────

  /**
   * Upload is blocked when required columns are missing or when the file has
   * duplicated header names. Unknown/extra columns are a warning only.
   */
  const hasBlockingErrors =
    (inspectResult?.mappingHeadersNotInCsv.length ?? 0) > 0 ||
    duplicateColumns.length > 0;

  const progressPercent =
    jobStatus && jobStatus.progress.total > 0
      ? Math.round(
          (jobStatus.progress.processed / jobStatus.progress.total) * 100,
      )
      : 0;

  const isTerminal =
    jobStatus?.status === 'completed' || jobStatus?.status === 'failed';

  // When the first ('abort') attempt failed because rows named things the
  // server could not match (not a real crash), these are the problems to put in
  // the warnings dialog. Null otherwise — a genuine failure still shows
  // failureReason in the red box.
  const importWarnings =
    jobStatus?.status === 'failed' && (jobStatus.errors?.length ?? 0) > 0
      ? jobStatus.errors!
      : null;

  return {
    templateLoading,
    templateError,
    downloadTemplate,
    selectedEntity,
    setSelectedEntity,
    selectedFile,
    dragging,
    handleFileChange,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    clearFile,
    inspecting,
    inspectResult,
    inspectError,
    duplicateColumns,
    hasBlockingErrors,
    duplicateTitleWarning,
    uploading,
    uploadError,
    jobStatus,
    handleUpload,
    progressPercent,
    isTerminal,
    importWarnings,
    importAnyway,
    dismissWarnings,
  };
}
