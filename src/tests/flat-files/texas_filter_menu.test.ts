import menu from '@/utils/flatfiles/enslaved/enslaved_texas_filter_menu.json';

import fields from './fixtures/api-option-fields.json';
import { testFilterMenu } from './flatFileContracts';

testFilterMenu('Texas filters', menu, fields.Enslaved);
