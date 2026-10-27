import {  CircularProgress, Box } from '@mui/material';
export const CustomLoadingOverlay = () => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 4000,
      }}
    >
      <CircularProgress 
        size={40}
        thickness={4}
        sx={{
          color: 'var(--pagination-table--, #007269)'
        }}
      />
    </Box>
  );
};