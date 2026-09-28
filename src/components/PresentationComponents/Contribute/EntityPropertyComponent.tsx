import { useState } from 'react';

import { Button } from '@mui/material';
import {
  MaterializedEntity,
  isMaterializedEntity,
  getSchema,
  isUpdateEntityChange,
  areMatch,
  materializeNew,
  Property,
  EntityUpdate,
  NumberProperty,
} from '@slavevoyages/voyages-contribute';

import { DATASET_PROPERTY } from '@/utils/contribute/datasets';
import { SEX_PROPERTY } from '@/utils/contribute/sex';

import { DatasetPropertyField } from './DatasetPropertyField';
import { DirectEntityPropertyField } from './DirectEntityPropertyField';
import { EntityFormProps, EntityForm } from './EntityForm';
import { EntityTableView } from './EntityTableView';
import { LinkedEntityPropertyComponent } from './LinkedEntityPropertyComponent';
import NumbersTableDialog from './NumbersTableDialog';
import { SexPropertyField } from './SexPropertyField';

export interface EntityPropertyComponentProps extends EntityFormProps {
  property: Property;
  entity: MaterializedEntity;
  error?: boolean;
}

export const EntityPropertyComponent = ({
  property,
  entity,
  error,
  ...other
}: EntityPropertyComponentProps) => {
  const { uid, kind } = property;

  const localChanges = other.changes.find(
    (ec) =>
      isUpdateEntityChange(ec) && areMatch(ec.entityRef, entity.entityRef),
  ) as EntityUpdate | undefined;
  const lastChange = localChanges?.changes.find((c) => c.property === uid);
  const [isOpenNumbersTableDialog, setOpenNumbersTableDialog] = useState(false);
  const handleOnCloseNumbersTableDialog = () =>
    setOpenNumbersTableDialog(false);
  if (kind === 'entityOwned') {
    const raw = entity.data[property.label];
    // Nullable owned entities may be null — create an empty entity so the section still renders
    const value =
      raw == null
        ? materializeNew(
            getSchema(property.linkedEntitySchema),
            `${entity.entityRef.id}_${property.label}`,
          )
        : (raw as MaterializedEntity);
    if (lastChange && lastChange.kind !== 'owned') {
      return <span>BUG: unexpected change type for Owned entity.</span>;
    }
    if (
      isMaterializedEntity(value) &&
      value.entityRef.schema === property.linkedEntitySchema
    ) {
      return (
        <EntityForm
          key={entity.entityRef.id}
          {...other}
          changes={
            lastChange
              ? [
                  {
                    entityRef: lastChange.ownedEntity.entityRef,
                    type: 'update',
                    changes: lastChange.changes,
                  },
                ]
              : []
          }
          onChange={(c) => {
            return (
              c.type === 'update' &&
              other.onChange({
                type: 'update',
                entityRef: entity.entityRef,
                changes: [
                  {
                    property: property.uid,
                    kind: 'owned',
                    ownedEntity: value,
                    changes: c.changes,
                  },
                ],
              })
            );
          }}
          schema={getSchema(property.linkedEntitySchema)}
          entity={value}
        />
      );
    } else {
      return (
        <span>
          BUG: expected a materialized value of the correct entity type.
        </span>
      );
    }
  }
  if (kind === 'text' || kind === 'number' || kind === 'bool') {
    if (lastChange && lastChange.kind !== 'direct') {
      return (
        <span>BUG: Only Direct changes are accepted for this property</span>
      );
    }
    // Stored as an integer, but it is a choice between four named databases and
    // the numbering is not something anyone should have to remember.
    if (uid === DATASET_PROPERTY) {
      return (
        <DatasetPropertyField
          property={property as NumberProperty}
          entity={entity}
          lastChange={lastChange}
          onChange={other.onChange}
          readOnly={other.readOnly}
          commentsLocked={other.commentsLocked}
          error={error}
        />
      );
    }
    // Sex is stored as an integer (gender_int) but is a Male / Female choice,
    // not a number anyone should type (DD-0550).
    if (uid === SEX_PROPERTY) {
      return (
        <SexPropertyField
          property={property as NumberProperty}
          entity={entity}
          lastChange={lastChange}
          onChange={other.onChange}
          readOnly={other.readOnly}
          commentsLocked={other.commentsLocked}
          error={error}
        />
      );
    }
    return (
      <DirectEntityPropertyField
        property={property}
        entity={entity}
        lastChange={lastChange}
        error={error}
        {...other}
      />
    );
  }
  if (kind === 'linkedEntity') {
    // Update the value if there are changes.
    if (lastChange && lastChange.kind !== 'linked') {
      return (
        <span>
          BUG: only Link changes are supported for this type of property!
        </span>
      );
    }
    return (
      <LinkedEntityPropertyComponent
        property={property}
        entity={entity}
        lastChange={lastChange}
        {...other}
      />
    );
  }
  if (kind === 'table') {
    if (lastChange && lastChange.kind !== 'table') {
      return (
        <span>
          BUG: only Table changes are supported for this type of property!
        </span>
      );
    }
    return (
      <>
        <Button
          className="button-save-contribute"
          sx={{
            cursor: 'pointer',
            textTransform: 'unset',
            height: 32,
            fontSize: '0.85rem',
          }}
          onClick={() => setOpenNumbersTableDialog(true)}
        >
          Show table
        </Button>
        <NumbersTableDialog
          property={property}
          entity={entity}
          lastChange={lastChange}
          {...other}
          onClose={handleOnCloseNumbersTableDialog}
          openDialog={isOpenNumbersTableDialog}
        />
      </>
    );
  }
  if (kind === 'ownedEntityList') {
    if (lastChange && lastChange.kind !== 'ownedList') {
      return (
        <span>
          BUG: only Table changes are supported for this type of property!
        </span>
      );
    }
    return (
      <EntityTableView
        lastChange={lastChange}
        entity={entity}
        property={property}
        {...other}
      />
    );
  }
  return <span>BUG: Unknown property {kind}</span>;
};
