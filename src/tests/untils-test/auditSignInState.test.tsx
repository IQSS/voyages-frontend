import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { Provider, useSelector } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, test, vi } from 'vitest';

import SignInForm from '@/components/PresentationComponents/Contribute/Form/SingInForm';
import authReducer, { setLoading } from '@/redux/getAuthUserSlice';

const signIn = vi.hoisted(() => vi.fn());
vi.mock('@/utils/supabase/supabaseClient', () => ({
  supabase: { auth: { signInWithPassword: signIn } },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

test('upstream PR12 keeps sign-in input and friendly errors while action loading changes', async () => {
  let finish: (value: { data: { session: null }; error: Error }) => void = () =>
    undefined;
  signIn.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const store = configureStore({
    reducer: {
      getAuthUserSlice: authReducer,
      getLanguages: () => ({ languageValue: 'en' }),
    },
  });
  store.dispatch(setLoading(false));
  // ContributeContent's original bootstrap gate caused the form to unmount
  // when a login thunk mistakenly changed `loading` instead of actionLoading.
  const BootstrapGate = () => {
    const loading = useSelector(
      (state: ReturnType<typeof store.getState>) =>
        state.getAuthUserSlice.loading,
    );
    if (loading) return <div>Loading session</div>;
    return <SignInForm />;
  };
  render(
    <Provider store={store}>
      <MemoryRouter>
        <BootstrapGate />
      </MemoryRouter>
    </Provider>,
  );
  const email = screen.getByLabelText(/^Email/i) as HTMLInputElement;
  const password = screen.getByLabelText(/^Password/i) as HTMLInputElement;
  fireEvent.change(email, { target: { value: 'audit@example.invalid' } });
  fireEvent.change(password, {
    target: { value: 'audit-not-a-real-password' },
  });
  fireEvent.click(screen.getByRole('button', { name: /^Sign in$/i }));
  await waitFor(() => expect(signIn).toHaveBeenCalledOnce());
  expect(store.getState().getAuthUserSlice.loading).toBe(false);
  expect(store.getState().getAuthUserSlice.actionLoading).toBe(true);
  expect(screen.getByLabelText(/^Email/i)).toBe(email);
  expect(email.value).toBe('audit@example.invalid');
  expect(password.value).toBe('audit-not-a-real-password');
  await act(async () =>
    finish({
      data: { session: null },
      error: new Error('Invalid login credentials'),
    }),
  );
  await waitFor(() =>
    expect(screen.getByRole('alert').textContent).toMatch(/email|password/i),
  );
  expect(store.getState().getAuthUserSlice.actionLoading).toBe(false);
  expect((screen.getByLabelText(/^Password/i) as HTMLInputElement).value).toBe(
    'audit-not-a-real-password',
  );
  fireEvent.change(email, { target: { value: 'corrected@example.invalid' } });
  expect(screen.queryByRole('alert')).toBeNull();
});
