import React, { useState } from 'react';

import { Close, Warning } from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { PublicationBatch } from '@slavevoyages/voyages-contribute';

import { PaperDraggableDeleteBatch } from '@/components/SelectorComponents/Cascading/PaperDraggable';
import { useBatchManagement } from '@/hooks/useBatchManagement';
import { StyleDialog } from '@/styleMUI';

interface DeleteBatchModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batch: PublicationBatch | null;
}

const DeleteBatchModal: React.FC<DeleteBatchModalProps> = ({
  visible,
  onClose,
  onSuccess,
  batch,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const { deleteBatch, loading } = useBatchManagement();

  const isConfirmed = confirmText === 'DELETE';
  const isPublished = batch?.published !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!batch || !isConfirmed) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteBatch(batch.id);
    setIsDeleting(false);

    if (result) {
      handleClose();
      onSuccess();
    }
  };

  const handleClose = () => {
    setConfirmText('');
    setIsDeleting(false);
    onClose();
  };

  const handleInputChange = (value: string) => {
    setConfirmText(value);
  };

  if (!batch) {
    return null;
  }

  return (
    <Dialog
      open={visible}
      onClose={handleClose}
      disableScrollLock={false}
      sx={{
        ...StyleDialog,
      }}
      fullWidth
      maxWidth="sm"
      PaperComponent={PaperDraggableDeleteBatch}
      aria-labelledby="draggable-dialog-delete-batch"
    >
      <DialogTitle
        sx={{
          cursor: 'move',
          position: 'relative',
          textAlign: 'center',
          fontWeight: 600,
          bgcolor: 'rgb(220, 38, 38)',
          color: '#fff',
          py: 2,
        }}
      >
        <Typography variant="h6" component="div">
          Delete Publication Batch
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

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            {/* Warning Alert */}
            <Alert severity="error" icon={<Warning />} sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                This action cannot be undone!
              </Typography>
              <Typography variant="body2">
                You are about to permanently delete the batch &quot;
                {batch.title}&quot;. All associated contributions will be
                unassigned from this batch.
              </Typography>
            </Alert>

            {/* Batch Information */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Batch Details:
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>ID:</strong> {batch.id}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Title:</strong> {batch.title}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Status:</strong> {isPublished ? 'Published' : 'Pending'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Contributions:</strong>{' '}
                {(batch as any).contributionCount || 0}
              </Typography>
              {batch.comments && (
                <Typography variant="body2">
                  <strong>Comments:</strong> {batch.comments}
                </Typography>
              )}
            </Box>

            {/* Confirmation Input */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                To confirm deletion, type <strong>&quot;DELETE&quot;</strong> in
                the box below:
              </Typography>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Type DELETE to confirm"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `2px solid ${isConfirmed ? '#10b981' : '#e5e7eb'}`,
                  borderRadius: '4px',
                  fontSize: '16px',
                  outline: 'none',
                  backgroundColor: isConfirmed ? '#f0fdf4' : '#ffffff',
                }}
              />
              {confirmText && !isConfirmed && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 1, display: 'block' }}
                >
                  Please type &quot;DELETE&quot; exactly as shown
                </Typography>
              )}
            </Box>

            {/* Additional Warning for Published Batches */}
            {isPublished && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Warning:</strong> This batch is published. Deleting it
                  may affect data integrity and published content. Consider
                  contacting an administrator before proceeding.
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            disabled={loading || isDeleting}
            style={{ textTransform: 'unset', height: 32 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || isDeleting || !isConfirmed}
            sx={{
              textTransform: 'unset',
              height: 32,
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
              },
            }}
          >
            {loading || isDeleting ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1, color: 'white' }} />
                Deleting...
              </>
            ) : (
              'Delete Batch'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DeleteBatchModal;
