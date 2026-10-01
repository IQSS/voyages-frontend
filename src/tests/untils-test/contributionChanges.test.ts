import {
  EntityChange,
  EntityRef,
  OwnedEntityListChange,
  PropertyChange,
} from '@slavevoyages/voyages-contribute';
import { describe, expect, test } from 'vitest';

import {
  addedRows,
  combineEntityChanges,
  dropLayerOrphans,
  ListChange,
  withoutListRemovals,
} from '@/utils/contribute/contributionChanges';

const VOYAGE: EntityRef = { schema: 'Voyage', id: 1, type: 'existing' };
const rowRef = (id: string | number, type: 'new' | 'existing' = 'new') =>
  ({ schema: 'Voyage Source Connection', id, type }) as EntityRef;

const row = (ref: EntityRef, changes: PropertyChange[]) => ({
  kind: 'owned' as const,
  ownedEntity: { entityRef: ref, data: {}, state: 'new' as const },
  changes,
});
const direct = (property: string, changed: string): PropertyChange => ({
  kind: 'direct',
  property,
  changed,
});

const sources = (
  modified: OwnedEntityListChange['modified'],
  removed: EntityRef[] = [],
): EntityChange => ({
  type: 'update',
  entityRef: VOYAGE,
  changes: [
    { kind: 'ownedList', property: 'Voyage_Sources', modified, removed },
  ],
});

const listOf = (changes: EntityChange[]) => {
  const update = changes.find((c) => c.type === 'update');
  if (update?.type !== 'update') throw new Error('no update');
  return update.changes[0] as OwnedEntityListChange;
};

describe('combineEntityChanges on owned lists', () => {
  test('a later layer removing one row keeps the rows earlier layers added', () => {
    const contribution = sources([row(rowRef('added'), [direct('page', '1')])]);
    const review = sources([], [rowRef(7, 'existing')]);

    const list = listOf(combineEntityChanges([contribution, review]));
    expect(list.modified.map((m) => m.ownedEntity.entityRef.id)).toEqual([
      'added',
    ]);
    expect(list.removed.map((r) => r.id)).toEqual([7]);
  });

  test('layers editing the same row merge, the later value winning', () => {
    const first = sources([
      row(rowRef('a'), [direct('page', '1'), direct('note', 'x')]),
    ]);
    const second = sources([row(rowRef('a'), [direct('page', '2')])]);

    const [merged] = listOf(combineEntityChanges([first, second])).modified;
    expect(
      Object.fromEntries(
        merged.changes.map((c) => [
          c.property,
          (c as { changed: string }).changed,
        ]),
      ),
    ).toEqual({ page: '2', note: 'x' });
  });

  test('removals accumulate without repeating', () => {
    const list = listOf(
      combineEntityChanges([
        sources([], [rowRef(7, 'existing')]),
        sources([], [rowRef(7, 'existing'), rowRef(8, 'existing')]),
      ]),
    );
    expect(list.removed.map((r) => r.id)).toEqual([7, 8]);
  });
});

describe('withoutListRemovals', () => {
  test('drops list removals at any depth and keeps everything else', () => {
    const nested: PropertyChange = {
      kind: 'ownedList',
      property: 'Inner_list',
      modified: [],
      removed: [rowRef(9, 'existing')],
    };
    const change = sources(
      [row(rowRef('a'), [direct('page', '1'), nested])],
      [rowRef(7, 'existing')],
    );

    const list = listOf(withoutListRemovals([change]));
    expect(list.removed).toEqual([]);
    expect(list.modified[0].changes[0]).toEqual(direct('page', '1'));
    expect(
      (list.modified[0].changes[1] as OwnedEntityListChange).removed,
    ).toEqual([]);
    // The input is left as it was.
    expect(listOf([change]).removed).toHaveLength(1);
  });
});

describe('dropLayerOrphans', () => {
  test('keeps the removal of a new row an earlier layer added', () => {
    const earlier = [sources([row(rowRef('theirs'), [])])];
    const layer = [sources([], [rowRef('theirs')])];

    const list = listOf(dropLayerOrphans(layer, addedRows(earlier)));
    expect(list.removed).toEqual([rowRef('theirs')]);
  });

  test('drops a row added and removed in the same layer', () => {
    const layer = [
      sources(
        [row(rowRef('mine'), []), row(rowRef('kept'), [])],
        [rowRef('mine')],
      ),
    ];

    const list = listOf(dropLayerOrphans(layer, []));
    expect(list.modified.map((m) => m.ownedEntity.entityRef.id)).toEqual([
      'kept',
    ]);
    expect(list.removed).toEqual([]);
  });

  test('leaves the removal of an existing row alone', () => {
    const layer = [sources([], [rowRef(7, 'existing')])];
    const list = listOf(dropLayerOrphans(layer, [rowRef(7)]));
    expect(list.removed).toEqual([rowRef(7, 'existing')]);
  });
});

describe('purged rows', () => {
  const purged = (removed: EntityRef[], purgedRefs: EntityRef[]) => {
    const change = sources([], removed);
    const list: ListChange = { ...listOf([change]), purged: purgedRefs };
    return { ...change, changes: [list] } as EntityChange;
  };

  test('stay removed when the layer is displayed', () => {
    const list = listOf(
      withoutListRemovals([
        purged(
          [rowRef(7, 'existing'), rowRef(8, 'existing')],
          [rowRef(8, 'existing')],
        ),
      ]),
    );
    expect(list.removed).toEqual([rowRef(8, 'existing')]);
  });

  test('accumulate when list changes merge', () => {
    const list = listOf(
      combineEntityChanges([
        purged([rowRef(7, 'existing')], [rowRef(7, 'existing')]),
        purged([rowRef(8, 'existing')], [rowRef(8, 'existing')]),
      ]),
    ) as ListChange;
    expect((list.purged ?? []).map((r) => r.id)).toEqual([7, 8]);
  });
});
