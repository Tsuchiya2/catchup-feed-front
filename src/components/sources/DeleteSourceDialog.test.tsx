/**
 * DeleteSourceDialog Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteSourceDialog } from './DeleteSourceDialog';
import * as useDeleteSourceModule from '@/hooks/useDeleteSource';
import type { Source } from '@/types/api';

// Mock the useDeleteSource hook
vi.mock('@/hooks/useDeleteSource', () => ({
  useDeleteSource: vi.fn(),
}));

// Mock observability dependencies
vi.mock('@/lib/observability/metrics', () => ({
  metrics: {
    source: {
      delete: {
        attempt: vi.fn(),
        success: vi.fn(),
        failure: vi.fn(),
        cacheRollback: vi.fn(),
        dialog: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/observability/tracing', () => ({
  startSpan: vi.fn((_name, _op, callback) => callback()),
  addBreadcrumb: vi.fn(),
  addContext: vi.fn(),
}));

describe('DeleteSourceDialog', () => {
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

    vi.mocked(useDeleteSourceModule.useDeleteSource).mockReturnValue({
      deleteSource: vi.fn(),
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
      reset: mockReset,
      isSuccess: false,
    });
  });

  describe('Rendering', () => {
    it('renders dialog when isOpen is true', () => {
      render(<DeleteSourceDialog {...defaultProps} isOpen={true} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<DeleteSourceDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('displays source name in confirmation message', () => {
      render(<DeleteSourceDialog {...defaultProps} />);

      expect(screen.getByText(/Tech Blog/)).toBeInTheDocument();
      expect(
        screen.getByText(
          /Are you sure you want to delete 'Tech Blog'\? This action cannot be undone\./
        )
      ).toBeInTheDocument();
    });

    it('renders dialog title "Delete Source"', () => {
      render(<DeleteSourceDialog {...defaultProps} />);

      expect(screen.getByText('Delete Source')).toBeInTheDocument();
    });

    it('renders Cancel and Delete buttons', () => {
      render(<DeleteSourceDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });
  });

  describe('Cancel Behavior', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<DeleteSourceDialog {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls reset when Cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(<DeleteSourceDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it('does not call mutateAsync when Cancel is clicked', async () => {
      const user = userEvent.setup();

      render(<DeleteSourceDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('does not call onSuccess when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();

      render(<DeleteSourceDialog {...defaultProps} onSuccess={onSuccess} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Delete Behavior', () => {
    it('calls mutateAsync when Delete button is clicked', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValueOnce(undefined);

      render(<DeleteSourceDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({ id: 1 });
        expect(mockMutateAsync).toHaveBeenCalledTimes(1);
      });
    });

    it('calls reset after successful deletion', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValueOnce(undefined);

      render(<DeleteSourceDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(mockReset).toHaveBeenCalled();
      });
    });

    it('calls onSuccess and onClose on successful deletion', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      const onClose = vi.fn();
      mockMutateAsync.mockResolvedValueOnce(undefined);

      render(<DeleteSourceDialog {...defaultProps} onSuccess={onSuccess} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('works without onSuccess callback', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValueOnce(undefined);

      render(<DeleteSourceDialog isOpen={true} onClose={vi.fn()} source={mockSource} />);

      // Should not throw when onSuccess is not provided
      await expect(
        user.click(screen.getByRole('button', { name: /delete/i }))
      ).resolves.not.toThrow();
    });

    it('calls mutateAsync with correct source ID', async () => {
      const user = userEvent.setup();
      const customSource: Source = {
        id: 42,
        name: 'Custom Blog',
        feed_url: 'https://custom.com/feed.xml',
        active: false,
      };
      mockMutateAsync.mockResolvedValueOnce(undefined);

      render(<DeleteSourceDialog {...defaultProps} source={customSource} />);

      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({ id: 42 });
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when mutation fails', async () => {
      const apiError = new Error('Failed to delete source');

      vi.mocked(useDeleteSourceModule.useDeleteSource).mockReturnValue({
        deleteSource: vi.fn(),
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: apiError,
        reset: mockReset,
        isSuccess: false,
      });

      render(<DeleteSourceDialog {...defaultProps} />);

      expect(screen.getByText('Failed to delete source')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('does not close dialog when API call fails', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      mockMutateAsync.mockRejectedValueOnce(new Error('Network error'));

      render(<DeleteSourceDialog {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /delete/i }));

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

      render(<DeleteSourceDialog {...defaultProps} onSuccess={onSuccess} />);

      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });

      // Give some time to ensure onSuccess is not called
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('displays default error message when error has no message', async () => {
      const apiError = new Error('');

      vi.mocked(useDeleteSourceModule.useDeleteSource).mockReturnValue({
        deleteSource: vi.fn(),
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: apiError,
        reset: mockReset,
        isSuccess: false,
      });

      render(<DeleteSourceDialog {...defaultProps} />);

      expect(screen.getByText('Failed to delete source. Please try again.')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('disables Delete button while isPending is true', () => {
      vi.mocked(useDeleteSourceModule.useDeleteSource).mockReturnValue({
        deleteSource: vi.fn(),
        mutateAsync: mockMutateAsync,
        isPending: true,
        error: null,
        reset: mockReset,
        isSuccess: false,
      });

      render(<DeleteSourceDialog {...defaultProps} />);

      const deleteButton = screen.getByTestId('source-delete-confirm-button');
      expect(deleteButton).toBeDisabled();
    });

    it('disables Cancel button while isPending is true', () => {
      vi.mocked(useDeleteSourceModule.useDeleteSource).mockReturnValue({
        deleteSource: vi.fn(),
        mutateAsync: mockMutateAsync,
        isPending: true,
        error: null,
        reset: mockReset,
        isSuccess: false,
      });

      render(<DeleteSourceDialog {...defaultProps} />);

      const cancelButton = screen.getByTestId('source-delete-cancel-button');
      expect(cancelButton).toBeDisabled();
    });

    it('shows "Deleting..." text when isPending is true', () => {
      vi.mocked(useDeleteSourceModule.useDeleteSource).mockReturnValue({
        deleteSource: vi.fn(),
        mutateAsync: mockMutateAsync,
        isPending: true,
        error: null,
        reset: mockReset,
        isSuccess: false,
      });

      render(<DeleteSourceDialog {...defaultProps} />);

      const deleteButton = screen.getByTestId('source-delete-confirm-button');
      expect(deleteButton).toHaveTextContent('Deleting...');
    });

    it('shows "Delete" text when isPending is false', () => {
      render(<DeleteSourceDialog {...defaultProps} />);

      const deleteButton = screen.getByTestId('source-delete-confirm-button');
      expect(deleteButton).toHaveTextContent('Delete');
    });
  });

  describe('Dialog Close via Escape Key', () => {
    it('calls reset when dialog is closed via escape key', async () => {
      const user = userEvent.setup();

      render(<DeleteSourceDialog {...defaultProps} />);

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(mockReset).toHaveBeenCalled();
      });
    });

    it('calls onClose when dialog is closed via escape key', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<DeleteSourceDialog {...defaultProps} onClose={onClose} />);

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('does not call mutateAsync when dialog is closed via escape key', async () => {
      const user = userEvent.setup();

      render(<DeleteSourceDialog {...defaultProps} />);

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(mockReset).toHaveBeenCalled();
      });

      // API should not be called
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA labels', () => {
      render(<DeleteSourceDialog {...defaultProps} />);

      // Delete button should have descriptive aria-label
      const deleteButton = screen.getByRole('button', { name: /confirm delete tech blog/i });
      expect(deleteButton).toBeInTheDocument();

      // Cancel button should have aria-label
      const cancelButton = screen.getByRole('button', { name: /cancel deletion/i });
      expect(cancelButton).toBeInTheDocument();
    });

    it('error message has role alert', () => {
      const apiError = new Error('Test error');

      vi.mocked(useDeleteSourceModule.useDeleteSource).mockReturnValue({
        deleteSource: vi.fn(),
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: apiError,
        reset: mockReset,
        isSuccess: false,
      });

      render(<DeleteSourceDialog {...defaultProps} />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('Test error');
    });

    it('dialog has proper heading structure', () => {
      render(<DeleteSourceDialog {...defaultProps} />);

      // Dialog should have accessible name via DialogTitle
      expect(screen.getByText('Delete Source')).toBeInTheDocument();
    });
  });

  describe('Source Variations', () => {
    it('handles source with special characters in name', () => {
      const specialSource: Source = {
        ...mockSource,
        name: "Tech & Dev's Blog",
      };

      render(<DeleteSourceDialog {...defaultProps} source={specialSource} />);

      expect(screen.getByText(/Tech & Dev's Blog/)).toBeInTheDocument();
    });

    it('handles source with unicode characters in name', () => {
      const unicodeSource: Source = {
        ...mockSource,
        name: '日本語ソース 🎉',
      };

      render(<DeleteSourceDialog {...defaultProps} source={unicodeSource} />);

      expect(screen.getByText(/日本語ソース 🎉/)).toBeInTheDocument();
    });

    it('handles source with very long name', () => {
      const longNameSource: Source = {
        ...mockSource,
        name: 'A'.repeat(200),
      };

      render(<DeleteSourceDialog {...defaultProps} source={longNameSource} />);

      expect(screen.getByText(new RegExp('A'.repeat(200)))).toBeInTheDocument();
    });

    it('displays correct source name for different sources', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue(undefined);

      const source1: Source = {
        id: 1,
        name: 'First Blog',
        feed_url: 'https://first.com/feed.xml',
        active: true,
      };

      const { rerender } = render(<DeleteSourceDialog {...defaultProps} source={source1} />);

      expect(screen.getByText(/First Blog/)).toBeInTheDocument();

      const source2: Source = {
        id: 2,
        name: 'Second Blog',
        feed_url: 'https://second.com/feed.xml',
        active: false,
      };

      rerender(<DeleteSourceDialog {...defaultProps} source={source2} />);

      expect(screen.getByText(/Second Blog/)).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('complete deletion flow: click Delete → success → close', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      const onClose = vi.fn();
      mockMutateAsync.mockResolvedValueOnce(undefined);

      render(<DeleteSourceDialog {...defaultProps} onSuccess={onSuccess} onClose={onClose} />);

      // Initial state
      expect(screen.getByText(/Tech Blog/)).toBeInTheDocument();

      // Click delete
      await user.click(screen.getByRole('button', { name: /delete/i }));

      // Wait for mutation to complete
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({ id: 1 });
        expect(mockReset).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('error flow: click Delete → error → stay open', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      mockMutateAsync.mockRejectedValueOnce(new Error('API Error'));

      render(<DeleteSourceDialog {...defaultProps} onClose={onClose} />);

      // Click delete
      await user.click(screen.getByRole('button', { name: /delete/i }));

      // Wait for mutation to fail
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });

      // Give time for handlers to run
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Dialog should remain open
      expect(onClose).not.toHaveBeenCalled();
    });

    it('multiple delete attempts with reset between', async () => {
      const user = userEvent.setup();
      mockMutateAsync
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(undefined);

      const { rerender } = render(<DeleteSourceDialog {...defaultProps} />);

      // First attempt - fails
      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(1);
      });

      // Re-render with error state
      vi.mocked(useDeleteSourceModule.useDeleteSource).mockReturnValue({
        deleteSource: vi.fn(),
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: new Error('First attempt failed'),
        reset: mockReset,
        isSuccess: false,
      });

      rerender(<DeleteSourceDialog {...defaultProps} />);

      // Error should be visible
      expect(screen.getByText('First attempt failed')).toBeInTheDocument();

      // Reset state
      vi.mocked(useDeleteSourceModule.useDeleteSource).mockReturnValue({
        deleteSource: vi.fn(),
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null,
        reset: mockReset,
        isSuccess: false,
      });

      rerender(<DeleteSourceDialog {...defaultProps} />);

      // Second attempt - succeeds
      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(2);
      });
    });
  });
});
