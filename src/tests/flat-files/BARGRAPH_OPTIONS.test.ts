import options from '@/utils/flatfiles/voyages/voyages_bargraph_options.json';

import fields from './fixtures/api-option-fields.json';
import { testChartOptions } from './flatFileContracts';

testChartOptions('Voyages bargraph options', options, fields.Voyage);
