import {
  HttpError,
  inspectBatchedContributions,
  UploadEntity,
} from '@/fetch/contributeFetch/batchUploadApi';

/**
 * Calls the backend inspect endpoint with an empty CSV file so that every
 * expected header comes back as a "missing" header. Returns the ordered list
 * of column names the backend accepts for the given entity.
 *
 * Requires an authenticated Editor-role session in Supabase app_metadata.
 * Throws a user-friendly error if the role is missing (403).
 */
export async function fetchTemplateHeaders(
  entity: UploadEntity,
): Promise<string[]> {
  // Send a CSV with no columns — the backend will report every expected header
  // as missing, giving us the full canonical column list.
  const emptyFile = new File([''], `${entity}_empty.csv`, { type: 'text/csv' });
  try {
    const result = await inspectBatchedContributions(entity, emptyFile);
    return result.mappingHeadersNotInCsv;
  } catch (err) {
    if (err instanceof HttpError && err.status === 403) {
      throw new Error(
        'Your account needs Editor privileges to download the template. ' +
          'Ask your admin to grant the Editor role in Supabase (Authentication → Users → edit app_metadata).',
      );
    }
    throw err;
  }
}

/**
 * Builds a CSV Blob containing only the header row for the given columns.
 * The file is ready to download and re-upload once data rows are added.
 */
export function buildTemplateCsvBlob(headers: string[]): Blob {
  const csvContent = headers.join(',') + '\n';
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Triggers a browser file download for the given Blob.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
