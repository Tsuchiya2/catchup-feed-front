'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * FormField Component Props
 */
interface FormFieldProps {
  /** Label text for the field */
  label: string;
  /** Error message to display */
  error?: string | null;
  /** Whether the field is required */
  required?: boolean;
  /** The form control element(s) */
  children: React.ReactNode;
  /** ID for the form control (used for label association) */
  htmlFor?: string;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * FormField Component
 *
 * A reusable wrapper component for form fields that provides:
 * - Label with optional required indicator
 * - Error message display
 * - Proper accessibility attributes
 *
 * @example
 * ```tsx
 * <FormField
 *   label="Email"
 *   required
 *   htmlFor="email"
 *   error={errors.email}
 * >
 *   <Input
 *     id="email"
 *     type="email"
 *     aria-invalid={!!errors.email}
 *     aria-describedby={errors.email ? 'email-error' : undefined}
 *   />
 * </FormField>
 * ```
 */
export function FormField({
  label,
  error,
  required = false,
  children,
  htmlFor,
  className,
}: FormFieldProps) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && (
          <>
            <span className="ml-1 text-destructive" aria-hidden="true">
              *
            </span>
            <span className="sr-only">(required)</span>
          </>
        )}
      </Label>
      {children}
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
