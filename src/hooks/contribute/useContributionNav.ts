import { useCallback, useEffect, useState } from 'react';

import { Modal } from 'antd';

import {
  ContributionNavList,
  loadNavList,
  pageOf,
  saveNavList,
  withPage,
} from '@/utils/contribute/contributionNav';

interface UseContributionNavProps {
  source: ContributionNavList['source'];
  currentId?: string;
  /** Fetches one page of the list's ids, the way its table does. */
  fetchPage: (list: ContributionNavList, page: number) => Promise<string[]>;
  onOpen: (id: string) => void;
  /** Edits on the page that leaving would lose. */
  isDirty?: boolean;
  /** The page is still loading the contribution it moved to. */
  busy?: boolean;
  /** Starts loading a neighbour, so stepping to it is quick. */
  prefetch?: (id: string) => void;
}

/** Previous / next through the list a contribution was opened from. */
export const useContributionNav = ({
  source,
  currentId,
  fetchPage,
  onOpen,
  isDirty = false,
  busy = false,
  prefetch,
}: UseContributionNavProps) => {
  const [list, setList] = useState(() => loadNavList(source));
  const [loading, setLoading] = useState(false);

  // The table saves the list on the click that opens this page.
  useEffect(() => {
    setList(loadNavList(source));
  }, [source, currentId]);

  const index = list && currentId ? list.ids.indexOf(currentId) : -1;
  const total = list?.total ?? 0;

  const prevId = index > 0 ? list?.ids[index - 1] : undefined;
  const nextId = index >= 0 ? list?.ids[index + 1] : undefined;
  useEffect(() => {
    if (busy || !prefetch) return;
    if (nextId) prefetch(nextId);
    if (prevId) prefetch(prevId);
  }, [busy, prefetch, prevId, nextId]);

  const go = useCallback(
    (delta: number) => {
      if (!list || index < 0) return;
      const target = index + delta;
      if (target < 0 || target >= list.total) return;
      const open = async () => {
        let next = list;
        if (!next.ids[target]) {
          setLoading(true);
          try {
            const page = pageOf(target, next.pageSize);
            const pageIds = await fetchPage(next, page);
            next = {
              ...next,
              ids: withPage(next.ids, page, next.pageSize, pageIds),
            };
            saveNavList(next);
            setList(next);
          } catch {
            // Stay on this contribution; the buttons can be tried again.
          } finally {
            setLoading(false);
          }
        }
        const id = next.ids[target];
        if (id) onOpen(id);
      };
      if (!isDirty) {
        open();
        return;
      }
      Modal.confirm({
        title: 'Leave this contribution?',
        content: 'Your changes here are not saved and will be lost.',
        okText: 'Leave',
        cancelText: 'Stay',
        onOk: open,
      });
    },
    [list, index, fetchPage, onOpen, isDirty],
  );

  const moving = loading || busy;
  return {
    visible: index >= 0,
    position: index + 1,
    total,
    moving,
    canPrev: index > 0 && !moving,
    canNext: index >= 0 && index + 1 < total && !moving,
    goPrev: () => go(-1),
    goNext: () => go(1),
  };
};
