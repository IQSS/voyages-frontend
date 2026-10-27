import React from 'react';

import {
  EntityChange,
  TableChange,
  MaterializedEntity,
  TableProperty,
} from '@slavevoyages/voyages-contribute';
import '@/style/numberTable.scss';
import { Close } from '@mui/icons-material';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';

import { PaperDraggableNumbersTable } from '@/components/SelectorComponents/Cascading/PaperDraggable';
import { StyleDialog } from '@/styleMUI';
import { displayPropertyLabel } from '@/utils/contribute/propertyLabels';

import NumbersTableComponent from './NumbersTableComponent';

interface NumbersTableDialogProps {
  property: TableProperty;
  entity: MaterializedEntity;
  lastChange?: TableChange;
  onChange: (change: EntityChange) => void;
  onClose: (change: boolean) => void;
  openDialog: boolean;
  readOnly?: boolean;
}

const NumbersTableDialog: React.FC<NumbersTableDialogProps> = ({
  property,
  entity,
  lastChange,
  onChange,
  onClose,
  openDialog,
  readOnly = false,
}) => {
  return (
    <Dialog
      open={openDialog}
      onClose={onClose}
      disableScrollLock={false}
      sx={StyleDialog}
      fullWidth
      maxWidth="lg"
      PaperComponent={PaperDraggableNumbersTable}
      aria-labelledby="draggable-dialog-nubmer"
    >
      <DialogTitle
        sx={{
          cursor: 'move',
          position: 'relative',
          textAlign: 'center',
          fontWeight: 600,
          bgcolor: 'rgb(55, 148, 141)',
          color: '#fff',
          py: '20px',
        }}
      >
        <div style={{ fontSize: '1rem' }}>{displayPropertyLabel(property)}</div>
        <IconButton
          edge="end"
          color="inherit"
          onClick={() => onClose(false)}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent style={{ padding: '30px 15px 15px 15px' }}>
        <NumbersTableComponent
          property={property}
          entity={entity}
          lastChange={lastChange}
          onChange={onChange}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
};

export default NumbersTableDialog;
