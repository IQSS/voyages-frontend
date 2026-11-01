import { Weights } from '@/share/InterfaceTypesMap';

import { VoyagesModalPivot } from './VoyagesModal';

const YEAR_ROWS = {
  rows: 'voyage_dates__imp_arrival_at_port_of_dis_sparsedate__year',
  rows_label: 'Year range',
  binsize: 25,
};

export const nodePivots = (weights: Weights): VoyagesModalPivot[] => {
  const { embarkation, disembarkation } = weights;
  const pivots: VoyagesModalPivot[] = [];
  if (embarkation) {
    pivots.push({
      id: 'embarked',
      label: 'Embarked here, by destination',
      request: {
        ...YEAR_ROWS,
        columns: [
          'voyage_itinerary__imp_broad_region_slave_dis__name',
          'voyage_itinerary__imp_principal_region_slave_dis__name',
        ],
        value_field: 'voyage_slaves_numbers__imp_total_num_slaves_embarked',
        agg_fn: 'sum',
      },
    });
  }
  if (disembarkation) {
    pivots.push({
      id: 'disembarked',
      label: 'Disembarked here, by origin',
      request: {
        ...YEAR_ROWS,
        columns: [
          'voyage_itinerary__imp_broad_region_of_slave_purchase__name',
          'voyage_itinerary__imp_principal_region_of_slave_purchase__name',
        ],
        value_field: 'voyage_slaves_numbers__imp_total_num_slaves_disembarked',
        agg_fn: 'sum',
      },
    });
  }
  return pivots;
};
