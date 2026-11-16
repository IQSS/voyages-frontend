import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { cleanup, render, screen } from '@testing-library/react';
import axios from 'axios';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';

import VoyageCard from '@/components/PresentationComponents/Cards/Cards';
import cardReducer, {
  openCardTarget,
  setCardFileName,
} from '@/redux/getCardFlatObjectSlice';
import languagesReducer from '@/redux/getLanguagesSlice';
import {
  ALLVOYAGESFILECARD,
  INDIANOCEANANDASIANFILECARD,
  INTRAAMERICANFILECARD,
  TRANSATLANTICFILECARD,
} from '@/share/CONST_DATA';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function mortalityValue(
  file: string,
  dataset: number,
  ratio: number | null,
) {
  const store = configureStore({
    reducer: {
      getCardFlatObjectData: cardReducer,
      getLanguages: languagesReducer,
    },
    middleware: (defaultMiddleware) =>
      defaultMiddleware({ serializableCheck: false }),
  });
  vi.spyOn(axios, 'get').mockResolvedValue({
    data: {
      voyage_id: 4822,
      dataset,
      voyage_ship: null,
      voyage_dates: null,
      voyage_itinerary: null,
      voyage_outcome: null,
      voyage_crew: null,
      voyage_groupings: [],
      african_info: [],
      cargo: [],
      sources: [],
      enslavers: [],
      named_enslaved_people: [],
      linked_voyages: [],
      voyage_slaves_numbers: {
        imp_mortality_during_voyage: 18,
        imp_mortality_ratio: ratio,
      },
    },
  });
  store.dispatch(setCardFileName(file));
  store.dispatch(openCardTarget({ id: 4822, nodeClass: 'voyages' }));
  render(
    <Provider store={store}>
      <MemoryRouter>
        <VoyageCard />
      </MemoryRouter>
    </Provider>,
  );
  await screen.findByText(/^4,?822$/);
  const label = screen.getByText(
    'Percentage of captives who died during crossing (IMP)',
  );
  return label.nextElementSibling?.textContent;
}

const cards = [
  [ALLVOYAGESFILECARD, 0],
  [TRANSATLANTICFILECARD, 0],
  [INTRAAMERICANFILECARD, 1],
  [INDIANOCEANANDASIANFILECARD, 3],
] as const;

it.each(cards)(
  'renders the mortality ratio as a percentage on %s',
  async (file, dataset) => {
    expect(await mortalityValue(file, dataset, 0.06)).toBe('6.0%');
  },
);

it.each(cards)(
  'distinguishes an unknown rate from the recorded number of deaths on %s',
  async (file, dataset) => {
    expect(await mortalityValue(file, dataset, null)).toBe('--');
  },
);

it.each(cards)(
  'shows a recorded zero mortality rate on %s',
  async (file, dataset) => {
    expect(await mortalityValue(file, dataset, 0)).toBe('0.0%');
  },
);
