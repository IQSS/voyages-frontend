import { User } from '@/share/InterfaceTypeUser';

const EDITOR_ROLE = 'Editor';

/**
 * Mirrors the backend's `hasEditorRole` check (voyages-contribute
 * src/backend/authz.ts) so the UI can hide Editor-only actions before the
 * request round-trips. The backend remains the source of truth — it always
 * re-checks `app_metadata` on the verified JWT.
 */
export const hasEditorRole = (user: User | null | undefined): boolean => {
  if (!user) return false;
  if (user.role === EDITOR_ROLE) return true;
  return Array.isArray(user.roles) && user.roles.includes(EDITOR_ROLE);
};

export const isEditorOnlyContributeRoute = (pathname: string): boolean =>
  pathname.startsWith('/contribute/editor_main/') ||
  pathname.startsWith('/contribute/enslaver_contribution_review/');
