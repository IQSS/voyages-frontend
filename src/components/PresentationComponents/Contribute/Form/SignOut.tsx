import { Button } from '@mui/material';

import { useNavigation } from '@/hooks/useNavigation';

import '@/style/contributeContent.scss';

const SignOut: React.FC = () => {
  const { handleConfirmSignOut } = useNavigation();
  return (
    <div className="contribute-content">
      <h1 className="page-title-1">Sign Out</h1>
      <p> Are you sure you want to sign out?</p>
      <div className="sign-out-button">
        <Button
          onClick={handleConfirmSignOut}
          type="submit"
          variant="contained"
          color="primary"
          sx={{
            backgroundColor: 'rgb(55, 148, 141)',
            color: '#fff',
            height: 32,
            fontSize: '0.85rem',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'rgba(6, 186, 171, 0.83)',
            },
          }}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
};
export default SignOut;
