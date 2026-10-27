import React from 'react';

export interface DocumentItemInfo {
  key: string;
  label: string;
  bib?: string;
  revision_number: number;
  thumb: string | null;
  textSnippet: string;
}

const UserWorkspaceLocalStorageKey = 'my-workspace';

export const ManifestURLBase = import.meta.env.VITE_IIIF_MANIFESTS_BASEURL;

const HostedIiifImagePathPrefix = '/iiif/3/';
const AppServedIiifManifestPathPrefix = '/iiif/manifests/';

type MinimalIiifManifest = {
  items?: Array<{
    id?: string | null;
  }>;
};

export type DocumentWorkspace = DocumentItemInfo[];

export const createDocKey = (zotero_group_id: string, zotero_item_id: string) =>
  `${zotero_group_id}__${zotero_item_id}.json`;

const currentOrigin = () =>
  typeof window === 'undefined' ? '' : window.location.origin;

const isAbsoluteHttpUrl = (url: string) => /^https?:\/\//i.test(url);

const resolveUrl = (url: string, baseOrigin: string) => {
  if (!baseOrigin) {
    return null;
  }

  try {
    return new URL(url, baseOrigin);
  } catch {
    return null;
  }
};

export const isHostedIiifImageUrl = (
  url: string | null | undefined,
  baseOrigin = currentOrigin(),
) => {
  if (!url) {
    return false;
  }

  const parsed = resolveUrl(url, baseOrigin);
  const origin = resolveUrl(baseOrigin, baseOrigin);
  if (!parsed || !origin) {
    return false;
  }

  return (
    parsed.origin === origin.origin &&
    parsed.pathname.startsWith(HostedIiifImagePathPrefix)
  );
};

export const isHostedIiifDocument = (
  doc: Pick<DocumentItemInfo, 'thumb'>,
  baseOrigin = currentOrigin(),
) => isHostedIiifImageUrl(doc.thumb, baseOrigin);

export const isAppServedIiifManifestUrl = (
  url: string,
  baseOrigin = currentOrigin(),
) => {
  const parsed = resolveUrl(url, baseOrigin);
  const origin = resolveUrl(baseOrigin, baseOrigin);
  if (!parsed || !origin) {
    return false;
  }

  return (
    parsed.origin === origin.origin &&
    parsed.pathname.startsWith(AppServedIiifManifestPathPrefix)
  );
};

export const buildDocumentManifestUrl = (
  manifestUrlBase: string,
  manifestId: string,
  baseOrigin = currentOrigin(),
) => {
  const path =
    isAbsoluteHttpUrl(manifestId) || manifestId.startsWith('/')
      ? manifestId
      : `${manifestUrlBase.replace(/\/$/, '')}/${manifestId.replace(/^\//, '')}`;

  if (isAppServedIiifManifestUrl(path, baseOrigin)) {
    return resolveUrl(path, baseOrigin)?.href ?? path;
  }

  return path;
};

export const firstCanvasIdFromManifest = (
  manifest: MinimalIiifManifest | null | undefined,
  manifestUrl: string,
) => manifest?.items?.[0]?.id || `${manifestUrl.replace(/\/$/, '')}/canvas1`;

export const getWorkspace = () => {
  const stored = localStorage.getItem(UserWorkspaceLocalStorageKey);
  const items: DocumentWorkspace = JSON.parse(stored ?? '[]');
  return items;
};

export const performWorkspaceAction = (
  doc: DocumentItemInfo,
  element: HTMLElement,
) => {
  const items = getWorkspace();
  const matchIndex = items.findIndex((info) => info.key === doc.key);
  if (matchIndex >= 0) {
    // Already in the workspace, so we remove it.
    if (!confirm('Remove document from workspace?')) {
      return items;
    }
    items.splice(matchIndex, 1);
  } else {
    items.push(doc);
  }
  localStorage.setItem(UserWorkspaceLocalStorageKey, JSON.stringify(items));
  element.style.display = 'none';
  return items;
};

interface DocumentViewerContextValue {
  doc: DocumentItemInfo | null;
  setDoc: (d: DocumentItemInfo | null) => void;
  workspace?: DocumentWorkspace;
}

export const DocumentViewerContext =
  React.createContext<DocumentViewerContextValue>({
    doc: null,
    setDoc: () => {},
  });
