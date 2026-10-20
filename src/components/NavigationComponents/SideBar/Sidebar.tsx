// Sidebar.tsx
import React from 'react';

import '@/style/contributeContent.scss';
import { useSelector } from 'react-redux';

import { useNavigation } from '@/hooks/useNavigation';
import { RootState } from '@/redux/store';
import { hasEditorRole } from '@/utils/auth/hasEditorRole';
import { getDisplayButtons } from '@/utils/functions/contribuitePath';
import { translationLanguagesContribute } from '@/utils/functions/translationLanguages';

const SidebarContribute: React.FC = () => {
  const {
    handleClickGuidelines,
    handleSignInClick,
    handleLogout,
    handleClickSideBar,
  } = useNavigation();
  const { user } = useSelector((state: RootState) => state.getAuthUserSlice);
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const translatedContribute = translationLanguagesContribute(languageValue);
  const buttons = getDisplayButtons(translatedContribute, hasEditorRole(user));

  const buttonStyle: React.CSSProperties = {
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    color: 'inherit',
    textDecoration: 'underline',
  };

  return (
    <div className="contribute-sidebar">
      <ul>
        <li>
          <button onClick={handleClickGuidelines} style={buttonStyle}>
            {translatedContribute.contributeGuidelines}
          </button>
        </li>
        {!user ? (
          <li>
            <button onClick={handleSignInClick} style={buttonStyle}>
              {translatedContribute.contributeSignInButton}
            </button>
          </li>
        ) : (
          <>
            <li>
              <button
                onClick={() => handleClickSideBar('')}
                style={buttonStyle}
              >
                {translatedContribute.contributeContributeHome}
              </button>
              <ul className="contribute-sub-sidebar">
                {buttons.map((btn) => (
                  <li key={btn.nameBtn}>
                    <button
                      onClick={() => handleClickSideBar(btn.path)}
                      style={buttonStyle}
                    >
                      {btn.nameBtn}
                    </button>{' '}
                  </li>
                ))}
              </ul>
            </li>
            <li>
              <button onClick={handleLogout} style={buttonStyle}>
                {translatedContribute.contributeLogOut}
              </button>
            </li>
          </>
        )}
      </ul>
    </div>
  );
};

export default SidebarContribute;
