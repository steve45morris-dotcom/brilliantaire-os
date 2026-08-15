import { ZodSchema, ZodError } from 'zod';

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export class AppValidationError extends Error {
  public details: ValidationErrorDetail[];

  constructor(message: string, details: ValidationErrorDetail[]) {
    super(message);
    this.name = 'AppValidationError';
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Validates a payload against a Zod schema.
 * Throws a formatted AppValidationError if validation fails.
 */
export function validateRequest<T>(schema: ZodSchema<T>, payload: unknown): T {
  try {
    return schema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      const details: ValidationErrorDetail[] = error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new AppValidationError('Validation failed', details);
    }
    throw error;
  }
}
