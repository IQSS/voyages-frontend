import {
  combineChanges,
  EntityChange,
  foldCombinedChanges,
  getSchema,
  materializeNew,
  PropertyChange,
} from '@slavevoyages/voyages-contribute';
import { describe, expect, test } from 'vitest';

import {
  linkedChangesFromData,
  mergePropertyChanges,
  nameChange,
} from '@/utils/contribute/linkedEntityChanges';

const connection = getSchema('Voyage Source Connection');
const source = getSchema('Voyage Source');
const shortRef = getSchema('Voyage Source Short Reference');
const uidOf = (schema: typeof source, label: string) =>
  schema.properties.find((p) => p.label === label)!.uid;

const SOURCE_LINK = connection.properties.find(
  (p) => p.kind === 'linkedEntity' && p.label === 'Source',
)!.uid;

// A new source titled "T", with a new short reference named "SR", linked to an
// existing voyage-source connection -- what "Add new" produces from a source.
const newSourceWithShortRef = () => {
  const ref = materializeNew(shortRef, 'sr-1');
  ref.data['Name'] = 'SR';
  const src = materializeNew(source, 'src-1');
  src.data['Title'] = 'T';
  src.data['Short reference'] = ref;
  return { ref, src };
};

// Validate the way acceptance does: combine the change set, then fold it.
const validate = (sourceChange: PropertyChange) => {
  const change: EntityChange = {
    type: 'update',
    entityRef: { schema: connection.name, id: 99, type: 'existing' },
    changes: [sourceChange],
  };
  return foldCombinedChanges([
    { ...combineChanges([change]), label: 'test' } as never,
  ]);
};

const shortRefMissing = (fold: ReturnType<typeof validate>) =>
  fold.validation.filter(
    (v) => v.kind === 'error' && /Short reference/.test(v.message),
  );

const written = (fold: ReturnType<typeof validate>, id: string) =>
  fold.updates
    .filter((u) => String(u.entityRef.id) === id)
    .flatMap((u) => u.changes.map((c) => [c.property, c.changed]));

describe('linkedChanges of an entity added with "Add new"', () => {
  test('carry its fields, nested new entities included, through validation', () => {
    const { ref, src } = newSourceWithShortRef();
    const fold = validate({
      kind: 'linked',
      property: SOURCE_LINK,
      changed: src,
      linkedChanges: [
        { kind: 'direct', property: uidOf(source, 'Title'), changed: 'T' },
        {
          kind: 'linked',
          property: uidOf(source, 'Short reference'),
          changed: ref,
          linkedChanges: [nameChange(shortRef, 'SR')!],
        },
      ],
    });
    expect(shortRefMissing(fold)).toEqual([]);
    expect(written(fold, 'src-1')).toContainEqual(['title', 'T']);
    expect(written(fold, 'sr-1')).toContainEqual(['name', 'SR']);
  });

  test('without them (as before), the new source has no short reference (DD-0559)', () => {
    const { src } = newSourceWithShortRef();
    const fold = validate({
      kind: 'linked',
      property: SOURCE_LINK,
      changed: src,
    });
    expect(shortRefMissing(fold)).toHaveLength(1);
  });

  test('are rebuilt from the data of an entity emitted without them', () => {
    const { src } = newSourceWithShortRef();
    const fold = validate({
      kind: 'linked',
      property: SOURCE_LINK,
      changed: src,
      linkedChanges: linkedChangesFromData(source, src, getSchema),
    });
    expect(shortRefMissing(fold)).toEqual([]);
    expect(written(fold, 'src-1')).toContainEqual(['title', 'T']);
    expect(written(fold, 'sr-1')).toContainEqual(['name', 'SR']);
  });
});

describe('editing an entity a previous layer created', () => {
  test('adding its short reference keeps the fields it already had', () => {
    // A contributor's new source: titled, no short reference (editor-only).
    const src = materializeNew(source, 'src-1');
    src.data['Title'] = 'T';
    const before = validate({
      kind: 'linked',
      property: SOURCE_LINK,
      changed: src,
      linkedChanges: linkedChangesFromData(source, src, getSchema),
    });
    expect(shortRefMissing(before)).toHaveLength(1);

    // The editor reopens it and picks an existing short reference.
    const picked = {
      entityRef: { schema: shortRef.name, id: 7, type: 'existing' as const },
      data: { Name: 'SR' },
      state: 'lazy' as const,
    };
    const after = validate({
      kind: 'linked',
      property: SOURCE_LINK,
      changed: src,
      linkedChanges: mergePropertyChanges(
        linkedChangesFromData(source, src, getSchema),
        [
          {
            kind: 'linked',
            property: uidOf(source, 'Short reference'),
            changed: picked,
          },
        ],
      ),
    });
    expect(shortRefMissing(after)).toEqual([]);
    expect(written(after, 'src-1')).toContainEqual(['title', 'T']);
    expect(written(after, 'src-1')).toContainEqual(['short_ref_id', 7]);
  });
});

describe('mergePropertyChanges', () => {
  test('a later change to a field replaces the earlier one; others stay', () => {
    const a = { kind: 'direct', property: 'a', changed: 1 } as PropertyChange;
    const b = { kind: 'direct', property: 'b', changed: 2 } as PropertyChange;
    const a2 = { kind: 'direct', property: 'a', changed: 3 } as PropertyChange;
    expect(mergePropertyChanges([a, b], [a2])).toEqual([b, a2]);
  });
});
