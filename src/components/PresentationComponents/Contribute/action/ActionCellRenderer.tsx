import { useState } from 'react';

import {
  MoreVert as MoreVertIcon,
  Archive as ArchiveIcon,
  RateReview as ReviewIcon,
} from '@mui/icons-material';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

const ActionCellRenderer = ({ data }: { data: any }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation(); // Prevent row click
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleArchiveRequest = () => {
    handleClose();
  };

  const handleEditorialReview = () => {
    handleClose();
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={handleClick}
        sx={{
          padding: '4px',
          '&:hover': {
            backgroundColor: '#e3f2fd',
          },
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            minWidth: '180px',
          },
        }}
      >
        <MenuItem
          onClick={handleArchiveRequest}
          sx={{ fontSize: '14px', py: 1 }}
        >
          <ListItemIcon sx={{ minWidth: '32px' }}>
            <ArchiveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Archive request" />
        </MenuItem>
        <MenuItem
          onClick={handleEditorialReview}
          sx={{ fontSize: '14px', py: 1 }}
        >
          <ListItemIcon sx={{ minWidth: '32px' }}>
            <ReviewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Editorial Review" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default ActionCellRenderer;
