import { useEffect, useState } from 'react';

import { MaterializedEntity } from '@slavevoyages/voyages-contribute';

import { fetchEnumeration } from '@/fetch/contributeFetch/fetchEnumeration';

interface CachedEnumeration {
  timestamp: number;
  items: Promise<object[]>;
}

// Note: this could be placed in a React context if for some reason the
// cached enumerations should not be shared across all components.
const cache: Record<string, CachedEnumeration> = {};

export interface UseEnumerationOptions {
  expirationSeconds?: number;
  forceRefresh?: boolean;
}

export const useSchemaEnumeration = (
  schema: string,
  options?: UseEnumerationOptions,
) =>
  useEnumeration<MaterializedEntity>(
    schema,
    () => fetchEnumeration(schema),
    options,
  );

export const useEnumeration = <TItem,>(
  cacheKey: string,
  enumerator: () => Promise<TItem[]>,
  options?: UseEnumerationOptions,
) => {
  const [items, setItems] = useState<TItem[]>([]);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let expirationTimer: number;

    const load = async () => {
      const now = new Date().getTime();
      const cached = cache[cacheKey];
      const expired =
        cached && options?.expirationSeconds
          ? now - cached.timestamp > options.expirationSeconds * 1000
          : false;

      if (cached && !expired && !options?.forceRefresh) {
        cached.items.then((x) => setItems(x as TItem[]));
        return;
      }

      try {
        setLoading(true);
        const promise = enumerator();
        cache[cacheKey] = {
          timestamp: now,
          items: promise as Promise<object[]>,
        };
        const items = await promise;
        setError(undefined);
        setItems(items);

        // Set timer to clear cache automatically after expiration time
        if (options?.expirationSeconds) {
          expirationTimer = window.setTimeout(() => {
            delete cache[cacheKey];
          }, options.expirationSeconds * 1000);
        }
      } catch (err) {
        delete cache[cacheKey];
        setItems([]);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => {
      if (expirationTimer) {
        clearTimeout(expirationTimer);
      }
    };
  }, [cacheKey, options?.expirationSeconds, options?.forceRefresh]);

  return { error, loading, items };
};
