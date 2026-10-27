import React, { useState } from 'react';

import { Box, TextField, Button, Typography } from '@mui/material';

interface PasswordResetProp {
  handleResetPassword: () => void;
}

const PasswordReset: React.FC<PasswordResetProp> = () => {
  const [email, setEmail] = useState<string>('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
  };

  return (
    <Box
      sx={{
        margin: '0 auto',
        padding: '2rem',
        textAlign: 'left',
      }}
    >
      <Typography variant="h4" gutterBottom>
        Password Reset
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Forgotten your password? Enter your e-mail address below, and we'll send
        you an e-mail allowing you to reset it.
      </Typography>
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 3 }}>
          <TextField
            sx={{ width: 300 }}
            InputProps={{
              sx: {
                height: 42,
                padding: '0 8px',
              },
            }}
            label="E-mail address"
            variant="outlined"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Box>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          sx={{
            backgroundColor: 'rgb(25, 118, 210 ,10)',
            color: '#fff',
            height: 32,
            fontSize: '0.85rem',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'rgb(10 131 253)',
            },
          }}
        >
          Reset My Password
        </Button>
      </form>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Please contact us if you have any trouble resetting your password.
      </Typography>
    </Box>
  );
};

export default PasswordReset;
