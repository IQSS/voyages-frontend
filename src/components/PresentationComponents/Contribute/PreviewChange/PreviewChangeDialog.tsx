import { Close } from '@mui/icons-material';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { MaterializedEntity } from '@slavevoyages/voyages-contribute';

import { PaperDraggableLinkEntityPreviewChange } from '@/components/SelectorComponents/Cascading/PaperDraggable';
import { StyleDialog } from '@/styleMUI';

import PreviewEntity from './PreviewEntity';

interface PreviewChangeDialogrops {
  previewEntity: MaterializedEntity | undefined;
  onClose: () => void;
  open: boolean;
}

const PreviewChangeDialog = ({
  open,
  previewEntity,
  onClose,
}: PreviewChangeDialogrops) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      disableScrollLock={false}
      sx={{
        ...StyleDialog,
        '& .MuiDialog-paper': {
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
        },
      }}
      fullWidth
      maxWidth="sm"
      PaperComponent={PaperDraggableLinkEntityPreviewChange}
      aria-labelledby="draggable-dialog-title-preview"
    >
      <DialogTitle
        sx={{
          cursor: 'move',
          position: 'relative',
          textAlign: 'center',
          fontWeight: 600,
          bgcolor: 'rgb(55, 148, 141)',
          color: '#fff',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: '1rem' }}>Preview Changes </div>
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
        dividers
        style={{
          padding: '4px 20px 20px 20px',
          overflowY: 'auto',
          maxHeight: '65vh',
        }}
      >
        {previewEntity && <PreviewEntity entity={previewEntity} />}{' '}
      </DialogContent>
    </Dialog>
  );
};
export default PreviewChangeDialog;
