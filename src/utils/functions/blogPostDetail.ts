import { BlogDataProps } from '@/share/InterfaceTypesBlog';

type BlogPostResponse =
  | {
      results?: BlogDataProps[] | null;
    }
  | null
  | undefined;

type BlogLocation = Pick<Location, 'origin' | 'pathname'>;

export const selectBlogPostResult = (
  response: BlogPostResponse,
): BlogDataProps | null => {
  const post = response?.results?.[0];
  return post || null;
};

export const blogCanonicalUrlFromLocation = (
  location: BlogLocation | null | undefined,
) => {
  if (!location?.origin || !location?.pathname) {
    return '';
  }
  return `${location.origin}${location.pathname}`;
};

export const currentBlogCanonicalUrl = () =>
  typeof window === 'undefined'
    ? ''
    : blogCanonicalUrlFromLocation(window.location);
