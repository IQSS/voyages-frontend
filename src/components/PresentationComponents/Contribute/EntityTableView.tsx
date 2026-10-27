import { useCallback, useMemo } from 'react';

import { Add } from '@mui/icons-material';
import {
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  applyUpdate,
  isMaterializedEntityArray,
  MaterializedEntity,
  getSchema,
  materializeNew,
  areMatch,
  OwnedEntityListChange,
  OwnedEntityListProperty,
  cloneEntity,
} from '@slavevoyages/voyages-contribute';
import { Typography } from 'antd';
import { v4 as uuidv4 } from 'uuid';

import { EntityFormProps } from './EntityForm';
import { EntityTableRow } from './EntityTableRow';

export interface EntityTableViewProps {
  property: OwnedEntityListProperty;
  lastChange?: OwnedEntityListChange;
  entity: MaterializedEntity;
}

export const createEmptyChange = (property: string): OwnedEntityListChange => ({
  kind: 'ownedList',
  modified: [],
  removed: [],
  property,
});

export const EntityTableView = ({
  property,
  entity,
  lastChange,
  ...other
}: EntityTableViewProps & EntityFormProps) => {
  const { label, linkedEntitySchema } = property;
  const fieldValue = entity.data[label];
  const isValidFieldValue = isMaterializedEntityArray(fieldValue);
  const childSchema = getSchema(linkedEntitySchema);
  const onChange = other.onChange;

  const children = useMemo(() => {
    if (!isValidFieldValue) return [];
    const res: MaterializedEntity[] = [...fieldValue];
    if (lastChange) {
      const added = lastChange.modified.filter(
        (m) =>
          m.ownedEntity.entityRef.type === 'new' &&
          !res.find((e) => areMatch(m.ownedEntity.entityRef, e.entityRef)),
      );
      for (const m of added) {
        const item = cloneEntity(m.ownedEntity);
        applyUpdate(item, m.changes);
        res.push(item);
      }
    }
    // Make sure that the order in which the rows appear is consistent.
    res.sort((x, y) => {
      const a = x.entityRef.id;
      const b = y.entityRef.id;
      if (typeof a === 'number') {
        if (typeof b === 'number') {
          return a - b;
        }
        return -1;
      }
      if (typeof b === 'number') {
        return 1;
      }
      return a.localeCompare(b);
    });
    return res;
  }, [isValidFieldValue, lastChange, fieldValue]);

  const handleAdd = useCallback(() => {
    try {
      const change = lastChange ?? createEmptyChange(property.uid);
      const childProp = childSchema.properties.find(
        (p) => p.label === property.childBackingProp,
      );
      if (childProp === undefined) {
        throw new Error(
          `Invalid schema: the child property "${property.childBackingProp}" was not found in ${linkedEntitySchema}`,
        );
      }
      onChange({
        type: 'update',
        entityRef: entity.entityRef,
        changes: [
          {
            ...change,
            modified: [
              ...change.modified,
              {
                kind: 'owned',
                ownedEntity: materializeNew(
                  childSchema,
                  `${new Date().getTime()}${uuidv4()}`,
                ),
                changes: [
                  {
                    kind: 'direct',
                    property: childProp.uid,
                    changed: entity.entityRef.id,
                  },
                ],
              },
            ],
          },
        ],
      });
    } catch (e) {
      console.error(e);
      alert(e);
    }
  }, [entity, lastChange, property, linkedEntitySchema, onChange, childSchema]);

  if (!isValidFieldValue) {
    return (
      <span>
        BUG: The entity data does not match the expectation of being an array of
        materialized entities (children)
      </span>
    );
  }

  return (
    <div style={{ marginBottom: '10px' }}>
      <TableContainer component={Paper}>
        <Table aria-label="collapsible table">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>
                <Typography.Title
                  level={5}
                  style={{ color: 'rgb(55, 148, 141)' }}
                >
                  {property.label}
                </Typography.Title>
              </TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  color="success"
                  onClick={handleAdd}
                  disabled={!!other.readOnly}
                >
                  <Add />
                </IconButton>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {children.map((c) => (
              <EntityTableRow
                key={c.entityRef.id}
                {...other}
                entity={c}
                schema={childSchema}
                parent={entity}
                property={property}
                lastChange={lastChange}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};
