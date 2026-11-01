/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useCallback } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import '@/style/table.scss';
import { usePageRouter } from '@/hooks/usePageRouter';
import { setPivotOrderBy } from '@/redux/getPivotTablesDataSlice';
import { AppDispatch, RootState } from '@/redux/store';
import { getHeaderColomnColor } from '@/utils/functions/getColorStyle';

interface Props {
  showColumnMenu: (ref: React.RefObject<HTMLDivElement> | null) => void;
  column: {
    colId: string;
    colDef: any;
  };
  enableMenu: boolean;
  menuIcon: string;
  enableSorting: boolean;
  displayName?: string;
}

type SortOrder = 'asc' | 'desc';

const CustomHeaderPivotTable: React.FC<Props> = (props) => {
  const { column, enableSorting, displayName } = props;

  const dispatch: AppDispatch = useDispatch();
  const { styleName } = usePageRouter();
  const { orderBy } = useSelector(
    (state: RootState) => state.getPivotTablesData,
  );

  const field: string | undefined = column?.colDef?.field;
  const activeKey = orderBy[0];
  const ascSort =
    field !== undefined && activeKey === field ? 'active' : 'inactive';
  const descSort =
    field !== undefined && activeKey === `-${field}` ? 'active' : 'inactive';

  const onSortRequested = useCallback(
    (order: SortOrder) => {
      if (field === undefined) return;
      dispatch(setPivotOrderBy([order === 'desc' ? `-${field}` : field]));
    },
    [dispatch, field],
  );

  useEffect(() => {
    const headerColor = getHeaderColomnColor(styleName!);
    document.documentElement.style.setProperty('--header-color--', headerColor);
    document.documentElement.style.setProperty(
      '--ag-secondary-foreground-color',
      headerColor,
    );
    document.documentElement.style.setProperty(
      '--ag-header-foreground-color',
      headerColor,
    );
  }, [styleName]);

  let sort: React.ReactNode = null;
  if (enableSorting && field !== undefined) {
    sort = (
      <div
        style={{
          display: 'flex',
        }}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSortRequested('asc')}
          onTouchEnd={() => onSortRequested('asc')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSortRequested('asc');
          }}
          className={`customSortUpLabel-pivot ${ascSort}`}
        >
          <i className="fa fa-long-arrow-alt-up"></i>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSortRequested('desc')}
          onTouchEnd={() => onSortRequested('desc')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSortRequested('desc');
          }}
          className={`customSortDownLabel-pivot ${descSort}`}
        >
          <i className="fa fa-long-arrow-alt-down"></i>
        </div>
      </div>
    );
  }

  return (
    <div className="customHeaderLabel-box">
      <div
        className="customHeaderLabel"
        style={{ color: getHeaderColomnColor(styleName!) }}
      >
        {displayName}
      </div>
      {sort}
    </div>
  );
};

export default CustomHeaderPivotTable;
