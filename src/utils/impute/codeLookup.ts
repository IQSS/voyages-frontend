/**
 * Resolve an imputed code to the entity that carries it.
 *
 * The calculation answers in codes — `natinimp: 7` — but a change set needs the
 * Nationality entity with that code. The enumeration endpoint returns every
 * entity of a schema, so one fetch per schema is enough to index them.
 */

import { MaterializedEntity } from '@slavevoyages/voyages-contribute';

import { fetchEnumeration } from '@/fetch/contributeFetch/fetchEnumeration';

/**
 * Code-bearing schemas do not agree on what to call their code: locations and
 * nationalities expose "Code", the outcome schemas expose "Value". Probing
 * `Code ?? Value` would read a missing field as absent, so ask for both by name
 * and fail loudly if neither is there.
 */
const CODE_LABELS = ['Code', 'Value'] as const;

const readCode = (entity: MaterializedEntity): number | null => {
  for (const label of CODE_LABELS) {
    const value = entity.data[label];
    if (typeof value === 'number') {
      return value;
    }
  }
  return null;
};

export type EntityLookUp = (
  schema: string,
  code: number,
) => Promise<MaterializedEntity | null>;

export interface CodeLookup {
  lookUp: EntityLookUp;
  /** Codes the calculation produced that no entity carries. */
  unresolved: string[];
}

/**
 * Builds a lookup backed by the enumeration endpoint.
 *
 * Each schema is fetched at most once and indexed by code; misses are recorded
 * rather than thrown, so one unknown code does not abandon the whole run.
 */
export const createCodeLookup = (): CodeLookup => {
  const indexes = new Map<string, Map<number, MaterializedEntity>>();
  const unresolved: string[] = [];

  const indexFor = async (schema: string) => {
    const cached = indexes.get(schema);
    if (cached) {
      return cached;
    }
    const entities: MaterializedEntity[] = await fetchEnumeration(schema);
    const index = new Map<number, MaterializedEntity>();
    for (const entity of entities ?? []) {
      const code = readCode(entity);
      if (code !== null) {
        index.set(code, entity);
      }
    }
    indexes.set(schema, index);
    return index;
  };

  const lookUp: EntityLookUp = async (schema, code) => {
    const index = await indexFor(schema);
    const found = index.get(code) ?? null;
    if (found === null) {
      unresolved.push(`${schema}:${code}`);
    }
    return found;
  };

  return { lookUp, unresolved };
};
