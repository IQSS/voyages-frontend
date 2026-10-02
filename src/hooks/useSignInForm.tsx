import { useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { signInWithEmail, signInWithOAuth } from '@/redux/getAuthUserSlice';
import { RootState, AppDispatch } from '@/redux/store';
import { translationLanguagesContribute } from '@/utils/functions/translationLanguages';
import {
  getRememberedEmail,
  getRememberMe,
  rememberEmail,
  setRememberMe,
} from '@/utils/supabase/authStorage';

export interface SignInFormValues {
  email: string;
  password: string;
  remember: boolean;
}

export interface SignInFieldErrors {
  email?: string;
  password?: string;
}

export const useSignInForm = (nextPath: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { actionLoading: loading } = useSelector(
    (state: RootState) => state.getAuthUserSlice,
  );
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const translatedContribute = translationLanguagesContribute(languageValue);

  const [formValues, setFormValues] = useState<SignInFormValues>({
    email: getRememberedEmail(),
    password: '',
    remember: getRememberMe(),
  });
  const [fieldErrors, setFieldErrors] = useState<SignInFieldErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const getFriendlySignInError = (
    message: string,
    fallback: string = translatedContribute.contributeSignInFailed,
  ): string => {
    const normalized = (message || '').toLowerCase();
    if (normalized.includes('invalid login credentials')) {
      return translatedContribute.contributeSignInInvalidCredentials;
    }
    if (normalized.includes('email not confirmed')) {
      return translatedContribute.contributeSignInEmailNotConfirmed;
    }
    if (normalized.includes('rate limit') || normalized.includes('429')) {
      return translatedContribute.contributeSignInTooManyRequests;
    }
    if (
      normalized.includes('failed to fetch') ||
      normalized.includes('network')
    ) {
      return translatedContribute.contributeSignInNetworkError;
    }
    return message || fallback;
  };

  const validateForm = (): boolean => {
    const newFieldErrors: SignInFieldErrors = {};

    if (!formValues.email || !/\S+@\S+\.\S+/.test(formValues.email)) {
      newFieldErrors.email = translatedContribute.contributeSignInEmailRequired;
    }
    if (!formValues.password) {
      newFieldErrors.password =
        translatedContribute.contributeSignInPasswordRequired;
    }

    setFieldErrors(newFieldErrors);
    return Object.keys(newFieldErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setAuthError(null);
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleFormSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setAuthError(null);

    if (!validateForm()) {
      return;
    }

    setRememberMe(formValues.remember);
    rememberEmail(formValues.email, formValues.remember);
    try {
      await dispatch(
        signInWithEmail({
          email: formValues.email,
          password: formValues.password,
        }),
      ).unwrap();
      navigate(nextPath);
    } catch (error: unknown) {
      setAuthError(getFriendlySignInError(error as string));
    }
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    setAuthError(null);
    setRememberMe(formValues.remember);
    try {
      await dispatch(signInWithOAuth('google')).unwrap();
    } catch (error: unknown) {
      setAuthError(
        getFriendlySignInError(
          error as string,
          translatedContribute.contributeSignInGoogleFailed,
        ),
      );
    }
  };

  const handleGitHubSignIn = async (): Promise<void> => {
    setAuthError(null);
    setRememberMe(formValues.remember);
    try {
      await dispatch(signInWithOAuth('github')).unwrap();
    } catch (error: unknown) {
      setAuthError(
        getFriendlySignInError(
          error as string,
          translatedContribute.contributeSignInGithubFailed,
        ),
      );
    }
  };

  const togglePasswordVisibility = (): void => {
    setShowPassword((prev) => !prev);
  };

  return {
    translatedContribute,
    loading,
    formValues,
    fieldErrors,
    authError,
    showPassword,
    handleInputChange,
    handleFormSubmit,
    handleGoogleSignIn,
    handleGitHubSignIn,
    togglePasswordVisibility,
  };
};
