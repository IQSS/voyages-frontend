import { describe, expect, test } from 'vitest';

import { contributionReturnPath } from '@/utils/auth/contributionReturnPath';

describe('contribution sign-in return path', () => {
  test.each([
    '/contribute/interim',
    '/contribute/editor_main/pending?page=2#request',
    '/admin/auth/user/',
  ])('resumes an allowed local screen: %s', (path) => {
    expect(contributionReturnPath(path)).toBe(path);
  });
  test.each([
    undefined,
    null,
    42,
    '',
    'https://outside.example/contribute',
    '//outside.example/contribute',
    '/\\outside.example/contribute',
    '/accounts/signin',
    '/voyages',
    '/contribute/logout',
    '/contribute/password_change',
    '/contribute/\neditor_main',
  ])('rejects unsafe or unrelated destination: %s', (path) => {
    expect(contributionReturnPath(path)).toBe('/contribute/legal');
  });
});
