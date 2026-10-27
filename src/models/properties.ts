import { PropertyValidation } from "./validation"

export enum PropertyAccessLevel {
  BegginerContributor = 0,
  IntermediateContributor = 1,
  AdvancedContributor = 2,
  Editor = 100,
  Hidden = 999
}

export interface BaseProperty {
  uid: string
  kind: string
  label: string
  schema: string
  backingField: string
  description?: string
  /**
   * An optional logical grouping of properties.
   */
  section?: string
  validation?: PropertyValidation
  accessLevel?: PropertyAccessLevel 
}

export interface TextProperty extends BaseProperty {
  readonly kind: "text"
  // By default text is non nullable
  // (empty string should work most of the time).
  nullable?: boolean
}

export interface NumberProperty extends BaseProperty {
  readonly kind: "number"
  // For our use case it seems that the majority of numbers
  // are nullable, so we make that the default.
  notNull?: boolean
}

export interface BoolProperty extends BaseProperty {
  readonly kind: "bool"
  nullable?: boolean
  defaultValue: boolean
}

export interface PartialDate {
  year: number
  month?: number
  day?: number
}

export const isPartialDate = (value: any): value is PartialDate =>
  value && value.year

export interface DateProperty extends BaseProperty {
  readonly kind: "date"
}

export interface EntityLinkBaseProperty extends BaseProperty {
  /**
   * The schema of the linked entity.
   */
  linkedEntitySchema: string
}

export enum EntityLinkEditMode {
  Select = 0,
  Own = 1,
  View = 2
} 

export interface LinkedEntityProperty extends EntityLinkBaseProperty {
  readonly kind: "linkedEntity"
  notNull?: boolean
  mode: EntityLinkEditMode
}

/**
 * This property consists of an entity that is owned through a one-to-one
 * relationship.
 */
export interface EntityOwnedProperty extends EntityLinkBaseProperty {
  readonly kind: "entityOwned"
  oneToOneBackingField: string
  notNull?: boolean
}

export enum ListEditMode {
  None = 0,
  Add = 1,
  Remove = 2,
  Modify = 4,
  All = 7
}

export interface EntityListBaseProperty extends EntityLinkBaseProperty {
  editModes: ListEditMode
}

export interface OwnedEntityListProperty extends EntityListBaseProperty {
  readonly kind: "ownedEntityList"
  childBackingProp: string
}

export interface TableProperty extends Omit<BaseProperty, "backingField"> {
  readonly kind: "table"
  columns: string[]
  rows: string[]
  /**
   * Determines the backing field for this table cell. If a cell does not have
   * a corresponding variable, the function should return undefined.
   */
  cellField: (col: number, row: number) => string | undefined
}

export type Property =
  | TextProperty
  | NumberProperty
  | BoolProperty
  | LinkedEntityProperty
  | EntityOwnedProperty
  | OwnedEntityListProperty
  | TableProperty
