import React from 'react';

import { Box, TextField, Button, Typography, Alert } from '@mui/material';

import {
  usePasswordResetForm,
  PasswordResetFormData,
} from '@/hooks/usePasswordResetForm';

interface PasswordResetProp {
  handleResetPassword?: () => void;
  onSubmit?: (data: PasswordResetFormData) => Promise<void> | void;
}

const PasswordResetForm: React.FC<PasswordResetProp> = ({ onSubmit }) => {
  const {
    formData,
    errors,
    isSubmitting,
    isSuccess,
    handleInputChange,
    handleSubmit,
  } = usePasswordResetForm();

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
      {isSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Password reset email has been sent to your email address.
        </Alert>
      )}
      {errors.general && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.general}
        </Alert>
      )}
      <form onSubmit={(e) => handleSubmit(e, onSubmit)}>
        <Box sx={{ mb: 3 }}>
          <TextField
            label="E-mail address"
            variant="outlined"
            sx={{
              width: 300,
              '& .MuiOutlinedInput-root': {
                height: 42,
              },
            }}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            error={!!errors.email}
            helperText={errors.email}
            required
          />
        </Box>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isSubmitting}
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
          {isSubmitting ? 'Sending...' : 'Reset My Password'}
        </Button>
      </form>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Please contact us if you have any trouble resetting your password.
      </Typography>
    </Box>
  );
};

export default PasswordResetForm;
