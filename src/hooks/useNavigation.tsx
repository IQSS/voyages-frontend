import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { signOut } from '@/redux/getAuthUserSlice';
import { AppDispatch } from '@/redux/store';
import { ACCOUNTS, CONTRIBUTE } from '@/share/CONST_DATA';

interface UseNavigationReturn {
  handleClickGuidelines: () => void;
  handleSignInClick: () => void;
  handleSignUpClick: () => void;
  handleResetPasswordClick: () => void;
  handleLogout: () => void;
  handleConfirmSignOut: () => void;
  handleAcceptTeams: () => void;
  handleClickSideBar: (path: string) => void;
}

export const useNavigation = (): UseNavigationReturn => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleClickGuidelines = () =>
    handleNavigate(`/${CONTRIBUTE}guidelines`);
  const handleSignInClick = () => handleNavigate(`/${ACCOUNTS}signin`);
  const handleSignUpClick = () => handleNavigate(`/${ACCOUNTS}signup`);
  const handleResetPasswordClick = () =>
    handleNavigate(`/${ACCOUNTS}password/reset`);
  const handleAcceptTeams = () => handleNavigate(`/${CONTRIBUTE}`);
  const handleClickSideBar = (path: string) => {
    if (!path) {
      handleNavigate(`/${CONTRIBUTE}`);
    } else {
      handleNavigate(`${path}`);
    }
  };

  const handleLogout = () => {
    handleNavigate(`/${ACCOUNTS}logout`);
  };
  const handleConfirmSignOut = () => {
    void dispatch(signOut());
    navigate(`/${ACCOUNTS}signin`, { replace: true });
  };

  return {
    handleClickGuidelines,
    handleSignInClick,
    handleSignUpClick,
    handleResetPasswordClick,
    handleLogout,
    handleConfirmSignOut,
    handleAcceptTeams,
    handleClickSideBar,
  };
};
