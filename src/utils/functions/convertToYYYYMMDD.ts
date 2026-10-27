/** Format the API's sparse dates without inventing missing components. */
export function convertToYYYYMMDD(value: string | number | null | undefined): string {
  const text = String(value ?? '').trim();
  if (!text) return '--';

  const complete = /^(\d{1,2})\s*,\s*(\d{1,2})\s*,\s*(\d{1,4})$/.exec(text);
  if (complete) {
    const [, month, day, year] = complete;
    if (+month >= 1 && +month <= 12 && +day >= 1 && +day <= 31) {
      return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return text;
  }

  const partial = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,4})$/.exec(text);
  if (partial) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${partial[2].padStart(4, '0')}-${String(months.indexOf(partial[1]) + 1).padStart(2, '0')}`;
  }
  return text;
}
