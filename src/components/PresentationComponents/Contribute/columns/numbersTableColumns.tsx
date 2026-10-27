import { Input } from 'antd';
import type { TableColumnsType } from 'antd';

interface ActiveCell {
  rowIndex: number;
  colIndex: number;
}

interface NumbersTableColumnsParams {
  activeCell: ActiveCell | null;
  setActiveCell: (cell: ActiveCell | null) => void;
  localChanges: Record<string, string>;
  columns: string[];
  handleCellChange: (col: number, row: number, value: string) => void;
  readOnly?: boolean;
}

const ACTIVE_STYLE = { color: 'rgb(55, 148, 141)', fontSize: '0.85rem' };
const DEFAULT_STYLE = { fontSize: '0.85rem' };

export const getNumbersTableColumns = ({
  activeCell,
  setActiveCell,
  localChanges,
  columns,
  handleCellChange,
  readOnly = false,
}: NumbersTableColumnsParams): TableColumnsType<any> => [
  {
    title: '',
    dataIndex: 'rowHeader',
    key: 'rowHeader',
    fixed: 'left',
    width: 210,
    render: (text: string, _record, rowIndex) => (
      <span
        style={activeCell?.rowIndex === rowIndex ? ACTIVE_STYLE : DEFAULT_STYLE}
      >
        {text}
      </span>
    ),
  },
  ...columns.map((colHeader, colIndex) => ({
    title: (
      <span
        style={activeCell?.colIndex === colIndex ? ACTIVE_STYLE : DEFAULT_STYLE}
      >
        {colHeader.charAt(0).toUpperCase() + colHeader.slice(1).toLowerCase()}
      </span>
    ),
    dataIndex: `col-${colIndex}`,
    key: `col-${colIndex}`,
    width: 70,
    render: (cell: any) =>
      cell?.field ? (
        <Input
          value={localChanges[cell.field] ?? cell.value}
          disabled={readOnly}
          onChange={(e) =>
            handleCellChange(cell.colIndex, cell.rowIndex, e.target.value)
          }
          onFocus={() =>
            setActiveCell({ rowIndex: cell.rowIndex, colIndex: cell.colIndex })
          }
          onBlur={() => setActiveCell(null)}
          style={{
            padding: 2,
            border: 'none',
            borderBottom: '1px solid #d9d9d9',
            borderRadius: 0,
            outline: 'none',
            boxShadow: 'none',
            background: 'transparent',
          }}
        />
      ) : (
        <div style={{ backgroundColor: '#f9f9f9' }} />
      ),
  })),
];
