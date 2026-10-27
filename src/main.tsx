import React from 'react';

import { StyledEngineProvider } from '@mui/material/styles';
import ReactDOM from 'react-dom/client';
import '@fortawesome/fontawesome-free/css/all.css';
import 'leaflet/dist/leaflet.css';
import './style/index.css';
import { Provider } from 'react-redux';
import { StyleSheetManager } from 'styled-components';

import AppWithRouter from './App.js';
import store from './redux/store';

const insertionPoint =
  document.getElementById('styled-components-insertion-point') ?? undefined;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <StyleSheetManager target={insertionPoint}>
        <Provider store={store}>
          <AppWithRouter />
        </Provider>
      </StyleSheetManager>
    </StyledEngineProvider>
  </React.StrictMode>,
);
