import { useCallback, useState } from 'react';

import {
  EntityChange,
  TableChange,
  MaterializedEntity,
  TableProperty,
} from '@slavevoyages/voyages-contribute';

import { tableCellText } from '@/utils/contribute/numbersTable';

interface ActiveCell {
  rowIndex: number;
  colIndex: number;
}

interface UseNumbersTableParams {
  property: TableProperty;
  entity: MaterializedEntity;
  lastChange?: TableChange;
  onChange: (change: EntityChange) => void;
}

export const useNumbersTableComponent = ({
  property,
  entity,
  lastChange,
  onChange,
}: UseNumbersTableParams) => {
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [localChanges, setLocalChanges] = useState<Record<string, string>>({});

  const handleCellChange = useCallback(
    (col: number, row: number, changed: string) => {
      const field = property.cellField(col, row);
      if (!field) return;

      const numValue = changed === '' ? null : parseFloat(changed);
      if (changed !== '' && isNaN(numValue as number)) return;

      setLocalChanges((prev) => ({ ...prev, [field]: changed }));

      onChange({
        type: 'update',
        entityRef: entity.entityRef,
        changes: [
          {
            kind: 'table',
            property: property.uid,
            changes: { ...lastChange?.changes, [field]: numValue },
            comments: lastChange?.comments,
          },
        ],
      });
    },
    [property, entity, lastChange, onChange],
  );

  const getCellValue = useCallback(
    (col: number, row: number): string => {
      const field = property.cellField(col, row);
      if (!field) return '';
      const changed = lastChange?.changes[field];
      const value = changed === undefined ? entity.data[field] : changed;
      return tableCellText(value);
    },
    [property, lastChange, entity.data],
  );

  const handleComment = useCallback(
    (comment: string) => {
      onChange({
        type: 'update',
        entityRef: entity.entityRef,
        changes: [
          {
            kind: 'table',
            property: property.uid,
            changes: lastChange?.changes ?? {},
            comments: comment,
          },
        ],
      });
    },
    [entity, lastChange, property, onChange],
  );

  const dataSource = property.rows.map((rowHeader, rowIndex) => {
    const row: Record<string, any> = { key: rowIndex, rowHeader };
    property.columns.forEach((_, colIndex) => {
      const field = property.cellField(colIndex, rowIndex);
      row[`col-${colIndex}`] = {
        field,
        value: getCellValue(colIndex, rowIndex),
        rowIndex,
        colIndex,
      };
    });
    return row;
  });

  return {
    activeCell,
    setActiveCell,
    localChanges,
    handleCellChange,
    handleComment,
    dataSource,
  };
};
