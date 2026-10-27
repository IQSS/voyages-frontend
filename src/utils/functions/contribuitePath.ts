//https://www.slavevoyages.org/contribute/interim/new/2976
import { createElement } from 'react';

import { Add, Edit, Merge, Delete, List, Download } from '@mui/icons-material';
const generateId = '';
const editorialPlatformPath = '/contribute/editor_main/requests';
export const getDisplayButtons = (
  translatedContribute: Record<string, string>,
  isEditor: boolean,
) => {
  const buttons = [
    {
      nameBtn: translatedContribute.contributeNewVoyage,
      path: `/contribute/interim/new/${generateId}`,
      icon: createElement(Add),
    },
    {
      nameBtn: translatedContribute.contributeEditExistingVoyage,
      path: `/contribute/edit_voyage`,
      icon: createElement(Edit),
    },
    {
      nameBtn: translatedContribute.contributeMergeVoyages,
      path: `/contribute/merge_voyages`,
      icon: createElement(Merge),
    },
    {
      nameBtn: translatedContribute.contributeDeleteVoyage,
      path: `/contribute/delete_voyage`,
      icon: createElement(Delete),
    },
    {
      nameBtn: translatedContribute.contributeEditorialPlatform,
      path: editorialPlatformPath,
      icon: createElement(List),
    },
  ];

  return isEditor
    ? buttons
    : buttons.filter((button) => button.path !== editorialPlatformPath);
};

export const getDisplayButtonsEditorial = (
  translatedContribute: Record<string, string>,
) => [
  {
    nameBtn: translatedContribute.contributeRequests,
    path: `/contribute/editor_main/requests`,
    icon: createElement(List),
  },
  {
    nameBtn: translatedContribute.contributeVoyages,
    path: `/contribute/editor_main/pending`,
    icon: createElement(List),
  },
  {
    nameBtn: translatedContribute.contributeEnslavers,
    path: `/contribute/editor_main/enslavers_contrib`,
    icon: createElement(List),
  },
  {
    nameBtn: translatedContribute.contributeEnslaved,
    path: `/contribute/editor_main/enslaved_contrib`,
    icon: createElement(List),
  },
  {
    nameBtn: translatedContribute.contributeSourceCodes,
    path: `/contribute/editor_main/sources`,
    icon: createElement(List),
  },
  {
    nameBtn: translatedContribute.contributePublish,
    path: `/contribute/editor_main/publish`,
    icon: createElement(List),
  },
  {
    nameBtn: translatedContribute.contributeDownloadVoyages,
    path: `/contribute/editor_main/downloads`,
    icon: createElement(Download),
  },
];
