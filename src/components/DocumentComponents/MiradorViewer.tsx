import { useEffect, useRef, useState } from 'react';

import Mirador from 'mirador';
import { useSelector } from 'react-redux';

import { RootState } from '@/redux/store';
import {
  buildDocumentManifestUrl,
  firstCanvasIdFromManifest,
} from '@/utils/functions/documentWorkspace';

type WorkspaceAction = 'Add' | 'Remove' | 'None';

interface MiradorViewerProps {
  workspaceAction: WorkspaceAction;
  manifestUrlBase: string;
  domId: string;
  manifestId: string;
  onWorkspaceAction: (manifestId: string, element: HTMLElement) => void;
  onClose?: () => boolean;
}

const findWin = (store: any, manifestId: string): any =>
  Object.values(store.getState().windows).find(
    (w: any) => w.manifestId === manifestId,
  );

const updateMiradorUI = (
  workspaceAction: string,
  enableClose: boolean,
  manifestId: string,
  onWorkspaceAction: any,
) => {
  const topBar = document.getElementsByClassName('mirador-window-top-bar');
  if (!topBar || !topBar[0]) {
    return false;
  }
  const getButton = (className: string) => {
    const matches = document.getElementsByClassName(className);
    if (matches.length === 1) {
      return matches[0];
    }
    return null;
  };
  const removeButton = (className: string) => getButton(className)?.remove();
  // Remove buttons from the UI.
  document.getElementById('addBtn')?.remove();
  removeButton('mirador-window-maximize');
  if (!enableClose) {
    removeButton('mirador-window-close');
  }
  removeButton('workspaceBtn');
  if (workspaceAction !== 'None') {
    const template = document.getElementById(
      `__miradorWorkspace${workspaceAction}Btn`,
    );
    const workspaceBtn = template?.cloneNode(true) as HTMLButtonElement;
    if (workspaceBtn) {
      workspaceBtn.classList.add('workspaceBtn');
      workspaceBtn.onclick = () => onWorkspaceAction(manifestId, workspaceBtn);
      topBar[0].appendChild(workspaceBtn);
    }
  }
  return true;
};

const MiradorUserSettingsKey = '__miradorSettings';

const MiradorViewer = (
  {
    manifestUrlBase,
    manifestId,
    domId,
    workspaceAction,
    onWorkspaceAction,
    onClose,
  }: MiradorViewerProps = {
    manifestUrlBase: '',
    manifestId: '',
    domId: '',
    workspaceAction: 'None',
    onWorkspaceAction: () => {},
  },
) => {
  const [ready, setReady] = useState(false);
  const target = useRef(null);
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const container = useRef<HTMLDivElement>(null);
  const activeDoc = useRef<string | null>(null);
  const prevTheme = useRef<string | null>(null);

  // NOTE: Spanish is still not supported by Mirador! And for Portuguese, only
  // the Brazilian variant is available.
  const miradorLanguage = languageValue === 'pt' ? 'pt-BR' : 'en';

  // Initialize Mirador viewer
  useEffect(() => {
    if (!container.current) {
      return;
    }
    container.current.innerHTML = '';
    const div = document.createElement('div');
    div.id = domId;
    container.current.appendChild(div);

    // Get user settings from localStorage safely
    let userSettings = {};
    try {
      const storedSettings = localStorage.getItem(MiradorUserSettingsKey);
      userSettings = storedSettings ? JSON.parse(storedSettings) : {};
    } catch (error) {
      console.warn('Failed to parse Mirador user settings:', error);
      userSettings = {};
    }

    target.current = Mirador.viewer({
      ...userSettings,
      id: domId,
      language: miradorLanguage,
    });

    return () => {
      div.remove();
    };
  }, [domId, miradorLanguage]);

  // Handle manifest loading and window management
  useEffect(() => {
    if (!target.current) {
      return;
    }

    const store = Mirador.selectors.miradorSlice(target.current).store;
    const path = buildDocumentManifestUrl(manifestUrlBase, manifestId);

    // Check if manifest already exists
    const state = store.getState();
    const match = Object.values(state.manifests).find(
      (manifest: any) => manifest.id === path,
    );

    if (!match) {
      // Add the manifest if it doesn't exist
      const addRes = Mirador.actions.addResource(path);
      store.dispatch(addRes);
    }

    // Close any existing windows in the viewer
    Object.keys(state.windows).forEach((winKey) => {
      const rmw = Mirador.actions.removeWindow(winKey);
      store.dispatch(rmw);
    });

    // Create a window with the manifest
    let canvasLoaded = false;
    const unsubscribe = store.subscribe(() => {
      const currentState = store.getState();
      const { selectedTheme } = currentState.config;

      // Save theme changes to localStorage
      if (prevTheme.current && prevTheme.current !== selectedTheme) {
        try {
          localStorage.setItem(
            MiradorUserSettingsKey,
            JSON.stringify({
              selectedTheme: selectedTheme,
            }),
          );
        } catch (error) {
          console.warn('Failed to save Mirador settings:', error);
        }
      }
      prevTheme.current = selectedTheme;

      // Handle window closing
      if (
        activeDoc.current === manifestId &&
        canvasLoaded &&
        onClose &&
        Object.keys(currentState.windows).length === 0
      ) {
        onClose();
        activeDoc.current = null;
        return;
      }

      // Check if manifest is still loading
      const manifestState = currentState.manifests[path];
      if (canvasLoaded || (manifestState?.isFetching ?? true)) {
        return;
      }

      canvasLoaded = true;

      try {
        const win = findWin(store, path);
        if (win) {
          const canvasId = firstCanvasIdFromManifest(
            manifestState?.json,
            path,
          );
          const displayAction = Mirador.actions.setCanvas(
            win.id,
            canvasId,
          );
          store.dispatch(displayAction);
        }
      } catch (error) {
        console.error('Error setting canvas:', error);
      }

      setReady(true);
      activeDoc.current = manifestId;
    });

    // Dispatch actions to load and display the manifest
    store.dispatch(Mirador.actions.fetchManifest(path));
    store.dispatch(Mirador.actions.addWindow({ manifestId: path }));

    // Maximize all windows
    Object.keys(store.getState().windows).forEach((winKey) => {
      const maxw = Mirador.actions.maximizeWindow(winKey);
      store.dispatch(maxw);
    });

    // Update UI periodically until successful
    const uiUpdater = setInterval(() => {
      if (
        updateMiradorUI(
          workspaceAction,
          !!onClose,
          manifestId,
          onWorkspaceAction,
        )
      ) {
        clearInterval(uiUpdater);
      }
    }, 100);

    return () => {
      unsubscribe();
      clearInterval(uiUpdater);
    };
  }, [
    manifestUrlBase,
    manifestId,
    onClose,
    onWorkspaceAction,
    workspaceAction,
  ]);

  // We use the ready flag to hide the Mirador UI while the manifest window is
  // loaded. This prevents the user from seeing the Mirador app without any
  // windows for a brief moment.
  return <div ref={container} style={{ opacity: ready ? 1 : 0 }}></div>;
};

export default MiradorViewer;
