/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Row mappers for the editorial platform list pages (Voyages / Enslavers /
 * Enslaved). Each takes a raw `Contribution` from `/contributions` and shapes
 * it into the row the corresponding AG Grid expects — replacing the mock
 * fixtures those pages used while the backend was under development.
 *
 * A contribution is a tree rooted on one entity (`root.schema`). These mappers
 * read display values out of the root's `changeSet` so the list can show the
 * ship, places, captive numbers, enslaver name, etc. without materialising the
 * whole entity.
 */
import { Contribution } from '@slavevoyages/voyages-contribute';

import {
  transformContributionData,
  TransformedContribution,
} from './transformContributionData';

// ── changeSet readers ────────────────────────────────────────────────────────
// The root entity's section changes live at `changeSet.changes[0].changes`.
const rootChanges = (cs: any): any[] => cs?.changes?.[0]?.changes ?? [];

const findOwned = (cs: any, property: string): any =>
  rootChanges(cs).find(
    (c: any) => c?.property === property && c?.kind === 'owned',
  );

// The `ownedEntity.data` of a section carries human-readable keys
// (e.g. "Principal place of slave purchase") alongside their values.
const ownedData = (cs: any, property: string): any =>
  findOwned(cs, property)?.ownedEntity?.data ?? {};

// A direct scalar change on the root, by property key.
const directChange = (cs: any, property: string): any =>
  rootChanges(cs).find(
    (c: any) => c?.kind === 'direct' && c?.property === property,
  )?.changed;

// A linked/lookup value renders as { entityRef, data:{ Name | Nation name } }.
const nameOf = (v: any): string => {
  if (v == null) return '';
  if (typeof v === 'object')
    return v.data?.Name ?? v.data?.['Nation name'] ?? '';
  return String(v);
};

const numOf = (v: any): number | undefined => {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const firstDefined = (...vals: any[]): any =>
  vals.find((v) => v !== undefined && v !== null && v !== '');

// Contribution operation → the edit/new/delete type icon the pages render.
// (Merge is a dedicated enslaver flow that the changeSet cannot infer yet, so
// it is never guessed here.)
const opType = (c: Contribution): 'edit' | 'new' | 'delete' => {
  const first = (c.changeSet as any)?.changes?.[0];
  if (first?.type === 'delete') return 'delete';
  return c.root?.type === 'new' ? 'new' : 'edit';
};

// ── Voyages ──────────────────────────────────────────────────────────────────
export interface VoyageDisplayFields {
  year?: number | string;
  exported?: number | string;
  imported?: number | string;
  majorPlaceOfPurchase?: string;
  majorPlaceOfLanding?: string;
}

export type VoyageRow = TransformedContribution & VoyageDisplayFields;

const yearFromDates = (cs: any): number | string | undefined => {
  const dates = ownedData(cs, 'Voyage_Dates');
  const plain = numOf(dates['Year voyage began']);
  if (plain !== undefined) return plain;
  // Otherwise dig a sparse date's year out of the section, either as a nested
  // { data: { Year } } object or from the linkedChanges the form recorded.
  for (const v of Object.values<any>(dates)) {
    if (v && typeof v === 'object' && v.data?.Year) return v.data.Year;
  }
  const section = findOwned(cs, 'Voyage_Dates');
  const lc = (section?.changes ?? [])
    .flatMap((c: any) => c?.linkedChanges ?? [])
    .find((l: any) => l?.property === 'VoyageSparseDate_year' && l?.changed);
  return lc?.changed ?? undefined;
};

export const mapVoyageRow = (contribution: Contribution): VoyageRow => {
  const base = transformContributionData(contribution);
  const cs = contribution.changeSet;
  const itin = ownedData(cs, 'Voyage_Itinerary');
  const sn = ownedData(cs, 'Voyage_Slave numbers');

  return {
    ...base,
    year: yearFromDates(cs),
    exported: numOf(
      firstDefined(
        sn['Total captives embarked'],
        sn['Total captives embarked (imputed)'],
        sn['Total captives arrived at first port of disembarkation'],
        sn['Total captives purchased'],
      ),
    ),
    imported: numOf(
      firstDefined(
        sn['Total captives disembarked (imputed)'],
        sn['Total captives arrived at first port of disembarkation'],
        sn['Number of captives disembarked at first place'],
      ),
    ),
    majorPlaceOfPurchase: nameOf(
      firstDefined(
        itin['Principal place of slave purchase'],
        itin['Imputed principal place of slave purchase'],
        itin['Principal port of embarkation'],
        itin['First place of slave purchase'],
        itin['First port of embarkation'],
      ),
    ),
    majorPlaceOfLanding: nameOf(
      firstDefined(
        itin['Principal port of slave disembarkation'],
        itin['Imputed principal port of slave disembarkation'],
        itin['Principal port of disembarkation'],
        itin['First place of slave landing'],
        itin['First port of disembarkation'],
      ),
    ),
  };
};

// ── Enslavers ────────────────────────────────────────────────────────────────
export interface EnslaverRow {
  id: string;
  type: 'edit' | 'merge' | 'new' | 'delete';
  enslaver: string;
  enslaverMergeTarget?: string;
  contributor: string;
  timestamp: number;
  status: number;
}

export const mapEnslaverRow = (contribution: Contribution): EnslaverRow => {
  const cs = contribution.changeSet;
  const enslaver =
    directChange(cs, 'Enslaver_principal_alias') ??
    (cs as any)?.changes?.[0]?.ownedEntity?.data?.['Principal alias'] ??
    '';
  return {
    id: contribution.id ?? '',
    type: opType(contribution),
    enslaver: String(enslaver),
    contributor: cs?.author ?? '',
    timestamp: cs?.timestamp ?? 0,
    status: contribution.status,
  };
};

// ── Enslaved ─────────────────────────────────────────────────────────────────
// `Names contributed` and `Languages contributed` have no backing fields in the
// current EnslavedSchema (documented_name / age / gender only), so they are left
// blank until the schema is extended.
export interface EnslavedRow {
  id: string;
  type: 'edit' | 'merge' | 'new' | 'delete';
  enslaved: string;
  contributor: string;
  timestamp: number;
  status: number;
  contributed: string;
  languages: string;
}

// The Names owned list added to EnslavedSchema — each item carries a name and
// the language it is recorded in. Read here to fill the "Names contributed" and
// "Languages contributed" columns.
const NAME_FIELDS = ['name_first', 'name_second', 'name_third', 'modern_name'];

const readEnslavedNames = (
  cs: any,
): { names: string[]; languages: string[] } => {
  const changes = rootChanges(cs);
  // Additional documented names are direct fields on the Enslaved root
  // (name_first/second/third, modern_name), not an owned list.
  const names: string[] = [];
  for (const c of changes) {
    if (
      c?.kind === 'direct' &&
      NAME_FIELDS.some((f) => String(c?.property ?? '').endsWith(f))
    ) {
      const v = c.changed;
      if (v != null && String(v).trim() !== '') names.push(String(v).trim());
    }
  }
  // Language group is a linked field; its changed value carries the group name.
  const languages: string[] = [];
  const langChange = changes.find(
    (c: any) =>
      c?.kind === 'linked' &&
      String(c?.property ?? '').endsWith('language_group_id'),
  );
  const langName =
    langChange?.changed?.data?.['Language group'] ??
    langChange?.changed?.data?.Name;
  if (langName != null && String(langName).trim() !== '')
    languages.push(String(langName).trim());
  return { names, languages };
};

export const mapEnslavedRow = (contribution: Contribution): EnslavedRow => {
  const cs = contribution.changeSet;
  const enslaved =
    directChange(cs, 'Enslaved_documented_name') ??
    (cs as any)?.changes?.[0]?.ownedEntity?.data?.['Documented name'] ??
    '';
  const { names, languages } = readEnslavedNames(cs);
  return {
    id: contribution.id ?? '',
    type: opType(contribution),
    enslaved: String(enslaved),
    contributor: cs?.author ?? '',
    timestamp: cs?.timestamp ?? 0,
    status: contribution.status,
    contributed: names.join(', '),
    languages: Array.from(new Set(languages)).join(', '),
  };
};
