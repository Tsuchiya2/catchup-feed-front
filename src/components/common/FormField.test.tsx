/**
 * FormField Component Tests
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormField } from './FormField';

describe('FormField', () => {
  it('renders label text', () => {
    render(
      <FormField label="Username">
        <input id="username" />
      </FormField>
    );

    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <FormField label="Email">
        <input id="email" placeholder="Enter email" />
      </FormField>
    );

    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('shows required indicator when required is true', () => {
    render(
      <FormField label="Name" required>
        <input id="name" />
      </FormField>
    );

    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
    // Check screen reader accessible text
    expect(screen.getByText('(required)')).toBeInTheDocument();
    expect(screen.getByText('(required)')).toHaveClass('sr-only');
  });

  it('does not show required indicator when required is false', () => {
    render(
      <FormField label="Optional Field">
        <input id="optional" />
      </FormField>
    );

    expect(screen.queryByText('*')).not.toBeInTheDocument();
    expect(screen.queryByText('(required)')).not.toBeInTheDocument();
  });

  it('displays error message when error is provided', () => {
    render(
      <FormField label="Email" error="Invalid email format" htmlFor="email">
        <input id="email" />
      </FormField>
    );

    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email format');
  });

  it('does not display error when error is null', () => {
    render(
      <FormField label="Email" error={null}>
        <input id="email" />
      </FormField>
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not display error when error is undefined', () => {
    render(
      <FormField label="Email">
        <input id="email" />
      </FormField>
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('associates label with input via htmlFor', () => {
    render(
      <FormField label="Password" htmlFor="password">
        <input id="password" type="password" />
      </FormField>
    );

    const label = screen.getByText('Password');
    expect(label).toHaveAttribute('for', 'password');
  });

  it('creates error ID based on htmlFor', () => {
    render(
      <FormField label="Email" htmlFor="email" error="Required">
        <input id="email" />
      </FormField>
    );

    const errorElement = screen.getByRole('alert');
    expect(errorElement).toHaveAttribute('id', 'email-error');
  });

  it('applies custom className to container', () => {
    const { container } = render(
      <FormField label="Test" className="custom-class">
        <input />
      </FormField>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders with multiple children', () => {
    render(
      <FormField label="Full Name" htmlFor="firstName">
        <input id="firstName" placeholder="First name" />
        <input id="lastName" placeholder="Last name" />
      </FormField>
    );

    expect(screen.getByPlaceholderText('First name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Last name')).toBeInTheDocument();
  });
});
