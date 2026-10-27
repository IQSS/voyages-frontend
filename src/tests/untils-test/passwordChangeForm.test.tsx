import React from 'react';

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import PasswordChangeForm from '@/components/PresentationComponents/Contribute/Form/PasswordChangeForm';

const { updateUser } = vi.hoisted(() => ({ updateUser: vi.fn() }));
vi.mock('@/utils/supabase/supabaseClient', () => ({
  supabase: { auth: { updateUser } },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const submit = (password: string, confirmation = password) => {
  const { container } = render(<PasswordChangeForm />);
  const fields = container.querySelectorAll('input');
  fireEvent.change(fields[0], { target: { value: password } });
  fireEvent.change(fields[1], { target: { value: confirmation } });
  fireEvent.submit(container.querySelector('form')!);
};

describe('password recovery completion', () => {
  it('reports success only after the auth provider updates the password', async () => {
    updateUser.mockResolvedValueOnce({ error: null });
    submit('a-test-password');
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'Your password has been changed.',
      ),
    );
    expect(updateUser).toHaveBeenCalledWith({ password: 'a-test-password' });
  });

  it('shows an expired recovery-session failure instead of claiming success', async () => {
    updateUser.mockResolvedValueOnce({
      error: new Error('Recovery session expired'),
    });
    submit('a-test-password');
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'Recovery session expired',
      ),
    );
    expect(screen.queryByText('Your password has been changed.')).toBeNull();
  });

  it.each([
    ['short', 'short'],
    ['a-test-password', 'different-password'],
  ])(
    'rejects an invalid password pair before contacting authentication',
    async (password, confirmation) => {
      submit(password, confirmation);
      expect(screen.getByRole('alert')).toBeDefined();
      expect(updateUser).not.toHaveBeenCalled();
    },
  );
});
