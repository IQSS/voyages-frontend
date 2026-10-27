import menu from '@/utils/flatfiles/voyages/voyages_transatlantic_filter_menu.json';

import fields from './fixtures/api-option-fields.json';
import { testFilterMenu } from './flatFileContracts';

testFilterMenu('Transatlantic voyage filters', menu, fields.Voyage);
