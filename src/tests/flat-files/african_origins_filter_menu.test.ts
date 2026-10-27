import menu from '@/utils/flatfiles/enslaved/enslaved_african_origins_filter_menu.json';

import fields from './fixtures/api-option-fields.json';
import { testFilterMenu } from './flatFileContracts';

testFilterMenu('African Origins filters', menu, fields.Enslaved);
