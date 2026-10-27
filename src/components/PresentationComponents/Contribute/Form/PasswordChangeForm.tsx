import React, { useState } from 'react';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  Alert,
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
} from '@mui/material';

import { supabase } from '@/utils/supabase/supabaseClient';

const PasswordChangeForm = () => {
  const [password, setPassword] = useState<string>('');
  const [passwordAgain, setPasswordAgain] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordAgain, setShowPasswordAgain] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setError('');
    setSuccess(false);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== passwordAgain) {
      setError('Passwords do not match.');
      return;
    }
    setPending(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;
      setPassword('');
      setPasswordAgain('');
      setSuccess(true);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Password change failed. Please try again.',
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <Box
      sx={{
        padding: '2rem',
        textAlign: 'left',
      }}
    >
      <Typography variant="h4" gutterBottom>
        Set Password
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {success && (
        <Alert severity="success">Your password has been changed.</Alert>
      )}
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 3 }}>
          <TextField
            sx={{ width: 300 }}
            slotProps={{
              input: {
                sx: {
                  height: 42,
                  padding: '0 8px',
                },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            autoComplete="new-password"
            label="Password"
            variant="outlined"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Box>
        <Box sx={{ mb: 3 }}>
          <TextField
            sx={{ width: 300 }}
            slotProps={{
              input: {
                sx: {
                  height: 32,
                  padding: '0 8px',
                },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswordAgain(!showPasswordAgain)}
                      edge="end"
                      size="small"
                    >
                      {showPasswordAgain ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            autoComplete="new-password"
            label={
              <Typography
                variant="body1"
                style={{
                  fontSize: 16,
                  color: '#4e4e4e',
                }}
              >
                Password (again)
              </Typography>
            }
            variant="outlined"
            type={showPasswordAgain ? 'text' : 'password'}
            value={passwordAgain}
            onChange={(e) => setPasswordAgain(e.target.value)}
            required
          />
        </Box>
        <Button
          type="submit"
          disabled={pending}
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
          {pending ? 'Saving...' : 'Set Password'}
        </Button>
      </form>
    </Box>
  );
};

export default PasswordChangeForm;
