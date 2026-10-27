import { NonNullFieldValue, EntityData } from "./materialization"

export type DataOperator = "equals" | "in"

export interface DataFilter {
  /**
   * The field to search for.
   */
  field: string
  /**
   * The operator to use, if not set, it defaults to equal.
   */
  operator?: DataOperator
  value: NonNullFieldValue | NonNullFieldValue[]
}

export interface DataQuery {
  model: string
  filter: DataFilter[]
}

export interface DataResolverInput {
  query: DataQuery
  fields: string[]
}

/**
 * The DataResolver is responsible for getting the entity data. It can be mocked
 * for unit tests, access the database, impose a caching layer etc.
 */
export interface DataResolver {
  fetch: (input: DataResolverInput) => Promise<EntityData[]>
}

export interface BatchDataResolver {
  fetchBatch: (batch: Record<string, DataResolverInput>) => Promise<Record<string, EntityData[]>>
}