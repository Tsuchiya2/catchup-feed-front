import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SourceForm } from './SourceForm';
import type { SourceFormData } from '@/utils/validation/sourceValidation';

describe('SourceForm', () => {
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Edit Mode Tests', () => {
    const initialData: SourceFormData = {
      name: 'Tech Blog',
      feedURL: 'https://example.com/feed.xml',
    };

    it('should render with pre-populated values from initialData', () => {
      render(
        <SourceForm
          mode="edit"
          initialData={initialData}
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Source name');
      const urlInput = screen.getByLabelText('Feed URL');

      expect(nameInput).toHaveValue('Tech Blog');
      expect(urlInput).toHaveValue('https://example.com/feed.xml');
    });

    it('should show "Save Changes" button text', () => {
      render(
        <SourceForm
          mode="edit"
          initialData={initialData}
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveTextContent('Save Changes');
    });

    it('should show "Saving..." when isLoading is true', () => {
      render(
        <SourceForm
          mode="edit"
          initialData={initialData}
          onSubmit={mockOnSubmit}
          isLoading={true}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      // Check for loading spinner
      const loadingIcon = screen.getByText('Saving...').parentElement;
      expect(loadingIcon?.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Create Mode Tests', () => {
    it('should render with empty values (no initialData)', () => {
      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Source name');
      const urlInput = screen.getByLabelText('Feed URL');

      expect(nameInput).toHaveValue('');
      expect(urlInput).toHaveValue('');
    });

    it('should show "Add Source" button text', () => {
      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /add source/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveTextContent('Add Source');
    });

    it('should show "Adding..." when isLoading is true', () => {
      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={true}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Adding...')).toBeInTheDocument();
      // Check for loading spinner
      const loadingIcon = screen.getByText('Adding...').parentElement;
      expect(loadingIcon?.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Validation Tests', () => {
    it('should show error when name field is empty on blur', async () => {
      const user = userEvent.setup();
      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Source name');

      // Blur without entering any value
      await user.click(nameInput);
      await user.tab(); // Move to next field (triggers blur)

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when URL field is invalid on blur', async () => {
      const user = userEvent.setup();
      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const urlInput = screen.getByLabelText('Feed URL');

      // Enter invalid URL
      await user.type(urlInput, 'not-a-valid-url');
      await user.tab(); // Blur to trigger validation

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument();
      });
    });

    it('should show error when URL field is empty on blur', async () => {
      const user = userEvent.setup();
      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const urlInput = screen.getByLabelText('Feed URL');

      // Blur without entering any value
      await user.click(urlInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/feed url is required/i)).toBeInTheDocument();
      });
    });

    it('should clear error when valid input is entered after error', async () => {
      const user = userEvent.setup();
      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Source name');

      // Trigger error by blurring empty field
      await user.click(nameInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });

      // Enter valid value
      await user.type(nameInput, 'Valid Name');
      await user.tab(); // Blur to trigger validation

      await waitFor(() => {
        expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
      });
    });

    it('should clear URL error when valid URL is entered', async () => {
      const user = userEvent.setup();
      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const urlInput = screen.getByLabelText('Feed URL');

      // Enter invalid URL
      await user.type(urlInput, 'invalid');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument();
      });

      // Clear and enter valid URL
      await user.clear(urlInput);
      await user.type(urlInput, 'https://example.com/feed.xml');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid url/i)).not.toBeInTheDocument();
      });
    });

    it('should show errors for all invalid fields on submit', async () => {
      const user = userEvent.setup();
      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /add source/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/feed url is required/i)).toBeInTheDocument();
      });

      // Should not call onSubmit when validation fails
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission Tests', () => {
    it('should call onSubmit with trimmed values on submit', async () => {
      const user = userEvent.setup();
      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Source name');
      const urlInput = screen.getByLabelText('Feed URL');
      const submitButton = screen.getByRole('button', { name: /add source/i });

      // Enter values with extra whitespace
      await user.type(nameInput, '  Tech Blog  ');
      await user.type(urlInput, '  https://example.com/feed.xml  ');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Tech Blog',
          feedURL: 'https://example.com/feed.xml',
        });
      });
    });

    it('should submit form with valid data in edit mode', async () => {
      const user = userEvent.setup();
      const initialData: SourceFormData = {
        name: 'Old Name',
        feedURL: 'https://old-url.com/feed',
      };

      render(
        <SourceForm
          mode="edit"
          initialData={initialData}
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Source name');
      const submitButton = screen.getByRole('button', { name: /save changes/i });

      // Update name
      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'New Name',
          feedURL: 'https://old-url.com/feed',
        });
      });
    });

    it('should form be disabled during loading (isLoading=true)', () => {
      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={true}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Source name');
      const urlInput = screen.getByLabelText('Feed URL');
      const submitButton = screen.getByRole('button', { name: /add source/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      expect(nameInput).toBeDisabled();
      expect(urlInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('should not submit when validation fails', async () => {
      const user = userEvent.setup();
      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Source name');
      const submitButton = screen.getByRole('button', { name: /add source/i });

      // Enter valid name but invalid URL (empty)
      await user.type(nameInput, 'Valid Name');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/feed url is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Error Display Tests', () => {
    it('should display API error alert when error prop is set', () => {
      const error = new Error('Failed to save source');

      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={error}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Failed to save source')).toBeInTheDocument();
    });

    it('should error alert have role="alert" for accessibility', () => {
      const error = new Error('Network error');

      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={error}
          onCancel={mockOnCancel}
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('Network error');
    });

    it('should not display error alert when error prop is null', () => {
      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      // ErrorAlert doesn't render when error is null, so no alert should exist
      // before any form interaction
      const alerts = screen.queryAllByRole('alert');
      expect(alerts).toHaveLength(0);
    });
  });

  describe('Cancel Button Tests', () => {
    it('should call onCancel when Cancel clicked', async () => {
      const user = userEvent.setup();
      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should cancel button be disabled during loading', () => {
      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={true}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });

    it('should cancel button not trigger form submission', async () => {
      const user = userEvent.setup();
      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Source name');
      const urlInput = screen.getByLabelText('Feed URL');
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      // Enter valid data
      await user.type(nameInput, 'Test Source');
      await user.type(urlInput, 'https://example.com/feed');
      await user.click(cancelButton);

      // onSubmit should not be called
      expect(mockOnSubmit).not.toHaveBeenCalled();
      // onCancel should be called
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper ARIA attributes for inputs', () => {
      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Source name');
      const urlInput = screen.getByLabelText('Feed URL');

      expect(nameInput).toHaveAttribute('aria-required', 'true');
      expect(nameInput).toHaveAttribute('aria-invalid', 'false');
      expect(urlInput).toHaveAttribute('aria-required', 'true');
      expect(urlInput).toHaveAttribute('aria-invalid', 'false');
    });

    it('should mark invalid inputs with aria-invalid when errors exist', async () => {
      const user = userEvent.setup();
      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Source name');

      // Trigger validation error
      await user.click(nameInput);
      await user.tab();

      await waitFor(() => {
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should have aria-describedby for error messages', async () => {
      const user = userEvent.setup();
      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const urlInput = screen.getByLabelText('Feed URL');

      // Trigger validation error
      await user.click(urlInput);
      await user.tab();

      await waitFor(() => {
        expect(urlInput).toHaveAttribute('aria-describedby', 'source-feedURL-error');
      });
    });

    it('should have proper labels for screen readers', () => {
      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText('Source name')).toBeInTheDocument();
      expect(screen.getByLabelText('Feed URL')).toBeInTheDocument();
      expect(screen.getByLabelText('Cancel editing')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid form submissions', async () => {
      const user = userEvent.setup();
      const slowOnSubmit = vi
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      const { rerender } = render(
        <SourceForm
          mode="create"
          onSubmit={slowOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Source name');
      const urlInput = screen.getByLabelText('Feed URL');
      const submitButton = screen.getByRole('button', { name: /add source/i });

      // Enter valid data
      await user.type(nameInput, 'Test Source');
      await user.type(urlInput, 'https://example.com/feed');

      // First click
      await user.click(submitButton);

      // Simulate loading state from parent
      rerender(
        <SourceForm
          mode="create"
          onSubmit={slowOnSubmit}
          isLoading={true}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      // Try to click again (should be disabled)
      const disabledButton = screen.getByRole('button', { name: /add source/i });
      expect(disabledButton).toBeDisabled();

      // Should only be called once
      expect(slowOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('should handle whitespace-only input as empty', async () => {
      const user = userEvent.setup();
      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Source name');
      const submitButton = screen.getByRole('button', { name: /add source/i });

      // Enter whitespace-only value
      await user.type(nameInput, '   ');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should handle form with max length input', async () => {
      const user = userEvent.setup();
      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Source name');
      const urlInput = screen.getByLabelText('Feed URL');

      // Name should have maxLength attribute
      expect(nameInput).toHaveAttribute('maxlength', '255');
      // URL should have maxLength attribute
      expect(urlInput).toHaveAttribute('maxlength', '2048');
    });

    it('should handle protocol validation for URL', async () => {
      const user = userEvent.setup();
      render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const urlInput = screen.getByLabelText('Feed URL');

      // Test ftp:// protocol (should fail)
      await user.type(urlInput, 'ftp://example.com/feed');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument();
      });

      // Clear and test valid https://
      await user.clear(urlInput);
      await user.type(urlInput, 'https://example.com/feed');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid url/i)).not.toBeInTheDocument();
      });
    });

    it('should preserve form data when error occurs', async () => {
      const user = userEvent.setup();
      const error = new Error('Save failed');

      const { rerender } = render(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={null}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Source name');
      const urlInput = screen.getByLabelText('Feed URL');

      // Enter data
      await user.type(nameInput, 'Test Source');
      await user.type(urlInput, 'https://example.com/feed');

      // Simulate error from parent
      rerender(
        <SourceForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={false}
          error={error}
          onCancel={mockOnCancel}
        />
      );

      // Form data should be preserved
      expect(nameInput).toHaveValue('Test Source');
      expect(urlInput).toHaveValue('https://example.com/feed');
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });
});
