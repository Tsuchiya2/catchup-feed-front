/**
 * ErrorAlert Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorAlert } from './ErrorAlert';

describe('ErrorAlert', () => {
  it('renders nothing when error is null', () => {
    const { container } = render(<ErrorAlert error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders alert when error is provided', () => {
    const error = new Error('Something went wrong');
    render(<ErrorAlert error={error} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('displays default title "Error"', () => {
    const error = new Error('Test error');
    render(<ErrorAlert error={error} />);

    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('displays custom title when provided', () => {
    const error = new Error('Test error');
    render(<ErrorAlert error={error} title="Custom Title" />);

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('does not show dismiss button when onDismiss is not provided', () => {
    const error = new Error('Test error');
    render(<ErrorAlert error={error} />);

    expect(screen.queryByLabelText('Dismiss error')).not.toBeInTheDocument();
  });

  it('shows dismiss button when onDismiss is provided', () => {
    const error = new Error('Test error');
    render(<ErrorAlert error={error} onDismiss={() => {}} />);

    expect(screen.getByLabelText('Dismiss error')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    const error = new Error('Test error');

    render(<ErrorAlert error={error} onDismiss={onDismiss} />);

    await user.click(screen.getByLabelText('Dismiss error'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('has aria-live="polite" for accessibility', () => {
    const error = new Error('Test error');
    render(<ErrorAlert error={error} />);

    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
  });

  it('applies custom className when provided', () => {
    const error = new Error('Test error');
    render(<ErrorAlert error={error} className="custom-class" />);

    expect(screen.getByRole('alert')).toHaveClass('custom-class');
  });
});
