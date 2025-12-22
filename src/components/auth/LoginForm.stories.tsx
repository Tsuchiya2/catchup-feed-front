import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { LoginForm } from './LoginForm';

/**
 * LoginForm Component
 *
 * A complete login form with email and password fields, validation, and error handling.
 * Uses react-hook-form with zod validation.
 */
const meta = {
  title: 'Forms/LoginForm',
  component: LoginForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onLogin: {
      action: 'login',
      description: 'Callback function called when form is submitted',
    },
  },
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default login form
 */
export const Default: Story = {
  args: {
    onLogin: fn(async (email: string, password: string) => {
      console.log('Login:', email, password);
      // Simulate successful login
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }),
  },
};

/**
 * Form with successful login
 */
export const SuccessfulLogin: Story = {
  args: {
    onLogin: fn(async (email: string, password: string) => {
      console.log('Login successful:', email);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }),
  },
  play: async ({ canvasElement }) => {
    // Note: Interactive tests would go here in a real scenario
    // This demonstrates the successful state
  },
};

/**
 * Form with login error
 */
export const WithError: Story = {
  args: {
    onLogin: fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      throw new Error('Invalid email or password');
    }),
  },
};

/**
 * Form with network error
 */
export const NetworkError: Story = {
  args: {
    onLogin: fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      throw new Error('Network error. Please check your connection.');
    }),
  },
};

/**
 * Form with server error
 */
export const ServerError: Story = {
  args: {
    onLogin: fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      throw new Error('Server error. Please try again later.');
    }),
  },
};

/**
 * Form in loading state
 */
export const Loading: Story = {
  args: {
    onLogin: fn(async () => {
      // Never resolves to show loading state
      await new Promise(() => {});
    }),
  },
};

/**
 * Form with pre-filled data (for demonstration)
 */
export const PrefilledForm: Story = {
  render: (args) => {
    return (
      <div>
        <LoginForm {...args} />
        <p className="mt-4 text-sm text-muted-foreground text-center">
          Demo: Use any email/password to test
        </p>
      </div>
    );
  },
  args: {
    onLogin: fn(async (email: string, password: string) => {
      console.log('Login:', email, password);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }),
  },
};

/**
 * Form in full-page layout
 */
export const FullPageLayout: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <LoginForm {...args} />
    </div>
  ),
  args: {
    onLogin: fn(async (email: string, password: string) => {
      console.log('Login:', email, password);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }),
  },
};

/**
 * Form with custom styling context
 */
export const InCustomContainer: Story = {
  render: (args) => (
    <div className="max-w-md mx-auto p-8 bg-accent/10 rounded-xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Welcome Back</h1>
      <LoginForm {...args} />
      <p className="mt-6 text-sm text-muted-foreground text-center">
        {"Don't have an account?"}{' '}
        <a href="#" className="text-primary hover:underline">
          Sign up
        </a>
      </p>
    </div>
  ),
  args: {
    onLogin: fn(async (email: string, password: string) => {
      console.log('Login:', email, password);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }),
  },
};

/**
 * Multiple states showcase
 */
export const AllStates: Story = {
  render: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Default State</h3>
        <LoginForm
          onLogin={fn(async () => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          })}
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">With Error</h3>
        <LoginForm
          onLogin={fn(async () => {
            await new Promise((resolve) => setTimeout(resolve, 500));
            throw new Error('Invalid credentials');
          })}
        />
      </div>
    </div>
  ),
};

/**
 * Mobile view
 */
export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    layout: 'fullscreen',
  },
  render: (args) => (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <LoginForm {...args} />
    </div>
  ),
  args: {
    onLogin: fn(async (email: string, password: string) => {
      console.log('Login:', email, password);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }),
  },
};
