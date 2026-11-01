import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

import {
  fetchRouteVoyagesPage,
  RouteVoyageListItem,
} from '@/fetch/voyagesFetch/fetchRouteVoyages';

const PAGE_SIZE = 25;

const SORT_FIELDS = {
  year: 'voyage_dates__imp_arrival_at_port_of_dis_sparsedate__year',
  embarked: 'voyage_slaves_numbers__imp_total_num_slaves_embarked',
  disembarked: 'voyage_slaves_numbers__imp_total_num_slaves_disembarked',
  died: 'voyage_slaves_numbers__imp_mortality_during_voyage',
  men: 'voyage_slaves_numbers__imp_num_men_total',
  women: 'voyage_slaves_numbers__imp_num_women_total',
  children: 'voyage_slaves_numbers__imp_num_child_total',
} as const;

type SortKey = keyof typeof SORT_FIELDS;
type SortDir = 'asc' | 'desc';
interface Sort {
  key: SortKey;
  dir: SortDir;
}

const DEFAULT_SORT: Sort = { key: 'year', dir: 'asc' };

const orderBy = ({ key, dir }: Sort) => {
  const field = SORT_FIELDS[key];
  return dir === 'asc' ? [field] : [`-${field}`];
};

const num = (n: number | null | undefined) =>
  n == null ? '—' : n.toLocaleString();

const placeName = (name: string | null | undefined) =>
  name
    ?.replace(
      /,\s*(port|place)\s+unspecified|,\s*unspecified|\s*\(colony unspecified\)/gi,
      '',
    )
    .trim() || null;

const numAt = (
  n: number | null | undefined,
  place: string | null | undefined,
) => {
  const name = placeName(place);
  return name ? `${num(n)} ${name}` : num(n);
};

interface VoyagesTableProps {
  voyageIds: string[];
  scrollRoot: RefObject<HTMLElement>;
}

export const VoyagesTable = ({ voyageIds, scrollRoot }: VoyagesTableProps) => {
  const [rows, setRows] = useState<RouteVoyageListItem[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT);
  const nextPageRef = useRef(1);
  const loadingRef = useRef(false);
  const generationRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const idsKey = voyageIds.join(',');

  const loadMore = useCallback(() => {
    if (loadingRef.current) return;
    if (count !== null && rows.length >= count) return;
    loadingRef.current = true;
    setLoading(true);
    const page = nextPageRef.current;
    const generation = generationRef.current;
    fetchRouteVoyagesPage(voyageIds, page, PAGE_SIZE, orderBy(sort))
      .then((res) => {
        if (generation !== generationRef.current) return;
        nextPageRef.current = page + 1;
        setCount(res.count);
        setRows((prev) => [...prev, ...res.results]);
      })
      .catch((err: unknown) => {
        if (generation === generationRef.current)
          setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (generation !== generationRef.current) return;
        loadingRef.current = false;
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, sort, count, rows.length]);

  useEffect(() => {
    generationRef.current++;
    loadingRef.current = false;
    setLoading(false);
    setRows([]);
    setCount(null);
    setError(null);
    nextPageRef.current = 1;
  }, [idsKey, sort]);

  const sortBy = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'year' ? 'asc' : 'desc' },
    );

  const header = (key: SortKey, label: string, className?: string) => (
    <th
      className={className}
      aria-sort={
        sort.key === key
          ? sort.dir === 'asc'
            ? 'ascending'
            : 'descending'
          : 'none'
      }
    >
      <button type="button" className="voyagesSort" onClick={() => sortBy(key)}>
        {label}
        <span className="voyagesSortArrow">
          {sort.key === key ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
        </span>
      </button>
    </th>
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || error) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { root: scrollRoot.current, rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, scrollRoot, error]);

  const done = count !== null && rows.length >= count;

  return (
    <div className="voyagesTableWrap">
      <table className="voyagesTable">
        <thead>
          <tr>
            <th>Ship name</th>
            {header('year', 'Year', 'num')}
            <th>Slave traders</th>
            {header('embarked', 'Embarked')}
            {header('disembarked', 'Disembarked')}
            {header('died', 'Died', 'num')}
            {header('men', 'Men', 'num')}
            {header('women', 'Women', 'num')}
            {header('children', 'Children', 'num')}
            <th>Outcome</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => {
            const n = v.voyage_slaves_numbers ?? {};
            return (
              <tr key={v.voyage_id}>
                <td>{v.voyage_ship?.ship_name ?? '—'}</td>
                <td className="num">
                  {v.voyage_dates?.imp_arrival_at_port_of_dis_sparsedate
                    ?.year ?? '—'}
                </td>
                <td>
                  {v.enslavers && v.enslavers.length > 0
                    ? v.enslavers.map((e) => (
                        <div key={e.id}>{e.name_and_role}</div>
                      ))
                    : '—'}
                </td>
                <td>
                  {numAt(
                    n.imp_total_num_slaves_embarked,
                    v.voyage_itinerary?.imp_principal_place_of_slave_purchase
                      ?.name,
                  )}
                </td>
                <td>
                  {numAt(
                    n.imp_total_num_slaves_disembarked,
                    v.voyage_itinerary?.imp_principal_port_slave_dis?.name,
                  )}
                </td>
                <td className="num">
                  {num(
                    n.imp_mortality_during_voyage ??
                      (n.imp_total_num_slaves_embarked != null &&
                      n.imp_total_num_slaves_disembarked != null
                        ? n.imp_total_num_slaves_embarked -
                          n.imp_total_num_slaves_disembarked
                        : null),
                  )}
                </td>
                <td className="num">{num(n.imp_num_men_total)}</td>
                <td className="num">{num(n.imp_num_women_total)}</td>
                <td className="num">{num(n.imp_num_child_total)}</td>
                <td>{v.voyage_outcome?.particular_outcome?.name ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {error ? (
        <div className="voyagesTableStatus voyagesStatusError">
          Could not load voyages: {error}
        </div>
      ) : (
        !done && (
          <div ref={sentinelRef} className="voyagesTableStatus">
            {loading ? 'Loading voyages…' : ''}
          </div>
        )
      )}
    </div>
  );
};
