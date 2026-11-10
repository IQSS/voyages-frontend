import { useEffect, useMemo, useRef, useState } from 'react';

import { NodePivotRequest } from '@/fetch/voyagesFetch/fetchNodePivot';
import { Weights } from '@/share/InterfaceTypesMap';
import '@/style/voyages-modal.scss';

import { BibliographyList, useBibliography } from './BibliographyList';
import { NodePivot } from './NodePivot';
import { nodePivots } from './nodePivots';
import { VoyagesTable } from './VoyagesTable';

export interface VoyagesModalPivot {
  id: string;
  label: string;
  request: NodePivotRequest;
}

export interface VoyagesModalPlace {
  id: string;
  name: string;
  voyageIds: string[];
  weights: Weights;
}

export interface VoyagesModalContent {
  voyageIds: string[];
  title?: string;
  pivots?: VoyagesModalPivot[];
  places?: VoyagesModalPlace[];
}

interface VoyagesModalProps extends VoyagesModalContent {
  onClose: () => void;
}

const sumWeights = (places: VoyagesModalPlace[]): Weights => ({
  post_disembarkation: places.reduce(
    (sum, place) => sum + (place.weights.post_disembarkation ?? 0),
    0,
  ),
  embarkation: places.reduce(
    (sum, place) => sum + (place.weights.embarkation ?? 0),
    0,
  ),
  disembarkation: places.reduce(
    (sum, place) => sum + (place.weights.disembarkation ?? 0),
    0,
  ),
});

export const VoyagesModal = ({
  voyageIds,
  title,
  pivots = [],
  places = [],
  onClose,
}: VoyagesModalProps) => {
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>(() =>
    places.map((place) => place.id),
  );
  const selectedPlaces = useMemo(
    () => places.filter((place) => selectedPlaceIds.includes(place.id)),
    [places, selectedPlaceIds],
  );
  const activeVoyageIds = useMemo(
    () =>
      places.length > 0
        ? [...new Set(selectedPlaces.flatMap((place) => place.voyageIds))]
        : voyageIds,
    [places.length, selectedPlaces, voyageIds],
  );
  const activePivots = useMemo(
    () => (places.length > 0 ? nodePivots(sumWeights(selectedPlaces)) : pivots),
    [places.length, selectedPlaces, pivots],
  );

  const [tab, setTab] = useState<string>(activePivots[0]?.id ?? 'voyages');
  const bodyRef = useRef<HTMLDivElement>(null);
  const count = activeVoyageIds.length;
  const bibliography = useBibliography(activeVoyageIds);
  const sourceCount = bibliography.entries?.length;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const togglePlace = (placeId: string) =>
    setSelectedPlaceIds((previous) =>
      previous.includes(placeId)
        ? previous.filter((id) => id !== placeId)
        : places
            .map((place) => place.id)
            .filter((id) => id === placeId || previous.includes(id)),
    );

  const tabs = [
    ...activePivots.map((pivot) => ({ id: pivot.id, label: pivot.label })),
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
  const activeTab = tabs.some((t) => t.id === tab) ? tab : tabs[0].id;
  const activePivot = activePivots.find((pivot) => pivot.id === activeTab);
  const dialogLabel =
    title ??
    (places.length > 0 ? places.map((p) => p.name).join('; ') : undefined);

  return (
    <div className="voyagesModalBackdrop" onClick={onClose}>
      <div
        className="voyagesModal"
        role="dialog"
        aria-modal="true"
        aria-label={dialogLabel}
        onClick={(e) => e.stopPropagation()}
      >
        {places.length > 0 ? (
          <ul className="voyagesModalPlaces" aria-label="Places">
            {places.map((place) => {
              const selected = selectedPlaceIds.includes(place.id);
              const locked = selected && selectedPlaceIds.length === 1;
              return (
                <li key={place.id}>
                  <button
                    type="button"
                    className={`voyagesModalPlace ${selected ? 'selected' : 'deselected'}`}
                    aria-pressed={selected}
                    data-voyage-node-id={place.id}
                    disabled={locked}
                    title={
                      locked
                        ? undefined
                        : selected
                          ? 'Remove from selection'
                          : 'Add to selection'
                    }
                    onClick={() => togglePlace(place.id)}
                  >
                    <svg
                      className="voyagesModalPlaceMark"
                      viewBox="0 0 12 12"
                      aria-hidden="true"
                    >
                      {selected ? (
                        <polyline points="2,6.5 5,9.5 10,2.5" />
                      ) : (
                        <path d="M3,3 L9,9 M9,3 L3,9" />
                      )}
                    </svg>
                    {place.name}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          title && <div className="voyagesModalTitle">{title}</div>
        )}
        <div className="voyagesModalTabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              className={activeTab === t.id ? 'active' : undefined}
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
              voyageIds={activeVoyageIds}
              request={activePivot.request}
            />
          )}
          {activeTab === 'voyages' && (
            <VoyagesTable voyageIds={activeVoyageIds} scrollRoot={bodyRef} />
          )}
          {activeTab === 'bibliography' && (
            <BibliographyList {...bibliography} />
          )}
        </div>
      </div>
    </div>
  );
};
