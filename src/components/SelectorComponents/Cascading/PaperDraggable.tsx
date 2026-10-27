import { useRef } from 'react';

import { Paper } from '@mui/material';
import { PaperProps } from '@mui/material/Paper';
import Draggable from 'react-draggable';
import '@/style/dialog.scss';

import {  PaperDraggableTimeLapseStyle } from '@/styleMUI';

export function PaperDraggable(props: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
      nodeRef={paperRef}
    >
      <Paper {...props} ref={paperRef} className="paper-draggable-dialog" />
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
