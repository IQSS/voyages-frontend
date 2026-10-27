import React, { useEffect } from 'react';

import { useSelector } from 'react-redux';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

// Form Components
import EditExistingVoyage from '@/components/PresentationComponents/Contribute/Form/EditExistingVoyage';
import MergeVoyages from '@/components/PresentationComponents/Contribute/Form/MergeVoyages';
import NewVoyage from '@/components/PresentationComponents/Contribute/Form/NewVoyage';
import PasswordChangeForm from '@/components/PresentationComponents/Contribute/Form/PasswordChangeForm';
import RecommendVoyageDeletion from '@/components/PresentationComponents/Contribute/Form/RecommendVoyageDeletion';
import SignInForm from '@/components/PresentationComponents/Contribute/Form/SingInForm';
import SignUpForm from '@/components/PresentationComponents/Contribute/Form/SignUpForm';
// Editorial Platform Components
import { useNavigation } from '@/hooks/useNavigation';
import { usePageRouter } from '@/hooks/usePageRouter';
import { RootState } from '@/redux/store';
import {
  hasEditorRole,
  isEditorOnlyContributeRoute,
} from '@/utils/auth/hasEditorRole';
import { translationLanguagesContribute } from '@/utils/functions/translationLanguages';

import ContributeHomeWelcome from './ContributeHomeWelcome';
import AdminHome from '../Admin/AdminHome';
import AdminUserAdd from '../Admin/AdminUserAdd';
import DownloadVoyages from './editorialPlatform/DownloadVoyages';
import EditEnslaved from './editorialPlatform/EditEnslaved';
import EditEnslavers from './editorialPlatform/EditEnslavers';
import EnslaverContributionReview from './editorialPlatform/editEnslavers/EnslaverContributionReview';
import EditorialPlatformTable from './editorialPlatform/EditorialPlatformTable';
import EditSourceCodes from './editorialPlatform/EditSourceCodes';
import EditUser from './editorialPlatform/EditUser';
import EditVoyages from './editorialPlatform/EditVoyages';
import PublishNewDBVersion from './editorialPlatform/PublishNewDBVersion';
import PasswordResetForm from './Form/PasswordResetForm';
import SignOut from './Form/SignOut';
import TermsAndConditions from './Form/TermsAndConditions';
import Guidelines from './Guidelines';
import '@/style/contributeContent.scss';
import AdminUserList from '../Admin/AdminUserList';

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['signin', 'signup', 'guidelines', 'password'];

interface ContributeContentProps {
  openSideBar: boolean;
}

type RouteKey = string;
type ComponentRenderer = () => JSX.Element;

const ContributeContent: React.FC<ContributeContentProps> = ({
  openSideBar,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { handleClickGuidelines, handleResetPasswordClick } = useNavigation();
  const { contributePath, endpointPath, contributePathEditorial } =
    usePageRouter();

  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const { user, loading } = useSelector(
    (state: RootState) => state.getAuthUserSlice,
  );
  const isEditor = hasEditorRole(user);
  const isAdminRoute = endpointPath === 'admin';
  const isEditorialRoute = isEditorOnlyContributeRoute(location.pathname);
  const translatedContribute = translationLanguagesContribute(languageValue);

  // Check if current route is public (doesn't require auth)
  const isPublicRoute = PUBLIC_ROUTES.includes(contributePath || '');

  // Redirect to signin if not authenticated and trying to access protected route
  // Wait for auth to finish loading before redirecting
  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      navigate('/accounts/signin', { replace: true });
    }
  }, [user, loading, isPublicRoute, navigate]);

  // Route configuration object
  const routeComponents: Record<RouteKey, ComponentRenderer> = {
    // Main contribute routes
    signin: () => (
      <SignInPage
        translatedContribute={translatedContribute}
        handleClickGuidelines={handleClickGuidelines}
      />
    ),
    signup: () => <SignUpForm />,
    guidelines: () => <Guidelines />,
    password: () => (
      <PasswordResetForm handleResetPassword={handleResetPasswordClick} />
    ),
    legal: () => <TermsAndConditions />,
    logout: () => <SignOut />,
    password_change: () => <PasswordChangeForm />,

    interim: () => <NewVoyage />,
    edit_voyage: () => <EditExistingVoyage openSideBar={openSideBar} />,
    merge_voyages: () => <MergeVoyages />,
    delete_voyage: () => <RecommendVoyageDeletion />,

    // Editorial platform routes
    'editor_main/pending': () => <EditVoyages />,
    'editor_main/enslavers_contrib': () => <EditEnslavers />,
    'editor_main/enslaved_contrib': () => <EditEnslaved />,
    'editor_main/users': () => <EditUser />,
    'editor_main/sources': () => <EditSourceCodes />,
    'editor_main/publish': () => <PublishNewDBVersion />,
    'editor_main/downloads': () => <DownloadVoyages />,

    // 'admin/auth/user/': () => <AdminUserList />,
  };

  const getDisplayContent = (): JSX.Element => {
    // While auth is loading, show a loading indicator
    if (loading) {
      return (
        <div
          className="contribute-content"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
          }}
        >
          <span>Loading...</span>
        </div>
      );
    }

    // Protected routes require authentication before role checks or rendering.
    if (!user && !isPublicRoute) {
      return (
        <SignInPage
          translatedContribute={translatedContribute}
          handleClickGuidelines={handleClickGuidelines}
        />
      );
    }

    // Admin and editorial screens are available to Editors only, including
    // when a non-Editor enters one of these URLs directly.
    if ((isAdminRoute || isEditorialRoute) && !isEditor) {
      return <Navigate to="/contribute/" replace />;
    }

    // ── Admin routes (/admin/ and /admin/auth/user/) ─────────────────────
    if (isAdminRoute) {
      if (location.pathname === '/admin/' || location.pathname === '/admin') {
        return <AdminHome />;
      }
      if (location.pathname.startsWith('/admin/auth/user/add')) {
        return <AdminUserAdd />;
      }
      if (location.pathname.startsWith('/admin/auth/user')) {
        return <AdminUserList />;
      }
    }

    if (location.pathname.includes('/accounts/signup')) {
      if (!user) {
        return <SignUpForm />;
      }
    }

    // Enslaver contribution review — /contribute/enslaver_contribution_review/:id
    if (
      location.pathname.includes('/contribute/enslaver_contribution_review/')
    ) {
      if (!user) {
        return (
          <SignInPage
            translatedContribute={translatedContribute}
            handleClickGuidelines={handleClickGuidelines}
          />
        );
      }
      return <EnslaverContributionReview />;
    }

    // FIXED: Check actual URL pathname for requests routes
    // This handles both /editor_main/requests and /editor_main/requests/:id
    if (location.pathname.includes('/contribute/editor_main/requests')) {
      if (!user) {
        return (
          <SignInPage
            translatedContribute={translatedContribute}
            handleClickGuidelines={handleClickGuidelines}
          />
        );
      }
      return <EditorialPlatformTable openSideBar={openSideBar} />;
    }

    // Check editorial path from hook (requires auth)
    if (contributePathEditorial) {
      if (!user) {
        return (
          <SignInPage
            translatedContribute={translatedContribute}
            handleClickGuidelines={handleClickGuidelines}
          />
        );
      }
      // Check if it matches any route in our config
      if (routeComponents[contributePathEditorial]) {
        return routeComponents[contributePathEditorial]();
      }
    }

    // Check contribute path
    if (contributePath && routeComponents[contributePath]) {
      return routeComponents[contributePath]();
    }

    // Default to home page (requires auth)
    if (endpointPath === 'contribute') {
      if (!user) {
        return (
          <SignInPage
            translatedContribute={translatedContribute}
            handleClickGuidelines={handleClickGuidelines}
          />
        );
      }
      return <ContributeHomeWelcome />;
    }

    // Fallback - show signin if not authenticated
    if (!user) {
      return (
        <SignInPage
          translatedContribute={translatedContribute}
          handleClickGuidelines={handleClickGuidelines}
        />
      );
    }
    return <ContributeHomeWelcome />;
  };

  return getDisplayContent();
};

// Extracted SignIn page component for better organization
const SignInPage: React.FC<{
  translatedContribute: Record<string, string>;
  handleClickGuidelines: () => void;
}> = ({ translatedContribute, handleClickGuidelines }) => (
  <div className="contribute-content">
    <h1 className="page-title-1">{translatedContribute.contribute}</h1>
    <p>{translatedContribute.contributeText1}</p>
    <p>{translatedContribute.contributeText2}</p>
    <p>
      {translatedContribute.contributeText3}{' '}
      <Link to="#" className="contribute-link">
        {translatedContribute.contributeText3Link1}
      </Link>{' '}
      {translatedContribute.contributeText4}{' '}
      <button
        onClick={handleClickGuidelines}
        className="contribute-link-button"
        type="button"
        aria-label="View guidelines"
      >
        {translatedContribute.contributeText3Link2}
      </button>
    </p>
    <p>{translatedContribute.contributeText5}</p>
    <SignInForm />
  </div>
);

export default ContributeContent;
