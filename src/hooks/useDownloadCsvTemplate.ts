import { useState, useCallback } from 'react';

import { UploadEntity } from '@/fetch/contributeFetch/batchUploadApi';
import {
  fetchTemplateHeaders,
  buildTemplateCsvBlob,
  triggerBlobDownload,
} from '@/utils/contribute/csvTemplateUtils';

interface UseDownloadCsvTemplateResult {
  /** Call this to fetch headers and trigger the CSV download. */
  download: (entity: UploadEntity) => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook that fetches the canonical CSV column headers from the backend and
 * triggers a browser download of a blank template file.
 *
 * Usage:
 *   const { download, loading, error } = useDownloadCsvTemplate();
 *   <button onClick={() => download('Voyage')} disabled={loading}>
 *     Download template
 *   </button>
 */
export function useDownloadCsvTemplate(): UseDownloadCsvTemplateResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = useCallback(async (entity: UploadEntity) => {
    setLoading(true);
    setError(null);
    try {
      const headers = await fetchTemplateHeaders(entity);
      if (headers.length === 0) {
        throw new Error(
          'No headers returned from server. Check that your account has Editor privileges.',
        );
      }
      const blob = buildTemplateCsvBlob(headers);
      triggerBlobDownload(blob, `${entity}_template.csv`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to download template';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { download, loading, error };
}
