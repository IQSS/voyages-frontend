import { useEffect } from 'react';

import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { setSession } from '@/redux/getAuthUserSlice';
import { supabase } from '@/utils/supabase/supabaseClient';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          navigate('/accounts/signin', {
            state: { error: 'Authentication failed' },
          });
          return;
        }

        if (session) {
          dispatch(setSession(session));
          navigate('/contribute');
        } else {
          navigate('/accounts/signin');
        }
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        navigate('/accounts/signin', {
          state: { error: 'An unexpected error occurred' },
        });
      }
    };

    handleAuthCallback();
  }, [navigate, dispatch]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
      }}
    >
      <h2>Completing sign in...</h2>
      <p>Please wait while we redirect you.</p>
    </div>
  );
};
