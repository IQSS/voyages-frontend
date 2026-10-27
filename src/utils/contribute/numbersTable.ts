/**
 * The text a numbers-table cell shows for a stored value.
 *
 * Values typed into the table are stored as numbers, but the bulk importer
 * stores each cell as the CSV's text -- `"4"`, not `4`. Showing numbers only
 * left every imported voyage's Age and sex table blank, while the changes
 * panel, which prints any value, showed the figures (DD-0560). So a number, or
 * text that reads as one, is shown; anything else is blank.
 */
export const tableCellText = (value: unknown): string => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toString() : '';
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed !== '' && Number.isFinite(Number(trimmed)) ? trimmed : '';
  }
  return '';
};
