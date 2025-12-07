import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentArticlesList } from './RecentArticlesList';
import type { Article } from '@/types/api';
import { createMockArticle, createMockArticles } from '@/__test__/factories/articleFactory';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('RecentArticlesList', () => {
  // Mock article data
  const mockArticles: Article[] = [
    createMockArticle({
      id: 1,
      title: 'First Article',
      summary: 'This is the first article summary',
      url: 'https://example.com/article1',
      published_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      source_name: 'Tech Blog',
    }),
    createMockArticle({
      id: 2,
      title: 'Second Article',
      summary:
        'This is the second article with a very long summary that should be truncated when displayed in the list to prevent the UI from breaking and to maintain a clean layout',
      url: 'https://example.com/article2',
      published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      source_name: 'News Site',
    }),
    createMockArticle({
      id: 3,
      title: 'Third Article Without Summary',
      summary: '',
      url: 'https://example.com/article3',
      published_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      source_name: 'Dev Blog',
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render recent articles list with header', () => {
      // Act
      render(<RecentArticlesList articles={mockArticles} />);

      // Assert
      expect(screen.getByText('Recent Articles')).toBeInTheDocument();
      expect(screen.getByText(/latest articles from your sources/i)).toBeInTheDocument();
    });

    it('should render all articles', () => {
      // Act
      render(<RecentArticlesList articles={mockArticles} />);

      // Assert
      expect(screen.getByText('First Article')).toBeInTheDocument();
      expect(screen.getByText('Second Article')).toBeInTheDocument();
      expect(screen.getByText('Third Article Without Summary')).toBeInTheDocument();
    });

    it('should render article summaries', () => {
      // Act
      render(<RecentArticlesList articles={mockArticles} />);

      // Assert
      expect(screen.getByText(/this is the first article summary/i)).toBeInTheDocument();
      // Second article summary should be truncated
      expect(
        screen.getByText(/this is the second article with a very long summary/i)
      ).toBeInTheDocument();
    });

    it('should not render empty summaries', () => {
      // Act
      const { container } = render(<RecentArticlesList articles={mockArticles} />);

      // Assert
      const thirdArticle = screen.getByText('Third Article Without Summary').closest('a');
      const summaryInThirdArticle = thirdArticle?.querySelector('.text-sm.text-muted-foreground');
      expect(summaryInThirdArticle).not.toBeInTheDocument();
    });

    it('should render relative timestamps', () => {
      // Act
      render(<RecentArticlesList articles={mockArticles} />);

      // Assert
      expect(screen.getByText(/hour.*ago/i)).toBeInTheDocument();
      expect(screen.getByText(/day.*ago/i)).toBeInTheDocument();
      expect(screen.getByText(/minute.*ago/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading skeletons when loading', () => {
      // Act
      render(<RecentArticlesList articles={[]} isLoading={true} />);

      // Assert
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
      expect(screen.queryByText('First Article')).not.toBeInTheDocument();
    });

    it('should show 5 skeleton items', () => {
      // Act
      const { container } = render(<RecentArticlesList articles={[]} isLoading={true} />);

      // Assert
      const skeletonContainers = container.querySelectorAll('.space-y-2.p-4');
      expect(skeletonContainers).toHaveLength(5);
    });

    it('should not show articles when loading', () => {
      // Act
      render(<RecentArticlesList articles={mockArticles} isLoading={true} />);

      // Assert
      expect(screen.queryByText('First Article')).not.toBeInTheDocument();
      expect(screen.queryByText('Second Article')).not.toBeInTheDocument();
    });

    it('should show articles when not loading', () => {
      // Act
      render(<RecentArticlesList articles={mockArticles} isLoading={false} />);

      // Assert
      expect(screen.getByText('First Article')).toBeInTheDocument();
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(0);
    });

    it('should default to not loading', () => {
      // Act
      render(<RecentArticlesList articles={mockArticles} />);

      // Assert
      expect(screen.getByText('First Article')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no articles', () => {
      // Act
      render(<RecentArticlesList articles={[]} />);

      // Assert
      expect(screen.getByText('No articles yet')).toBeInTheDocument();
      expect(
        screen.getByText(/articles will appear here once they are added/i)
      ).toBeInTheDocument();
    });

    it('should show empty state emoji', () => {
      // Act
      render(<RecentArticlesList articles={[]} />);

      // Assert
      expect(screen.getByText('📰')).toBeInTheDocument();
    });

    it('should not show loading skeletons in empty state', () => {
      // Act
      render(<RecentArticlesList articles={[]} isLoading={false} />);

      // Assert
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(0);
    });

    it('should not show articles in empty state', () => {
      // Act
      render(<RecentArticlesList articles={[]} />);

      // Assert
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  describe('Links', () => {
    it('should link to article detail pages', () => {
      // Act
      render(<RecentArticlesList articles={mockArticles} />);

      // Assert
      const firstArticleLink = screen.getByText('First Article').closest('a');
      expect(firstArticleLink).toHaveAttribute('href', '/articles/1');

      const secondArticleLink = screen.getByText('Second Article').closest('a');
      expect(secondArticleLink).toHaveAttribute('href', '/articles/2');
    });

    it('should make entire article item clickable', () => {
      // Act
      render(<RecentArticlesList articles={mockArticles} />);

      // Assert
      const links = screen.getAllByRole('link');
      expect(links.length).toBe(mockArticles.length);
    });
  });

  describe('Summary Truncation', () => {
    it('should truncate long summaries to 150 characters', () => {
      // Arrange
      const longSummary = 'A'.repeat(200);
      const articleWithLongSummary = createMockArticle({
        summary: longSummary,
      });

      // Act
      render(<RecentArticlesList articles={[articleWithLongSummary]} />);

      // Assert
      const summary = screen.getByText(/A+\.\.\./);
      expect(summary.textContent?.length).toBeLessThanOrEqual(154); // 150 + "..."
    });

    it('should not truncate short summaries', () => {
      // Arrange
      const shortSummary = 'Short summary';
      const articleWithShortSummary = createMockArticle({
        summary: shortSummary,
      });

      // Act
      render(<RecentArticlesList articles={[articleWithShortSummary]} />);

      // Assert
      expect(screen.getByText('Short summary')).toBeInTheDocument();
      expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument();
    });

    it('should handle exactly 150 character summaries', () => {
      // Arrange
      const exactSummary = 'A'.repeat(150);
      const articleWithExactSummary = createMockArticle({
        summary: exactSummary,
      });

      // Act
      render(<RecentArticlesList articles={[articleWithExactSummary]} />);

      // Assert
      const summary = screen.getByText(new RegExp(`^A{150}$`));
      expect(summary.textContent?.length).toBe(150);
      expect(summary.textContent).not.toContain('...');
    });
  });

  describe('Timestamp Formatting', () => {
    it('should format recent timestamps as minutes', () => {
      // Arrange
      const recentArticle = createMockArticle({
        published_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
      });

      // Act
      render(<RecentArticlesList articles={[recentArticle]} />);

      // Assert
      expect(screen.getByText('45 minutes ago')).toBeInTheDocument();
    });

    it('should use singular for 1 minute', () => {
      // Arrange
      const oneMinuteAgo = createMockArticle({
        published_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
      });

      // Act
      render(<RecentArticlesList articles={[oneMinuteAgo]} />);

      // Assert
      expect(screen.getByText('1 minute ago')).toBeInTheDocument();
    });

    it('should format as hours for recent articles', () => {
      // Arrange
      const hoursAgo = createMockArticle({
        published_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      });

      // Act
      render(<RecentArticlesList articles={[hoursAgo]} />);

      // Assert
      expect(screen.getByText('3 hours ago')).toBeInTheDocument();
    });

    it('should format as days for older articles', () => {
      // Arrange
      const daysAgo = createMockArticle({
        published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      });

      // Act
      render(<RecentArticlesList articles={[daysAgo]} />);

      // Assert
      expect(screen.getByText('5 days ago')).toBeInTheDocument();
    });

    it('should format as date for very old articles', () => {
      // Arrange
      const veryOld = createMockArticle({
        published_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      });

      // Act
      render(<RecentArticlesList articles={[veryOld]} />);

      // Assert
      // Should show formatted date instead of relative time (format may vary by locale)
      const timeElements = screen.getAllByRole('time');
      expect(timeElements.length).toBeGreaterThan(0);
      const timeElement = timeElements[0];
      expect(timeElement).toBeInTheDocument();
      // Just verify it's not showing "days ago" format
      expect(timeElement?.textContent).not.toMatch(/\d+\s+days?\s+ago/);
    });
  });

  describe('Styling', () => {
    it('should apply custom className', () => {
      // Act
      const { container } = render(
        <RecentArticlesList articles={mockArticles} className="custom-class" />
      );

      // Assert
      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
    });

    it('should have hover effects on article links', () => {
      // Act
      const { container } = render(<RecentArticlesList articles={mockArticles} />);

      // Assert
      const links = container.querySelectorAll('a');
      links.forEach((link) => {
        expect(link).toHaveClass('hover:border-primary');
        expect(link).toHaveClass('hover:bg-accent');
      });
    });
  });

  describe('Accessibility', () => {
    it('should use time element with datetime attribute', () => {
      // Act
      render(<RecentArticlesList articles={mockArticles} />);

      // Assert
      const timeElements = screen.getAllByRole('time');
      expect(timeElements.length).toBeGreaterThan(0);

      timeElements.forEach((timeEl) => {
        expect(timeEl).toHaveAttribute('datetime');
      });
    });

    it('should have semantic structure', () => {
      // Act
      render(<RecentArticlesList articles={mockArticles} />);

      // Assert
      // Should have headings
      expect(screen.getByText('Recent Articles')).toBeInTheDocument();

      // Should have links
      const links = screen.getAllByRole('link');
      expect(links.length).toBe(mockArticles.length);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty summary', () => {
      // Arrange
      const articleEmptySummary = createMockArticle({
        title: 'First Article',
        summary: '',
      });

      // Act
      render(<RecentArticlesList articles={[articleEmptySummary]} />);

      // Assert
      expect(screen.getByText('First Article')).toBeInTheDocument();
    });

    it('should render single article', () => {
      // Act
      render(<RecentArticlesList articles={[mockArticles[0]!]} />);

      // Assert
      expect(screen.getByText('First Article')).toBeInTheDocument();
      expect(screen.queryByText('Second Article')).not.toBeInTheDocument();
    });

    it('should render many articles', () => {
      // Arrange
      const manyArticles = Array.from({ length: 20 }, (_, i) =>
        createMockArticle({
          id: i,
          title: `Article ${i}`,
        })
      );

      // Act
      render(<RecentArticlesList articles={manyArticles} />);

      // Assert
      expect(screen.getByText('Article 0')).toBeInTheDocument();
      expect(screen.getByText('Article 19')).toBeInTheDocument();
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(20);
    });
  });
});
