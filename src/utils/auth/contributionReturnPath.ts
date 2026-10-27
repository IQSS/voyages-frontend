const DEFAULT_RETURN_PATH = '/contribute/legal';

/** Only the site's contribution screens may be resumed after sign-in. */
export const contributionReturnPath = (
  value: unknown,
  fallback = DEFAULT_RETURN_PATH,
): string => {
  if (
    typeof value !== 'string' ||
    [...value].some((character) => character.charCodeAt(0) <= 32) ||
    value.includes('\\')
  ) {
    return fallback;
  }
  try {
    const destination = new URL(value, 'https://voyages.invalid');
    if (
      !value.startsWith('/') ||
      destination.origin !== 'https://voyages.invalid' ||
      !/^\/(contribute|admin)(\/|$)/.test(destination.pathname) ||
      /\/(logout|password_change)\/?$/.test(destination.pathname)
    ) {
      return fallback;
    }
    return destination.pathname + destination.search + destination.hash;
  } catch {
    return fallback;
  }
};
