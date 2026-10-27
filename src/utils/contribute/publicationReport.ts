/**
 * Turn a publication refusal into something an editor can act on.
 *
 * The server reports problems against entities and backing fields, because by
 * that point the change sets have been flattened for the database. An editor
 * works in contributions and labelled properties, so the report has to be
 * translated back before it goes on screen.
 */

import { getSchema } from '@slavevoyages/voyages-contribute';

import {
  PublicationConflict,
  PublicationValidation,
} from '@/fetch/contributeFetch/publishApi';

/**
 * The label a contributor sees for a backing field.
 *
 * `combineChanges` rewrites property uids to backing fields on its way to the
 * database, so a conflict arrives as `tonnage_mod` rather than "Tonnage
 * standardized on British measured tons, 1773-1870". Falls back to the raw
 * field, which is still better than nothing if a schema drifts.
 */
export const propertyLabel = (
  schemaName: string,
  backingField: string,
): string => {
  try {
    const prop = getSchema(schemaName).properties.find(
      (p) => 'backingField' in p && p.backingField === backingField,
    );
    return prop?.label ?? backingField;
  } catch {
    return backingField;
  }
};

export interface ReportedConflict {
  kind: 'conflict';
  schema: string;
  entityId: string | number;
  /** Human label, e.g. "Nationality". */
  label: string;
  /** Raw backing field, kept for anyone debugging. */
  field: string;
  values: (string | number | boolean | null)[];
}

export interface ReportedValidation {
  kind: 'validation';
  schema: string;
  entityId: string | number;
  message: string;
}

export type ReportedIssue = ReportedConflict | ReportedValidation;

export interface ContributionIssues {
  /** Contribution id, or null for issues the server did not attribute. */
  contributionId: string | null;
  conflicts: ReportedConflict[];
  validationErrors: ReportedValidation[];
}

/**
 * Group everything by the contribution it came from.
 *
 * `tag` carries the contribution id, and that is the unit an editor can open
 * and fix — a flat list of entity refs is not. Anything without a tag is
 * collected under `null` rather than dropped, since a problem the server
 * couldn't attribute still needs showing.
 */
export const groupIssuesByContribution = (
  conflicts: PublicationConflict[],
  validation: PublicationValidation[],
): ContributionIssues[] => {
  const groups = new Map<string | null, ContributionIssues>();

  const groupFor = (id: string | null): ContributionIssues => {
    const existing = groups.get(id);
    if (existing) {
      return existing;
    }
    const created: ContributionIssues = {
      contributionId: id,
      conflicts: [],
      validationErrors: [],
    };
    groups.set(id, created);
    return created;
  };

  // Conflicts carry no tag, so they group by entity and land under `null`.
  // They are shown first because a disagreement between contributions is the
  // harder problem to reason about.
  for (const conflict of conflicts) {
    const { schema, id } = conflict.entityRef;
    const group = groupFor(null);
    for (const change of conflict.incompatible) {
      group.conflicts.push({
        kind: 'conflict',
        schema,
        entityId: id,
        label: propertyLabel(schema, change.property),
        field: change.property,
        values: [change.changed],
      });
    }
  }

  for (const entry of validation) {
    if (entry.kind !== 'error') {
      continue;
    }
    groupFor(entry.tag ?? null).validationErrors.push({
      kind: 'validation',
      schema: entry.entityRef.schema,
      entityId: entry.entityRef.id,
      message: entry.message,
    });
  }

  return [...groups.values()].filter(
    (g) => g.conflicts.length > 0 || g.validationErrors.length > 0,
  );
};

/** Warnings do not block publication, so they are reported after the fact. */
export const warningsOf = (
  validation: PublicationValidation[],
): PublicationValidation[] => validation.filter((v) => v.kind === 'warning');

export const countIssues = (
  conflicts: PublicationConflict[],
  validation: PublicationValidation[],
) => ({
  conflicts: conflicts.reduce((n, c) => n + c.incompatible.length, 0),
  errors: validation.filter((v) => v.kind === 'error').length,
  warnings: validation.filter((v) => v.kind === 'warning').length,
});
