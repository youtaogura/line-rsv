import { useState, useCallback } from 'react';

export interface ValidationRule<T> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
}

export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

export type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

export interface UseFormValidationReturn<T> {
  errors: ValidationErrors<T>;
  isValid: boolean;
  validate: (field: keyof T, value: T[keyof T]) => string | null;
  validateAll: (data: T) => boolean;
  clearError: (field: keyof T) => void;
  clearAllErrors: () => void;
  setError: (field: keyof T, error: string) => void;
}

export function useFormValidation<T extends Record<string, unknown>>(
  rules: ValidationRules<T>
): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<ValidationErrors<T>>({});

  const validate = useCallback(
    (field: keyof T, value: T[keyof T]): string | null => {
      const rule = rules[field];
      if (!rule) return null;

      // Required validation
      if (
        rule.required &&
        (!value || (typeof value === 'string' && value.trim() === ''))
      ) {
        return '必須項目です';
      }

      // Skip other validations if value is empty and not required
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return null;
      }

      // String-specific validations
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          return `${rule.minLength}文字以上で入力してください`;
        }

        if (rule.maxLength && value.length > rule.maxLength) {
          return `${rule.maxLength}文字以下で入力してください`;
        }

        if (rule.pattern && !rule.pattern.test(value)) {
          return '正しい形式で入力してください';
        }
      }

      // Custom validation
      if (rule.custom) {
        return rule.custom(value);
      }

      return null;
    },
    [rules]
  );

  const validateAll = useCallback(
    (data: T): boolean => {
      const newErrors: ValidationErrors<T> = {};
      let hasErrors = false;

      (Object.keys(rules) as Array<keyof T>).forEach((field) => {
        const error = validate(field, data[field]);
        if (error) {
          newErrors[field] = error;
          hasErrors = true;
        }
      });

      setErrors(newErrors);
      return !hasErrors;
    },
    [rules, validate]
  );

  const clearError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  }, []);

  const isValid = Object.keys(errors).length === 0;

  return {
    errors,
    isValid,
    validate,
    validateAll,
    clearError,
    clearAllErrors,
    setError,
  };
}
