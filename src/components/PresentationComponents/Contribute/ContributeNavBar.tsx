import '@/style/contributeContent.scss';
import '@/style/Nav.scss';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import HeaderLogoContribute from '@/components/NavigationComponents/Header/HeaderLogoContribute';
import ButtonToggle from '@/components/SelectorComponents/ButtonComponents/ButtonToggle';
import LanguagesDropdown from '@/components/SelectorComponents/DropDown/LanguagesDropdown';
import { RootState } from '@/redux/store';
import { BASEURL } from '@/share/AUTH_BASEURL';
import { hasEditorRole } from '@/utils/auth/hasEditorRole';
import { translationLanguagesContribute } from '@/utils/functions/translationLanguages';

interface ContributeNavBarProps {
  handleDrawerOpen: () => void;
  isAdminRoute?: boolean;
}

const ContributeNavBar = ({ handleDrawerOpen }: ContributeNavBarProps) => {
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );

  const { user } = useSelector((state: RootState) => state.getAuthUserSlice);
  const translatedcontribute = translationLanguagesContribute(languageValue);

  const userName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.userName;
  return (
    <div className="nav-header-contribute">
      <span className="header-logo-icon-estimate">
        <div className="logo-header-estimate">
          <ButtonToggle handleDrawerOpen={handleDrawerOpen} />
          <HeaderLogoContribute />
          <div>{translatedcontribute.header}</div>
        </div>
        <div>
          <LanguagesDropdown />
        </div>
      </span>
      <div className="navbar-subtitle-contribuite flex-navbar">
        <div className="flex-navbar">
          {user ? (
            <div className="navbar-subtitle-contribuite  flex">
              <div className="navbar-subitem">
                Welcome, {userName}.
                <Link className="navbar-subitem-link" to="/contribute/">
                  {translatedcontribute.contributeContributeHome}
                </Link>{' '}
                |
                {hasEditorRole(user) && (
                  <>
                    {/* Admin Home opens the Django admin on the API host. */}
                    {' | '}
                    <a
                      className="navbar-subitem-link"
                      href={`${BASEURL}/admin/`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {translatedcontribute.adminPage}
                    </a>
                    {' | '}
                  </>
                )}
                <Link
                  className="navbar-subitem-link"
                  to="/accounts/password_change/"
                >
                  {translatedcontribute.contributeChangePassword}
                </Link>
                |
                <Link className="navbar-subitem-link" to="/accounts/logout/">
                  {translatedcontribute.contributeLogOut}
                </Link>
              </div>
            </div>
          ) : (
            <div>{translatedcontribute.loginTitle}</div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ContributeNavBar;
