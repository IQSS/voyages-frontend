import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, test, vi } from 'vitest';

import { GenerateCellTableRenderer } from '@/components/PresentationComponents/Tables/GenerateCellTableRenderer';
import { MenuDropdown } from '@/components/SelectorComponents/DropDown/MenuDropdown';
import cardReducer from '@/redux/getCardFlatObjectSlice';
import { DocumentViewerContext } from '@/utils/functions/documentWorkspace';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderSource(data: Record<string, unknown>) {
  const setDoc = vi.fn();
  const store = configureStore({ reducer: { card: cardReducer } });
  const Cell = () =>
    GenerateCellTableRenderer(
      { value: ['Recorded source'], data: { id: 192048, ...data } } as never,
      'literal',
      'enslaved_sources',
      null,
    );
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/past/enslaved/african-origins']}>
        <DocumentViewerContext.Provider
          value={{ doc: null, setDoc, workspace: [] }}
        >
          <Cell />
        </DocumentViewerContext.Provider>
      </MemoryRouter>
    </Provider>,
  );
  return setDoc;
}

test('PR231 renders a source without a bibliography array', () => {
  renderSource({
    sources__title: ['Archive'],
    sources__has_published_manifest: [false],
  });
  expect(screen.getByText('Recorded source')).toBeTruthy();
  expect(screen.queryByTitle('View External Source')).toBeNull();
});

test('PR230 activates an external source without opening the enclosing person card', () => {
  const open = vi.spyOn(window, 'open').mockReturnValue(null);
  const setDoc = renderSource({
    sources__title: ['Archive'],
    sources__has_published_manifest: [false],
    sources__bib: ['Archive, https://archive.example.org/item/123'],
  });
  const source = screen.getByRole('button', { name: 'View External Source' });
  fireEvent.click(source);
  expect(open).toHaveBeenCalledWith(
    'https://archive.example.org/item/123',
    '_blank',
    'noopener,noreferrer',
  );
  expect(setDoc).not.toHaveBeenCalled();
  expect(source.getAttribute('data-card-target-id')).toBeNull();
});

test('PR230 keeps a published manifest on the document viewer path', () => {
  const open = vi.spyOn(window, 'open').mockReturnValue(null);
  const setDoc = renderSource({
    sources__title: ['Archive'],
    sources__has_published_manifest: [true],
    sources__bib: ['Archive, https://archive.example.org/item/123'],
    sources__zotero_group_id: ['5290782'],
    sources__zotero_item_id: ['AUDIT123'],
  });
  fireEvent.click(screen.getByRole('button', { name: 'View Source Document' }));
  expect(setDoc).toHaveBeenCalledWith(
    expect.objectContaining({
      key: '5290782__AUDIT123.json',
      label: 'Archive',
    }),
  );
  expect(open).not.toHaveBeenCalled();
});

test.each([
  ['en', 'Essays', 'Indian Ocean'],
  ['es', 'Ensayos', 'Océano Índico'],
  ['pt', 'Ensaios', 'Oceano Índico'],
])(
  'PR233 exposes the Indian Ocean essay link in %s',
  (locale, essays, ocean) => {
    const store = configureStore({
      reducer: { getLanguages: () => ({ languageValue: locale }) },
    });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <MenuDropdown open />
        </MemoryRouter>
      </Provider>,
    );
    // PR215 made Essays an expandable heading, not a link to every essay.
    expect(
      screen.queryByRole('link', { name: essays }),
    ).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: essays }));
    expect(
      screen
        .getByRole('link', { name: ocean })
        .getAttribute('href'),
    ).toBe('/blog/tag/indian-ocean#indian-ocean');
  },
);
