import type { Meta, StoryObj } from '@storybook/react';
import { ThemeToggle } from './ThemeToggle';
import { ThemeProvider } from 'next-themes';

/**
 * ThemeToggle Component
 *
 * Provides a dropdown menu for switching between light, dark, and system themes.
 * Uses next-themes for theme management with localStorage persistence.
 */
const meta = {
  title: 'Common/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <Story />
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default theme toggle
 */
export const Default: Story = {};

/**
 * Theme toggle in light mode context
 */
export const LightMode: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <div className="light bg-background p-8 rounded-lg">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

/**
 * Theme toggle in dark mode context
 */
export const DarkMode: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <div className="dark bg-background p-8 rounded-lg">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

/**
 * Theme toggle in header navigation
 */
export const InNavigation: Story = {
  render: () => (
    <nav className="flex items-center justify-between p-4 border-b bg-card">
      <div className="font-bold text-lg">Catchup Feed</div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Dashboard</span>
        <span className="text-sm text-muted-foreground">Articles</span>
        <ThemeToggle />
      </div>
    </nav>
  ),
};

/**
 * Multiple theme toggles showcase
 */
export const MultipleToggles: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <ThemeToggle />
        <span className="text-xs text-muted-foreground">Toggle 1</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ThemeToggle />
        <span className="text-xs text-muted-foreground">Toggle 2</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ThemeToggle />
        <span className="text-xs text-muted-foreground">Toggle 3</span>
      </div>
    </div>
  ),
};
