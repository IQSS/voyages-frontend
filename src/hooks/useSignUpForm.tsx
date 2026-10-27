import { useState } from 'react';

export interface SignUpFormData {
  email: string;
  firstName: string;
  lastName: string;
  institution: string;
  description: string;
  captcha: string;
  password: string;
  passwordConfirm: string;
  agreeToTerms: boolean;
}

export interface SignUpFormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  institution?: string;
  description?: string;
  captcha?: string;
  password?: string;
  passwordConfirm?: string;
  agreeToTerms?: string;
}

export const useSignUpForm = () => {
  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    firstName: '',
    lastName: '',
    institution: '',
    description: '',
    captcha: '',
    password: '',
    passwordConfirm: '',
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<SignUpFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: SignUpFormErrors = {};

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.institution) {
      newErrors.institution = 'Institution is required';
    }
    if (!formData.description) {
      newErrors.description = 'Description is required';
    }
    if (!formData.captcha) {
      newErrors.captcha = 'Captcha is required';
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Passwords do not match';
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name as keyof SignUpFormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (
    e: React.FormEvent,
    onSubmit?: (data: SignUpFormData) => Promise<void> | void,
  ) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (validateForm()) {
      try {
        if (onSubmit) {
          await onSubmit(formData);
        }
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }

    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      institution: '',
      description: '',
      captcha: '',
      password: '',
      passwordConfirm: '',
      agreeToTerms: false,
    });
    setErrors({});
    setIsSubmitting(false);
  };

  return {
    formData,
    errors,
    isSubmitting,
    handleInputChange,
    handleSubmit,
    validateForm,
    resetForm,
  };
};
