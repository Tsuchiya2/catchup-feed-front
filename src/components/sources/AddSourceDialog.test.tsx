/**
 * AddSourceDialog Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddSourceDialog } from './AddSourceDialog';
import * as useCreateSourceModule from '@/hooks/useCreateSource';

// Mock the useCreateSource hook
vi.mock('@/hooks/useCreateSource', () => ({
  useCreateSource: vi.fn(),
}));

describe('AddSourceDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  const mockMutateAsync = vi.fn();
  const mockReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useCreateSourceModule.useCreateSource).mockReturnValue({
      createSource: vi.fn(),
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
      reset: mockReset,
      isSuccess: false,
    });
  });

  describe('Rendering', () => {
    it('renders dialog when isOpen is true', () => {
      render(<AddSourceDialog {...defaultProps} isOpen={true} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render dialog when isOpen is false', () => {
      render(<AddSourceDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders dialog title', () => {
      render(<AddSourceDialog {...defaultProps} />);

      expect(screen.getByText('Add New Source')).toBeInTheDocument();
    });

    it('renders dialog description', () => {
      render(<AddSourceDialog {...defaultProps} />);

      expect(screen.getByText('Add a new RSS or Atom feed source to track.')).toBeInTheDocument();
    });

    it('renders the SourceForm', () => {
      render(<AddSourceDialog {...defaultProps} />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/feed url/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add source/i })).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls mutateAsync with form data on submit', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValueOnce(undefined);

      render(<AddSourceDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/name/i), 'Tech Blog');
      await user.type(screen.getByLabelText(/feed url/i), 'https://example.com/feed.xml');
      await user.click(screen.getByRole('button', { name: /add source/i }));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          name: 'Tech Blog',
          feedURL: 'https://example.com/feed.xml',
        });
      });
    });

    it('calls reset after successful submission', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValueOnce(undefined);

      render(<AddSourceDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/name/i), 'Tech Blog');
      await user.type(screen.getByLabelText(/feed url/i), 'https://example.com/feed.xml');
      await user.click(screen.getByRole('button', { name: /add source/i }));

      await waitFor(() => {
        expect(mockReset).toHaveBeenCalled();
      });
    });

    it('calls onSuccess after successful submission', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      mockMutateAsync.mockResolvedValueOnce(undefined);

      render(<AddSourceDialog {...defaultProps} onSuccess={onSuccess} />);

      await user.type(screen.getByLabelText(/name/i), 'Tech Blog');
      await user.type(screen.getByLabelText(/feed url/i), 'https://example.com/feed.xml');
      await user.click(screen.getByRole('button', { name: /add source/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onClose after successful submission', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      mockMutateAsync.mockResolvedValueOnce(undefined);

      render(<AddSourceDialog {...defaultProps} onClose={onClose} />);

      await user.type(screen.getByLabelText(/name/i), 'Tech Blog');
      await user.type(screen.getByLabelText(/feed url/i), 'https://example.com/feed.xml');
      await user.click(screen.getByRole('button', { name: /add source/i }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('works without onSuccess callback', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValueOnce(undefined);

      render(<AddSourceDialog isOpen={true} onClose={vi.fn()} />);

      await user.type(screen.getByLabelText(/name/i), 'Tech Blog');
      await user.type(screen.getByLabelText(/feed url/i), 'https://example.com/feed.xml');

      // Should not throw when onSuccess is not provided
      await expect(
        user.click(screen.getByRole('button', { name: /add source/i }))
      ).resolves.not.toThrow();
    });
  });

  describe('Cancel Behavior', () => {
    it('calls reset when cancel is clicked', async () => {
      const user = userEvent.setup();

      render(<AddSourceDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancel is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<AddSourceDialog {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dialog Close', () => {
    it('calls reset when dialog is closed via escape key', async () => {
      const user = userEvent.setup();

      render(<AddSourceDialog {...defaultProps} />);

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(mockReset).toHaveBeenCalled();
      });
    });

    it('calls onClose when dialog is closed via escape key', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<AddSourceDialog {...defaultProps} onClose={onClose} />);

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('Loading State', () => {
    it('passes isPending to form as isLoading', () => {
      vi.mocked(useCreateSourceModule.useCreateSource).mockReturnValue({
        createSource: vi.fn(),
        mutateAsync: mockMutateAsync,
        isPending: true,
        error: null,
        reset: mockReset,
        isSuccess: false,
      });

      render(<AddSourceDialog {...defaultProps} />);

      // Check that submit button is disabled and shows loading state
      const submitButton = screen.getByRole('button', { name: /add source/i });
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Adding...');
    });
  });

  describe('Error Handling', () => {
    it('passes error to form', () => {
      const error = new Error('Failed to create source');
      vi.mocked(useCreateSourceModule.useCreateSource).mockReturnValue({
        createSource: vi.fn(),
        mutateAsync: mockMutateAsync,
        isPending: false,
        error,
        reset: mockReset,
        isSuccess: false,
      });

      render(<AddSourceDialog {...defaultProps} />);

      expect(screen.getByText('Failed to create source')).toBeInTheDocument();
    });

    it('does not close dialog when submission fails', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      mockMutateAsync.mockRejectedValueOnce(new Error('API Error'));

      render(<AddSourceDialog {...defaultProps} onClose={onClose} />);

      await user.type(screen.getByLabelText(/name/i), 'Tech Blog');
      await user.type(screen.getByLabelText(/feed url/i), 'https://example.com/feed.xml');
      await user.click(screen.getByRole('button', { name: /add source/i }));

      // Wait and verify onClose was not called when submission fails
      await waitFor(() => {
        expect(onClose).not.toHaveBeenCalled();
      });
    });
  });
});
