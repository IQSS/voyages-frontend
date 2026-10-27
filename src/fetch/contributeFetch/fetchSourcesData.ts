import axios from 'axios';

import { AUTHTOKEN, BASEURL } from '@/share/AUTH_BASEURL';

export interface SourceRow {
  zotero_group_id?: number | null;
  zotero_item_id?: string | null;
  bib?: string | null;
  thumbnail?: string | null;
  iiif_manifest_url?: string | null;
  text_snippet?: string | null;
  enslavers_count?: number | null;
  named_enslaved_count?: number | null;
  source_type?: { id: number; name: string } | null;
  short_ref?: { id: number; name: string } | null;
  date?: unknown;
}

export interface SourceListResponse {
  page: number;
  page_size: number;
  count: number;
  results: SourceRow[];
}

interface SourceFilterItem {
  varName: string;
  op: 'icontains' | 'exact' | 'in';
  searchTerm: unknown;
}

export interface SourceListParams {
  /** Free-text search, matched against the short reference (short_ref__name). */
  search?: string;
  /** Exact SourceType.name to filter by (the "By source type" panel). */
  sourceType?: string;
}

/**
 * Read a page of sources from the voyages-api `document/` endpoint (the same
 * source list the public site uses), for the editorial Source Codes page.
 * Read-only: source editing stays in the Django admin.
 *
 * Search and the source-type filter run server-side through the SourceList
 * `filter` body: each item is `{ varName, op, searchTerm }` and the API ANDs
 * them together (see voyages-api common/reqs.py post_req). Search matches the
 * short reference; the type filter is an exact match on the source type name.
 */
export const fetchSourcesData = async (
  page: number,
  pageSize: number,
  params: SourceListParams = {},
): Promise<SourceListResponse> => {
  const filter: SourceFilterItem[] = [];
  if (params.search?.trim()) {
    filter.push({
      varName: 'short_ref__name',
      op: 'icontains',
      searchTerm: params.search.trim(),
    });
  }
  if (params.sourceType) {
    filter.push({
      varName: 'source_type__name',
      op: 'exact',
      searchTerm: params.sourceType,
    });
  }

  // document app is mounted at /docs/ in the API root urlconf; SourceList is
  // its index route.
  const response = await axios.post(
    `${BASEURL}/docs/`,
    { filter, page, page_size: pageSize },
    {
      headers: {
        Authorization: AUTHTOKEN,
        'Content-Type': 'application/json',
      },
    },
  );
  return response.data;
};
