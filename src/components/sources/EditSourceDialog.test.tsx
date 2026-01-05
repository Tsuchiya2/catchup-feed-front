/**
 * EditSourceDialog Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditSourceDialog } from './EditSourceDialog';
import * as useUpdateSourceModule from '@/hooks/useUpdateSource';
import type { Source } from '@/types/api';

// Mock the useUpdateSource hook
vi.mock('@/hooks/useUpdateSource', () => ({
  useUpdateSource: vi.fn(),
}));

describe('EditSourceDialog', () => {
  const mockSource: Source = {
    id: 1,
    name: 'Tech Blog',
    feed_url: 'https://example.com/feed.xml',
    active: true,
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    source: mockSource,
    onSuccess: vi.fn(),
  };

  const mockMutateAsync = vi.fn();
  const mockReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useUpdateSourceModule.useUpdateSource).mockReturnValue({
      updateSource: vi.fn(),
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
      reset: mockReset,
      isSuccess: false,
    });
  });

  describe('Rendering', () => {
    it('renders dialog when isOpen is true', () => {
      render(<EditSourceDialog {...defaultProps} isOpen={true} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render dialog when isOpen is false', () => {
      render(<EditSourceDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders dialog title "Edit Source"', () => {
      render(<EditSourceDialog {...defaultProps} />);

      expect(screen.getByText('Edit Source')).toBeInTheDocument();
    });

    it('renders dialog description', () => {
      render(<EditSourceDialog {...defaultProps} />);

      expect(screen.getByText('Edit the source details below.')).toBeInTheDocument();
    });

    it('renders the SourceForm with pre-populated values', () => {
      render(<EditSourceDialog {...defaultProps} />);

      // Check that form fields exist
      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      const urlInput = screen.getByLabelText(/feed url/i) as HTMLInputElement;

      expect(nameInput).toBeInTheDocument();
      expect(urlInput).toBeInTheDocument();

      // Check that values are pre-populated from source prop
      expect(nameInput.value).toBe('Tech Blog');
      expect(urlInput.value).toBe('https://example.com/feed.xml');
    });

    it('renders save and cancel buttons', () => {
      render(<EditSourceDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('Form Submission - Success Flow', () => {
    it('submits form with changed name when Save is clicked', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValueOnce(undefined);

      render(<EditSourceDialog {...defaultProps} />);

      const nameInput = screen.getByLabelText(/name/i);

      // Clear existing value and type new name
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Tech Blog');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: 1,
          data: {
            name: 'Updated Tech Blog',
            feedURL: 'https://example.com/feed.xml',
            active: true,
          },
        });
      });
    });

    it('submits form with changed URL when Save is clicked', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValueOnce(undefined);

      render(<EditSourceDialog {...defaultProps} />);

      const urlInput = screen.getByLabelText(/feed url/i);

      // Clear existing value and type new URL
      await user.clear(urlInput);
      await user.type(urlInput, 'https://newsite.com/feed.xml');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: 1,
          data: {
            name: 'Tech Blog',
            feedURL: 'https://newsite.com/feed.xml',
            active: true,
          },
        });
      });
    });

    it('submits form with both name and URL changed', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValueOnce(undefined);

      render(<EditSourceDialog {...defaultProps} />);

      const nameInput = screen.getByLabelText(/name/i);
      const urlInput = screen.getByLabelText(/feed url/i);

      // Change both values
      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');
      await user.clear(urlInput);
      await user.type(urlInput, 'https://newurl.com/feed.xml');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: 1,
          data: {
            name: 'New Name',
            feedURL: 'https://newurl.com/feed.xml',
            active: true,
          },
        });
      });
    });

    it('calls reset after successful submission', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValueOnce(undefined);

      render(<EditSourceDialog {...defaultProps} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockReset).toHaveBeenCalled();
      });
    });

    it('calls onSuccess after successful submission', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      mockMutateAsync.mockResolvedValueOnce(undefined);

      render(<EditSourceDialog {...defaultProps} onSuccess={onSuccess} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onClose after successful submission', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      mockMutateAsync.mockResolvedValueOnce(undefined);

      render(<EditSourceDialog {...defaultProps} onClose={onClose} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('works without onSuccess callback', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValueOnce(undefined);

      render(<EditSourceDialog isOpen={true} onClose={vi.fn()} source={mockSource} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      // Should not throw when onSuccess is not provided
      await expect(
        user.click(screen.getByRole('button', { name: /save changes/i }))
      ).resolves.not.toThrow();
    });
  });

  describe('Validation Error Tests', () => {
    it('displays error message when name is cleared and blur is triggered', async () => {
      const user = userEvent.setup();

      render(<EditSourceDialog {...defaultProps} />);

      const nameInput = screen.getByLabelText(/name/i);

      // Clear the name field
      await user.clear(nameInput);

      // Trigger blur
      await user.tab();

      // Check that error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it('displays error message when URL is cleared and blur is triggered', async () => {
      const user = userEvent.setup();

      render(<EditSourceDialog {...defaultProps} />);

      const urlInput = screen.getByLabelText(/feed url/i);

      // Clear the URL field
      await user.clear(urlInput);

      // Trigger blur
      await user.tab();

      // Check that error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/feed url is required/i)).toBeInTheDocument();
      });
    });

    it('does not close dialog when validation errors exist', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<EditSourceDialog {...defaultProps} onClose={onClose} />);

      const nameInput = screen.getByLabelText(/name/i);

      // Clear the name to trigger validation error
      await user.clear(nameInput);

      // Try to submit
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      // Dialog should remain open - onClose should not be called
      await waitFor(() => {
        expect(onClose).not.toHaveBeenCalled();
      });

      // Error should be visible
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

    it('does not call API when validation errors exist', async () => {
      const user = userEvent.setup();

      render(<EditSourceDialog {...defaultProps} />);

      const nameInput = screen.getByLabelText(/name/i);

      // Clear the name to trigger validation error
      await user.clear(nameInput);

      // Try to submit
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      // API should not be called
      await waitFor(() => {
        expect(mockMutateAsync).not.toHaveBeenCalled();
      });
    });

    it('prevents submission when both fields have validation errors', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<EditSourceDialog {...defaultProps} onClose={onClose} />);

      const nameInput = screen.getByLabelText(/name/i);
      const urlInput = screen.getByLabelText(/feed url/i);

      // Clear both fields
      await user.clear(nameInput);
      await user.clear(urlInput);

      // Try to submit
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      // Should show both errors
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/feed url is required/i)).toBeInTheDocument();
      });

      // Dialog should remain open
      expect(onClose).not.toHaveBeenCalled();

      // API should not be called
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('API Error Tests', () => {
    it('displays error message when API returns 500 error', async () => {
      const user = userEvent.setup();
      const apiError = new Error('Internal Server Error');

      vi.mocked(useUpdateSourceModule.useUpdateSource).mockReturnValue({
        updateSource: vi.fn(),
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: apiError,
        reset: mockReset,
        isSuccess: false,
      });

      render(<EditSourceDialog {...defaultProps} />);

      expect(screen.getByText('Internal Server Error')).toBeInTheDocument();
    });

    it('does not close dialog when API call fails', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      mockMutateAsync.mockRejectedValueOnce(new Error('Network error'));

      render(<EditSourceDialog {...defaultProps} onClose={onClose} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      // Wait and verify onClose was not called when submission fails
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });

      // Give some time to ensure onClose is not called
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(onClose).not.toHaveBeenCalled();
    });

    it('does not call onSuccess when API call fails', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      mockMutateAsync.mockRejectedValueOnce(new Error('API Error'));

      render(<EditSourceDialog {...defaultProps} onSuccess={onSuccess} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });

      // Give some time to ensure onSuccess is not called
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('displays error in dialog after failed submission', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockRejectedValueOnce(new Error('API Error'));

      render(<EditSourceDialog {...defaultProps} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });

      // Re-render with error state
      vi.mocked(useUpdateSourceModule.useUpdateSource).mockReturnValue({
        updateSource: vi.fn(),
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: new Error('API Error'),
        reset: mockReset,
        isSuccess: false,
      });

      const { rerender } = render(<EditSourceDialog {...defaultProps} />);
      rerender(<EditSourceDialog {...defaultProps} />);

      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  describe('Cancel Behavior', () => {
    it('calls reset when cancel is clicked', async () => {
      const user = userEvent.setup();

      render(<EditSourceDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancel is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<EditSourceDialog {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call API when cancel is clicked', async () => {
      const user = userEvent.setup();

      render(<EditSourceDialog {...defaultProps} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      // Click cancel instead of save
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // API should not be called
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('does not call onSuccess when cancel is clicked', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();

      render(<EditSourceDialog {...defaultProps} onSuccess={onSuccess} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Dialog Close', () => {
    it('calls reset when dialog is closed via escape key', async () => {
      const user = userEvent.setup();

      render(<EditSourceDialog {...defaultProps} />);

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(mockReset).toHaveBeenCalled();
      });
    });

    it('calls onClose when dialog is closed via escape key', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<EditSourceDialog {...defaultProps} onClose={onClose} />);

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('does not call API when dialog is closed via escape key', async () => {
      const user = userEvent.setup();

      render(<EditSourceDialog {...defaultProps} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      // Close via escape key
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(mockReset).toHaveBeenCalled();
      });

      // API should not be called
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('passes isPending to form as isLoading', () => {
      vi.mocked(useUpdateSourceModule.useUpdateSource).mockReturnValue({
        updateSource: vi.fn(),
        mutateAsync: mockMutateAsync,
        isPending: true,
        error: null,
        reset: mockReset,
        isSuccess: false,
      });

      render(<EditSourceDialog {...defaultProps} />);

      // Check that submit button is disabled and shows loading state
      const submitButton = screen.getByRole('button', { name: /save changes/i });
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Saving...');
    });

    it('disables all inputs when isPending is true', () => {
      vi.mocked(useUpdateSourceModule.useUpdateSource).mockReturnValue({
        updateSource: vi.fn(),
        mutateAsync: mockMutateAsync,
        isPending: true,
        error: null,
        reset: mockReset,
        isSuccess: false,
      });

      render(<EditSourceDialog {...defaultProps} />);

      const nameInput = screen.getByLabelText(/name/i);
      const urlInput = screen.getByLabelText(/feed url/i);
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      expect(nameInput).toBeDisabled();
      expect(urlInput).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Source Prop Variations', () => {
    it('handles source with different active status', () => {
      const inactiveSource: Source = {
        ...mockSource,
        active: false,
      };

      render(<EditSourceDialog {...defaultProps} source={inactiveSource} />);

      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('Tech Blog');
    });

    it('handles source with special characters in name', () => {
      const specialSource: Source = {
        ...mockSource,
        name: "Tech & Dev's Blog",
      };

      render(<EditSourceDialog {...defaultProps} source={specialSource} />);

      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      expect(nameInput.value).toBe("Tech & Dev's Blog");
    });

    it('handles source with long URL', () => {
      const longUrlSource: Source = {
        ...mockSource,
        feed_url: 'https://example.com/very/long/path/to/feed.xml?param1=value1&param2=value2',
      };

      render(<EditSourceDialog {...defaultProps} source={longUrlSource} />);

      const urlInput = screen.getByLabelText(/feed url/i) as HTMLInputElement;
      expect(urlInput.value).toBe(
        'https://example.com/very/long/path/to/feed.xml?param1=value1&param2=value2'
      );
    });
  });
});
