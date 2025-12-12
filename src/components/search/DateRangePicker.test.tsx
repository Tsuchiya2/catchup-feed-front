import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateRangePicker } from './DateRangePicker';

describe('DateRangePicker', () => {
  // Mock the current date for consistent testing
  const mockToday = new Date('2025-01-15T12:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockToday);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Helper to change date input value (date inputs don't work well with userEvent.type)
  const changeDateInput = (label: string, value: string) => {
    const input = screen.getByLabelText(label);
    fireEvent.change(input, { target: { value } });
  };

  describe('Rendering', () => {
    it('should render From and To date inputs', () => {
      render(<DateRangePicker fromDate={null} toDate={null} onChange={vi.fn()} />);

      expect(screen.getByLabelText('From')).toBeInTheDocument();
      expect(screen.getByLabelText('To')).toBeInTheDocument();
    });

    it('should render quick range buttons', () => {
      render(<DateRangePicker fromDate={null} toDate={null} onChange={vi.fn()} />);

      expect(screen.getByRole('button', { name: 'Last 7 Days' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Last 30 Days' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'This Year' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Today' })).not.toBeInTheDocument();
    });

    it('should show Clear button when dates are set', () => {
      render(<DateRangePicker fromDate="2025-01-01" toDate="2025-01-15" onChange={vi.fn()} />);

      expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    });

    it('should not show Clear button when dates are null', () => {
      render(<DateRangePicker fromDate={null} toDate={null} onChange={vi.fn()} />);

      expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    });

    it('should render with initial dates', () => {
      render(<DateRangePicker fromDate="2025-01-01" toDate="2025-01-15" onChange={vi.fn()} />);

      expect(screen.getByLabelText('From')).toHaveValue('2025-01-01');
      expect(screen.getByLabelText('To')).toHaveValue('2025-01-15');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <DateRangePicker
          fromDate={null}
          toDate={null}
          onChange={vi.fn()}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Date Input Changes', () => {
    it('should call onChange when From date changes', () => {
      const onChange = vi.fn();
      render(<DateRangePicker fromDate={null} toDate={null} onChange={onChange} />);

      changeDateInput('From', '2025-01-01');

      expect(onChange).toHaveBeenCalledWith('2025-01-01', null);
    });

    it('should call onChange when To date changes', () => {
      const onChange = vi.fn();
      render(<DateRangePicker fromDate="2025-01-01" toDate={null} onChange={onChange} />);

      changeDateInput('To', '2025-01-15');

      expect(onChange).toHaveBeenCalledWith('2025-01-01', '2025-01-15');
    });

    it('should clear From date when input is cleared', () => {
      const onChange = vi.fn();
      render(<DateRangePicker fromDate="2025-01-01" toDate="2025-01-15" onChange={onChange} />);

      changeDateInput('From', '');

      expect(onChange).toHaveBeenCalledWith(null, '2025-01-15');
    });
  });

  describe('Quick Range Buttons', () => {
    it('should set Last 7 Days range', () => {
      const onChange = vi.fn();
      render(<DateRangePicker fromDate={null} toDate={null} onChange={onChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Last 7 Days' }));

      expect(onChange).toHaveBeenCalledWith('2025-01-08', '2025-01-15');
    });

    it('should set Last 30 Days range', () => {
      const onChange = vi.fn();
      render(<DateRangePicker fromDate={null} toDate={null} onChange={onChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Last 30 Days' }));

      expect(onChange).toHaveBeenCalledWith('2024-12-16', '2025-01-15');
    });

    it('should set This Year range', () => {
      const onChange = vi.fn();
      render(<DateRangePicker fromDate={null} toDate={null} onChange={onChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'This Year' }));

      expect(onChange).toHaveBeenCalledWith('2024-01-15', '2025-01-15');
    });
  });

  describe('Clear Button', () => {
    it('should clear dates when Clear button is clicked', () => {
      const onChange = vi.fn();
      render(<DateRangePicker fromDate="2025-01-01" toDate="2025-01-15" onChange={onChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

      expect(onChange).toHaveBeenCalledWith(null, null);
    });

    it('should show Clear button when only fromDate is set', () => {
      render(<DateRangePicker fromDate="2025-01-01" toDate={null} onChange={vi.fn()} />);

      expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    });

    it('should show Clear button when only toDate is set', () => {
      render(<DateRangePicker fromDate={null} toDate="2025-01-15" onChange={vi.fn()} />);

      expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    });
  });

  describe('Date Validation', () => {
    it('should show error when end date is before start date', () => {
      const onChange = vi.fn();
      render(<DateRangePicker fromDate="2025-01-15" toDate={null} onChange={onChange} />);

      changeDateInput('To', '2025-01-01');

      expect(screen.getByRole('alert')).toHaveTextContent('End date must be after start date');
      // onChange should not be called with invalid dates
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should not show error for valid date range', () => {
      const onChange = vi.fn();
      render(<DateRangePicker fromDate="2025-01-01" toDate={null} onChange={onChange} />);

      changeDateInput('To', '2025-01-15');

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(onChange).toHaveBeenCalled();
    });

    it('should allow same date for from and to', () => {
      const onChange = vi.fn();
      render(<DateRangePicker fromDate="2025-01-15" toDate={null} onChange={onChange} />);

      changeDateInput('To', '2025-01-15');

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(onChange).toHaveBeenCalledWith('2025-01-15', '2025-01-15');
    });

    it('should clear error when setting valid dates via quick range', () => {
      const onChange = vi.fn();
      render(<DateRangePicker fromDate="2025-01-15" toDate={null} onChange={onChange} />);

      // First trigger an error
      changeDateInput('To', '2025-01-01');
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Then use quick range to clear error
      fireEvent.click(screen.getByRole('button', { name: 'Last 7 Days' }));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable all inputs when disabled prop is true', () => {
      render(<DateRangePicker fromDate={null} toDate={null} onChange={vi.fn()} disabled={true} />);

      expect(screen.getByLabelText('From')).toBeDisabled();
      expect(screen.getByLabelText('To')).toBeDisabled();
    });

    it('should disable all buttons when disabled prop is true', () => {
      render(
        <DateRangePicker
          fromDate="2025-01-01"
          toDate="2025-01-15"
          onChange={vi.fn()}
          disabled={true}
        />
      );

      expect(screen.getByRole('button', { name: 'Last 7 Days' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Last 30 Days' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'This Year' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
    });

    it('should not disable inputs by default', () => {
      render(<DateRangePicker fromDate={null} toDate={null} onChange={vi.fn()} />);

      expect(screen.getByLabelText('From')).not.toBeDisabled();
      expect(screen.getByLabelText('To')).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have labeled inputs', () => {
      render(<DateRangePicker fromDate={null} toDate={null} onChange={vi.fn()} />);

      const fromInput = screen.getByLabelText('From');
      const toInput = screen.getByLabelText('To');

      expect(fromInput).toHaveAttribute('id', 'from-date');
      expect(toInput).toHaveAttribute('id', 'to-date');
    });

    it('should have aria-describedby on inputs when error exists', () => {
      render(<DateRangePicker fromDate="2025-01-15" toDate={null} onChange={vi.fn()} />);

      changeDateInput('To', '2025-01-01');

      expect(screen.getByLabelText('From')).toHaveAttribute('aria-describedby', 'date-error');
      expect(screen.getByLabelText('To')).toHaveAttribute('aria-describedby', 'date-error');
    });

    it('should have role=alert on error message', () => {
      render(<DateRangePicker fromDate="2025-01-15" toDate={null} onChange={vi.fn()} />);

      changeDateInput('To', '2025-01-01');

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
