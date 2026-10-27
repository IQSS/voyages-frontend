import React from 'react';

import { Dialog, DialogContent, DialogTitle, PaperProps } from '@mui/material';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  PaperDraggable,
  PaperDraggableBatchAssignmentModal,
  PaperDraggableBatchManagement,
  PaperDraggableCreateBatch,
  PaperDraggableDeleteBatch,
  PaperDraggableEditBatch,
  PaperDraggableLinkEntityAddComponent,
  PaperDraggableLinkEntityPreviewChange,
  PaperDraggableNumbersTable,
  PaperDraggableTimeLapse,
  PaperDraggableUploadBatch,
} from '@/components/SelectorComponents/Cascading/PaperDraggable';

afterEach(cleanup);

const papers = {
  PaperDraggable,
  PaperDraggableBatchAssignmentModal,
  PaperDraggableBatchManagement,
  PaperDraggableCreateBatch,
  PaperDraggableDeleteBatch,
  PaperDraggableEditBatch,
  PaperDraggableLinkEntityAddComponent,
  PaperDraggableLinkEntityPreviewChange,
  PaperDraggableNumbersTable,
  PaperDraggableTimeLapse,
  PaperDraggableUploadBatch,
};

describe('draggable MUI dialogs', () => {
  it.each(Object.entries(papers))(
    '%s preserves MUI sizing selectors and caller classes',
    (_name, PaperComponent) => {
      render(
        <Dialog
          open
          fullWidth
          maxWidth="sm"
          PaperComponent={PaperComponent}
          PaperProps={{ className: 'caller-paper-class' }}
          sx={{
            '& .MuiDialog-paper': {
              maxHeight: '321px',
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          <DialogTitle>Fixture dialog</DialogTitle>
          <DialogContent>Fixture content</DialogContent>
        </Dialog>,
      );

      const paper = document.querySelector<HTMLElement>('[role="dialog"]')!;
      expect(paper.classList.contains('MuiDialog-paper')).toBe(true);
      expect(paper.classList.contains('caller-paper-class')).toBe(true);
      expect(getComputedStyle(paper).maxHeight).toBe('321px');
      expect(getComputedStyle(paper).flexDirection).toBe('column');
    },
  );

  it('drags a nested Add-new dialog without moving its parent', () => {
    const paperProps = (
      handleId: string,
    ): PaperProps & { handleId: string } => ({
      handleId,
    });
    render(
      <Dialog
        open
        PaperComponent={PaperDraggableLinkEntityAddComponent}
        PaperProps={paperProps('source-title')}
        aria-labelledby="source-title"
      >
        <DialogTitle id="source-title">Add source</DialogTitle>
        <DialogContent>
          <Dialog
            open
            PaperComponent={PaperDraggableLinkEntityAddComponent}
            PaperProps={paperProps('short-reference-title')}
            aria-labelledby="short-reference-title"
          >
            <DialogTitle id="short-reference-title">
              Add short reference
            </DialogTitle>
            <DialogContent>Nested content</DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>,
    );

    const outer = document.querySelector<HTMLElement>(
      '[role="dialog"][aria-labelledby="source-title"]',
    )!;
    const inner = document.querySelector<HTMLElement>(
      '[role="dialog"][aria-labelledby="short-reference-title"]',
    )!;
    const outerTransform = outer.style.transform;
    const title = document.getElementById('short-reference-title')!;
    expect(outer.querySelectorAll('#source-title')).toHaveLength(1);
    expect(inner.querySelectorAll('#short-reference-title')).toHaveLength(1);
    fireEvent.mouseDown(title, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseMove(document, { clientX: 45, clientY: 30 });
    fireEvent.mouseUp(document);
    expect(inner.style.transform).toBe('translate(35px,20px)');
    expect(outer.style.transform).toBe(outerTransform);
  });
});
