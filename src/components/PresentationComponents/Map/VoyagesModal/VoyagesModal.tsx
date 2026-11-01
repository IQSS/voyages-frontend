import { useEffect, useRef, useState } from 'react';

import '@/style/voyages-modal.scss';
import { BibliographyList, useBibliography } from './BibliographyList';
import { VoyagesTable } from './VoyagesTable';

const TABS = [{ id: 'voyages' }, { id: 'bibliography' }] as const;

type TabId = (typeof TABS)[number]['id'];

interface VoyagesModalProps {
  voyageIds: string[];
  onClose: () => void;
}

export const VoyagesModal = ({ voyageIds, onClose }: VoyagesModalProps) => {
  const [tab, setTab] = useState<TabId>('voyages');
  const bodyRef = useRef<HTMLDivElement>(null);
  const count = voyageIds.length;
  const bibliography = useBibliography(voyageIds);
  const sourceCount = bibliography.entries?.length;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const tabLabel = (id: TabId) => {
    if (id === 'voyages')
      return `${count.toLocaleString()} ${count === 1 ? 'Voyage' : 'Voyages'}`;
    if (sourceCount === undefined) return 'Sources';
    return `${sourceCount.toLocaleString()} ${sourceCount === 1 ? 'Source' : 'Sources'}`;
  };

  return (
    <div className="voyagesModalBackdrop" onClick={onClose}>
      <div
        className="voyagesModal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="voyagesModalTabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? 'active' : undefined}
              onClick={() => setTab(t.id)}
            >
              {tabLabel(t.id)}
            </button>
          ))}
          <button
            type="button"
            className="voyagesModalClose"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div ref={bodyRef} className="voyagesModalBody" role="tabpanel">
          {tab === 'voyages' && (
            <VoyagesTable voyageIds={voyageIds} scrollRoot={bodyRef} />
          )}
          {tab === 'bibliography' && <BibliographyList {...bibliography} />}
        </div>
      </div>
    </div>
  );
};
