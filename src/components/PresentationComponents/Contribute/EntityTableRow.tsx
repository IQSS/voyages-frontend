import React, { useCallback, useMemo } from 'react';

import {
  Delete,
  DeleteForever,
  Restore,
  KeyboardArrowUp,
  KeyboardArrowDown,
} from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  TableCell,
  TableRow,
  Collapse,
} from '@mui/material';
import {
  applyUpdate,
  cloneEntity,
  MaterializedEntity,
  EntitySchema,
  areMatch,
  EntityChange,
  EntityRef,
  EntityUpdate,
  mergePropertyChange,
  OwnedEntityListChange,
  PropertyChange,
  OwnedEntityListProperty,
} from '@slavevoyages/voyages-contribute';
import { Modal } from 'antd';

import { ListChange, purgedOf } from '@/utils/contribute/contributionChanges';

import { EntityForm, EntityFormProps } from './EntityForm';
import { createEmptyChange } from './EntityTableView';

// Compact buttons for a deleted row, in place of the single delete icon.
const rowButtonSx = {
  textTransform: 'none',
  fontSize: 12,
  lineHeight: 1.5,
  py: 0.25,
  px: 1,
  minWidth: 0,
  background: '#fff',
  '& .MuiButton-startIcon': { mr: 0.5 },
} as const;

interface EntityTableRowProps {
  schema: EntitySchema;
  entity: MaterializedEntity;
  parent: MaterializedEntity;
  property: OwnedEntityListProperty;
  lastChange?: OwnedEntityListChange;
}

export const EntityTableRow = ({
  schema,
  entity,
  parent,
  property,
  lastChange,
  onChange,
  ...other
}: EntityTableRowProps & EntityFormProps) => {
  const [open, setOpen] = React.useState(false);

  const isDeleted =
    lastChange &&
    lastChange.removed.findIndex((r) => areMatch(r, entity.entityRef)) >= 0;

  const handleDelAction = useCallback(() => {
    if (isDeleted) {
      // Revert.
      const notThis = (r: EntityRef) => !areMatch(r, entity.entityRef);
      onChange({
        type: 'update',
        entityRef: parent.entityRef,
        changes: [
          {
            ...lastChange,
            removed: lastChange.removed.filter(notThis),
            purged: purgedOf(lastChange).filter(notThis),
          } as ListChange,
        ],
      });
    } else {
      const change: OwnedEntityListChange =
        lastChange ?? createEmptyChange(property.uid);
      onChange({
        type: 'update',
        entityRef: parent.entityRef,
        changes: [
          {
            ...change,
            removed: [...change.removed, entity.entityRef],
          },
        ],
      });
    }
  }, [isDeleted, lastChange, onChange]);

  // Hides a deleted row from the list, after confirmation. It stays removed.
  const handleDeleteForever = useCallback(() => {
    if (!lastChange) return;
    const purge = () =>
      onChange({
        type: 'update',
        entityRef: parent.entityRef,
        changes: [
          {
            ...lastChange,
            purged: [...purgedOf(lastChange), entity.entityRef],
          } as ListChange,
        ],
      });
    Modal.confirm({
      title: 'Delete this row forever?',
      content:
        'It will be removed from the list and can no longer be reverted here.',
      okText: 'Delete forever',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: purge,
    });
  }, [lastChange, onChange, parent, entity]);

  const handleRowChange = useCallback(
    (c: EntityChange) => {
      const change: OwnedEntityListChange =
        lastChange ?? createEmptyChange(property.uid);
      if (c.type !== 'update') {
        alert('Not supported change in nested table entry!');
        return;
      }
      if (!areMatch(c.entityRef, entity.entityRef)) {
        alert('Unexpected entityRef in nested table entry!');
        return;
      }
      const prev = change.modified.find((m) =>
        areMatch(m.ownedEntity.entityRef, c.entityRef),
      );
      const next = mergePropertyChange(prev, {
        kind: 'owned',
        ownedEntity: prev?.ownedEntity ?? entity,
        property: property.uid,
        changes: c.changes,
      });
      onChange({
        type: 'update',
        entityRef: parent.entityRef,
        changes: [
          {
            ...change,
            modified: [
              ...change.modified.filter(
                (m) => !areMatch(m.ownedEntity.entityRef, c.entityRef),
              ),
              next,
            ],
          },
        ],
      });
    },
    [lastChange, parent, entity, property, onChange],
  );

  const rowPropChanges: PropertyChange[] = useMemo(() => {
    if (!lastChange) return [];
    return lastChange.modified
      .filter((v) => areMatch(v.ownedEntity.entityRef, entity.entityRef))
      .flatMap((v) => v.changes);
  }, [entity, lastChange]);

  const rowChanges: EntityUpdate[] = useMemo(
    () =>
      rowPropChanges.length === 0
        ? []
        : [
            {
              type: 'update',
              entityRef: entity.entityRef,
              changes: rowPropChanges,
            },
          ],
    [entity, rowPropChanges],
  );

  const background = isDeleted
    ? '#ffcdd2'
    : entity.entityRef.type === 'new'
      ? '#e8f5e9'
      : '#f9f9f9';

  const updatedEntity = useMemo(() => {
    let e = entity;
    if (rowPropChanges.length > 0) {
      try {
        e = cloneEntity(entity);
        applyUpdate(e, rowPropChanges);
      } catch {
        // DEBUG MODE:
        e = entity;
        console.dir(e);
      }
    }
    return e;
  }, [entity, rowPropChanges]);

  return (
    <React.Fragment>
      <TableRow
        sx={{
          '& > *': {
            borderBottom: 'unset',
            background,
          },
          '&:hover': {
            backgroundColor: '#f0f0f0',
          },
        }}
      >
        <TableCell>
          {schema.contributionMode !== 'ReadOnly' && (
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          )}
        </TableCell>
        <TableCell
          component="th"
          scope="row"
          sx={{ fontWeight: 500, color: '#333' }}
        >
          <span
            dangerouslySetInnerHTML={{
              __html: schema.getLabel(updatedEntity.data),
            }}
          ></span>
        </TableCell>
        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
          {isDeleted ? (
            <Box sx={{ display: 'inline-flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Restore sx={{ fontSize: '16px !important' }} />}
                onClick={handleDelAction}
                disabled={!!other.readOnly}
                sx={rowButtonSx}
              >
                Revert
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={
                  <DeleteForever sx={{ fontSize: '16px !important' }} />
                }
                onClick={handleDeleteForever}
                disabled={!!other.readOnly}
                sx={rowButtonSx}
              >
                Delete forever
              </Button>
            </Box>
          ) : (
            <IconButton
              size="small"
              color="error"
              onClick={handleDelAction}
              title="Delete"
              disabled={!!other.readOnly}
            >
              <Delete />
            </IconButton>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <EntityForm
                key={entity.entityRef.id}
                {...other}
                // A new entity's values are known: its fields take comments.
                commentsLocked={false}
                schema={schema}
                entity={entity}
                changes={rowChanges}
                onChange={handleRowChange}
              />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};
