'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { FormField } from '@/components/common/FormField';
import { validators } from '@/utils/validation';
import type { CreateSourceInput, SourceFormData, SourceFormErrors } from '@/types/api';

/**
 * AddSourceForm Component Props
 */
interface AddSourceFormProps {
  /** Callback when form is submitted with valid data */
  onSubmit: (data: CreateSourceInput) => Promise<void>;
  /** Whether a submission is in progress */
  isLoading: boolean;
  /** API error to display */
  error: Error | null;
  /** Callback when cancel button is clicked */
  onCancel: () => void;
}

/**
 * Default form data
 */
const defaultFormData: SourceFormData = {
  name: '',
  feedURL: '',
  sourceType: 'RSS',
};

/**
 * AddSourceForm Component
 *
 * A form for adding new RSS/Atom feed sources.
 * Includes client-side validation and error handling.
 *
 * @example
 * ```tsx
 * <AddSourceForm
 *   onSubmit={async (data) => await createSource(data)}
 *   isLoading={isPending}
 *   error={error}
 *   onCancel={() => setIsOpen(false)}
 * />
 * ```
 */
export function AddSourceForm({ onSubmit, isLoading, error, onCancel }: AddSourceFormProps) {
  const [formData, setFormData] = React.useState<SourceFormData>(defaultFormData);
  const [errors, setErrors] = React.useState<SourceFormErrors>({});

  /**
   * Validate a single field
   */
  const validateField = (field: keyof SourceFormData, value: string): string | undefined => {
    if (field === 'name') {
      const result = validators.compose(
        validators.required('Name is required'),
        validators.maxLength(255)
      )(value);
      return result ?? undefined;
    }

    if (field === 'feedURL') {
      const result = validators.compose(
        validators.required('Feed URL is required'),
        validators.urlFormat('Please enter a valid URL (e.g., https://example.com/feed.xml)'),
        validators.maxLength(2048)
      )(value);
      return result ?? undefined;
    }

    return undefined;
  };

  /**
   * Handle field value change
   */
  const handleChange = (field: keyof SourceFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Handle field blur for validation
   */
  const handleBlur = (field: keyof SourceFormData) => {
    const fieldValue = formData[field];
    const error = validateField(field, fieldValue);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: SourceFormErrors = {
      name: validateField('name', formData.name),
      feedURL: validateField('feedURL', formData.feedURL),
    };

    setErrors(newErrors);

    // Check if there are any errors
    if (newErrors.name || newErrors.feedURL) {
      return;
    }

    // Submit the form
    await onSubmit({
      name: formData.name.trim(),
      feedURL: formData.feedURL.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* API Error Alert */}
      <ErrorAlert error={error} />

      {/* Name Field */}
      <FormField label="Name" required htmlFor="source-name" error={errors.name}>
        <Input
          id="source-name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          placeholder="e.g., Tech Blog"
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'source-name-error' : undefined}
          disabled={isLoading}
          maxLength={255}
        />
      </FormField>

      {/* Feed URL Field */}
      <FormField label="Feed URL" required htmlFor="source-feedURL" error={errors.feedURL}>
        <Input
          id="source-feedURL"
          type="url"
          value={formData.feedURL}
          onChange={(e) => handleChange('feedURL', e.target.value)}
          onBlur={() => handleBlur('feedURL')}
          placeholder="https://example.com/feed.xml"
          aria-required="true"
          aria-invalid={!!errors.feedURL}
          aria-describedby={errors.feedURL ? 'source-feedURL-error' : undefined}
          disabled={isLoading}
          maxLength={2048}
        />
      </FormField>

      {/* Source Type Field (UI only) */}
      <FormField label="Source Type" htmlFor="source-sourceType">
        <Select
          value={formData.sourceType}
          onValueChange={(value) => handleChange('sourceType', value)}
          disabled={isLoading}
        >
          <SelectTrigger id="source-sourceType">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RSS">RSS</SelectItem>
            <SelectItem value="Atom">Atom</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            'Add Source'
          )}
        </Button>
      </div>
    </form>
  );
}
