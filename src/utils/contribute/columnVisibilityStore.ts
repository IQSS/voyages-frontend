/**
 * Persists the Edit Requests grid's column visibility to localStorage so an
 * editor's choice survives reloads. AG Grid Community has no columns tool
 * panel, so this backs the custom Columns control instead.
 *
 * Shape: a map of colId -> hidden (true = hidden). Every read and write is
 * wrapped: storage can be unavailable (private windows, disabled site data) and
 * the grid must still render with its default columns when it is.
 */
const STORAGE_KEY = 'editRequests.columnVisibility.v1';

export type ColumnVisibility = Record<string, boolean>;

export const loadColumnVisibility = (): ColumnVisibility | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as ColumnVisibility)
      : null;
  } catch {
    return null;
  }
};

export const saveColumnVisibility = (visibility: ColumnVisibility): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility));
  } catch {
    // Storage unavailable or full — the choice just will not persist.
  }
};

export const clearColumnVisibility = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to recover from — a failed clear leaves the old value, which the
    // caller is about to overwrite by applying defaults anyway.
  }
};
