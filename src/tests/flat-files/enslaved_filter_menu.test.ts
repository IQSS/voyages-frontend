import menu from '@/utils/flatfiles/enslaved/enslaved_all_filter_menu.json';

import fields from './fixtures/api-option-fields.json';
import { testFilterMenu } from './flatFileContracts';

testFilterMenu('All enslaved people filters', menu, fields.Enslaved);
