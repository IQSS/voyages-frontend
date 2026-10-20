import { describe, expect, test } from 'vitest';

import { User } from '@/share/InterfaceTypeUser';
import {
  hasEditorRole,
  isEditorOnlyContributeRoute,
} from '@/utils/auth/hasEditorRole';
import { getDisplayButtons } from '@/utils/functions/contribuitePath';

const contributor: User = {
  id: 'contributor-id',
  email: 'contributor@example.com',
  userName: 'contributor',
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresAt: 0,
};

const translatedContribute = {
  contributeNewVoyage: 'New Voyages',
  contributeEditExistingVoyage: 'Edit Existing Voyage',
  contributeMergeVoyages: 'Merge Voyages',
  contributeDeleteVoyage: 'Recommend Voyage Deletion',
  contributeEditorialPlatform: 'Editorial Platform',
};

describe('contributor editor access', () => {
  test('recognizes only the Editor app-metadata role', () => {
    expect(hasEditorRole(null)).toBe(false);
    expect(hasEditorRole(contributor)).toBe(false);
    expect(hasEditorRole({ ...contributor, role: 'Editor' })).toBe(true);
    expect(
      hasEditorRole({ ...contributor, roles: ['Contributor', 'Editor'] }),
    ).toBe(true);
  });

  test('hides the Editorial Platform action for contributors', () => {
    const contributorPaths = getDisplayButtons(translatedContribute, false).map(
      ({ path }) => path,
    );
    const editorPaths = getDisplayButtons(translatedContribute, true).map(
      ({ path }) => path,
    );

    expect(contributorPaths).not.toContain('/contribute/editor_main/requests');
    expect(editorPaths).toContain('/contribute/editor_main/requests');
  });

  test('identifies every editor-only contribution URL', () => {
    expect(
      isEditorOnlyContributeRoute('/contribute/editor_main/requests'),
    ).toBe(true);
    expect(
      isEditorOnlyContributeRoute('/contribute/editor_main/requests/123'),
    ).toBe(true);
    expect(
      isEditorOnlyContributeRoute(
        '/contribute/enslaver_contribution_review/123',
      ),
    ).toBe(true);
    expect(isEditorOnlyContributeRoute('/contribute/edit_voyage')).toBe(false);
  });
});
