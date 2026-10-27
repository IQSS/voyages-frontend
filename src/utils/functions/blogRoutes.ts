import { BLOGPAGE } from '@/share/CONST_DATA';
import {
  formatTextURL,
  reverseFormatTextURL,
} from '@/utils/functions/formatText';

const INTRODUCTORY_MAPS_TAG = 'Introductory Maps';
const INTRODUCTORY_MAPS_SLUG = 'all-intro-maps';

const BLOG_TAG_ROUTE_ALIASES: Record<string, string> = {
  [INTRODUCTORY_MAPS_SLUG]: INTRODUCTORY_MAPS_TAG,
};

export const blogTagNameFromRouteSlug = (slug?: string | null) => {
  const cleanedSlug = slug?.trim();
  if (!cleanedSlug) {
    return '';
  }
  return (
    BLOG_TAG_ROUTE_ALIASES[cleanedSlug] ||
    reverseFormatTextURL(cleanedSlug) ||
    ''
  );
};

export const blogTagSlugFromName = (tagName: string) => {
  const cleanedName = tagName.trim();
  if (cleanedName === INTRODUCTORY_MAPS_TAG) {
    return INTRODUCTORY_MAPS_SLUG;
  }
  return formatTextURL(cleanedName) || '';
};

export const blogTagPathFromName = (tagName: string) => {
  const slug = blogTagSlugFromName(tagName);
  return `/${BLOGPAGE}/tag/${slug}`;
};
