import React from 'react';

import { Dialog, DialogTitle, ThemeProvider, createTheme } from '@mui/material';
import { cleanup, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, test, vi } from 'vitest';

import HeaderEnslavedNavBar from '@/components/NavigationComponents/Header/HeaderEnslavedNavBar';
import HeaderEnslaversNavBar from '@/components/NavigationComponents/Header/HeaderEnslaversNavBar';
import HeaderPeopleNavBar from '@/components/NavigationComponents/Header/HeaderPeopleNavBar';
import HeaderVoyagesNavBar from '@/components/NavigationComponents/Header/HeaderVoyagesNavBar';
import store from '@/redux/store';

vi.mock('@/components/SelectorComponents/Cascading/CascadingMenu', () => ({
  default: () => (
    <Dialog open aria-labelledby="fixture-filter-title">
      <DialogTitle id="fixture-filter-title">Filter dialog</DialogTitle>
    </Dialog>
  ),
}));
vi.mock('@/hooks/usePageRouter', () => ({
  usePageRouter: () => ({ styleName: '', currentBlockName: 'table' }),
}));
vi.mock('@/components/NavigationComponents/Header/DatasetButton', () => ({
  DatasetButton: () => null,
}));
vi.mock('@/components/NavigationComponents/Header/DrawerMenuBar', () => ({
  DrawerMenuBar: () => null,
}));
vi.mock('@/components/NavigationComponents/Header/HeaderTitle', () => ({
  HeaderTitle: () => null,
}));
vi.mock('@/components/NavigationComponents/Header/HeaderLogo', () => ({
  default: () => null,
}));
vi.mock('@/components/SelectorComponents/DropDown/DatabaseDropdown', () => ({
  default: () => null,
}));
vi.mock('@/components/SelectorComponents/DropDown/LanguagesDropdown', () => ({
  default: () => null,
}));
vi.mock(
  '@/components/SelectorComponents/ButtonComponents/ButtonDropdownColumnSelector',
  () => ({
    default: () => null,
  }),
);
vi.mock(
  '@/components/PresentationComponents/GlobalSearch/GlobalSearchButton',
  () => ({
    default: () => null,
  }),
);

const theme = createTheme({
  breakpoints: { values: { xs: 0, sm: 600, md: 1000, lg: 1200, xl: 1536 } },
});

const setViewport = (width: number) => {
  vi.spyOn(window, 'matchMedia').mockImplementation((media) => ({
    media,
    matches:
      width >= Number(/min-width:\s*(\d+)px/.exec(media)?.[1] ?? Infinity),
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

const showHeader = (Header: React.ComponentType) =>
  render(
    <Provider store={store}>
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <Header />
        </ThemeProvider>
      </MemoryRouter>
    </Provider>,
  );

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

for (const Header of [
  HeaderVoyagesNavBar,
  HeaderEnslavedNavBar,
  HeaderEnslaversNavBar,
]) {
  test.each([375, 999, 1000, 1440])(
    `${Header.name} mounts one filter dialog at width %i`,
    (width) => {
      setViewport(width);
      showHeader(Header);
      // CSS-hidden parents cannot hide dialogs portaled into document.body.
      // Rendering both responsive branches would create two focus traps here.
      expect(
        screen.getAllByRole('dialog', { name: 'Filter dialog' }),
      ).toHaveLength(1);
      expect(
        document.querySelectorAll('button[aria-label="menu"]'),
      ).toHaveLength(width < 1000 ? 1 : 0);
    },
  );
}

test.each([375, 999, 1000, 1440])(
  'People header follows the theme breakpoint at width %i',
  (width) => {
    setViewport(width);
    showHeader(HeaderPeopleNavBar);
    expect(document.querySelectorAll('button[aria-label="menu"]')).toHaveLength(
      width < 1000 ? 1 : 0,
    );
  },
);
