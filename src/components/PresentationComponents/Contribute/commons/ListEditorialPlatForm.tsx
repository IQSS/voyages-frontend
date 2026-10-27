import '@/style/contributeContent.scss';
import { useState } from 'react';

import { Button } from '@mui/material';
import { useSelector } from 'react-redux';

import { useNavigation } from '@/hooks/useNavigation';
import { RootState } from '@/redux/store';
import { getDisplayButtonsEditorial } from '@/utils/functions/contribuitePath';
import { translationLanguagesContribute } from '@/utils/functions/translationLanguages';

interface ButtonItem {
  nameBtn: string;
  path: string | null;
  icon: React.ReactElement;
}

const ListEditorialPlatForm: React.FC = () => {
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const translatedContribute = translationLanguagesContribute(languageValue);

  const { handleClickSideBar } = useNavigation();

  const buttons = getDisplayButtonsEditorial(translatedContribute);

  const [activeButton, setActiveButton] = useState<string | null>(() => {
    const currentPath = window.location.pathname;
    const matchingButton = buttons.find((btn) => btn.path === currentPath);
    return matchingButton?.nameBtn || null;
  });

  const handleButtonClick = (btn: ButtonItem) => {
    setActiveButton(btn.nameBtn);
    if (btn.path !== null) {
      handleClickSideBar(btn.path);
    }
  };

  return (
    <div
      className="list-edittorial-container"
      style={{
        position: 'sticky',
        top: '7rem',
        zIndex: 40,
        background: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div>
        {buttons.map((btn) => (
          <Button
            onClick={() => handleButtonClick(btn)}
            key={btn.nameBtn}
            type="button"
            variant="contained"
            sx={{
              backgroundColor:
                activeButton === btn.nameBtn ? 'rgb(55, 148, 141)' : '#fff',
              color:
                activeButton === btn.nameBtn ? '#fff' : 'rgb(55, 148, 141)',
              border:
                activeButton === btn.nameBtn
                  ? 'none'
                  : '1px solid rgb(55, 148, 141)',
              marginRight: '0.75rem',
              height: 26,
              fontSize: '0.75rem',
              textTransform: 'none',
              '&:hover': {
                backgroundColor:
                  activeButton === btn.nameBtn
                    ? 'rgb(1 136 125 / 83%)'
                    : 'rgba(55, 148, 141, 0.1)',
              },
            }}
          >
            {btn.nameBtn}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ListEditorialPlatForm;
