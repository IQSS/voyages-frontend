import {
  areMatch,
  DirectPropertyChange,
  EntityChange,
  EntityRef,
  isEntityRef,
  PropertyChange
} from "./changeSets"
import { AllProperties, EntitySchema, getSchema } from "./entities"
import { failedUnknown } from "./validation"

export type NonNullFieldValue =
  | string
  | number
  | boolean
  | MaterializedEntity
  | MaterializedEntity[]

export type FieldValue = NonNullFieldValue | null

export type EntityData = Record<string, FieldValue>

export interface MaterializedEntity {
  entityRef: EntityRef
  data: EntityData
  /**
   * original: unchanged from the database
   *
   * new: a new entity record in the changeSet
   *
   * modified: an existing entity that has been modified in the changeSet
   *
   * deleted: an existing entity that has been deleted in the changeSet
   *
   * lazy: an existing entity whose data has not been materialized yet
   */
  state: "original" | "new" | "modified" | "deleted" | "lazy"
}

export const isMaterializedEntity = (f: FieldValue): f is MaterializedEntity =>
  f !== null &&
  typeof f === "object" &&
  typeof (f as MaterializedEntity).data === "object"

export const isMaterializedEntityArray = (
  f: FieldValue
): f is MaterializedEntity[] => Array.isArray(f)

export const materializeNew = (
  schema: EntitySchema,
  id: string | number
): MaterializedEntity => {
  const data: EntityData = {}
  for (const p of schema.properties) {
    if (
      (p.kind === "number" || p.kind === "text") &&
      p.backingField === schema.pkField
    ) {
      data[p.label] = id
    } else if (p.kind === "number") {
      data[p.label] = p.notNull ? 0 : null
    } else if (p.kind === "bool") {
      data[p.label] = p.nullable ? null : p.defaultValue
    } else if (p.kind === "text") {
      data[p.label] = p.nullable ? null : ""
    } else if (p.kind === "ownedEntityList") {
      data[p.label] = []
    } else if (p.kind === "entityOwned") {
      data[p.label] = p.notNull
        ? materializeNew(getSchema(p.linkedEntitySchema), `${id}_${p.label}`)
        : null
    } else if (p.kind === "table") {
      for (let i = 0; i < p.rows.length; ++i) {
        for (let j = 0; j < p.columns.length; ++j) {
          const cellBackingField = p.cellField(j, i)
          if (cellBackingField !== undefined) {
            data[cellBackingField] = null
          }
        }
      }
    } else if (p.kind === "linkedEntity") {
      data[p.label] = null
    } else {
      throw failedUnknown("property", p)
    }
  }
  return {
    entityRef: { id, schema: schema.name, type: "new" },
    state: "new",
    data
  }
}

/**
 * This type indexes materialized entities according to their schema and id. It
 * can be used to represent an entire entity graph
 */
export type MaterializedData = {
  [schemaName: string]: { [id: string]: MaterializedEntity }
}

export const addToMaterializedData = (
  data: MaterializedData,
  entity: MaterializedEntity
) => {
  const group = (data[entity.entityRef.schema] ??= {})
  group[entity.entityRef.id] = entity
  return data
}

/**
 * Create a deep clone of the entity.
 */
export const cloneEntity = (entity: MaterializedEntity) => {
  const recursive = ({
    entityRef,
    state,
    data
  }: MaterializedEntity): MaterializedEntity => {
    const next = Object.entries(data).reduce<EntityData>(
      (agg, [key, value]) => ({
        ...agg,
        [key]: isMaterializedEntity(value)
          ? cloneEntity(value)
          : isMaterializedEntityArray(value)
            ? value.map(cloneEntity)
            : value
      }),
      {}
    )
    return { entityRef: { ...entityRef }, state, data: next }
  }
  return recursive(entity)
}

export const expandMaterialized = (
  root: MaterializedEntity
): MaterializedData => {
  const expanded: MaterializedData = {}
  const recurse = (e: MaterializedEntity) => {
    addToMaterializedData(expanded, e)
    const children = Object.values(e.data).flatMap((f) =>
      isMaterializedEntityArray(f) || isMaterializedEntity(f) ? f : []
    )
    for (const c of children) {
      recurse(c)
    }
  }
  recurse(root)
  return expanded
}

export const getEntity = (
  data: MaterializedData,
  entityRef: EntityRef,
  lazy?: EntityData
): MaterializedEntity => {
  const grp = data[entityRef.schema] ?? {}
  let match = grp[entityRef.id]
  if (!match) {
    if (entityRef.type === "new") {
      // Materialize new entity and add it to data.
      match = materializeNew(getSchema(entityRef.schema), entityRef.id)
      addToMaterializedData(data, match)
    } else if (lazy) {
      return {
        entityRef,
        data: lazy,
        state: "lazy"
      }
    } else {
      throw new Error(
        `Could not find referenced entity ${JSON.stringify(
          entityRef
        )} in collection`
      )
    }
  }
  return match
}

const listFind = (list: MaterializedEntity[], entityRef: EntityRef) =>
  list.findIndex((e) => areMatch(e.entityRef, entityRef))

export const applyUpdate = (
  target: MaterializedEntity,
  data: MaterializedData,
  changes: PropertyChange[]
) => {
  if (target.state === "deleted") {
    throw new Error("Cannot update a deleted entity")
  }
  if (target.state === "original") {
    target.state = "modified"
  }
  for (const c of changes) {
    const prop = AllProperties[c.property]
    if (prop === undefined) {
      throw new Error(`Property ${c.property} was not found`)
    }
    if (prop.schema !== target.entityRef.schema) {
      throw new Error(
        `Property ${c.property} does not belong to target schema ${target.entityRef.schema}`
      )
    }
    if (c.kind === "direct") {
      target.data[prop.label] = isEntityRef(c.changed)
        ? getEntity(data, c.changed)
        : c.changed
    } else if (c.kind === "linked") {
      target.data[prop.label] =
        c.changed === null
          ? null
          : getEntity(data, c.changed.entityRef, c.changed.data)
    } else if (c.kind === "owned") {
      const owned = getEntity(data, c.ownedEntityId)
      const prev = target.data[prop.label]
      // Make sure that if there is already an owned entity, that the same
      // entity is updated. If a new owned entity is required, first a direct
      // prop replacement update should be made (and the old owned entity
      // possibly deleted).
      if (prev !== null) {
        if (!isMaterializedEntity(prev)) {
          throw new Error("Expected an entity for owned property update")
        }
        if (!areMatch(prev.entityRef, c.ownedEntityId)) {
          throw new Error(
            `An owned entity is already set for ${
              prop.label
            }: old => ${JSON.stringify(prev.entityRef)}, new => ${
              c.ownedEntityId.id
            }`
          )
        }
      }
      target.data[prop.label] = applyUpdate(owned, data, c.changes)
    } else if (c.kind === "ownedList") {
      const list = target.data[prop.label]
      if (!isMaterializedEntityArray(list)) {
        throw new Error(
          `Expected a materialized entity array for ${prop.label}`
        )
      }
      const remNew: EntityRef[] = []
      for (const rm of c.removed) {
        const idx = listFind(list, rm)
        if (idx < 0) {
          // This may be a new item item, so the changes cancel each other.
          if (rm.type === "new" && c.modified.find(m => areMatch(m.ownedEntityId, rm))) {
            remNew.push(rm)
            continue
          }
          throw new Error(`Cannot remove element: id ${rm.id} not found`)
        }
        list.splice(idx, 1)
      }
      const ownerSchema = getSchema(target.entityRef.schema)
      for (const mod of c.modified) {
        if (remNew.find(rm => areMatch(mod.ownedEntityId, rm))) {
          continue
        }
        const os = getSchema(mod.ownedEntityId.schema)
        const ownedEntity = getEntity(data, mod.ownedEntityId)
        const listProp = ownerSchema.properties.find(
          (p) => p.uid === c.property
        )
        if (listProp?.kind !== "ownedEntityList") {
          throw new Error(
            `Unexpected target property ${ownerSchema.name}:${c.property} for owned list change`
          )
        }
        const childProp = os.properties.find(
          (p) => p.label === listProp.childBackingProp
        )
        if (childProp === undefined) {
          throw new Error(
            `Child property "${listProp.childBackingProp}" not found
              on schema ${mod.ownedEntityId.schema}`
          )
        }
        const pkChange: DirectPropertyChange = {
          kind: "direct",
          property: childProp.uid,
          changed: target.entityRef.id
        }
        applyUpdate(ownedEntity, data, [...mod.changes, pkChange])
        const idx = listFind(list, mod.ownedEntityId)
        if (idx < 0 && mod.ownedEntityId.type !== "new") {
          throw new Error("Invalid owned list update")
        }
        if (idx < 0) {
          list.push(ownedEntity)
        } else {
          list[idx] = ownedEntity
        }
      }
    } else {
      throw failedUnknown("property change", c)
    }
  }
  return target
}

/**
 * Apply entity changes to the materialized data.
 *
 * - This method assumes that every transitive reference is materialized.
 * - The changes *mutate* the objects, caller should make defensive copies if
 *   necessary.
 * - May throw if there are invalid or inconsistent changes, or a referenced
 *   entity is not found among the materialized data.
 */
export const applyChanges = (
  data: MaterializedData,
  changes: EntityChange[]
) => {
  for (const change of changes) {
    const match = getEntity(data, change.entityRef)
    if (change.type === "delete") {
      match.state = "deleted"
    } else if (change.type === "undelete") {
      match.state = change.entityRef.type === "new" ? "new" : "modified"
    } else if (change.type === "update") {
      applyUpdate(match, data, change.changes)
    } else {
      throw failedUnknown("entity change", change)
    }
  }
}
