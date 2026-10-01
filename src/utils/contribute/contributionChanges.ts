import {
  areMatch,
  dropOrphans,
  EntityChange,
  EntityRef,
  EntityUpdate,
  mergePropertyChange,
  OwnedEntityChange,
  OwnedEntityListChange,
  PropertyChange,
} from '@slavevoyages/voyages-contribute';

export function combineOwnedChanges(
  changes: PropertyChange[],
): PropertyChange[] {
  const seen: Record<string, PropertyChange> = {};
  changes.forEach((change) => {
    seen[change.property] = change;
  });
  return Object.values(seen);
}

/**
 * `purged` lists the removed rows the list no longer shows ("deleted
 * forever"). Declared here until the shared package in use has it.
 */
export type ListChange = OwnedEntityListChange & { purged?: EntityRef[] };

export const purgedOf = (c: ListChange): EntityRef[] => c.purged ?? [];

/**
 * Merges a later change to an owned list into an earlier one: rows are merged
 * per entity (a later value for the same field wins) and removals accumulate.
 * A list change describes only the rows it touches, so replacing the earlier
 * one would drop the rows it added.
 */
export function mergeOwnedListChanges(
  first: OwnedEntityListChange,
  second: OwnedEntityListChange,
): OwnedEntityListChange {
  const modified = [...first.modified];
  for (const row of second.modified) {
    const idx = modified.findIndex((m) =>
      areMatch(m.ownedEntity.entityRef, row.ownedEntity.entityRef),
    );
    if (idx < 0) {
      modified.push(row);
    } else {
      // Rows carry no property of their own; the list's stands in for it.
      const asOwned = (m: (typeof modified)[number]): OwnedEntityChange => ({
        ...m,
        property: second.property,
      });
      modified[idx] = mergePropertyChange(asOwned(modified[idx]), asOwned(row));
    }
  }
  const union = (a: EntityRef[], b: EntityRef[]) => [
    ...a,
    ...b.filter((ref) => !a.some((r) => areMatch(r, ref))),
  ];
  return {
    ...second,
    modified,
    removed: union(first.removed, second.removed),
    purged: union(purgedOf(first), purgedOf(second)),
  } as ListChange;
}

// Rewrites the `removed` refs of every owned list, at any depth.
function mapListRemovals(
  changes: EntityChange[],
  map: (list: ListChange) => EntityRef[],
): EntityChange[] {
  const apply = (c: PropertyChange): PropertyChange => {
    if (c.kind === 'ownedList') {
      return {
        ...c,
        removed: map(c),
        modified: c.modified.map((m) => ({
          ...m,
          changes: m.changes.map(apply),
        })),
      };
    }
    if (c.kind === 'owned') {
      return { ...c, changes: c.changes.map(apply) };
    }
    return c;
  };
  return changes.map((change) =>
    change.type === 'update'
      ? { ...change, changes: change.changes.map(apply) }
      : change,
  );
}

/**
 * The same changes without their owned-list removals, at any depth, except
 * purged ones. Used to display the layer being edited: a removed row stays in
 * the list, where it is shown as deleted and can be reverted; a purged row is
 * not shown.
 */
export function withoutListRemovals(changes: EntityChange[]): EntityChange[] {
  return mapListRemovals(changes, (c) =>
    c.removed.filter((r) => purgedOf(c).some((p) => areMatch(p, r))),
  );
}

/** The new rows these changes add to owned lists, at any depth. */
export function addedRows(changes: EntityChange[]): EntityRef[] {
  const rows: EntityRef[] = [];
  const visit = (c: PropertyChange) => {
    if (c.kind === 'ownedList') {
      for (const m of c.modified) {
        if (m.ownedEntity.entityRef.type === 'new') {
          rows.push(m.ownedEntity.entityRef);
        }
        m.changes.forEach(visit);
      }
    } else if (c.kind === 'owned') {
      c.changes.forEach(visit);
    }
  };
  for (const change of changes) {
    if (change.type === 'update') change.changes.forEach(visit);
  }
  return rows;
}

/**
 * dropOrphans for one layer of a stack. A new row that is added and removed in
 * the same layer is an orphan and is dropped. One added by an earlier layer
 * (`earlierRows`) is not: its removal is kept, so the row is deleted.
 */
export function dropLayerOrphans(
  changes: EntityChange[],
  earlierRows: EntityRef[],
): EntityChange[] {
  const key = (ref: EntityRef) => `${ref.schema}:${ref.id}`;
  const earlier = new Set(earlierRows.map(key));
  // dropOrphans takes any removed new entity for an orphan, so the removals
  // to keep are hidden from it as existing ones, and put back after.
  const hiddenKeys = new Set<string>();
  const hidden = mapListRemovals(changes, ({ removed }) =>
    removed.map((r) => {
      if (r.type !== 'new' || !earlier.has(key(r))) return r;
      hiddenKeys.add(key(r));
      return { ...r, type: 'existing' };
    }),
  );
  dropOrphans(hidden);
  return mapListRemovals(hidden, ({ removed }) =>
    removed.map((r) =>
      r.type === 'existing' && hiddenKeys.has(key(r))
        ? { ...r, type: 'new' }
        : r,
    ),
  );
}

export function combineEntityChanges(changes: EntityChange[]): EntityChange[] {
  const entityMap: Record<string, EntityUpdate> = {};
  const otherChanges: EntityChange[] = [];

  changes.forEach((change) => {
    if (change.type === 'update') {
      const key = `${change.entityRef.schema}_${change.entityRef.id}`;

      if (!entityMap[key]) {
        entityMap[key] = { ...change, changes: [] };
      }

      const propertyMap: Record<string, PropertyChange> = {};
      entityMap[key].changes.forEach((propChange) => {
        propertyMap[propChange.property] = propChange;
      });

      change.changes.forEach((propertyChange) => {
        if (propertyChange.kind === 'owned') {
          propertyMap[propertyChange.property] = {
            ...propertyChange,
            changes: propertyChange.changes
              ? combineOwnedChanges(propertyChange.changes)
              : [],
          };
        } else if (propertyChange.kind === 'ownedList') {
          const prev = propertyMap[propertyChange.property];
          propertyMap[propertyChange.property] =
            prev?.kind === 'ownedList'
              ? mergeOwnedListChanges(prev, propertyChange)
              : propertyChange;
        } else {
          propertyMap[propertyChange.property] = propertyChange;
        }
      });

      entityMap[key].changes = Object.values(propertyMap);
    } else {
      otherChanges.push(change);
    }
  });

  return [...Object.values(entityMap), ...otherChanges];
}
