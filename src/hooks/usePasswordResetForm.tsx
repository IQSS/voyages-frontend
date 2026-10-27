import { useState } from 'react';

export interface PasswordResetFormData {
  email: string;
}

export interface PasswordResetFormErrors {
  email?: string;
  general?: string;
}

export const usePasswordResetForm = () => {
  const [formData, setFormData] = useState<PasswordResetFormData>({
    email: '',
  });

  const [errors, setErrors] = useState<PasswordResetFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: PasswordResetFormErrors = {};

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
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

    if (errors[name as keyof PasswordResetFormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (
    e: React.FormEvent,
    onSubmit?: (data: PasswordResetFormData) => Promise<void> | void,
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
        console.error('Password reset error:', error);
        setErrors({
          general: 'Failed to send password reset email. Please try again.',
        });
      }
    }

    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      email: '',
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
