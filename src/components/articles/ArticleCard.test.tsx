import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ArticleCard } from './ArticleCard';
import type { Article } from '@/types/api';
import { createMockArticle } from '@/__test__/factories/articleFactory';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('ArticleCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render article title', () => {
      const article = createMockArticle({ title: 'My Article Title' });
      render(<ArticleCard article={article} />);
      expect(
        screen.getByRole('heading', { level: 2, name: 'My Article Title' })
      ).toBeInTheDocument();
    });

    it('should render article summary', () => {
      const article = createMockArticle({ summary: 'This is the summary' });
      render(<ArticleCard article={article} />);
      expect(screen.getByText('This is the summary')).toBeInTheDocument();
    });

    it('should not render summary when empty', () => {
      const article = createMockArticle({ summary: '' });
      render(<ArticleCard article={article} />);
      const articleElement = screen.getByRole('article');
      expect(articleElement.querySelectorAll('p.text-muted-foreground').length).toBe(0);
    });

    it('should render source badge when sourceName provided', () => {
      const article = createMockArticle();
      render(<ArticleCard article={article} sourceName="Tech Blog" />);
      expect(screen.getByText('Tech Blog')).toBeInTheDocument();
    });

    it('should not render source badge when sourceName not provided', () => {
      const article = createMockArticle({ source_name: undefined as unknown as string });
      render(<ArticleCard article={article} />);
      expect(screen.queryByText('Tech Blog')).not.toBeInTheDocument();
    });

    it('should render published date', () => {
      const article = createMockArticle({
        published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      });
      render(<ArticleCard article={article} />);
      expect(screen.getByText(/hours? ago/)).toBeInTheDocument();
    });

    it('should render separator dot when both source and date present', () => {
      const article = createMockArticle();
      render(<ArticleCard article={article} sourceName="Tech Blog" />);
      expect(screen.getByText('·')).toBeInTheDocument();
    });
  });

  describe('Links', () => {
    it('should link to article detail page', () => {
      const article = createMockArticle({ id: 42 });
      render(<ArticleCard article={article} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/articles/42');
    });

    it('should have aria-label with article title', () => {
      const article = createMockArticle({ title: 'Test Article' });
      render(<ArticleCard article={article} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label', 'Article: Test Article');
    });
  });

  describe('Summary Truncation', () => {
    it('should truncate long summaries', () => {
      const longSummary = 'A'.repeat(200);
      const article = createMockArticle({ summary: longSummary });
      render(<ArticleCard article={article} />);

      // The summary text should be truncated with ellipsis
      // Use a more specific matcher to find the truncated text
      const summaryElement = screen.getByText(/^A+\.\.\.$/);
      expect(summaryElement.textContent?.length).toBeLessThan(200);
    });

    it('should not truncate short summaries', () => {
      const shortSummary = 'Short summary';
      const article = createMockArticle({ summary: shortSummary });
      render(<ArticleCard article={article} />);
      expect(screen.getByText('Short summary')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply custom className', () => {
      const article = createMockArticle();
      render(<ArticleCard article={article} className="custom-class" />);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('custom-class');
    });

    it('should have hover effects', () => {
      const article = createMockArticle();
      render(<ArticleCard article={article} />);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('hover:border-primary');
      expect(link).toHaveClass('hover:bg-accent');
    });

    it('should have focus-visible styling', () => {
      const article = createMockArticle();
      render(<ArticleCard article={article} />);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('focus-visible:ring-2');
    });
  });

  describe('Accessibility', () => {
    it('should have semantic article element', () => {
      const article = createMockArticle();
      render(<ArticleCard article={article} />);
      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('should have time element with datetime attribute', () => {
      const publishedAt = '2025-01-15T10:00:00Z';
      const article = createMockArticle({ published_at: publishedAt });
      render(<ArticleCard article={article} />);
      const timeElement = screen.getByRole('time');
      expect(timeElement).toHaveAttribute('datetime', publishedAt);
    });

    it('should have proper heading hierarchy', () => {
      const article = createMockArticle();
      render(<ArticleCard article={article} />);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing title gracefully', () => {
      const article = createMockArticle({ title: '' });
      render(<ArticleCard article={article} />);
      expect(
        screen.getByRole('heading', { level: 2, name: 'Untitled Article' })
      ).toBeInTheDocument();
    });

    it('should handle whitespace-only title', () => {
      const article = createMockArticle({ title: '   ' });
      render(<ArticleCard article={article} />);
      expect(
        screen.getByRole('heading', { level: 2, name: 'Untitled Article' })
      ).toBeInTheDocument();
    });

    it('should handle whitespace-only summary', () => {
      const article = createMockArticle({ summary: '   ' });
      render(<ArticleCard article={article} />);
      // Whitespace summary should not render as visible content
      const articleElement = screen.getByRole('article');
      const paragraphs = articleElement.querySelectorAll('p');
      expect(paragraphs.length).toBe(0);
    });

    it('should handle null published_at', () => {
      const article = createMockArticle();
      article.published_at = null as unknown as string;
      render(<ArticleCard article={article} />);
      // Should not crash and time element should not be present
      expect(screen.queryByRole('time')).not.toBeInTheDocument();
    });

    it('should handle special characters in title', () => {
      const article = createMockArticle({ title: '<script>alert("xss")</script>' });
      render(<ArticleCard article={article} />);
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        '<script>alert("xss")</script>'
      );
    });

    it('should handle very long source name', () => {
      const article = createMockArticle();
      const longSourceName = 'A'.repeat(100);
      render(<ArticleCard article={article} sourceName={longSourceName} />);
      expect(screen.getByText(longSourceName)).toBeInTheDocument();
    });
  });
});
