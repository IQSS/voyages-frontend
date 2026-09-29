import { useCallback, useEffect, useId, useState } from 'react';

import { Close } from '@mui/icons-material';
import {
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import {
  LinkedEntitySelectionChange,
  MaterializedEntity,
  LinkedEntityProperty,
  getSchema,
  materializeNew,
  EntityChange,
  PropertyChange,
  applyUpdate,
  cloneEntity,
} from '@slavevoyages/voyages-contribute';
import { Form } from 'antd';

import FooterModal from '@/components/commonComponents/FooterModal';
import { PaperDraggableLinkEntityAddComponent } from '@/components/SelectorComponents/Cascading/PaperDraggable';
import { useDebounce } from '@/hooks/useDebounce';
import { StyleDialog } from '@/styleMUI';
import {
  linkedChangesFromData,
  mergePropertyChanges,
  nameChange,
} from '@/utils/contribute/linkedEntityChanges';
import { namePropertyLabel } from '@/utils/contribute/linkedEntityName';

import { EntityForm, EntityFormProps } from './EntityForm';

import '@/style/contributeContent.scss';

export interface LinkedEntityPropertyComponentProps {
  property: LinkedEntityProperty;
  entity: MaterializedEntity;
  lastChange?: LinkedEntitySelectionChange;
  onChange: EntityFormProps['onChange'];
}

/**
 * A request to add a new entity named by text typed into the dropdown's
 * search. `seq` changes with every request, so asking twice for the same text
 * still opens the dialog.
 */
export interface AddFromSearchRequest {
  text: string;
  seq: number;
}

const LinkedEntityAddNewComponent = (
  props: LinkedEntityPropertyComponentProps &
    EntityFormProps & {
      comments?: string;
      addFromSearch?: AddFromSearchRequest;
    },
) => {
  const {
    property,
    entity,
    lastChange,
    comments,
    onChange,
    addFromSearch,
    ...other
  } = props;
  const { linkedEntitySchema, uid } = property;
  // Read-only until the editor starts a review: nothing may be added, modified
  // or cleared from here before then (DD-0540).
  const readOnly = !!other.readOnly;

  const [open, setOpen] = useState(false);
  const [addedEntity, setAddedEntity] = useState<
    MaterializedEntity | undefined
  >(undefined);
  const [localChanges, setLocalChanges] = useState<EntityChange | undefined>();
  const linkedSchema = getSchema(linkedEntitySchema);
  // A drag-handle id unique to this dialog instance, so a nested Add-new (e.g. a
  // short reference opened from inside a source) does not share one id with the
  // dialog behind it. useId can contain ":" which is invalid in a CSS selector,
  // so strip it.
  const dragHandleId = `draggable-dialog-title-contribute-${useId().replace(/:/g, '')}`;

  const onClose = useCallback(() => {
    setOpen(false);
    // Re-sync with what is actually selected. If "Add new" was opened over an
    // existing reference and closed without entering anything, the fresh entity
    // was never emitted, so drop it and let the existing selection (and the
    // button) stand.
    const selected = lastChange?.changed;
    setAddedEntity(
      selected && selected.entityRef.type === 'new' ? selected : undefined,
    );
  }, [lastChange?.changed]);

  useEffect(() => {
    const selected = lastChange?.changed;
    setAddedEntity(
      selected && selected.entityRef.type === 'new' ? selected : undefined,
    );
  }, [lastChange?.changed]);

  // The new entity's fields go out as `linkedChanges` alongside it: they are
  // what publication writes (see mergePropertyChanges). A clear sends none.
  const editAdded = useCallback(
    (e: MaterializedEntity | null, linkedChanges?: PropertyChange[]) =>
      onChange({
        type: 'update',
        entityRef: entity.entityRef,
        changes: [
          {
            kind: 'linked',
            property: uid,
            comments,
            changed: e,
            ...(e ? { linkedChanges: linkedChanges ?? [] } : {}),
          },
        ],
      }),
    [onChange, entity, uid, comments],
  );

  // The field changes already sent for the entity being edited, so a later
  // edit -- or reopening it with Modify -- adds to them instead of replacing
  // them.
  // An entity emitted before these were sent has only its `data`; its changes
  // are rebuilt from that, so editing one field of it keeps the others.
  const sentLinkedChanges = useCallback(
    (e: MaterializedEntity | undefined): PropertyChange[] => {
      if (!e || lastChange?.changed?.entityRef.id !== e.entityRef.id) {
        return [];
      }
      return (
        lastChange.linkedChanges ??
        linkedChangesFromData(linkedSchema, lastChange.changed, getSchema)
      );
    },
    [lastChange, linkedSchema],
  );

  // "Add …" from a search that found nothing: a new entity named by what was
  // typed, recorded at once (the editor asked for exactly this) and opened so
  // the rest of it can be filled in. Without it, text typed into the search
  // was dropped with a bare "No data" (DD-0559).
  useEffect(() => {
    const text = addFromSearch?.text.trim();
    if (!text) return;
    const added = materializeNew(linkedSchema, crypto.randomUUID());
    const nameLabel = namePropertyLabel(linkedSchema);
    if (nameLabel) {
      added.data[nameLabel] = text;
    }
    const named = nameChange(linkedSchema, text);
    setLocalChanges(undefined);
    setAddedEntity(added);
    editAdded(added, named ? [named] : []);
    setOpen(true);
    // Only a new request opens the dialog; the rest are read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addFromSearch?.seq]);

  const handleAddOrModify = useCallback(() => {
    if (addedEntity === undefined) {
      // Open the dialog on a fresh entity but do NOT emit it yet. Emitting here
      // would replace the currently selected reference with a blank one the
      // moment "Add new" is clicked. The selection is kept until the editor
      // actually enters values -- the debounced edit below then emits and
      // replaces it -- so adding a new reference over an existing selection no
      // longer wipes it on open.
      setAddedEntity(materializeNew(linkedSchema, crypto.randomUUID()));
    }
    setOpen(true);
  }, [addedEntity, linkedSchema]);

  // Each field reports only its own change, so a new one is merged into what is
  // pending rather than replacing it. Replacing it lost every field edited in
  // the same debounce window: type a title, pick a source type within a second,
  // and the title was gone (DD-0559).
  const mergeLocalChange = useCallback((change: EntityChange) => {
    setLocalChanges((prev) => {
      if (
        !prev ||
        prev.type !== 'update' ||
        change.type !== 'update' ||
        prev.entityRef.id !== change.entityRef.id
      ) {
        return change;
      }
      const touched = new Set(change.changes.map((c) => c.property));
      return {
        ...change,
        changes: [
          ...prev.changes.filter((c) => !touched.has(c.property)),
          ...change.changes,
        ],
      };
    });
  }, []);

  const debouncedChanges = useDebounce(localChanges, 1000);

  useEffect(() => {
    if (
      !debouncedChanges ||
      addedEntity?.entityRef.id !== debouncedChanges.entityRef.id ||
      debouncedChanges.type !== 'update'
    ) {
      return;
    }
    const modified = cloneEntity(addedEntity);
    editAdded(
      applyUpdate(modified, debouncedChanges.changes),
      mergePropertyChanges(
        sentLinkedChanges(addedEntity),
        debouncedChanges.changes,
      ),
    );
  }, [debouncedChanges, editAdded, addedEntity, sentLinkedChanges]);

  const handleClear = useCallback(() => {
    editAdded(null);
  }, [editAdded]);

  return (
    <>
      <Stack
        direction="row"
        spacing={1}
        sx={{ mt: 2, mb: 2, justifyContent: 'center' }}
      >
        <Button
          variant="contained"
          onClick={handleAddOrModify}
          disabled={readOnly}
          className="button-save-contribute"
          sx={{
            cursor: 'pointer',
            textTransform: 'unset',
            height: 32,
            fontSize: '0.85rem',
          }}
        >
          {addedEntity !== undefined ? 'Modify' : 'Add new'}
        </Button>
        {addedEntity && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleClear}
            disabled={readOnly}
            size="small"
            sx={{
              cursor: 'pointer',
              textTransform: 'unset',
              height: 32,
              fontSize: '0.85rem',
            }}
          >
            Clear
          </Button>
        )}
      </Stack>

      <Dialog
        open={open && addedEntity !== undefined}
        onClose={onClose}
        disableScrollLock={false}
        sx={{
          ...StyleDialog,
          '& .MuiDialog-paper': {
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '80vh',
          },
        }}
        fullWidth
        maxWidth="sm"
        PaperComponent={PaperDraggableLinkEntityAddComponent}
        PaperProps={{ handleId: dragHandleId } as { handleId: string }}
        aria-labelledby={dragHandleId}
      >
        <DialogTitle
          // Per-instance id so this dialog's draggable Paper handle targets its
          // own title, not another open dialog's. Without a matching id the
          // handle matched nothing and the dialog could not be dragged; a shared
          // static id let a nested "Add new" (e.g. a short reference opened from
          // inside a source) collide with the dialog behind it.
          id={dragHandleId}
          sx={{
            cursor: 'move',
            position: 'relative',
            textAlign: 'center',
            fontWeight: 600,
            bgcolor: 'rgb(55, 148, 141)',
            color: '#fff',
            py: 2,
          }}
        >
          <div style={{ fontSize: '1rem' }}>
            Add new {linkedEntitySchema.replace(/([A-Z])/g, ' $1').trim()}{' '}
            entity
          </div>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent
          style={{
            padding: 26,
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {open && addedEntity && (
            <Form layout="vertical">
              <EntityForm
                {...other}
                // A new entity's values are known: its fields take comments.
                commentsLocked={false}
                changes={localChanges ? [localChanges] : []}
                schema={linkedSchema}
                entity={addedEntity}
                onChange={mergeLocalChange}
              />
            </Form>
          )}
        </DialogContent>
        <FooterModal content="" />
      </Dialog>
    </>
  );
};

export default LinkedEntityAddNewComponent;
