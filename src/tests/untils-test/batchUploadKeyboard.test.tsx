import React from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import BatchUploadModal from '@/components/PresentationComponents/Contribute/BatchComponent/Modal/BatchUploadModal';
import { useBatchUpload } from '@/hooks/useBatchUpload';

vi.mock('@/hooks/useBatchUpload', () => ({
  SUPPORTED_ENTITIES: ['Voyage'],
  useBatchUpload: vi.fn(),
}));

const state = {
  templateLoading: false,
  templateError: null,
  downloadTemplate: vi.fn(),
  selectedEntity: 'Voyage' as const,
  setSelectedEntity: vi.fn(),
  selectedFile: null,
  dragging: false,
  handleFileChange: vi.fn(),
  handleDrop: vi.fn(),
  handleDragOver: vi.fn(),
  handleDragLeave: vi.fn(),
  clearFile: vi.fn(),
  inspecting: false,
  inspectResult: null,
  inspectError: null,
  duplicateColumns: [],
  hasBlockingErrors: false,
  duplicateTitleWarning: null,
  uploading: false,
  uploadError: null,
  jobStatus: null,
  handleUpload: vi.fn(async () => {}),
  progressPercent: 0,
  isTerminal: false,
  importWarnings: null,
  importAnyway: vi.fn(async () => {}),
  dismissWarnings: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useBatchUpload).mockReturnValue(state);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('batch CSV file selection', () => {
  it('exposes a focusable native button that opens the CSV input once', () => {
    render(<BatchUploadModal visible onClose={vi.fn()} onSuccess={vi.fn()} />);
    const select = screen.getByRole('button', { name: 'Select CSV file' });
    const input =
      document.querySelector<HTMLInputElement>('input[type="file"]')!;
    const picker = vi.spyOn(input, 'click');

    // Native button semantics provide Enter and Space activation in browsers;
    // Happy DOM does not implement those keyboard default actions.
    expect(select.tagName).toBe('BUTTON');
    expect(select.getAttribute('type')).toBe('button');
    expect(select.getAttribute('tabindex')).not.toBe('-1');
    expect(select.hasAttribute('disabled')).toBe(false);
    select.focus();
    expect(document.activeElement).toBe(select);
    expect(select.contains(input)).toBe(false);
    expect(input.accept).toBe('.csv');
    fireEvent.click(select);
    expect(picker).toHaveBeenCalledTimes(1);
    expect(state.handleUpload).not.toHaveBeenCalled();
  });

  it('preserves file selection and drop handlers on the same visible zone', () => {
    render(<BatchUploadModal visible onClose={vi.fn()} onSuccess={vi.fn()} />);
    const select = screen.getByRole('button', { name: 'Select CSV file' });
    const input =
      document.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = new File(['voyageid\n800000001\n'], 'fixture.csv', {
      type: 'text/csv',
    });

    fireEvent.change(input, { target: { files: [file] } });
    expect(state.handleFileChange).toHaveBeenCalledTimes(1);
    fireEvent.dragOver(select);
    fireEvent.dragLeave(select);
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fireEvent.drop(select, { dataTransfer });
    expect(state.handleDragOver).toHaveBeenCalledTimes(1);
    expect(state.handleDragLeave).toHaveBeenCalledTimes(1);
    expect(state.handleDrop).toHaveBeenCalledTimes(1);
    expect(state.handleDrop).toHaveBeenCalledWith(
      expect.objectContaining({ dataTransfer }),
    );
  });
});
