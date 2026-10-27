import { AllProperties } from "./entities"
import {
  FieldValue,
  isMaterializedEntity,
  isMaterializedEntityArray,
  MaterializedEntity
} from "./materialization"
import {
  BoolProperty,
  EntityOwnedProperty,
  LinkedEntityProperty,
  NumberProperty,
  OwnedEntityListProperty,
  Property,
  TableProperty,
  TextProperty
} from "./properties"
import { failedUnknown } from "./validation"

export interface PropertyChangeBase {
  property: string
  comments?: string
}

export interface DirectPropertyChange extends PropertyChangeBase {
  readonly kind: "direct"
  changed: string | number | boolean | EntityRef | null
}

export const isDirectChange = (
  change: PropertyChange
): change is DirectPropertyChange => change.kind === "direct"

export interface EntityRef {
  type: "existing" | "new"
  schema: string
  id: string | number
}

export const isEntityRef = (maybeRef: EntityRef | any): maybeRef is EntityRef =>
  maybeRef !== null &&
  typeof maybeRef === "object" &&
  !!(maybeRef as EntityRef).schema &&
  !!(maybeRef as EntityRef).id

export const areMatch = (a: EntityRef, b: EntityRef) =>
  a === b || (a.type === b.type && a.schema === b.schema && a.id === b.id)

export interface LinkedEntitySelectionChange extends PropertyChangeBase {
  readonly kind: "linked"
  /**
   * The id of the selected entity in the change.
   */
  changed: MaterializedEntity | null
  /**
   * In case updates have been made to the linked entity.
   */
  linkedChanges?: DirectPropertyChange[]
}

export interface OwnedEntityChange extends PropertyChangeBase {
  readonly kind: "owned"
  ownedEntityId: EntityRef
  /**
   * The changes made to the owned entity.
   */
  changes: PropertyChange[]
}

export interface TableChange extends PropertyChangeBase {
  readonly kind: "table"
  changes: Record<string, number | string | null>
}

export const isOwnedEntityChange = (
  change: PropertyChange
): change is OwnedEntityChange => (change as OwnedEntityChange).kind === "owned"

export interface ListChangeBase extends PropertyChangeBase {
  /**
   * A list of refs to list elements that should be removed.
   */
  removed: EntityRef[]
}

export interface OwnedEntityListChange extends ListChangeBase {
  readonly kind: "ownedList"
  /**
   * Modified or new entities in the list.
   */
  modified: OwnedEntityChange[]
}

export type PropertyChange =
  | DirectPropertyChange
  | TableChange
  | LinkedEntitySelectionChange
  | OwnedEntityChange
  | OwnedEntityListChange

/**
 * An entity update or insert.
 */
export interface EntityUpdate<TChange extends PropertyChange = PropertyChange> {
  readonly type: "update"
  entityRef: EntityRef
  changes: TChange[]
}

export interface EntityDelete {
  readonly type: "delete"
  entityRef: EntityRef
}

export interface EntityUndelete {
  readonly type: "undelete"
  entityRef: EntityRef
}

export type EntityChange = EntityUpdate | EntityDelete | EntityUndelete

export const isUpdateEntityChange = (ec: EntityChange): ec is EntityUpdate =>
  ec.type === "update"

type Ordered<T> = T & { order: number }

// This conditional type associates a PropertyChange type to the source Property
// type. This is useful later when we need to process a change and need the
// matching type.
type MatchingPropertyChangeType<T> = T extends OwnedEntityChange
  ? EntityOwnedProperty
  : T extends LinkedEntitySelectionChange
    ? LinkedEntityProperty
    : T extends OwnedEntityListChange
      ? OwnedEntityListProperty
      : T extends TableChange
        ? TableProperty
        : TextProperty | NumberProperty | BoolProperty

const isMatchingPropertyChangeType = <T extends PropertyChange>(
  prop: Property,
  change: T
): prop is MatchingPropertyChangeType<T> => {
  if (change.kind === "owned") {
    return prop.kind === "entityOwned"
  } else if (change.kind === "linked") {
    return prop.kind === "linkedEntity"
  }
  if (change.kind === "table") {
    return prop.kind === "table"
  }
  if (change.kind === "ownedList") {
    return prop.kind === "ownedEntityList"
  }
  return true
}

const validateAndGetProperty = <T extends PropertyChange>(
  change: T
): MatchingPropertyChangeType<T> => {
  const { property } = change
  const prop = AllProperties[property]
  if (!prop) {
    throw new Error(`Property ${property} not found`)
  }
  if (!isMatchingPropertyChangeType(prop, change)) {
    throw new Error(
      `Property ${property}'s type ${prop.kind} not compatible with change ${change.kind}`
    )
  }
  if (isOwnedEntityChange(change)) {
    const ls = (prop as LinkedEntityProperty).linkedEntitySchema
    const ss = change.ownedEntityId.schema
    if (ls !== ss) {
      throw new Error(
        `Owned changed entity "${ss}" is different than its corresponding property schema "${ls}"`
      )
    }
  }
  return prop
}

export interface CombinedChangeSet {
  deletions: EntityDelete[]
  updates: EntityUpdate<DirectPropertyChange>[]
}

const processRemoved = (
  deletedEntries: Ordered<EntityDelete>[],
  uc: ListChangeBase,
  order: number
) => {
  for (const r of uc.removed) {
    deletedEntries.push({
      type: "delete",
      entityRef: r,
      order
    })
  }
}

export const getChangeRefs = (change: EntityChange): EntityRef[] => {
  if (change.type === "delete" || change.type === "undelete") {
    return [change.entityRef]
  }
  const result: EntityRef[] = []
  const recurse = (changes: PropertyChange[]) => {
    for (const c of changes) {
      if (c.kind === "direct" || c.kind === "table") {
        continue
      }
      if (c.kind === "linked") {
        if (c.changed !== null) {
          result.push(c.changed.entityRef)
        }
      } else if (c.kind === "owned") {
        result.push(c.ownedEntityId)
        recurse(c.changes)
      } else if (c.kind === "ownedList") {
        result.push(...c.removed)
        for (const mod of c.modified) {
          result.push(mod.ownedEntityId)
        }
      } else {
        throw failedUnknown("entity change", c)
      }
    }
  }
  if (change.type === "update") {
    result.push(change.entityRef)
    // Changes may reference more entities.
    recurse(change.changes)
  }
  return result
}

/**
 * Retrieves all unique entity references that are required by the given
 * sequence of changes.
 */
export const getChangeSetRefs = (changes: EntityChange[]) => {
  const all = changes.flatMap(getChangeRefs)
  // Eliminate duplicate entries.
  const keys = new Set<string>()
  for (let i = all.length - 1; i >= 0; --i) {
    const e = all[i]
    const key = `${e.schema}_${e.id}`
    if (keys.has(key)) {
      all.splice(i, 1)
    } else {
      keys.add(key)
    }
  }
  return all
}

export const mergePropertyChange = <TChange extends PropertyChange>(
  first: TChange | undefined,
  second: TChange
): TChange => {
  if (first === undefined) {
    return second
  }
  if (first.kind !== second.kind) {
    throw new Error("Cannot merge different kinds of property changes")
  }
  if (
    first.kind === "linked" &&
    first.linkedChanges !== undefined &&
    second.kind === "linked" &&
    first.changed?.entityRef &&
    second.changed?.entityRef &&
    areMatch(first.changed.entityRef, second.changed?.entityRef)
  ) {
    const mergedLinkedChanges = mergeEntityChange(
      first.linkedChanges,
      second.linkedChanges ?? []
    )
    return { ...second, linkedChanges: mergedLinkedChanges }
  }
  if (first.kind === "owned") {
    const s = second as OwnedEntityChange
    if (!areMatch(first.ownedEntityId, s.ownedEntityId)) {
      throw new Error("Cannot merge updates for different owned entities")
    }
    // Match changed properties.
    const changes = mergeEntityChange(first.changes, s.changes)
    return { ...first, changes }
  }
  // The last update wins.
  return second
}

const mergeEntityChange = (
  prev: PropertyChange[],
  added: PropertyChange[]
): PropertyChange[] => {
  const changes = prev.map(clonePropChange)
  for (const c of added) {
    const existing = changes.findIndex((ec) => ec.property === c.property)
    if (
      existing < 0 ||
      ((c.kind === "direct" || c.kind === "table" || c.kind === "linked") &&
        existing > 0)
    ) {
      changes.splice(0, 0, clonePropChange(c))
    } else {
      changes[existing] = mergePropertyChange(changes[existing], c)
    }
  }
  return changes
}

export const addToChangeSet = (
  current: EntityChange[],
  added: EntityChange
) => {
  // Merge the change with our change set.
  const next = [...current]
  if (added.type === "update") {
    const idx = next.findIndex(
      (ec) => ec.type === "update" && areMatch(ec.entityRef, added.entityRef)
    )
    if (idx < 0 || next[idx].type !== "update") {
      next.push(added)
    } else {
      next[idx] = {
        ...next[idx],
        changes: mergeEntityChange(next[idx].changes, added.changes)
      }
    }
  } else {
    next.push(added)
  }
  return next
}

export const deleteChange = (
  current: PropertyChange[],
  deleted: PropertyChange
): number => {
  const idx = current.indexOf(deleted)
  if (idx >= 0) {
    current.splice(idx, 1)
    return 1
  } else {
    for (const c of current) {
      if (c.kind === "owned") {
        const count = deleteChange(c.changes, deleted)
        if (count > 0) {
          return count
        }
      }
    }
  }
  return 0
}

const cloneMaterializedEntity = (
  e: MaterializedEntity
): MaterializedEntity => ({
  entityRef: { ...e.entityRef },
  data: Object.entries(e.data).reduce(
    (acc, [k, v]) => {
      acc[k] = isMaterializedEntity(v)
        ? cloneMaterializedEntity(v)
        : isMaterializedEntityArray(v)
          ? v.map(cloneMaterializedEntity)
          : v
      return acc
    },
    {} as Record<string, FieldValue>
  ),
  state: e.state
})

const clonePropChange = <TProp extends PropertyChange>(c: TProp): TProp => {
  if (c.kind === "direct") {
    return {
      ...c,
      changed: isEntityRef(c.changed) ? { ...c.changed } : c.changed
    }
  }
  if (c.kind === "table") {
    return { ...c, changes: { ...c.changes } }
  }
  if (c.kind === "linked") {
    return {
      ...c,
      changed: c.changed ? cloneMaterializedEntity(c.changed) : null,
      linkedChanges: c.linkedChanges?.map(clonePropChange)
    }
  }
  if (c.kind === "owned") {
    return {
      ...c,
      ownedEntityId: { ...c.ownedEntityId },
      changes: c.changes.map(clonePropChange)
    }
  }
  if (c.kind === "ownedList") {
    return {
      ...c,
      removed: c.removed.map((r) => ({ ...r })),
      modified: c.modified.map((m) => ({
        ...m,
        ownedEntityId: { ...m.ownedEntityId },
        changes: m.changes.map(clonePropChange)
      }))
    }
  }
  throw failedUnknown("property change", c)
}

const cloneEntityChange = <TChange extends EntityChange>(
  change: TChange
): TChange => {
  if (change.type === "delete") {
    return { ...change }
  }
  if (change.type === "undelete") {
    return { ...change }
  }
  return {
    type: "update",
    entityRef: change.entityRef,
    changes: change.changes.map(clonePropChange)
  } as TChange
}

type ExtPropertyChange = PropertyChange & {
  combined?: boolean
}

/**
 * Combine an ordered sequence of changes into a flat list of deletes and
 * updates containing only direct changes that can be inspected or applied in
 * a db transaction.
 */
export const combineChanges = (
  allChanges: EntityChange[]
): CombinedChangeSet => {
  const deletedEntries: Ordered<EntityDelete>[] = []
  const undeletedEntries: Ordered<EntityUndelete>[] = []
  const updatedEntries: Ordered<EntityUpdate>[] = []
  let order = 0
  for (const change of allChanges) {
    ++order
    if (change.type === "delete") {
      deletedEntries.push({ ...cloneEntityChange(change), order })
    } else if (change.type === "undelete") {
      undeletedEntries.push({ ...cloneEntityChange(change), order })
    } else if (change.type === "update") {
      updatedEntries.push({ ...cloneEntityChange(change), order })
    } else {
      throw new Error(`Unknown change type ${JSON.stringify(change)}`)
    }
  }
  // Process and simplify/expand updates. For instance, a complex list update
  // may involve changes to the Many-to-Many model (connection) as well as
  // changes in the right-side entity.
  //
  // Note: new update entries are created and pushed to the end of the list.
  // Any entry processed and left on the array must contain only direct
  // updates to an entity. Therefore, a nested update A.B.C.x = "hello" is
  // first transformed to an update of "B", which is further processed to an
  // update of C (which is then a direct update).
  for (const u of updatedEntries) {
    const { order } = u
    for (let i = u.changes.length - 1; i >= 0; --i) {
      const uc = u.changes[i]
      if (uc.kind === "owned") {
        const prop = validateAndGetProperty(uc)
        // Move the changes to a linked entity update entry.
        const ownedChanges: ExtPropertyChange[] = [...uc.changes]
        ownedChanges.push({
          kind: "direct",
          property: prop.oneToOneBackingField,
          changed: u.entityRef.id,
          comments: uc.comments,
          combined: true
        })
        updatedEntries.push({
          type: "update" as const,
          changes: ownedChanges,
          entityRef: uc.ownedEntityId,
          order
        })
        u.changes.splice(i, 1)
      } else if (uc.kind === "ownedList") {
        processRemoved(deletedEntries, uc, order)
        validateAndGetProperty(uc)
        for (const m of uc.modified) {
          updatedEntries.push({
            type: "update" as const,
            changes: m.changes,
            entityRef: m.ownedEntityId,
            order
          })
        }
        u.changes.splice(i, 1)
      } else if (uc.kind === "linked") {
        const prop = validateAndGetProperty(uc)
        // This is a direct update on a FK value of the entity.
        updatedEntries.push({
          type: "update" as const,
          changes: [
            {
              kind: "direct" as const,
              property: prop.backingField,
              changed: uc.changed?.entityRef.id ?? null,
              comments: uc.comments,
              combined: true
            } as ExtPropertyChange
          ],
          entityRef: u.entityRef,
          order
        })
        if (uc.linkedChanges && uc.changed) {
          updatedEntries.push({
            type: "update" as const,
            changes: uc.linkedChanges,
            entityRef: uc.changed.entityRef,
            order
          })
        }
        u.changes.splice(i, 1)
      } else if (uc.kind === "table") {
        for (const [field, value] of Object.entries(uc.changes)) {
          updatedEntries.push({
            type: "update" as const,
            changes: [
              {
                kind: "direct" as const,
                property: field,
                changed: value,
                comments: uc.comments,
                combined: true
              } as ExtPropertyChange
            ],
            entityRef: u.entityRef,
            order
          })
        }
        u.changes.splice(i, 1)
      } else if (uc.kind === "direct") {
        if ((uc as ExtPropertyChange).combined === undefined) {
          // Remap to property from UID to label.
          const p = validateAndGetProperty(uc)
          u.changes[i] = {
            ...uc,
            property: p.backingField
          }
        }
      } else {
        throw new Error(
          `Unknown property change kind in: ${JSON.stringify(uc)}`
        )
      }
    }
  }
  // After expansion, sort by order.
  updatedEntries.sort((x, y) => x.order - y.order)
  deletedEntries.sort((x, y) => x.order - y.order)
  // Remove any updates with zero changes (which could happen after
  // simplification, or perhaps the UI allowed them just to allow for a
  // comment).
  for (let i = updatedEntries.length - 1; i >= 0; --i) {
    const { changes } = updatedEntries[i]
    if (changes.length === 0) {
      updatedEntries.splice(i, 1)
    } else if (changes.findIndex((c) => c.kind !== "direct") >= 0) {
      // At this point, only direct changes should appear in updated
      // entries.
      throw new Error("[BUG]: Could not simplify change sets")
    }
  }
  // First match delete-Cancel x deleted.
  for (const dc of undeletedEntries) {
    let match = -1
    for (let i = 0; i < deletedEntries.length; ++i) {
      const d = deletedEntries[i]
      if (dc.order < d.order) {
        break
      }
      if (areMatch(d.entityRef, dc.entityRef)) {
        match = i
      }
    }
    if (match < 0) {
      throw new Error(
        `A delete cancel operation ${JSON.stringify(
          dc
        )} does not match a previous delete operation.`
      )
    }
    // Remove the matched delete.
    deletedEntries.splice(match, 1)
  }
  // At this point any surviving delete entry should be applied to the
  // combined change set. We delete any updates referencing the deleted entity
  // (which could also be a New entity).
  for (let i = deletedEntries.length - 1; i >= 0; --i) {
    // We iterate in reverse order to allow removing entries from the array
    // without impacting the enumeration.
    const { order, entityRef: entityId } = deletedEntries[i]
    // An existing entity was marked for deletion, clear any updates to
    // the same entity appearing before the deletion and raise an error
    // if any update occurs *after* the deletion.
    for (let j = updatedEntries.length - 1; j >= 0; --j) {
      const u = updatedEntries[j]
      if (areMatch(u.entityRef, entityId)) {
        if (u.order > order) {
          throw new Error(`Update on ${entityId} after its deletion`)
        }
        updatedEntries.splice(j, 1)
      }
    }
  }
  // We next merge the updates so that all changes to a given entity appear in
  // a single update.
  const mergedUpdates: Record<string, EntityUpdate<DirectPropertyChange>> = {}
  for (const u of updatedEntries) {
    const id = `${u.entityRef.schema}_${u.entityRef.id}`
    const prev = mergedUpdates[id]
    let changes = u.changes.filter(isDirectChange)
    if (prev) {
      changes = [...prev.changes, ...changes]
    }
    mergedUpdates[id] = { ...u, changes }
  }
  return {
    deletions: deletedEntries,
    updates: Object.values(mergedUpdates)
  }
}

const matchAnyRef = (ref: EntityRef, all: EntityRef[]) =>
  all.find((m) => areMatch(m, ref)) !== undefined

/**
 * Recursively drop all changes that relate to
 * any of the references passed as argument.
 */
const dropRefsFromChange = (
  p: PropertyChange,
  refs: EntityRef[]
): PropertyChange | undefined => {
  if (
    p.kind === "linked" &&
    p.changed &&
    matchAnyRef(p.changed.entityRef, refs)
  ) {
    return undefined
  }
  if (p.kind === "owned") {
    if (matchAnyRef(p.ownedEntityId, refs)) {
      return undefined
    }
    if (p.changes.find((ch) => ch !== dropRefsFromChange(ch, refs))) {
      const next = {
        ...p,
        changes: p.changes
          .map((ch) => dropRefsFromChange(ch, refs))
          .filter((ch) => ch !== undefined)
      }
      return next.changes.length === 0 ? undefined : next
    }
  }
  if (p.kind === "ownedList") {
    if (
      p.removed.find((r) => matchAnyRef(r, refs)) ||
      p.modified.find((m) => matchAnyRef(m.ownedEntityId, refs))
    ) {
      const next = {
        ...p,
        modified: p.modified.filter((m) => !matchAnyRef(m.ownedEntityId, refs)),
        removed: p.removed.filter((r) => !matchAnyRef(r, refs))
      }
      return next.modified.length === 0 && next.removed.length === 0
        ? undefined
        : next
    }
  }
  return p
}

const removeRefs = (changes: EntityChange[], refs: EntityRef[]) => {
  for (let i = changes.length - 1; i >= 0; --i) {
    const c = changes[i]
    if (matchAnyRef(c.entityRef, refs)) {
      changes.splice(i, 1)
    } else if (
      c.type === "update" &&
      c.changes.find((change) => change !== dropRefsFromChange(change, refs))
    ) {
      const next = c.changes
        .map((change) => dropRefsFromChange(change, refs))
        .filter((change) => change !== undefined)
      if (next.length > 0) {
        changes[i] = {
          ...c,
          changes: next
        }
      } else {
        changes.splice(i, 1)
      }
    }
  }
}

const removeNoOpsPropChanges = (
  changes: PropertyChange[]
): PropertyChange[] => {
  let result = changes
  for (let i = result.length - 1; i >= 0; --i) {
    const c = changes[i]
    if (
      (c.kind === "owned" && c.changes.length === 0) ||
      (c.kind === "ownedList" &&
        c.modified.length === 0 &&
        c.removed.length === 0) ||
      (c.kind === "table" && c.changes.length === 0)
    ) {
      if (result === changes) {
        // make a copy before deletion
        result = [...changes]
      }
      result.splice(i, 1)
    }
  }
  return result
}

const removeNoOpsFromEC = (change: EntityChange): EntityChange | undefined => {
  if (change.type === "update") {
    const changes = removeNoOpsPropChanges(change.changes)
    if (changes.length === 0) {
      return undefined
    } else if (changes !== change.changes) {
      return { ...cloneEntityChange(change), changes }
    }
  }
  return change
}

const removeNoOps = (changes: EntityChange[]) => {
  for (let i = changes.length - 1; i >= 0; --i) {
    const c = removeNoOpsFromEC(changes[i])
    if (c === undefined) {
      changes.splice(i, 1)
    } else {
      changes[i] = c
    }
  }
}

/**
 * Drop any new entity and its update if no existing (or root) entity
 * references it.
 */
export const dropOrphans = (changes: EntityChange[]) => {
  // This is a simple algorithm: after combining all the changes, we gather all
  // new entity refs that are also marked for deletion. These are considered
  // orphans and we update the changes to eliminate any property with these refs.
  const combined = combineChanges(changes.map(cloneEntityChange))
  const orphanRefs = combined.deletions
    .filter((u) => u.entityRef.type === "new")
    .map((u) => u.entityRef)
  if (orphanRefs.length > 0) {
    removeRefs(changes, orphanRefs)
  }
  // Also eliminate any changes that are empty (possibly produced after
  // mutually cancelling changes).
  removeNoOps(changes)
  return orphanRefs
}
