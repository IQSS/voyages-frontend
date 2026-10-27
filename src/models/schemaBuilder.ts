import { EntitySchema, BuilderEntityProp } from "./entities"
import {
  Property,
  TextProperty,
  NumberProperty,
  TableProperty,
  LinkedEntityProperty,
  EntityOwnedProperty,
  OwnedEntityListProperty,
  BoolProperty,
  PropertyAccessLevel
} from "./properties"

/**
A helper class to build entities, allowing some fields to be automatically set
and ensuring that all built schemas are added to the collection of all schemas.
*/
export class EntitySchemaBuilder {
  disposed: boolean = false
  props: Property[]

  constructor(
    private info: Omit<EntitySchema, "properties">,
    private built: EntitySchema[],
    initProps?: Property[]
  ) {
    this.props = initProps ?? []
  }

  add = <T extends Property>(prop: Omit<T, "schema">) => {
    if (this.disposed) {
      throw new Error("disposed")
    }
    this.props.push({ ...prop, schema: this.info.name } as T)
    return this
  }

  _mkUid = (suffix: string) => `${this.info.name}_${suffix}`

  addBool = (prop: Omit<BoolProperty, "uid" | "kind" | "schema">) =>
    this.add<BoolProperty>({
      ...prop,
      kind: "bool",
      uid: this._mkUid(prop.backingField)
    })

  addText = (prop: Omit<TextProperty, "uid" | "kind" | "schema">) =>
    this.add<TextProperty>({
      ...prop,
      kind: "text",
      uid: this._mkUid(prop.backingField)
    })

  addNumber = (prop: Omit<NumberProperty, "uid" | "kind" | "schema">) =>
    this.add<NumberProperty>({
      ...prop,
      kind: "number",
      uid: this._mkUid(prop.backingField)
    })

  addOwnerProp = (backingField: string, fkType?: "number" | "text") =>
    this.add<NumberProperty | TextProperty>({
      kind: fkType ?? "number",
      uid: this._mkUid(`owner_${backingField}`),
      backingField,
      label: backingField,
      accessLevel: PropertyAccessLevel.Hidden
    })

  addTable = (prop: Omit<TableProperty, "kind" | "schema">) =>
    this.add<TableProperty>({ ...prop, kind: "table" })

  addLinkedEntity = (prop: BuilderEntityProp<LinkedEntityProperty>) =>
    this.add<LinkedEntityProperty>({
      ...prop,
      kind: "linkedEntity",
      linkedEntitySchema: prop.linkedEntitySchema.name,
      uid: this._mkUid(prop.backingField || prop.label)
    })

  addEntityOwned = (
    prop: Omit<BuilderEntityProp<EntityOwnedProperty>, "backingField">
  ) =>
    this.add<EntityOwnedProperty>({
      ...prop,
      backingField: "",
      kind: "entityOwned",
      linkedEntitySchema: prop.linkedEntitySchema.name,
      uid: this._mkUid(prop.label)
    })

  addOwnedEntityList = (
    prop: Omit<BuilderEntityProp<OwnedEntityListProperty>, "backingField">
  ) =>
    this.add<OwnedEntityListProperty>({
      ...prop,
      backingField: "",
      kind: "ownedEntityList",
      linkedEntitySchema: prop.linkedEntitySchema.name,
      uid: this._mkUid(prop.label)
    })

  build = (): EntitySchema => {
    if (this.disposed) {
      throw new Error("disposed")
    }
    this.disposed = true
    const schema = { ...this.info, properties: [...this.props] }
    this.built.push(schema)
    return schema
  }

  clone = (name: string) =>
    new EntitySchemaBuilder({ ...this.info, name }, this.built, [...this.props.map(p => ({...p, uid: `${p.uid}_${name}`}))])
}
