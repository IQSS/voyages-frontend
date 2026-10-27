import options from '@/utils/flatfiles/voyages/voyages_scatter_options.json';

import fields from './fixtures/api-option-fields.json';
import { testChartOptions } from './flatFileContracts';

testChartOptions('Voyages scatter options', options, fields.Voyage);
