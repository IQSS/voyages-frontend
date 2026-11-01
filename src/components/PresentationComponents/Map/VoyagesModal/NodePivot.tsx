import { useCallback, useEffect, useState } from 'react';

import {
  fetchNodePivot,
  NodePivotRequest,
} from '@/fetch/voyagesFetch/fetchNodePivot';
import {
  PivotCrosstabResponse,
  PivotSort,
} from '@/share/InterfaceTypePivotTable';

import PivotHtmlTable from '../../PivotTables/PivotHtmlTable';

interface NodePivotProps {
  voyageIds: string[];
  request: NodePivotRequest;
}

export const NodePivot = ({ voyageIds, request }: NodePivotProps) => {
  const [table, setTable] = useState<PivotCrosstabResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<PivotSort | null>(null);
  const idsKey = voyageIds.join(',');
  const requestKey = JSON.stringify(request);

  useEffect(() => {
    let cancelled = false;
    setTable(null);
    setError(null);
    setSort(null);
    fetchNodePivot(request, voyageIds)
      .then((result) => {
        if (!cancelled) setTable(result);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, requestKey]);

  const handleSort = useCallback((column: string | null) => {
    setSort((previous) =>
      previous && previous.column === column
        ? {
            column,
            direction: previous.direction === 'asc' ? 'desc' : 'asc',
          }
        : { column, direction: column === null ? 'asc' : 'desc' },
    );
  }, []);

  if (error)
    return (
      <div className="voyagesTableStatus voyagesStatusError">
        Could not load table: {error}
      </div>
    );
  if (!table) return <div className="voyagesTableStatus">Loading table…</div>;
  return (
    <div className="nodePivot">
      <PivotHtmlTable
        table={table}
        sort={sort}
        onSort={handleSort}
        page={1}
        pageSize={Math.max(table.rows.length, 1)}
        headerColor="#000"
      />
    </div>
  );
};
