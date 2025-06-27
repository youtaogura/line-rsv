export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[0-9-+().\s]+$/;
  return phoneRegex.test(phone) && phone.length >= 10;
}

export function validateRequired(value: unknown, fieldName: string): string | null {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateStringLength(
  value: string, 
  fieldName: string, 
  min?: number, 
  max?: number
): string | null {
  if (min && value.length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }
  if (max && value.length > max) {
    return `${fieldName} must be no more than ${max} characters`;
  }
  return null;
}

export function validateDate(dateString: string, fieldName: string): string | null {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return `${fieldName} must be a valid date`;
  }
  return null;
}

export function collectValidationErrors(validators: Array<() => string | null>): Record<string, string> {
  const errors: Record<string, string> = {};
  
  validators.forEach((validator, index) => {
    const error = validator();
    if (error) {
      errors[`field_${index}`] = error;
    }
  });
  
  return errors;
}