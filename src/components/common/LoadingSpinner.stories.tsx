import type { Meta, StoryObj } from '@storybook/react';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * LoadingSpinner Component
 *
 * A versatile loading spinner component with multiple sizes and variants.
 * Can be used inline or as a centered full-page loader.
 */
const meta = {
  title: 'Common/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['inline', 'centered'],
      description: 'Display variant of the spinner',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the spinner',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof LoadingSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default inline spinner (medium size)
 */
export const Default: Story = {
  args: {
    variant: 'inline',
    size: 'md',
  },
};

/**
 * Small inline spinner
 */
export const Small: Story = {
  args: {
    variant: 'inline',
    size: 'sm',
  },
};

/**
 * Medium inline spinner
 */
export const Medium: Story = {
  args: {
    variant: 'inline',
    size: 'md',
  },
};

/**
 * Large inline spinner
 */
export const Large: Story = {
  args: {
    variant: 'inline',
    size: 'lg',
  },
};

/**
 * Centered spinner (full-page loader)
 */
export const Centered: Story = {
  args: {
    variant: 'centered',
    size: 'lg',
  },
};

/**
 * Spinner in button context
 */
export const InButton: Story = {
  render: () => (
    <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground">
      <LoadingSpinner variant="inline" size="sm" />
      <span>Loading...</span>
    </button>
  ),
};

/**
 * Spinner with text
 */
export const WithText: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <LoadingSpinner variant="inline" size="md" />
      <span className="text-muted-foreground">Loading data...</span>
    </div>
  ),
};

/**
 * All sizes comparison
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner variant="inline" size="sm" />
        <span className="text-xs text-muted-foreground">Small</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner variant="inline" size="md" />
        <span className="text-xs text-muted-foreground">Medium</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner variant="inline" size="lg" />
        <span className="text-xs text-muted-foreground">Large</span>
      </div>
    </div>
  ),
};

/**
 * Spinner in card loading state
 */
export const InCard: Story = {
  render: () => (
    <div className="max-w-2xl border rounded-lg p-6 bg-card">
      <h2 className="text-xl font-bold mb-4">Recent Articles</h2>
      <LoadingSpinner variant="centered" size="md" />
    </div>
  ),
};

/**
 * Multiple spinners in list
 */
export const InList: Story = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-md">
      <div className="flex items-center justify-between border rounded-lg p-4">
        <span className="text-muted-foreground">Loading articles...</span>
        <LoadingSpinner variant="inline" size="sm" />
      </div>
      <div className="flex items-center justify-between border rounded-lg p-4">
        <span className="text-muted-foreground">Loading sources...</span>
        <LoadingSpinner variant="inline" size="sm" />
      </div>
      <div className="flex items-center justify-between border rounded-lg p-4">
        <span className="text-muted-foreground">Loading statistics...</span>
        <LoadingSpinner variant="inline" size="sm" />
      </div>
    </div>
  ),
};

/**
 * Custom color spinner
 */
export const CustomColor: Story = {
  render: () => (
    <div className="flex gap-8">
      <LoadingSpinner variant="inline" size="md" className="text-primary" />
      <LoadingSpinner variant="inline" size="md" className="text-destructive" />
      <LoadingSpinner variant="inline" size="md" className="text-green-500" />
      <LoadingSpinner variant="inline" size="md" className="text-yellow-500" />
    </div>
  ),
};

/**
 * Full-page loading state
 */
export const FullPage: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner variant="inline" size="lg" className="text-primary" />
        <p className="text-muted-foreground">Loading application...</p>
      </div>
    </div>
  ),
};
