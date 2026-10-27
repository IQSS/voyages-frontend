import React, { useState } from 'react';

import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';

import { resetPassword } from '@/redux/getAuthUserSlice';
import { AppDispatch, RootState } from '@/redux/store';

export const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const { actionLoading: loading } = useSelector(
    (state: RootState) => state.getAuthUserSlice,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      await dispatch(resetPassword(email)).unwrap();
      setSent(true);
    } catch (err: any) {
      setError(err || 'Failed to send reset email');
    }
  };

  if (sent) {
    return (
      <div
        className="contribute-sign-in-form"
        style={{ maxWidth: 500, margin: '50px auto' }}
      >
        <h1 className="page-title-1">Check Your Email</h1>
        <Alert severity="success" sx={{ mt: 2 }}>
          We've sent password reset instructions to <strong>{email}</strong>.
          Please check your inbox and follow the link to reset your password.
        </Alert>
        <Box sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => (window.location.href = '/accounts/signin')}
            fullWidth
          >
            Back to Sign In
          </Button>
        </Box>
      </div>
    );
  }

  return (
    <div
      className="contribute-sign-in-form"
      style={{ maxWidth: 500, margin: '50px auto' }}
    >
      <h1 className="page-title-1">Reset Password</h1>
      <Typography sx={{ mb: 3 }}>
        Enter your email address and we'll send you instructions to reset your
        password.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{ mb: 2, backgroundColor: 'rgb(55, 148, 141)' }}
        >
          {loading ? 'Sending...' : 'Send Reset Instructions'}
        </Button>

        <Button
          variant="text"
          onClick={() => (window.location.href = '/accounts/signin')}
          fullWidth
        >
          Back to Sign In
        </Button>
      </Box>
    </div>
  );
};
