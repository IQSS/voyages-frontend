import menu from '@/utils/flatfiles/enslavers/enslavers_filter_menu.json';

import fields from './fixtures/api-option-fields.json';
import { testFilterMenu } from './flatFileContracts';

testFilterMenu('Enslavers filters', menu, fields.EnslaverIdentity);
