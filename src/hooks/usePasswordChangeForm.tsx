import { useState } from 'react';

export interface PasswordChangeFormData {
  password: string;
  passwordAgain: string;
}

export interface PasswordChangeFormErrors {
  password?: string;
  passwordAgain?: string;
  general?: string;
}

export const usePasswordChangeForm = () => {
  const [formData, setFormData] = useState<PasswordChangeFormData>({
    password: '',
    passwordAgain: '',
  });

  const [errors, setErrors] = useState<PasswordChangeFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: PasswordChangeFormErrors = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.passwordAgain) {
      newErrors.passwordAgain = 'Please confirm your password';
    } else if (formData.password !== formData.passwordAgain) {
      newErrors.passwordAgain = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof PasswordChangeFormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (
    e: React.FormEvent,
    onSubmit?: (data: PasswordChangeFormData) => Promise<void> | void,
  ) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setIsSuccess(false);

    if (validateForm()) {
      try {
        if (onSubmit) {
          await onSubmit(formData);
        }
        setIsSuccess(true);
      } catch (error) {
        console.error('Password change error:', error);
        setErrors({ general: 'Failed to change password. Please try again.' });
      }
    }

    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      password: '',
      passwordAgain: '',
    });
    setErrors({});
    setIsSubmitting(false);
    setIsSuccess(false);
  };

  return {
    formData,
    errors,
    isSubmitting,
    isSuccess,
    handleInputChange,
    handleSubmit,
    validateForm,
    resetForm,
  };
};
