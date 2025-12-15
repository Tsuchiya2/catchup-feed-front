import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render with search icon and input', () => {
      render(<SearchInput value="" onChange={vi.fn()} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      // Search icon is present (aria-hidden)
      expect(screen.getByRole('textbox').parentElement?.querySelector('svg')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(<SearchInput value="" onChange={vi.fn()} placeholder="Search articles..." />);

      expect(screen.getByPlaceholderText('Search articles...')).toBeInTheDocument();
    });

    it('should render with default placeholder', () => {
      render(<SearchInput value="" onChange={vi.fn()} />);

      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('should render with initial value', () => {
      render(<SearchInput value="test query" onChange={vi.fn()} />);

      expect(screen.getByRole('textbox')).toHaveValue('test query');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <SearchInput value="" onChange={vi.fn()} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Loading State', () => {
    it('should show spinner when loading', () => {
      render(<SearchInput value="" onChange={vi.fn()} isLoading={true} />);

      // Should have animate-spin class on the spinner
      const spinner = screen.getByRole('textbox').parentElement?.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should not show clear button when loading', () => {
      render(<SearchInput value="test" onChange={vi.fn()} isLoading={true} />);

      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
    });
  });

  describe('Clear Button', () => {
    it('should show clear button when value is not empty', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<SearchInput value="" onChange={vi.fn()} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should not show clear button when value is empty', () => {
      render(<SearchInput value="" onChange={vi.fn()} />);

      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
    });

    it('should clear input and call onChange when clear button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const onChange = vi.fn();
      render(<SearchInput value="test" onChange={onChange} />);

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(screen.getByRole('textbox')).toHaveValue('');
      expect(onChange).toHaveBeenCalledWith('');
    });
  });

  describe('Debouncing', () => {
    it('should debounce onChange with default delay (300ms)', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} />);

      const input = screen.getByRole('textbox');

      // Reset mock after typing to isolate the test
      await user.type(input, 'test');
      onChange.mockClear();

      // Advance timer by full debounce delay
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('test');
        expect(onChange).toHaveBeenCalledTimes(1);
      });
    });

    it('should debounce onChange with custom delay', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} debounceDelay={500} />);

      const input = screen.getByRole('textbox');

      // Reset mock after typing to isolate the test
      await user.type(input, 'test');
      onChange.mockClear();

      // Advance timer by full custom debounce delay
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('test');
        expect(onChange).toHaveBeenCalledTimes(1);
      });
    });

    it('should cancel previous timeout on rapid typing', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} debounceDelay={300} />);

      const input = screen.getByRole('textbox');

      // Type 'a'
      await user.type(input, 'a');
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Type 'b'
      await user.type(input, 'b');
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Type 'c'
      await user.type(input, 'c');
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Still not called
      expect(onChange).not.toHaveBeenCalled();

      // Wait full delay from last keystroke
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('abc');
        expect(onChange).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Disabled State', () => {
    it('should disable input when disabled prop is true', () => {
      render(<SearchInput value="" onChange={vi.fn()} disabled={true} />);

      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should not disable input by default', () => {
      render(<SearchInput value="" onChange={vi.fn()} />);

      expect(screen.getByRole('textbox')).not.toBeDisabled();
    });
  });

  describe('External Value Sync', () => {
    it('should sync with external value changes', () => {
      const { rerender } = render(<SearchInput value="initial" onChange={vi.fn()} />);

      expect(screen.getByRole('textbox')).toHaveValue('initial');

      rerender(<SearchInput value="updated" onChange={vi.fn()} />);

      expect(screen.getByRole('textbox')).toHaveValue('updated');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label from placeholder', () => {
      render(<SearchInput value="" onChange={vi.fn()} placeholder="Search articles..." />);

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Search articles...');
    });

    it('should have clear button with aria-label', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<SearchInput value="" onChange={vi.fn()} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
    });
  });
});
