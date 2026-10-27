/* eslint-disable indent */
import { useCallback, useMemo } from 'react';

import { Button } from '@mui/material';
import {
  DirectPropertyChange,
  EntityChange,
  LinkedEntitySelectionChange,
  MaterializedEntity,
  materializeNew,
  LinkedEntityProperty,
  getSchema,
} from '@slavevoyages/voyages-contribute';

import { EntityForm, EntityFormProps } from './EntityForm';
import '@/style/contributeContent.scss';

// Voyage date fields that are conceptually year-only. Their owned
// VoyageSparseDate schema still carries Year/Month/Day, but only the Year
// belongs on the form. Identified by the owning property's backingField, which
// is stable in a way the label ("Year voyage began", ...) is not. Purely
// presentational -- what is stored is still the Year on the same table.
const YEAR_ONLY_OWNING_BACKING_FIELDS = new Set<string>([
  'imp_voyage_began_sparsedate_id',
  'imp_arrival_at_port_of_dis_sparsedate_id',
  'imp_departed_africa_sparsedate_id',
]);
// The Year sub-property within VoyageSparseDate.
const SPARSE_DATE_YEAR_UID = 'VoyageSparseDate_year';

export interface LinkedEntityPropertyComponentProps {
  property: LinkedEntityProperty;
  entity: MaterializedEntity;
  lastChange?: LinkedEntitySelectionChange;
  onChange: EntityFormProps['onChange'];
}

export const LinkedEntityOwnedPropertyComponent = ({
  property,
  entity,
  lastChange,
  onChange,
  ...other
}: LinkedEntityPropertyComponentProps & EntityFormProps) => {
  const { label } = property;
  const value = lastChange
    ? lastChange.changed
    : (entity.data[label] as MaterializedEntity | null);
  const schema = getSchema(property.linkedEntitySchema);
  // Year-only voyage date fields present the Year sub-input alone; full-date
  // fields keep Year/Month/Day.
  const yearOnly = YEAR_ONLY_OWNING_BACKING_FIELDS.has(
    (property as { backingField?: string }).backingField ?? '',
  );
  const localChanges: EntityChange[] = useMemo(
    () =>
      value && lastChange?.linkedChanges
        ? [
            {
              type: 'update' as const,
              entityRef: value.entityRef,
              changes: lastChange.linkedChanges,
            },
          ]
        : [],
    [value, lastChange],
  );

  const handleClear = useCallback(() => {
    if (value === null) {
      return;
    }
    onChange({
      type: 'update',
      entityRef: entity.entityRef,
      changes: [
        {
          kind: 'linked',
          property: property.uid,
          changed: null,
        },
      ],
    });
    onChange({
      type: 'delete',
      entityRef: value.entityRef,
    });
  }, [value, entity, property, onChange]);

  const handleSet = useCallback(() => {
    // Materialize a new entity
    const owned = materializeNew(schema, crypto.randomUUID());
    onChange({
      type: 'update',
      entityRef: entity.entityRef,
      changes: [
        {
          kind: 'linked',
          property: property.uid,
          //comments,
          changed: owned,
        },
      ],
    });
  }, [schema, entity, property, onChange]);

  const handleChanges = useCallback(
    (ec: EntityChange) => {
      if (ec.type !== 'update') {
        throw new Error('Unexpected ec type');
      }

      // Get new changes from the event
      const newChanges = ec.changes.filter(
        (c) => c.kind === 'direct',
      ) as DirectPropertyChange[];

      // Merge with existing linkedChanges to preserve previous edits
      const existingChanges = lastChange?.linkedChanges || [];
      const mergedChanges = [...existingChanges];

      // Update or add new changes
      newChanges.forEach((newChange) => {
        const existingIndex = mergedChanges.findIndex(
          (c) => c.property === newChange.property,
        );
        if (existingIndex >= 0) {
          mergedChanges[existingIndex] = newChange;
        } else {
          mergedChanges.push(newChange);
        }
      });

      onChange({
        type: 'update',
        entityRef: entity.entityRef,
        changes: [
          {
            kind: 'linked',
            property: property.uid,
            changed: value,
            linkedChanges: mergedChanges,
          },
        ],
      });
    },
    [entity, property, value, onChange, lastChange],
  );

  return (
    <>
      {value ? (
        <Button
          onClick={handleClear}
          disabled={!!other.readOnly}
          variant="outlined"
          size="small"
          sx={{
            cursor: 'pointer',
            textTransform: 'unset',
            height: 28,
            fontSize: '0.85rem',
            width: 50,
            borderColor: 'rgb(55, 148, 141)',
            color: 'rgb(55, 148, 141)',
          }}
        >
          Clear
        </Button>
      ) : (
        <Button
          onClick={handleSet}
          disabled={!!other.readOnly}
          variant="outlined"
          size="small"
          sx={{
            cursor: 'pointer',
            textTransform: 'unset',
            height: 28,
            fontSize: '0.85rem',
            width: 50,
            borderColor: 'rgb(55, 148, 141)',
            color: 'rgb(55, 148, 141)',
          }}
        >
          Set
        </Button>
      )}
      {value && (
        <div style={{ marginLeft: '20px' }}>
          <div className="date-fields-container">
            <EntityForm
              key={value.entityRef.id}
              {...other}
              changes={localChanges}
              schema={schema}
              entity={value}
              onChange={handleChanges}
              visiblePropertyUids={
                yearOnly ? [SPARSE_DATE_YEAR_UID] : undefined
              }
            />
          </div>
        </div>
      )}
    </>
  );
};
