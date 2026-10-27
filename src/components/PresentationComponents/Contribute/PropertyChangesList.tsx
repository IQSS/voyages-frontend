import {
  PropertyAccessLevel,
  PropertyChange,
} from '@slavevoyages/voyages-contribute';

import {
  isPropertyVisibleAt,
  propertyLabelForUid,
} from '@/utils/contribute/propertyAccess';

import PropertyChangeCard from './PropertyChangeCard';

interface PropertyChangesListProps {
  changes: PropertyChange[];
  handleDeleteChange: (propertyToDelete: string) => void;
  property?: string;
  /** Who is reading, so editor-only changes stay with editors. */
  accessLevel?: PropertyAccessLevel;
}

const PropertyChangesList = ({
  changes,
  handleDeleteChange,
  accessLevel = PropertyAccessLevel.Editor,
}: PropertyChangesListProps) => {
  // Group ownedList changes by property name
  const ownedListGroups: Record<string, any[]> = {};
  changes
    .filter(
      (c): c is Extract<PropertyChange, { kind: 'ownedList' }> =>
        c.kind === 'ownedList',
    )
    .forEach((c) => {
      if (!ownedListGroups[c.property]) ownedListGroups[c.property] = [];
      ownedListGroups[c.property].push(...c.modified, ...c.removed);
    });

  return (
    <>
      {/* Render grouped ownedList sections only once */}
      {Object.entries(ownedListGroups).map(([property, items], idx) => {
        const allChanges = items.flatMap((item) => item.changes || []);
        if (allChanges.length === 0) return null;

        return (
          <div key={`owned-${idx}`} className="property-card">
            <PropertyChangeCard
              change={{
                kind: 'ownedList',
                modified: items,
                removed: [],
                property,
              }}
              property={property}
              handleDeleteChange={handleDeleteChange}
            />
          </div>
        );
      })}

      {changes
        .filter((pc) => pc.kind !== 'ownedList')
        .filter(
          (pc) =>
            pc.kind !== 'direct' ||
            isPropertyVisibleAt(pc.property, accessLevel),
        )
        .map((pc, idxPC) => (
          <div key={`change-${idxPC}`} className="property-card">
            {pc.kind === 'direct' && propertyLabelForUid(pc.property) && (
              <strong>{propertyLabelForUid(pc.property)}: </strong>
            )}
            <PropertyChangeCard
              change={pc}
              property={pc.property}
              handleDeleteChange={handleDeleteChange}
            />
          </div>
        ))}
    </>
  );
};

export default PropertyChangesList;
