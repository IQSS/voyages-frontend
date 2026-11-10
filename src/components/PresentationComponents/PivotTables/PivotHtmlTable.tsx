import React, { useMemo } from 'react';

import {
  PivotCrosstabResponse,
  PivotSort,
} from '@/share/InterfaceTypePivotTable';
import '@/style/pivot-table.scss';

interface PivotHtmlTableProps {
  table: PivotCrosstabResponse;
  sort: PivotSort | null;
  onSort: (column: string | null) => void;
  page: number;
  pageSize: number;
  headerColor: string;
}

interface HeaderCell {
  key: string;
  label: string;
  colSpan: number;
  rowSpan: number;
  column?: string;
  isTotal?: boolean;
}

export const pivotColumnKey = (path: string[]) => path.join('__');

const isTotalColumn = (path: string[], index: number, count: number) =>
  index === count - 1 && path.length === 1 && path[0] === 'All';

const numberFormat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

const buildHeaderRows = (columns: string[][], levels: number) => {
  const rows: HeaderCell[][] = Array.from({ length: levels }, () => []);
  columns.forEach((path, index) => {
    if (isTotalColumn(path, index, columns.length)) {
      rows[0].push({
        key: 'All',
        label: 'All',
        colSpan: 1,
        rowSpan: levels,
        column: 'All',
        isTotal: true,
      });
      return;
    }
    for (let level = 0; level < levels; level += 1) {
      const key = path.slice(0, level + 1).join('\u0000');
      if (level === levels - 1) {
        rows[level].push({
          key,
          label: path[level] ?? '',
          colSpan: 1,
          rowSpan: 1,
          column: pivotColumnKey(path),
        });
        continue;
      }
      const last = rows[level][rows[level].length - 1];
      if (last && !last.isTotal && last.key === key) {
        last.colSpan += 1;
      } else {
        rows[level].push({
          key,
          label: path[level] ?? '',
          colSpan: 1,
          rowSpan: 1,
        });
      }
    }
  });
  return rows;
};

const SortIcon: React.FC<{ active: boolean; direction?: 'asc' | 'desc' }> = ({
  active,
  direction,
}) => (
  <i
    className={`pivot-sort-icon fa ${
      active && direction === 'asc'
        ? 'fa-long-arrow-alt-up'
        : 'fa-long-arrow-alt-down'
    } ${active ? 'active' : ''}`}
    aria-hidden="true"
  />
);

const PivotHtmlTable: React.FC<PivotHtmlTableProps> = ({
  table,
  sort,
  onSort,
  page,
  pageSize,
  headerColor,
}) => {
  const levels = Math.max(1, table.column_labels.length);
  const headerRows = useMemo(
    () => buildHeaderRows(table.columns, levels),
    [table.columns, levels],
  );
  const totalIndex = table.columns.findIndex((path, index) =>
    isTotalColumn(path, index, table.columns.length),
  );

  const order = useMemo(() => {
    const indices = table.rows.map((_, index) => index);
    if (!sort) return indices;
    const direction = sort.direction === 'asc' ? 1 : -1;
    const columnIndex =
      sort.column === null
        ? -1
        : table.columns.findIndex(
            (path, index) =>
              (isTotalColumn(path, index, table.columns.length)
                ? 'All'
                : pivotColumnKey(path)) === sort.column,
          );
    if (sort.column !== null && columnIndex < 0) return indices;
    return indices.sort((a, b) => {
      if (columnIndex < 0) {
        // The full JSON response is already in canonical ascending row order.
        // Use those ranks so local sorting matches CSV, including numeric bins
        // and text labels, without depending on the browser's locale.
        const missing =
          Number(table.rows[a] === 'Undefined') -
          Number(table.rows[b] === 'Undefined');
        return missing || (a - b) * direction;
      }
      const compared =
        table.values[a][columnIndex] - table.values[b][columnIndex];
      return compared * direction || a - b;
    });
  }, [table, sort]);

  const pageRows = order.slice((page - 1) * pageSize, page * pageSize);

  const ariaSort = (column: string | null) => {
    if (!sort || sort.column !== column) return 'none';
    return sort.direction === 'asc' ? 'ascending' : 'descending';
  };

  const sortButton = (label: string, column: string | null) => {
    const active = !!sort && sort.column === column;
    return (
      <button
        type="button"
        className="pivot-sort-button"
        onClick={() => onSort(column)}
      >
        <span>{label}</span>
        <SortIcon active={active} direction={sort?.direction} />
      </button>
    );
  };

  if (table.rows.length === 0) {
    return <div className="pivot-html-table-empty">No results.</div>;
  }

  return (
    <div
      className="pivot-html-table-container"
      style={{ '--pivot-header-color': headerColor } as React.CSSProperties}
    >
      <table className="pivot-html-table">
        <thead>
          {headerRows.map((cells, level) => (
            <tr key={`level-${level}`}>
              {level === 0 && (
                <th
                  rowSpan={levels}
                  className="pivot-row-label pivot-leaf"
                  aria-sort={ariaSort(null)}
                  scope="col"
                >
                  {sortButton(table.row_label, null)}
                </th>
              )}
              {cells.map((cell) =>
                cell.column !== undefined ? (
                  <th
                    key={cell.key}
                    rowSpan={cell.rowSpan}
                    className={`pivot-leaf ${cell.isTotal ? 'pivot-total-col' : ''}`}
                    aria-sort={ariaSort(cell.column)}
                    scope="col"
                  >
                    {sortButton(cell.label, cell.column)}
                  </th>
                ) : (
                  <th key={cell.key} colSpan={cell.colSpan} scope="colgroup">
                    {cell.label}
                  </th>
                ),
              )}
            </tr>
          ))}
        </thead>
        <tbody>
          {pageRows.map((rowIndex) => (
            <tr key={table.rows[rowIndex]}>
              <th scope="row" className="pivot-row-label">
                {table.rows[rowIndex]}
              </th>
              {table.values[rowIndex].map((value, columnIndex) => (
                <td
                  key={columnIndex}
                  className={
                    columnIndex === totalIndex ? 'pivot-total-col' : undefined
                  }
                >
                  {numberFormat.format(value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {table.totals.length > 0 && (
          <tfoot>
            <tr>
              <th scope="row" className="pivot-row-label">
                All
              </th>
              {table.totals.map((value, columnIndex) => (
                <td
                  key={columnIndex}
                  className={
                    columnIndex === totalIndex ? 'pivot-total-col' : undefined
                  }
                >
                  {numberFormat.format(value)}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

export default PivotHtmlTable;
