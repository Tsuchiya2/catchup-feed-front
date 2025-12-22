import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/button';
import { FileText, Search, Inbox, AlertCircle, Plus } from 'lucide-react';

/**
 * EmptyState Component
 *
 * Displays an empty state message with optional icon and action button.
 * Used when lists or collections have no data to display.
 */
const meta = {
  title: 'Common/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Main title text',
    },
    description: {
      control: 'text',
      description: 'Optional description text',
    },
    icon: {
      control: false,
      description: 'Optional icon element',
    },
    action: {
      control: false,
      description: 'Optional action element (usually a button)',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default empty state with icon and description
 */
export const Default: Story = {
  args: {
    title: 'No articles found',
    description: 'Start by adding some sources to get articles.',
    icon: <FileText />,
  },
};

/**
 * Empty state with action button
 */
export const WithAction: Story = {
  args: {
    title: 'No sources configured',
    description: 'Add your first source to start collecting articles.',
    icon: <Inbox />,
    action: (
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        Add Source
      </Button>
    ),
  },
};

/**
 * Empty search results
 */
export const NoSearchResults: Story = {
  args: {
    title: 'No results found',
    description: 'Try adjusting your search criteria or filters.',
    icon: <Search />,
    action: <Button variant="outline">Clear Filters</Button>,
  },
};

/**
 * Empty state without icon
 */
export const NoIcon: Story = {
  args: {
    title: 'Nothing here yet',
    description: 'Content will appear here once available.',
  },
};

/**
 * Empty state without description
 */
export const NoDescription: Story = {
  args: {
    title: 'No data available',
    icon: <AlertCircle />,
  },
};

/**
 * Empty articles list
 */
export const EmptyArticles: Story = {
  args: {
    title: 'No articles yet',
    description: 'Articles from your sources will appear here.',
    icon: <FileText />,
    action: (
      <Button variant="outline" size="sm">
        Refresh
      </Button>
    ),
  },
};

/**
 * Empty inbox
 */
export const EmptyInbox: Story = {
  args: {
    title: 'Inbox is empty',
    description: "You're all caught up! Check back later for new articles.",
    icon: <Inbox />,
  },
};

/**
 * Error state (no data due to error)
 */
export const ErrorState: Story = {
  args: {
    title: 'Unable to load data',
    description: 'There was a problem loading the content. Please try again.',
    icon: <AlertCircle />,
    action: <Button variant="destructive">Retry</Button>,
  },
};

/**
 * Empty state in card
 */
export const InCard: Story = {
  render: () => (
    <div className="max-w-2xl border rounded-lg bg-card">
      <div className="border-b p-4">
        <h2 className="text-xl font-bold">Recent Articles</h2>
      </div>
      <EmptyState
        title="No recent articles"
        description="Articles will appear here once they're available."
        icon={<FileText />}
      />
    </div>
  ),
};

/**
 * Multiple empty states comparison
 */
export const MultipleStates: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="border rounded-lg bg-card p-4">
        <EmptyState
          title="No articles"
          description="Start by adding sources"
          icon={<FileText />}
          action={<Button size="sm">Add Source</Button>}
        />
      </div>
      <div className="border rounded-lg bg-card p-4">
        <EmptyState
          title="No search results"
          description="Try different keywords"
          icon={<Search />}
          action={<Button variant="outline" size="sm">Clear Search</Button>}
        />
      </div>
      <div className="border rounded-lg bg-card p-4">
        <EmptyState
          title="Inbox empty"
          description="All caught up!"
          icon={<Inbox />}
        />
      </div>
      <div className="border rounded-lg bg-card p-4">
        <EmptyState
          title="Error loading data"
          description="Please try again"
          icon={<AlertCircle />}
          action={<Button variant="destructive" size="sm">Retry</Button>}
        />
      </div>
    </div>
  ),
};

/**
 * Large empty state (full page)
 */
export const FullPage: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <EmptyState
        title="Welcome to Catchup Feed"
        description="Get started by adding your first source to begin collecting articles."
        icon={<FileText className="h-16 w-16" />}
        action={
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Add First Source
          </Button>
        }
        className="max-w-md"
      />
    </div>
  ),
};

/**
 * Custom styled empty state
 */
export const CustomStyling: Story = {
  args: {
    title: 'Custom Empty State',
    description: 'With custom styling applied',
    icon: <FileText />,
    className: 'bg-accent/10 rounded-lg p-8',
  },
};
