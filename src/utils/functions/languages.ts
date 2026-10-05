import {
  AFRICANORIGINSPAGE,
  BLOGPAGE,
  ENSALVEDPAGE,
  ENSALVERSPAGE,
  PASTHOMEPAGEPATH,
  TRANSATLANTICENSLAVERS,
  TRANSATLANTICTIMELAPSEPATH,
  VOYAGEPATHDROPDOWN,
} from '@/share/CONST_DATA';
import { LabelFilterMeneList } from '@/share/InterfaceTypes';

export const LanguageOptions = [
  { language: 'English', value: 'en', lable: 'English' },
  { language: 'Español', value: 'es', lable: 'Español' },
  { language: 'Português', value: 'pt', lable: 'Português' },
];

export interface PagesOptionsProps {
  page: PagesProps;
}
interface PagesProps {
  name: string;
  pathUrl: string;
  label: LabelFilterMeneList;
}
export const PagesOptions: PagesOptionsProps[] = [
  {
    page: {
      name: 'Voyages',
      pathUrl: `${VOYAGEPATHDROPDOWN}`,
      label: {
        en: 'Voyages',
        es: 'Base de Datos de Viajes',
        pt: 'Base de Dados de Viagens',
      },
    },
  },
  {
    page: {
      name: 'People',
      pathUrl: `${PASTHOMEPAGEPATH}`,
      label: {
        en: 'People',
        es: 'Personas',
        pt: 'Pessoas',
      },
    },
  },
  {
    page: {
      name: 'Enslaved',
      pathUrl: `${ENSALVEDPAGE}${AFRICANORIGINSPAGE}#people`,
      label: {
        en: 'Enslaved',
        es: 'Esclavizadas',
        pt: 'Escravizadas',
      },
    },
  },
  {
    page: {
      name: 'Slave Traders',
      pathUrl: `${ENSALVERSPAGE}${TRANSATLANTICENSLAVERS}#people`,
      label: {
        en: 'Slave Traders',
        es: 'Traficantes de Esclavos',
        pt: 'Traficantes de Escravoss',
      },
    },
  },
  {
    page: {
      name: 'Timelapse',
      pathUrl: `${TRANSATLANTICTIMELAPSEPATH}`,
      label: {
        en: 'Timelapse',
        es: 'Lapso Temporal',
        pt: 'Cronologia',
      },
    },
  },
  {
    page: {
      name: 'Learn more',
      pathUrl: `/${BLOGPAGE}`,
      label: {
        en: 'Learn more',
        es: 'Aprende más',
        pt: 'Saiba mais',
      },
    },
  },
];
