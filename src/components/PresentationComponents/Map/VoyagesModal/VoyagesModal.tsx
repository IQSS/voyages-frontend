import { useEffect, useRef, useState } from 'react';

import { NodePivotRequest } from '@/fetch/voyagesFetch/fetchNodePivot';
import '@/style/voyages-modal.scss';

import { BibliographyList, useBibliography } from './BibliographyList';
import { NodePivot } from './NodePivot';
import { VoyagesTable } from './VoyagesTable';

export interface VoyagesModalPivot {
  id: string;
  label: string;
  request: NodePivotRequest;
}

export interface VoyagesModalContent {
  voyageIds: string[];
  title?: string;
  pivots?: VoyagesModalPivot[];
}

interface VoyagesModalProps extends VoyagesModalContent {
  onClose: () => void;
}

export const VoyagesModal = ({
  voyageIds,
  title,
  pivots = [],
  onClose,
}: VoyagesModalProps) => {
  const [tab, setTab] = useState<string>(pivots[0]?.id ?? 'voyages');
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

  const tabs = [
    ...pivots.map((pivot) => ({ id: pivot.id, label: pivot.label })),
    {
      id: 'voyages',
      label: `${count.toLocaleString()} ${count === 1 ? 'Voyage' : 'Voyages'}`,
    },
    {
      id: 'bibliography',
      label:
        sourceCount === undefined
          ? 'Sources'
          : `${sourceCount.toLocaleString()} ${sourceCount === 1 ? 'Source' : 'Sources'}`,
    },
  ];
  const activePivot = pivots.find((pivot) => pivot.id === tab);

  return (
    <div className="voyagesModalBackdrop" onClick={onClose}>
      <div
        className="voyagesModal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <div className="voyagesModalTitle">{title}</div>}
        <div className="voyagesModalTabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? 'active' : undefined}
              onClick={() => setTab(t.id)}
            >
              {t.label}
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
          {activePivot && (
            <NodePivot
              key={activePivot.id}
              voyageIds={voyageIds}
              request={activePivot.request}
            />
          )}
          {tab === 'voyages' && (
            <VoyagesTable voyageIds={voyageIds} scrollRoot={bodyRef} />
          )}
          {tab === 'bibliography' && <BibliographyList {...bibliography} />}
        </div>
      </div>
    </div>
  );
};
