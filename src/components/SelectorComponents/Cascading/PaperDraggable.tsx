import { useRef } from 'react';

import { Paper } from '@mui/material';
import { PaperProps } from '@mui/material/Paper';
import Draggable from 'react-draggable';
import '@/style/dialog.scss';

import { PaperDraggableTimeLapseStyle } from '@/styleMUI';

export function PaperDraggable(props: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
      nodeRef={paperRef}
    >
      <Paper
        {...props}
        ref={paperRef}
        className={`${props.className ?? ''} paper-draggable-dialog`.trim()}
      />
    </Draggable>
  );
}

export function PaperDraggableTimeLapse(props: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      handle="#draggable-dialog-title-timelapse"
      cancel={'[class*="MuiDialogContent-root"]'}
      nodeRef={paperRef}
    >
      <Paper
        {...props}
        ref={paperRef}
        style={{ ...PaperDraggableTimeLapseStyle }}
      />
    </Draggable>
  );
}

export function PaperDraggableLinkEntityAddComponent(
  props: PaperProps & { handleId?: string },
) {
  const paperRef = useRef<HTMLDivElement>(null);
  // Each Add-new dialog passes its own title id so nested dialogs (e.g. a short
  // reference opened from inside a source) drag independently instead of sharing
  // one id. Falls back to the static id for any caller that does not pass one.
  const { handleId, ...paperProps } = props;

  return (
    <Draggable
      handle={`#${handleId ?? 'draggable-dialog-title-contribute'}`}
      cancel={'[class*="MuiDialogContent-root"]'}
      nodeRef={paperRef}
    >
      <Paper
        {...paperProps}
        ref={paperRef}
        className={`${paperProps.className ?? ''} paper-draggable-dialog`.trim()}
      />
    </Draggable>
  );
}

export function PaperDraggableNumbersTable(props: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      handle="#draggable-dialog-nubmer"
      cancel={'[class*="MuiDialogContent-root"]'}
      nodeRef={paperRef}
    >
      <Paper
        {...props}
        ref={paperRef}
        className={`${props.className ?? ''} paper-draggable-md-dialog`.trim()}
      />
    </Draggable>
  );
}

export function PaperDraggableDeleteBatch(props: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      handle="#draggable-dialog-delete-batch"
      cancel={'[class*="MuiDialogContent-root"]'}
      nodeRef={paperRef}
    >
      <Paper
        {...props}
        ref={paperRef}
        className={`${props.className ?? ''} paper-draggable-dialog`.trim()}
      />
    </Draggable>
  );
}

export function PaperDraggableEditBatch(props: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      handle="#draggable-dialog-edit-batch"
      cancel={'[class*="MuiDialogContent-root"]'}
      nodeRef={paperRef}
    >
      <Paper
        {...props}
        ref={paperRef}
        className={`${props.className ?? ''} paper-draggable-dialog`.trim()}
      />
    </Draggable>
  );
}

export function PaperDraggableLinkEntityPreviewChange(props: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      handle="#draggable-dialog-title-preview"
      cancel={'[class*="MuiDialogContent-root"]'}
      nodeRef={paperRef}
    >
      <Paper
        {...props}
        ref={paperRef}
        className={`${props.className ?? ''} paper-draggable-md-dialog`.trim()}
      />
    </Draggable>
  );
}

export function PaperDraggableCreateBatch(props: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      handle="#draggable-dialog-create-batch"
      cancel={'[class*="MuiDialogContent-root"]'}
      nodeRef={paperRef}
    >
      <Paper
        {...props}
        ref={paperRef}
        className={`${props.className ?? ''} paper-draggable-dialog`.trim()}
      />
    </Draggable>
  );
}

export function PaperDraggableUploadBatch(props: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      handle="#draggable-dialog-upload-batch"
      cancel={'[class*="MuiDialogContent-root"]'}
      nodeRef={paperRef}
    >
      <Paper
        {...props}
        ref={paperRef}
        className={`${props.className ?? ''} paper-draggable-md-dialog`.trim()}
      />
    </Draggable>
  );
}

export function PaperDraggableBatchManagement(props: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      handle="#draggable-dialog-batch-management"
      cancel={'[class*="MuiDialogContent-root"]'}
      nodeRef={paperRef}
    >
      <Paper
        {...props}
        ref={paperRef}
        className={`${props.className ?? ''} paper-draggable-batch-dialog`.trim()}
      />
    </Draggable>
  );
}

export function PaperDraggableBatchAssignmentModal(props: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      handle="#draggable-dialog-batch-assignment"
      cancel={'[class*="MuiDialogContent-root"]'}
      nodeRef={paperRef}
    >
      <Paper
        {...props}
        ref={paperRef}
        className={`${props.className ?? ''} paper-draggable-dialog`.trim()}
      />
    </Draggable>
  );
}
