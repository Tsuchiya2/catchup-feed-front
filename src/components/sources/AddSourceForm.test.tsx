/**
 * AddSourceForm Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddSourceForm } from './AddSourceForm';

describe('AddSourceForm', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isLoading: false,
    error: null,
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all form fields', () => {
      render(<AddSourceForm {...defaultProps} />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/feed url/i)).toBeInTheDocument();
      expect(screen.getByText(/source type/i)).toBeInTheDocument();
    });

    it('renders submit and cancel buttons', () => {
      render(<AddSourceForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /add source/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('shows required indicators for name and feedURL fields', () => {
      render(<AddSourceForm {...defaultProps} />);

      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators).toHaveLength(2);
    });

    it('has correct placeholder text', () => {
      render(<AddSourceForm {...defaultProps} />);

      expect(screen.getByPlaceholderText('e.g., Tech Blog')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('https://example.com/feed.xml')).toBeInTheDocument();
    });
  });

  describe('Form Input', () => {
    it('updates name field on input', async () => {
      const user = userEvent.setup();
      render(<AddSourceForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Tech Blog');

      expect(nameInput).toHaveValue('Tech Blog');
    });

    it('updates feedURL field on input', async () => {
      const user = userEvent.setup();
      render(<AddSourceForm {...defaultProps} />);

      const urlInput = screen.getByLabelText(/feed url/i);
      await user.type(urlInput, 'https://example.com/feed.xml');

      expect(urlInput).toHaveValue('https://example.com/feed.xml');
    });

    // Note: Radix UI Select does not work correctly in jsdom environment
    // This test is skipped due to hasPointerCapture not being supported
    it.skip('allows selecting source type', async () => {
      const user = userEvent.setup();
      render(<AddSourceForm {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const atomOption = screen.getByRole('option', { name: 'Atom' });
      await user.click(atomOption);

      expect(trigger).toHaveTextContent('Atom');
    });
  });

  describe('Validation', () => {
    it('shows error when name is empty on blur', async () => {
      const user = userEvent.setup();
      render(<AddSourceForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.click(nameInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
    });

    it('shows error when feedURL is empty on blur', async () => {
      const user = userEvent.setup();
      render(<AddSourceForm {...defaultProps} />);

      const urlInput = screen.getByLabelText(/feed url/i);
      await user.click(urlInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Feed URL is required')).toBeInTheDocument();
      });
    });

    it('shows error for invalid URL format', async () => {
      const user = userEvent.setup();
      render(<AddSourceForm {...defaultProps} />);

      const urlInput = screen.getByLabelText(/feed url/i);
      await user.type(urlInput, 'not-a-valid-url');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText('Please enter a valid URL (e.g., https://example.com/feed.xml)')
        ).toBeInTheDocument();
      });
    });

    it('clears error when valid input is provided', async () => {
      const user = userEvent.setup();
      render(<AddSourceForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.click(nameInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });

      await user.type(nameInput, 'Valid Name');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
      });
    });

    it('validates all fields on submit', async () => {
      const user = userEvent.setup();
      render(<AddSourceForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /add source/i }));

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
        expect(screen.getByText('Feed URL is required')).toBeInTheDocument();
      });
    });

    it('does not submit when validation fails', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<AddSourceForm {...defaultProps} onSubmit={onSubmit} />);

      await user.click(screen.getByRole('button', { name: /add source/i }));

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with trimmed data when form is valid', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<AddSourceForm {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/name/i), '  Tech Blog  ');
      await user.type(screen.getByLabelText(/feed url/i), '  https://example.com/feed.xml  ');
      await user.click(screen.getByRole('button', { name: /add source/i }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          name: 'Tech Blog',
          feedURL: 'https://example.com/feed.xml',
        });
      });
    });

    it('prevents default form submission', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<AddSourceForm {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/name/i), 'Tech Blog');
      await user.type(screen.getByLabelText(/feed url/i), 'https://example.com/feed.xml');

      const form = screen.getByRole('button', { name: /add source/i }).closest('form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      vi.spyOn(submitEvent, 'preventDefault');

      form?.dispatchEvent(submitEvent);

      expect(submitEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('disables all inputs when loading', () => {
      render(<AddSourceForm {...defaultProps} isLoading={true} />);

      expect(screen.getByLabelText(/name/i)).toBeDisabled();
      expect(screen.getByLabelText(/feed url/i)).toBeDisabled();
      expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('disables buttons when loading', () => {
      render(<AddSourceForm {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('button', { name: /adding/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });

    it('shows loading indicator on submit button', () => {
      render(<AddSourceForm {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Adding...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays API error when provided', () => {
      const error = new Error('Failed to create source');
      render(<AddSourceForm {...defaultProps} error={error} />);

      expect(screen.getByText('Failed to create source')).toBeInTheDocument();
    });

    it('does not display error when null', () => {
      render(<AddSourceForm {...defaultProps} error={null} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Cancel Button', () => {
    it('calls onCancel when clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(<AddSourceForm {...defaultProps} onCancel={onCancel} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('does not submit form when cancel is clicked', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<AddSourceForm {...defaultProps} onSubmit={onSubmit} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has aria-required on required fields', () => {
      render(<AddSourceForm {...defaultProps} />);

      expect(screen.getByLabelText(/name/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/feed url/i)).toHaveAttribute('aria-required', 'true');
    });

    it('sets aria-invalid when field has error', async () => {
      const user = userEvent.setup();
      render(<AddSourceForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.click(nameInput);
      await user.tab();

      await waitFor(() => {
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('has maxLength attribute on input fields', () => {
      render(<AddSourceForm {...defaultProps} />);

      expect(screen.getByLabelText(/name/i)).toHaveAttribute('maxLength', '255');
      expect(screen.getByLabelText(/feed url/i)).toHaveAttribute('maxLength', '2048');
    });
  });
});
