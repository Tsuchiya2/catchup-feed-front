import type { Meta, StoryObj } from '@storybook/react';
import { ArticleHeader } from './ArticleHeader';
import type { Article } from '@/types/api';

/**
 * ArticleHeader Component
 *
 * Displays article header information including title, metadata, and link to original article.
 * Used in article detail pages.
 */
const meta = {
  title: 'Articles/ArticleHeader',
  component: ArticleHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    sourceName: {
      control: 'text',
      description: 'Optional source name override',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof ArticleHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock article data
const mockArticle: Article = {
  id: 1,
  source_id: 101,
  source_name: 'Tech Blog',
  title: 'Introduction to React Server Components',
  url: 'https://example.com/article-1',
  summary: 'Learn about React Server Components',
  published_at: '2024-01-15T10:30:00Z',
  created_at: '2024-01-15T10:35:00Z',
};

/**
 * Default article header
 */
export const Default: Story = {
  args: {
    article: mockArticle,
  },
};

/**
 * Header with custom source name
 */
export const CustomSourceName: Story = {
  args: {
    article: mockArticle,
    sourceName: 'Custom Tech News',
  },
};

/**
 * Header with long title
 */
export const LongTitle: Story = {
  args: {
    article: {
      ...mockArticle,
      title:
        'A Comprehensive Guide to Building Scalable and Maintainable Web Applications Using Modern JavaScript Frameworks and Best Practices',
    },
  },
};

/**
 * Header with recent publication date
 */
export const RecentArticle: Story = {
  args: {
    article: {
      ...mockArticle,
      published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    },
  },
};

/**
 * Header with old publication date
 */
export const OldArticle: Story = {
  args: {
    article: {
      ...mockArticle,
      published_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    },
  },
};

/**
 * Header without source name
 */
export const NoSourceName: Story = {
  args: {
    article: {
      ...mockArticle,
      source_name: '',
    },
  },
};

/**
 * Header with minimal data
 */
export const MinimalData: Story = {
  args: {
    article: {
      id: 2,
      source_id: 102,
      source_name: '',
      title: '',
      url: '',
      summary: '',
      published_at: '',
      created_at: '2024-01-15T10:35:00Z',
    },
  },
};

/**
 * Full width header
 */
export const FullWidth: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => (
    <div className="container mx-auto py-8">
      <ArticleHeader {...args} />
    </div>
  ),
  args: {
    article: mockArticle,
  },
};

/**
 * Header with custom styling
 */
export const CustomStyling: Story = {
  args: {
    article: mockArticle,
    className: 'bg-accent/10 p-6 rounded-lg',
  },
};
