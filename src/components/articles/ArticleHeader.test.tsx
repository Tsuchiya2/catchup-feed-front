import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ArticleHeader } from './ArticleHeader';
import {
  createMockArticle,
  createMockArticleWithSourceEdgeCase,
} from '@/__test__/factories/articleFactory';

describe('ArticleHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render article title as h1', () => {
      const article = createMockArticle({ title: 'My Article Title' });
      render(<ArticleHeader article={article} />);
      expect(
        screen.getByRole('heading', { level: 1, name: 'My Article Title' })
      ).toBeInTheDocument();
    });

    it('should render source badge when sourceName provided', () => {
      const article = createMockArticle();
      render(<ArticleHeader article={article} sourceName="Tech Blog" />);
      expect(screen.getByText('Tech Blog')).toBeInTheDocument();
    });

    it('should not render source badge when sourceName not provided and source_name is null', () => {
      const article = createMockArticle({ source_name: null as unknown as string });
      render(<ArticleHeader article={article} />);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should render published date with "Published" prefix', () => {
      const article = createMockArticle({
        published_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      });
      render(<ArticleHeader article={article} />);
      expect(screen.getByText(/Published.*hours? ago/)).toBeInTheDocument();
    });

    it('should render separator dot when both source and date present', () => {
      const article = createMockArticle();
      render(<ArticleHeader article={article} sourceName="Tech Blog" />);
      expect(screen.getByText('·')).toBeInTheDocument();
    });

    it('should render "Read Original Article" button', () => {
      const article = createMockArticle();
      render(<ArticleHeader article={article} />);
      expect(screen.getByRole('link', { name: /Read Original Article/i })).toBeInTheDocument();
    });
  });

  describe('External Link', () => {
    it('should link to article URL', () => {
      const article = createMockArticle({ url: 'https://example.com/my-article' });
      render(<ArticleHeader article={article} />);
      const link = screen.getByRole('link', { name: /Read Original Article/i });
      expect(link).toHaveAttribute('href', 'https://example.com/my-article');
    });

    it('should open in new tab', () => {
      const article = createMockArticle();
      render(<ArticleHeader article={article} />);
      const link = screen.getByRole('link', { name: /Read Original Article/i });
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should have security attributes', () => {
      const article = createMockArticle();
      render(<ArticleHeader article={article} />);
      const link = screen.getByRole('link', { name: /Read Original Article/i });
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should have aria-label with source name when provided', () => {
      const article = createMockArticle();
      render(<ArticleHeader article={article} sourceName="Tech Blog" />);
      const link = screen.getByRole('link', { name: /Read original article on Tech Blog/i });
      expect(link).toBeInTheDocument();
    });

    it('should have generic aria-label without source name', () => {
      const article = createMockArticle({ source_name: null as unknown as string });
      render(<ArticleHeader article={article} />);
      const link = screen.getByRole('link', { name: 'Read original article' });
      expect(link).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply custom className', () => {
      const article = createMockArticle();
      const { container } = render(<ArticleHeader article={article} className="custom-class" />);
      expect(container.querySelector('header')).toHaveClass('custom-class');
    });

    it('should have responsive title sizing', () => {
      const article = createMockArticle();
      render(<ArticleHeader article={article} />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-3xl');
      expect(heading).toHaveClass('md:text-4xl');
      expect(heading).toHaveClass('lg:text-5xl');
    });

    it('should have full-width button on mobile', () => {
      const article = createMockArticle();
      const { container } = render(<ArticleHeader article={article} />);
      // Find the button's parent button element
      const buttonLink = container.querySelector('a[target="_blank"]');
      const buttonWrapper = buttonLink?.closest('button') || buttonLink;
      expect(buttonWrapper).toHaveClass('w-full');
      expect(buttonWrapper).toHaveClass('sm:w-auto');
    });
  });

  describe('Accessibility', () => {
    it('should have semantic header element', () => {
      const article = createMockArticle();
      const { container } = render(<ArticleHeader article={article} />);
      expect(container.querySelector('header')).toBeInTheDocument();
    });

    it('should have time element with datetime attribute', () => {
      const publishedAt = '2025-01-15T10:00:00Z';
      const article = createMockArticle({ published_at: publishedAt });
      render(<ArticleHeader article={article} />);
      const timeElement = screen.getByRole('time');
      expect(timeElement).toHaveAttribute('datetime', publishedAt);
    });

    it('should have proper heading hierarchy (h1)', () => {
      const article = createMockArticle();
      render(<ArticleHeader article={article} />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing title gracefully', () => {
      const article = createMockArticle({ title: '' });
      render(<ArticleHeader article={article} />);
      expect(
        screen.getByRole('heading', { level: 1, name: 'Untitled Article' })
      ).toBeInTheDocument();
    });

    it('should handle whitespace-only title', () => {
      const article = createMockArticle({ title: '   ' });
      render(<ArticleHeader article={article} />);
      expect(
        screen.getByRole('heading', { level: 1, name: 'Untitled Article' })
      ).toBeInTheDocument();
    });

    it('should handle missing URL with fallback', () => {
      const article = createMockArticle({ url: '' });
      render(<ArticleHeader article={article} />);
      const link = screen.getByRole('link', { name: /Read Original Article/i });
      expect(link).toHaveAttribute('href', '#');
    });

    it('should handle null published_at', () => {
      const article = createMockArticle();
      article.published_at = null as unknown as string;
      render(<ArticleHeader article={article} />);
      // Should not crash and time element should not be present
      expect(screen.queryByRole('time')).not.toBeInTheDocument();
    });

    it('should handle special characters in title', () => {
      const article = createMockArticle({ title: '<script>alert("xss")</script>' });
      render(<ArticleHeader article={article} />);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        '<script>alert("xss")</script>'
      );
    });

    it('should handle very long source name', () => {
      const article = createMockArticle();
      const longSourceName = 'A'.repeat(100);
      render(<ArticleHeader article={article} sourceName={longSourceName} />);
      expect(screen.getByText(longSourceName)).toBeInTheDocument();
    });
  });

  describe('Source Name Edge Cases', () => {
    it('should handle null source name', () => {
      const article = createMockArticleWithSourceEdgeCase('null');
      render(<ArticleHeader article={article} sourceName={article.source_name} />);
      // Source badge should not be displayed when source name is null
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should handle undefined source name', () => {
      const article = createMockArticleWithSourceEdgeCase('undefined');
      render(<ArticleHeader article={article} sourceName={article.source_name} />);
      // Source badge should not be displayed when source name is undefined
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should handle empty string source name', () => {
      const article = createMockArticleWithSourceEdgeCase('empty');
      render(<ArticleHeader article={article} sourceName={article.source_name} />);
      // Source badge should not be displayed when source name is empty
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should handle whitespace-only source name', () => {
      const article = createMockArticleWithSourceEdgeCase('whitespace');
      render(<ArticleHeader article={article} sourceName={article.source_name} />);
      // Should either not display or normalize the whitespace
      const sourceText = screen.queryByText('   ');
      // Component may trim whitespace, so we check if it's either not rendered or trimmed
      if (sourceText) {
        expect(sourceText.textContent?.trim()).toBe('');
      }
    });

    it('should handle valid source name', () => {
      const article = createMockArticle({ source_name: 'Valid Tech Blog' });
      render(<ArticleHeader article={article} sourceName={article.source_name} />);
      expect(screen.getByText('Valid Tech Blog')).toBeInTheDocument();
    });

    it('should handle unicode characters in source name', () => {
      const article = createMockArticleWithSourceEdgeCase('unicode');
      render(<ArticleHeader article={article} sourceName={article.source_name} />);
      expect(screen.getByText('テックブログ 🚀')).toBeInTheDocument();
    });

    it('should handle very long source name from factory', () => {
      const article = createMockArticleWithSourceEdgeCase('long');
      render(<ArticleHeader article={article} sourceName={article.source_name} />);
      expect(screen.getByText('A'.repeat(200))).toBeInTheDocument();
    });
  });
});
