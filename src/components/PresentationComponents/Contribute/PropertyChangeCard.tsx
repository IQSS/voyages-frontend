import { ReactNode } from 'react';

import {
  getSchema,
  LinkedEntitySelectionChange,
  MaterializedEntity,
  PropertyChange,
} from '@slavevoyages/voyages-contribute';

import { DATASET_PROPERTY, datasetLabel } from '@/utils/contribute/datasets';

import PropertyChangesTable from './PropertyChangesTable';
import '@/style/contributeContent.scss';

interface PropertyChangeCardProps {
  change: PropertyChange;
  handleDeleteChange: (propertyToDelete: string) => void;
  property?: string;
}
export function getMonthName(month: number): string {
  return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
}

export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const PropertyChangeCard = ({
  change,
  property,
  handleDeleteChange,
}: PropertyChangeCardProps) => {
  let display: ReactNode;

  function getDisplayName(
    change?: PropertyChange,
    changed?: MaterializedEntity | string | number | boolean | null,
    linkedChanges?: LinkedEntitySelectionChange['linkedChanges'],
  ): ReactNode {
    if (!changed) {
      if (change?.property === 'Voyage_voyage_groupings') return null;
      return (
        <span
          style={{
            backgroundColor: '#8c8c8c',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontStyle: 'italic',
            fontWeight: 'bold',
          }}
        >
          NULL
        </span>
      );
    }
    if (
      typeof changed === 'string' ||
      typeof changed === 'number' ||
      typeof changed === 'boolean'
    ) {
      return String(changed);
    }
    try {
      const schema = getSchema(changed.entityRef.schema);
      const entityID = changed.entityRef.id;
      if (typeof changed === 'object' && 'entityRef' in changed) {
        if (typeof changed === 'object' && 'entityRef' in changed) {
          const labelName = schema.getLabel(changed.data);
          return `${labelName} #${entityID}`;
        }
      }
    } catch (error) {
      // If schema doesn't exist, return a fallback display
      return `${changed.entityRef.schema} #${changed.entityRef.id}`;
    }

    return '<unknown>';
  }

  if (change.kind === 'direct') {
    // Handle null/undefined values with styled NULL tag
    if (change.changed === null || change.changed === undefined) {
      display = (
        <span
          style={{
            backgroundColor: '#8c8c8c',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontStyle: 'italic',
            fontWeight: 'bold',
          }}
        >
          NULL
        </span>
      );
    } else {
      if (change.property === DATASET_PROPERTY) {
        // Shown by name. It used to be hidden here, from when the importer set
        // it on every row and a bare integer said nothing to anybody. It is an
        // editor's decision now, and the one person who has to check it is the
        // one who made it.
        const label = datasetLabel(Number(change.changed));
        display = (
          <span className="details-changes">
            {label ?? String(change.changed)}
          </span>
        );
      } else {
        display = (
          <span className="details-changes">{String(change.changed)}</span>
        );
      }
    }
  } else if (change.kind === 'linked' && change.linkedChanges) {
    display = (
      <div className="linked-change-wrapper">
        <div className="linked-change-table">
          <PropertyChangesTable
            change={change.linkedChanges}
            sectionName=""
            handleDeleteChange={handleDeleteChange}
          />
        </div>
      </div>
    );
  } else if (change.kind === 'linked') {
    display = (
      <span className="details-changes">
        {getDisplayName(change, change.changed)}
      </span>
    );
  } else if (change.kind === 'ownedList') {
    const combinedChanges = change.modified.flatMap((mod) => mod.changes);
    const hasModified = combinedChanges.length > 0;
    const hasRemoved = change.removed.length > 0;

    if (!hasModified && !hasRemoved) return null;

    display = (
      <>
        {hasModified && (
          <PropertyChangesTable
            change={combinedChanges}
            sectionName={property}
            handleDeleteChange={handleDeleteChange}
          />
        )}

        {hasRemoved && (
          <ul
            className="details-changes"
            style={{ paddingLeft: '1rem', margin: 0 }}
          >
            {change.removed.map((r, i) => (
              <li key={i}>Removed item with id {r.id}</li>
            ))}
          </ul>
        )}
      </>
    );
  } else if (change.kind === 'owned') {
    display = (
      <PropertyChangesTable
        change={change.changes}
        sectionName={property}
        handleDeleteChange={handleDeleteChange}
      />
    );
  } else if (change.kind === 'table') {
    const tableChanges = Object.entries(change.changes).map(([key, value]) => ({
      kind: 'direct' as const,
      changed: value,
      property: key,
    }));

    return (
      <div className="linked-change-wrapper">
        <div className="linked-change-table">
          <PropertyChangesTable
            change={tableChanges}
            sectionName={property}
            handleDeleteChange={handleDeleteChange}
            showTitle={false}
          />
        </div>
      </div>
    );
  } else {
    display = <span>Unsupported change type</span>;
  }

  return (
    <>
      {display} &nbsp;{change.comments && <small>{change.comments}</small>}
    </>
  );
};

export default PropertyChangeCard;
