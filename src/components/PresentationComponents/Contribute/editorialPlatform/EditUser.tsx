import { Box, Button, Typography } from '@mui/material';

import { BASEURL } from '@/share/AUTH_BASEURL';

import ListEditorialPlatForm from '../commons/ListEditorialPlatForm';

// User accounts and permissions live in the Django admin (same as the legacy
// Contribute site), so this page links out to it rather than reimplementing
// account management. Opens in a new tab; the editor authenticates there.
const EditUser: React.FC = () => {
  return (
    <Box sx={{ pr: 4, pl: 2, pb: 4, width: '100%' }}>
      <ListEditorialPlatForm />

      <Box
        sx={{
          mt: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontSize: '24px', fontWeight: 600 }}>
          Edit Users
        </Typography>

        <Typography sx={{ color: '#6b7280' }}>
          User accounts and permissions are managed in the Django admin.
        </Typography>

        <Button
          variant="contained"
          href={`${BASEURL}/admin/auth/user/`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            backgroundColor: 'rgb(55, 148, 141)',
            color: '#fff',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            px: 3,
            py: 1,
            '&:hover': { backgroundColor: 'rgb(1, 136, 125)' },
          }}
        >
          Users on Live Admin
        </Button>
      </Box>
    </Box>
  );
};

export default EditUser;
