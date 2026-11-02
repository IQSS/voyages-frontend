import { useEffect, useState } from 'react';

import { fetchVoyageBibliography } from '@/fetch/voyagesFetch/fetchRouteVoyages';

export interface BibliographyState {
  entries: string[] | null;
  error: string | null;
}

export const useBibliography = (voyageIds: string[]): BibliographyState => {
  const [state, setState] = useState<BibliographyState>({
    entries: null,
    error: null,
  });
  const idsKey = voyageIds.join(',');

  useEffect(() => {
    let cancelled = false;
    setState({ entries: null, error: null });
    fetchVoyageBibliography(voyageIds)
      .then((entries) => {
        if (!cancelled) setState({ entries, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            entries: null,
            error: err instanceof Error ? err.message : String(err),
          });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return state;
};

export const BibliographyList = ({ entries, error }: BibliographyState) => {
  if (error)
    return (
      <div className="voyagesTableStatus voyagesStatusError">
        Could not load sources: {error}
      </div>
    );
  if (!entries)
    return <div className="voyagesTableStatus">Loading sources…</div>;
  if (entries.length === 0)
    return (
      <div className="voyagesTableStatus">
        No sources recorded for these voyages.
      </div>
    );
  return (
    <ul className="bibliographyList">
      {entries.map((entry, i) => (
        <li key={i} dangerouslySetInnerHTML={{ __html: entry }} />
      ))}
    </ul>
  );
};
