import { BASE_URL_FRONTEND } from '@/share/AUTH_BASEURL';
import {
  ACCOUNTS,
  ASSESSMENT,
  BLOGPAGE,
  DOCUMENTPAGE,
  ESTIMATES,
  INTRAAMERICANPAGE,
  TRANSATLANTICTIMELAPSE,
} from '@/share/CONST_DATA';
import { MenuListsProps } from '@/share/InterfaceTypes';

export const menuLists: MenuListsProps[] = [
  {
    name: {
      en: 'About',
      es: 'Acerca de',
      pt: 'Sobre',
    },
    url: `${BLOGPAGE}/tag/about#about`,
  },
  {
    name: {
      en: 'Intro Maps',
      es: 'Mapas Introductorios',
      pt: 'Mapas Introdutórios',
    },
    url: `${BLOGPAGE}/tag/all-intro-maps#all-intro-maps`,
  },
  {
    name: {
      en: 'Essays',
      es: 'Ensayos',
      pt: 'Ensaios',
    },
    url: undefined,
    submenu: [
      {
        name: {
          en: 'Trans-Atlantic',
          es: 'Transatlántico',
          pt: 'Transatlântico',
        },
        url: `${BLOGPAGE}/tag/transatlantic#transatlantic`,
      },
      {
        name: {
          en: 'Intra-American',
          es: 'Intraamericano',
          pt: 'Intra-americano',
        },
        url: `${BLOGPAGE}/tag/intraamerican#intraamerican`,
      },
      {
        name: {
          en: 'Texas Bound',
          es: 'Rumbo a Texas',
          pt: 'Destino Texas',
        },
        url: `${BLOGPAGE}/tag/texas-bound#texas-bound`,
      },
      {
        name: {
          en: 'Indian Ocean',
          es: 'Océano Índico',
          pt: 'Oceano Índico',
        },
        url: `${BLOGPAGE}/tag/indian-ocean#indian-ocean`,
      }
    ],
  },
  {
    name: {
      en: 'Estimates',
      es: 'Estimaciones',
      pt: 'Estimativas',
    },
    url: `${ASSESSMENT}/${ESTIMATES}/`,
  },
  {
    name: {
      en: 'Timelapse',
      es: 'Línea de Tiempo',
      pt: 'Linha do Tempo',
    },
    url: undefined,
    submenu: [
      {
        name: {
          en: 'Trans-Atlantic',
          es: 'Transatlántico',
          pt: 'Transatlântico',
        },
        url: `${TRANSATLANTICTIMELAPSE}#timelapse`,
      },
      {
        name: {
          en: 'Intra-American',
          es: 'Intraamericano',
          pt: 'Intra-americano',
        },
        url: `${INTRAAMERICANPAGE}#timelapse`,
      },
    ],
  },
  {
    name: {
      en: '3D Videos',
      es: 'Videos en 3D',
      pt: 'Vídeos 3D',
    },
    url: `${BLOGPAGE}/3d-videos-of-slaving-vessels/162/`,
  },
  {
    name: {
      en: 'Lesson Plans',
      es: 'Planes de Lecciones',
      pt: 'Planos de Aula',
    },
    url: `${BLOGPAGE}/tag/lesson-plan#lesson-plan`,
  },
  {
    name: {
      en: 'Documents',
      es: 'Documentos',
      pt: 'Documentos',
    },
    url: `${DOCUMENTPAGE}`,
  },
  {
    name: {
      en: 'Methodology',
      es: 'Metodología',
      pt: 'Metodologia',
    },
    url: `${BLOGPAGE}/tag/methodology#methodology`,
  },
  {
    name: {
      en: 'Resources',
      es: 'Recursos',
      pt: 'Recursos',
    },
    url: `${BLOGPAGE}/tag/resources#resources`,
  },
  {
    name: {
      en: 'Downloads',
      es: 'Descargas',
      pt: 'Downloads',
    },
    url: `${BLOGPAGE}/tag/downloads#downloads`,
  },
  /*** Hide until Contribute finish  */
  // {
  //   name: {
  //     en: 'Contribute',
  //     es: 'Contribuir',
  //     pt: 'Contribuir',
  //   },
  //   url: `${ACCOUNTS}signin/`,
  // },
  {
    name: {
      en: 'User Feedback and Report Issues',
      es: 'Comentarios del usuario y reportar problemas',
      pt: 'Feedback do usuário e reportar problemas',
    },
    url: 'https://airtable.com/appZmGW1SJBCvNVkS/pagCykoWOYCdlEryO/form',
    isExternal: true,
  },
  {
    name: {
      en: 'Contact Us',
      es: 'Contacto',
      pt: 'Contato',
    },
    url: `${BLOGPAGE}/contact-us/177`,
  },
  {
    name: {
      en: 'FAQ',
      es: 'FAQ',
      pt: 'FAQ',
    },
    url: `${BLOGPAGE}/faqs/179`,
  },
];
