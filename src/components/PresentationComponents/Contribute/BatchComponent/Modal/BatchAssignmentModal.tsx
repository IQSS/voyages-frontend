import React, { useState, useEffect, useCallback } from 'react';

import { Close } from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';
import { PublicationBatch } from '@slavevoyages/voyages-contribute';
import { message } from 'antd';

import { PaperDraggableBatchAssignmentModal } from '@/components/SelectorComponents/Cascading/PaperDraggable';
import { useBatchManagement } from '@/hooks/useBatchManagement';
import { StyleDialog } from '@/styleMUI';

import SelectBatchAutoCompleted from './SelectBatchAutoCompleted';

const BatchAssignmentModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  contributionIds: string[];
  onSuccess: () => void;
}> = ({ visible, onClose, contributionIds, onSuccess }) => {
  const [selectedBatch, setSelectedBatch] = useState<PublicationBatch | null>(
    null,
  );
  const { getPendingBatches, bulkAssignContributionsToBatch, loading } =
    useBatchManagement();
  const [batches, setBatches] = useState<PublicationBatch[]>([]);

  const fetchBatches = useCallback(async () => {
    const pendingBatches = await getPendingBatches();
    setBatches(pendingBatches);
  }, [getPendingBatches]);

  useEffect(() => {
    if (visible) {
      fetchBatches();
      setSelectedBatch(null); // Reset selection when modal opens
    }
  }, [visible, fetchBatches]);

  const handleAssign = async () => {
    if (!selectedBatch) {
      message.warning('Please select a batch');
      return;
    }

    const success = await bulkAssignContributionsToBatch(
      contributionIds,
      selectedBatch.id,
    );
    if (success) {
      onClose();
      onSuccess();
    }
  };

  const handleClose = () => {
    setSelectedBatch(null);
    onClose();
  };

  return (
    <Dialog
      open={visible}
      onClose={handleClose}
      disableScrollLock={false}
      sx={{
        ...StyleDialog,
        '& .MuiDialog-paper': {
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
          // Batch titles are long ("Voyage import – Voyage_templateTestNoColumn"),
          // and they appear in the options list and the summary. `maxWidth` is
          // the cap; this only stops the dialog shrinking below something that
          // can hold one. Kept under `sm` (600px) so the two agree.
          minWidth: 'min(560px, 90vw)',
        },
      }}
      fullWidth
      maxWidth="sm"
      PaperComponent={PaperDraggableBatchAssignmentModal}
      aria-labelledby="draggable-dialog-batch-assignment"
    >
      <DialogTitle
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
        <Typography variant="h6" component="div">
          Assign {contributionIds.length} Contribution(s) to Batch
        </Typography>
        <IconButton
          edge="end"
          color="inherit"
          onClick={handleClose}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1,
          minHeight: '200px',
        }}
      >
        <SelectBatchAutoCompleted
          setSelectedBatch={setSelectedBatch}
          selectedBatch={selectedBatch}
          batches={batches}
          setBatches={setBatches}
          loading={loading}
          contributionIds={contributionIds}
        />
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{ mr: 1, textTransform: 'unset', height: 32 }}
          size="small"
        >
          Cancel
        </Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          size="small"
          disabled={!selectedBatch || loading}
          sx={{
            height: 32,
            background: selectedBatch
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : undefined,
            textTransform: 'unset',
            '&:hover': {
              background: selectedBatch
                ? 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                : undefined,
            },
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              Assigning...
            </>
          ) : (
            'Assign to Batch'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchAssignmentModal;
