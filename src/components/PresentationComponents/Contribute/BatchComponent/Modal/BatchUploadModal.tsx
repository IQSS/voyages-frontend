import React, { useRef } from 'react';

import {
  DownloadOutlined,
  InboxOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Close } from '@mui/icons-material';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import { Alert, Button, Progress, Select, Space, Spin, Typography } from 'antd';

import {
  PaperDraggableCreateBatch,
  PaperDraggableUploadBatch,
} from '@/components/SelectorComponents/Cascading/PaperDraggable';
import { UploadEntity } from '@/fetch/contributeFetch/batchUploadApi';
import { SUPPORTED_ENTITIES, useBatchUpload } from '@/hooks/useBatchUpload';

const { Text } = Typography;
const { Option } = Select;

interface BatchUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingBatchTitles?: string[];
}

const BatchUploadModal: React.FC<BatchUploadModalProps> = ({
  visible,
  onClose,
  onSuccess,
  existingBatchTitles,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    templateLoading,
    templateError,
    downloadTemplate,
    selectedEntity,
    setSelectedEntity,
    selectedFile,
    dragging,
    handleFileChange,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    clearFile,
    inspecting,
    inspectResult,
    inspectError,
    duplicateColumns,
    hasBlockingErrors,
    duplicateTitleWarning,
    uploading,
    uploadError,
    jobStatus,
    handleUpload,
    progressPercent,
    isTerminal,
    importWarnings,
    importAnyway,
    dismissWarnings,
  } = useBatchUpload({
    existingBatchTitles,
    onUploadSuccess: () => {
      onSuccess();
      handleClose();
    },
  });

  const handleClose = () => {
    clearFile();
    onClose();
  };

  const isUploadDisabled =
    !selectedFile ||
    uploading ||
    isTerminal ||
    inspecting ||
    hasBlockingErrors ||
    !!duplicateTitleWarning;

  return (
    <Dialog
      open={visible}
      onClose={handleClose}
      disableScrollLock={false}
      sx={{
        '& .MuiDialog-container': {
          position: 'relative',
          top: '10%',
          alignItems: 'flex-start',
        },
        '& .MuiBackdrop-root': { backgroundColor: 'rgba(0, 0, 0, 0.55)' },
        '& .MuiPaper-root': {
          boxShadow: '0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.08)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        },
        '& .MuiDialogContent-root': {
          padding: '10px 15px',
          overflowY: 'auto',
          flex: '1 1 auto',
          minHeight: 0,
        },
      }}
      fullWidth
      maxWidth="sm"
      PaperComponent={PaperDraggableUploadBatch}
      aria-labelledby="draggable-dialog-upload-batch"
    >
      {/* ── Header ── */}
      <DialogTitle
        sx={{
          cursor: 'move',
          position: 'relative',
          textAlign: 'center',
          fontWeight: 600,
          bgcolor: 'rgb(55, 148, 141)',
          color: '#fff',
          py: 2,
          flexShrink: 0,
        }}
      >
        <Text
          style={{
            margin: 0,
            color: '#fff',
            fontSize: '1.25rem',
            fontWeight: 600,
          }}
        >
          Upload Batch CSV
        </Text>
        <IconButton
          edge="end"
          color="inherit"
          onClick={handleClose}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* ── Entity + template download ── */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Entity type
            </Text>
            <Space wrap>
              <Select
                value={selectedEntity}
                onChange={(val) => setSelectedEntity(val as UploadEntity)}
                style={{ width: 140 }}
                size="middle"
              >
                {SUPPORTED_ENTITIES.map((e) => (
                  <Option key={e} value={e}>
                    {e}
                  </Option>
                ))}
              </Select>
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => downloadTemplate(selectedEntity)}
                loading={templateLoading}
                style={{
                  color: 'rgb(55, 148, 141)',
                  border: '1px solid rgb(55, 148, 141)',
                  fontSize: '0.75rem',
                }}
              >
                Download template
              </Button>
            </Space>
            {templateError && (
              <Alert
                type="error"
                message={templateError}
                style={{ marginTop: 8 }}
                showIcon
              />
            )}
            <Text
              type="secondary"
              style={{ display: 'block', marginTop: 6, fontSize: 12 }}
            >
              Download the blank template to get the correct column headers,
              fill in your data, then upload the file below.
            </Text>
          </div>

          {/* ── Drop zone ── */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Select CSV file
            </Text>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? '#37948d' : '#d9d9d9'}`,
                borderRadius: 8,
                padding: '12px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragging ? '#f0fffe' : '#fafafa',
                transition: 'border-color 0.2s, background 0.2s',
              }}
            >
              <InboxOutlined
                style={{ fontSize: 18, color: '#37948d', marginBottom: 2 }}
              />
              <div>
                <Text style={{ fontSize: 12 }}>
                  {selectedFile
                    ? selectedFile.name
                    : 'Drag and drop a CSV file here, or click to select'}
                </Text>
              </div>
              {selectedFile && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </Text>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
            {uploadError && (
              <Alert
                type="error"
                message={uploadError}
                style={{ marginTop: 8 }}
                showIcon
              />
            )}
          </div>

          {/* ── Validation panel (shown after a file is selected) ── */}
          {selectedFile && (
            <div
              style={{
                border: '1px solid #e8e8e8',
                borderRadius: 8,
                padding: '12px 14px',
                background: '#fafafa',
              }}
            >
              <Text
                strong
                style={{ fontSize: 13, display: 'block', marginBottom: 8 }}
              >
                File validation
              </Text>

              {inspecting && (
                <Space>
                  <Spin size="small" />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Checking columns against schema…
                  </Text>
                </Space>
              )}

              {!inspecting && inspectError && (
                <Alert
                  type="warning"
                  message={inspectError}
                  style={{ fontSize: 12 }}
                  showIcon
                />
              )}

              {/* Duplicate batch title — warning */}
              {duplicateTitleWarning && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 6 }}
                  message={
                    <span style={{ fontSize: 12 }}>
                      {duplicateTitleWarning}
                    </span>
                  }
                />
              )}

              {/* Duplicate column headers — blocking */}
              {duplicateColumns.length > 0 && (
                <Alert
                  type="error"
                  showIcon
                  style={{ marginBottom: 6 }}
                  message={
                    <span style={{ fontSize: 12 }}>
                      <strong>
                        {duplicateColumns.length} duplicate column header
                        {duplicateColumns.length !== 1 ? 's' : ''}
                      </strong>{' '}
                      — each header may appear only once. If a required column
                      is reported missing below, one of these duplicates is
                      likely that column under the wrong name — rename it in
                      your file:
                      <div
                        style={{
                          marginTop: 4,
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 4,
                          maxHeight: 130,
                          overflowY: 'auto',
                        }}
                      >
                        {duplicateColumns.map((col) => (
                          <code
                            key={col}
                            style={{
                              background: '#fff1f0',
                              border: '1px solid #ffa39e',
                              borderRadius: 3,
                              padding: '1px 5px',
                              fontSize: 11,
                            }}
                          >
                            {col}
                          </code>
                        ))}
                      </div>
                    </span>
                  }
                />
              )}

              {!inspecting && inspectResult && (
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  {/* Missing required columns — blocking */}
                  {inspectResult.mappingHeadersNotInCsv.length > 0 && (
                    <Alert
                      type="error"
                      showIcon
                      message={
                        <span style={{ fontSize: 12 }}>
                          <strong>
                            {inspectResult.mappingHeadersNotInCsv.length}{' '}
                            required column
                            {inspectResult.mappingHeadersNotInCsv.length !== 1
                              ? 's'
                              : ''}{' '}
                            missing
                          </strong>{' '}
                          — fix these before uploading:
                          <div
                            style={{
                              marginTop: 4,
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 4,
                              maxHeight: 130,
                              overflowY: 'auto',
                            }}
                          >
                            {inspectResult.mappingHeadersNotInCsv.map((col) => (
                              <code
                                key={col}
                                style={{
                                  background: '#fff1f0',
                                  border: '1px solid #ffa39e',
                                  borderRadius: 3,
                                  padding: '1px 5px',
                                  fontSize: 11,
                                }}
                              >
                                {col}
                              </code>
                            ))}
                          </div>
                        </span>
                      }
                    />
                  )}

                  {/* Unknown columns — warning only */}
                  {inspectResult.csvHeadersNotInMapping.length > 0 && (
                    <Alert
                      type="warning"
                      showIcon
                      message={
                        <span style={{ fontSize: 12 }}>
                          <strong>
                            {inspectResult.csvHeadersNotInMapping.length}{' '}
                            unrecognised column
                            {inspectResult.csvHeadersNotInMapping.length !== 1
                              ? 's'
                              : ''}
                          </strong>{' '}
                          — these will be ignored by the importer:
                          <div
                            style={{
                              marginTop: 4,
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 4,
                              maxHeight: 130,
                              overflowY: 'auto',
                            }}
                          >
                            {inspectResult.csvHeadersNotInMapping.map((col) => (
                              <code
                                key={col}
                                style={{
                                  background: '#fffbe6',
                                  border: '1px solid #ffe58f',
                                  borderRadius: 3,
                                  padding: '1px 5px',
                                  fontSize: 11,
                                }}
                              >
                                {col}
                              </code>
                            ))}
                          </div>
                        </span>
                      }
                    />
                  )}

                  {/* All clear */}
                  {inspectResult.mappingHeadersNotInCsv.length === 0 &&
                    inspectResult.csvHeadersNotInMapping.length === 0 &&
                    duplicateColumns.length === 0 && (
                      <Alert
                        type="success"
                        showIcon
                        message={
                          <span style={{ fontSize: 12 }}>
                            All columns match the schema — ready to upload.
                          </span>
                        }
                      />
                    )}
                </Space>
              )}

              {/* Validation rules info */}
              <details style={{ marginTop: 10 }}>
                <summary
                  style={{
                    fontSize: 12,
                    color: '#595959',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  What does validation check?
                </summary>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: '#595959',
                    lineHeight: 1.6,
                  }}
                >
                  <p style={{ margin: '0 0 4px' }}>
                    <strong>Required columns</strong> — the file must contain
                    every column header defined in the entity mapping. Missing
                    columns block upload.
                  </p>
                  <p style={{ margin: '0 0 4px' }}>
                    <strong>Duplicate columns</strong> — every header must be
                    unique. A duplicated header is often a required column saved
                    under the wrong name (e.g. a second <code>arrport</code>{' '}
                    that should be <code>arrport2</code>). Duplicates block
                    upload.
                  </p>
                  <p style={{ margin: '0 0 4px' }}>
                    <strong>Unrecognised columns</strong> — extra headers not in
                    the mapping are silently ignored; they do not cause a
                    failure.
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Tip:</strong> use the <em>Download template</em>{' '}
                    button above to get a file with all the correct headers
                    already in place.
                  </p>
                </div>
              </details>
            </div>
          )}

          {/* ── Progress ── */}
          {jobStatus && (
            <div>
              {(jobStatus.status === 'pending' ||
                jobStatus.status === 'running') && (
                <Space>
                  <Spin size="small" />
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Processing rows… {jobStatus.progress.processed} /{' '}
                    {jobStatus.progress.total || '?'}
                  </Text>
                </Space>
              )}

              {jobStatus.progress.total > 0 && (
                <Progress
                  percent={progressPercent}
                  status={
                    jobStatus.status === 'failed'
                      ? 'exception'
                      : jobStatus.status === 'completed'
                        ? 'success'
                        : 'active'
                  }
                  style={{ marginTop: 8 }}
                />
              )}

              {jobStatus.status === 'completed' && jobStatus.result && (
                <Alert
                  type="success"
                  style={{ marginTop: 8 }}
                  message={
                    <>
                      Import complete —{' '}
                      <strong>{jobStatus.result.pushed}</strong> contribution
                      {jobStatus.result.pushed !== 1 ? 's' : ''} created.
                      {jobStatus.progress.total - jobStatus.result.pushed >
                        0 && (
                        <>
                          {' '}
                          {jobStatus.progress.total -
                            jobStatus.result.pushed}{' '}
                          row
                          {jobStatus.progress.total -
                            jobStatus.result.pushed !==
                          1
                            ? 's'
                            : ''}{' '}
                          were dropped by the mapper.
                        </>
                      )}
                    </>
                  }
                  description={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      These are saved as <strong>Work In Progress</strong> —
                      each one still needs to be submitted and reviewed before
                      it can be published.
                    </Text>
                  }
                  showIcon
                />
              )}

              {/* A genuine failure (no mapping problems to resolve). When the
                  job failed only because rows named unmatched values, that is a
                  question, not a failure -- the warnings block handles it. */}
              {jobStatus.status === 'failed' && !importWarnings && (
                <Alert
                  type="error"
                  style={{ marginTop: 8 }}
                  message={
                    jobStatus.failureReason ??
                    'Import failed. Check your CSV and try again.'
                  }
                  showIcon
                />
              )}

              {/* Import warnings: the first ('abort') attempt imported nothing
                  because some values could not be matched. One block per
                  distinct problem. The editor cancels or imports anyway. */}
              {importWarnings && (
                <Alert
                  type="warning"
                  style={{ marginTop: 8 }}
                  showIcon
                  message={
                    <strong>Some values are not in the database yet</strong>
                  }
                  description={
                    <div>
                      <Text type="secondary" style={{ fontSize: 12.5 }}>
                        Your file references these values, but they do not exist
                        in the database, so they were left out. Nothing has been
                        imported yet.
                      </Text>
                      <div
                        style={{
                          marginTop: 12,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                        }}
                      >
                        {importWarnings.map((w, i) => {
                          const p = w.error;
                          const rows = w.rowNumbers.join(', ');
                          const countText = `${w.count} row${w.count !== 1 ? 's' : ''}`;
                          if (p.kind === 'lookup') {
                            // Show the first part only -- the name without the
                            // trailing page numbers (value can be "name|pages").
                            const shown = String(p.value).split('|')[0];
                            return (
                              <div key={i}>
                                <div style={{ fontWeight: 600 }}>
                                  {p.field} not found
                                </div>
                                <div style={{ color: '#d46b08' }}>{shown}</div>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {`Field “${p.field}” · table ${p.schema} · ${countText}${
                                    rows ? ` · rows ${rows}` : ''
                                  }`}
                                </Text>
                              </div>
                            );
                          }
                          return (
                            <div key={i}>
                              <div style={{ fontWeight: 600 }}>
                                Incomplete {p.schema}
                              </div>
                              <div style={{ color: '#d46b08' }}>
                                Missing: {p.missing}
                              </div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {`${countText}${rows ? ` · rows ${rows}` : ''}`}
                              </Text>
                            </div>
                          );
                        })}
                      </div>

                    <Text
                        type="secondary"
                        style={{
                          display: 'block',
                          marginTop: 14,
                          fontSize: 12.5,
                        }}
                      >
                        <strong>To keep them:</strong> click{' '}
                        <strong>Cancel</strong>, add each value in the database
                        first (for sources, use{' '}
                        <strong>Contribute → Source Codes → Add Source</strong>{' '}
                        and enter its short reference exactly as it appears
                        above), then upload this file again.
                        <br />
                        <strong>Import anyway</strong> imports every row the
                        server could read and permanently leaves out the values
                        listed here.
                      </Text>
                    </div>
                  }
                />
              )}
            </div>
          )}
        </Space>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: 'grey.50', flexShrink: 0 }}>
        {importWarnings ? (
          // Import-warnings choice. "Import anyway" imports the rows the server
          // could read and leaves out the values listed above; Cancel discards
          // the (nothing-imported) attempt so the file can be fixed.
          <Space>
            <Button onClick={dismissWarnings}>Cancel</Button>
            <Button
              type="primary"
              loading={uploading}
              onClick={() => importAnyway()}
              style={{
                textTransform: 'unset',
                fontWeight: 600,
                fontSize: '0.75rem',
                border: 'none',
                color: '#fff',
                background: 'rgb(55, 148, 141)',
              }}
            >
              Import anyway
            </Button>
          </Space>
        ) : (
          <Space>
            {selectedFile && !uploading && !isTerminal && (
              <Button onClick={clearFile}>Clear file</Button>
            )}

            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => handleUpload()}
              disabled={isUploadDisabled}
              loading={uploading}
              title={
                duplicateTitleWarning
                  ? 'Rename the file or remove the existing batch before uploading'
                  : hasBlockingErrors
                    ? 'Fix the column errors before uploading'
                    : inspecting
                      ? 'Validating file…'
                      : undefined
              }
              style={{
                textTransform: 'unset',
                fontWeight: 600,
                fontSize: '0.75rem',
                border: 'none',
                color: '#fff',
                background: isUploadDisabled ? '#b0b0b0' : 'rgb(55, 148, 141)',
                cursor: isUploadDisabled ? 'not-allowed' : 'pointer',
                opacity: isUploadDisabled ? 0.6 : 1,
                transition: 'background 0.2s, opacity 0.2s',
              }}
            >
              {uploading
                ? 'Uploading…'
                : duplicateTitleWarning
                  ? 'Duplicate batch title'
                  : hasBlockingErrors
                    ? 'Fix errors to upload'
                    : 'Upload CSV'}
            </Button>

            {isTerminal && <Button onClick={handleClose}>Close</Button>}
          </Space>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BatchUploadModal;
