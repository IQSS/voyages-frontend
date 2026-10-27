import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Session } from '@supabase/supabase-js';

import { AuthState, User } from '@/share/InterfaceTypeUser';
import { supabase } from '@/utils/supabase/supabaseClient';

const initialState: AuthState = {
  user: null,
  session: null,
  loading: true, // Start with loading true to prevent redirect flash on page refresh
  actionLoading: false,
  error: null,
};

// Helper function to map Supabase session to User type
const mapSupabaseUserToUser = (session: Session): User => {
  const metadata = session.user.user_metadata || {};
  const appMetadata = session.user.app_metadata || {};
  return {
    id: session.user.id,
    email: session.user.email!,
    userName: metadata.firstName || session.user.email?.split('@')[0] || 'User',
    firstName: metadata.firstName,
    lastName: metadata.lastName,
    institution: metadata.institution,
    role: appMetadata.role,
    roles: appMetadata.roles,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at || 0,
  };
};

// Async thunks
export const signInWithEmail = createAsyncThunk(
  'auth/signInWithEmail',
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.session) throw new Error('No session returned');

      return data.session;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Invalid email or password');
    }
  },
);

export const signUpWithEmail = createAsyncThunk(
  'auth/signUpWithEmail',
  async (
    {
      email,
      password,
      firstName,
      lastName,
      institution,
      description,
    }: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
      institution?: string;
      description?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstName,
            lastName,
            institution,
            description,
          },
        },
      });

      if (error) throw error;

      return data.session;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Sign up failed');
    }
  },
);

export const signInWithOAuth = createAsyncThunk(
  'auth/signInWithOAuth',
  async (provider: 'google' | 'github', { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      return null; // OAuth will redirect, so we don't get session immediately
    } catch (error: any) {
      return rejectWithValue(error.message || 'OAuth sign in failed');
    }
  },
);

export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Sign out failed');
    }
  },
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      return email;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Password reset failed');
    }
  },
);

export const refreshSession = createAsyncThunk(
  'auth/refreshSession',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return data.session;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Session refresh failed');
    }
  },
);

const getAuthUserSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<Session | null>) => {
      if (action.payload) {
        state.session = action.payload;
        state.user = mapSupabaseUserToUser(action.payload);
        state.error = null;
      } else {
        state.session = null;
        state.user = null;
      }
      state.loading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Sign in with email
    // Note: these thunks use `actionLoading`, not `loading` — `loading` is
    // reserved for the one-time initial session bootstrap in App.tsx, and
    // consumers (e.g. ContributeContent) remount the sign-in/up forms
    // whenever it flips, wiping local form state on every failed attempt.
    builder
      .addCase(signInWithEmail.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(signInWithEmail.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.session = action.payload;
        state.user = mapSupabaseUserToUser(action.payload);
        state.error = null;
      })
      .addCase(signInWithEmail.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // Sign up with email
    builder
      .addCase(signUpWithEmail.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(signUpWithEmail.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Session might be null if email confirmation is required
        if (action.payload) {
          state.session = action.payload;
          state.user = mapSupabaseUserToUser(action.payload);
        }
        state.error = null;
      })
      .addCase(signUpWithEmail.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // OAuth sign in
    builder
      .addCase(signInWithOAuth.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(signInWithOAuth.fulfilled, (state) => {
        state.actionLoading = false;
        state.error = null;
      })
      .addCase(signInWithOAuth.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // Sign out
    builder
      .addCase(signOut.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.actionLoading = false;
        state.user = null;
        state.session = null;
        state.error = null;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // Reset password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.actionLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // Refresh session
    builder
      .addCase(refreshSession.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(refreshSession.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          state.session = action.payload;
          state.user = mapSupabaseUserToUser(action.payload);
        }
        state.error = null;
      })
      .addCase(refreshSession.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSession, setLoading, clearError } = getAuthUserSlice.actions;

export default getAuthUserSlice.reducer;
