import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { ErrorMessage } from './ErrorMessage';

/**
 * ErrorMessage Component
 *
 * Displays error messages in an alert with an optional retry button.
 * Uses the Alert component for consistent styling.
 */
const meta = {
  title: 'Common/ErrorMessage',
  component: ErrorMessage,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    error: {
      control: 'text',
      description: 'Error message or Error object',
    },
    onRetry: {
      action: 'retry',
      description: 'Optional retry callback',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  args: {
    onRetry: fn(),
  },
} satisfies Meta<typeof ErrorMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default error message with retry button
 */
export const Default: Story = {
  args: {
    error: 'Failed to load data. Please try again.',
    onRetry: fn(),
  },
};

/**
 * Error message from Error object
 */
export const ErrorObject: Story = {
  args: {
    error: new Error('Network request failed'),
    onRetry: fn(),
  },
};

/**
 * Error message without retry button
 */
export const NoRetry: Story = {
  args: {
    error: 'You do not have permission to access this resource.',
    onRetry: undefined,
  },
};

/**
 * Short error message
 */
export const ShortMessage: Story = {
  args: {
    error: 'Error occurred',
    onRetry: fn(),
  },
};

/**
 * Long error message
 */
export const LongMessage: Story = {
  args: {
    error:
      'An unexpected error occurred while processing your request. The server encountered an internal error and was unable to complete your request. Please try again later or contact support if the problem persists.',
    onRetry: fn(),
  },
};

/**
 * Network error
 */
export const NetworkError: Story = {
  args: {
    error: 'Network connection lost. Please check your internet connection and try again.',
    onRetry: fn(),
  },
};

/**
 * API error
 */
export const APIError: Story = {
  args: {
    error: 'API request failed with status 500: Internal Server Error',
    onRetry: fn(),
  },
};

/**
 * Authentication error
 */
export const AuthError: Story = {
  args: {
    error: 'Your session has expired. Please log in again.',
    onRetry: undefined,
  },
};

/**
 * Multiple error messages
 */
export const MultipleErrors: Story = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-2xl">
      <ErrorMessage error="Failed to load articles" onRetry={fn()} />
      <ErrorMessage error="Failed to load sources" onRetry={fn()} />
      <ErrorMessage error="Session expired. Please log in again." />
    </div>
  ),
};

/**
 * Error in a card context
 */
export const InCardContext: Story = {
  render: () => (
    <div className="max-w-2xl border rounded-lg p-6 bg-card">
      <h2 className="text-xl font-bold mb-4">Recent Articles</h2>
      <ErrorMessage
        error="Failed to load recent articles. Please check your internet connection."
        onRetry={fn()}
      />
    </div>
  ),
};

/**
 * Error with custom styling
 */
export const CustomStyling: Story = {
  args: {
    error: 'Custom styled error message',
    onRetry: fn(),
    className: 'border-2 shadow-lg',
  },
};
