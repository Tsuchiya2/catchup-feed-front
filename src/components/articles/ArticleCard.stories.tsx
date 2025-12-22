import type { Meta, StoryObj } from '@storybook/react';
import { ArticleCard } from './ArticleCard';
import type { Article } from '@/types/api';

/**
 * ArticleCard Component
 *
 * Displays an article in list view with title, summary, source badge, and published date.
 * Features hover effects consistent with the cyber/glow theme.
 *
 * Links to article detail page (/articles/[id])
 */
const meta = {
  title: 'Articles/ArticleCard',
  component: ArticleCard,
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
} satisfies Meta<typeof ArticleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock article data
const mockArticle: Article = {
  id: 1,
  source_id: 101,
  source_name: 'Tech Blog',
  title: 'Introduction to React Server Components',
  url: 'https://example.com/article-1',
  summary:
    'Learn how React Server Components can improve your application performance by rendering components on the server side. This comprehensive guide covers the basics and advanced patterns.',
  published_at: '2024-01-15T10:30:00Z',
  created_at: '2024-01-15T10:35:00Z',
};

/**
 * Default article card
 */
export const Default: Story = {
  args: {
    article: mockArticle,
  },
};

/**
 * Article with custom source name
 */
export const CustomSourceName: Story = {
  args: {
    article: mockArticle,
    sourceName: 'Custom Tech News',
  },
};

/**
 * Article without summary
 */
export const NoSummary: Story = {
  args: {
    article: {
      ...mockArticle,
      summary: '',
    },
  },
};

/**
 * Article with long title
 */
export const LongTitle: Story = {
  args: {
    article: {
      ...mockArticle,
      title:
        'A Very Long Article Title That Demonstrates How the Component Handles Extended Text Content and Line Wrapping Behavior',
    },
  },
};

/**
 * Article with very long summary
 */
export const LongSummary: Story = {
  args: {
    article: {
      ...mockArticle,
      summary:
        'This is a very long summary that demonstrates the text truncation behavior. The component will truncate long text to maintain a clean layout and prevent overwhelming the user interface. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    },
  },
};

/**
 * Article with recent timestamp
 */
export const RecentArticle: Story = {
  args: {
    article: {
      ...mockArticle,
      published_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    },
  },
};

/**
 * Article from several days ago
 */
export const OldArticle: Story = {
  args: {
    article: {
      ...mockArticle,
      published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    },
  },
};

/**
 * Article with minimal data (edge case)
 */
export const MinimalData: Story = {
  args: {
    article: {
      id: 2,
      source_id: 102,
      source_name: '',
      title: '',
      url: 'https://example.com/article-2',
      summary: '',
      published_at: '2024-01-15T10:30:00Z',
      created_at: '2024-01-15T10:35:00Z',
    },
  },
};

/**
 * Multiple article cards in a list
 */
export const ArticleList: Story = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-3xl">
      <ArticleCard
        article={{
          ...mockArticle,
          id: 1,
          title: 'Introduction to React Server Components',
          source_name: 'React Blog',
          published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        }}
      />
      <ArticleCard
        article={{
          ...mockArticle,
          id: 2,
          title: 'Building Modern Web Applications with Next.js',
          source_name: 'Next.js News',
          summary:
            'Discover the latest features in Next.js 15 and how they can enhance your development workflow.',
          published_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        }}
      />
      <ArticleCard
        article={{
          ...mockArticle,
          id: 3,
          title: "TypeScript 5.0: What's New",
          source_name: 'TypeScript Blog',
          summary:
            'Explore the new features and improvements in TypeScript 5.0, including decorators and performance enhancements.',
          published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        }}
      />
    </div>
  ),
};

/**
 * Article card with custom styling
 */
export const CustomStyling: Story = {
  args: {
    article: mockArticle,
    className: 'bg-accent/50 border-primary',
  },
};
