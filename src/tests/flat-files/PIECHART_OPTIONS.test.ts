import options from '@/utils/flatfiles/voyages/voyages_piechart_options.json';

import fields from './fixtures/api-option-fields.json';
import { testChartOptions } from './flatFileContracts';

testChartOptions('Voyages piechart options', options, fields.Voyage);
