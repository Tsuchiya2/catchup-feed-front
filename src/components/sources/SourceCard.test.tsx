import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SourceCard } from './SourceCard';
import type { Source } from '@/types/api';

describe('SourceCard', () => {
  const NOW = new Date('2025-01-15T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createMockSource = (overrides: Partial<Source> = {}): Source => ({
    id: 1,
    name: 'Test Source',
    feed_url: 'https://example.com/feed.xml',
    active: true,
    last_crawled_at: new Date(NOW.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    ...overrides,
  });

  describe('Rendering', () => {
    it('should render source name', () => {
      const source = createMockSource({ name: 'Tech Blog' });
      render(<SourceCard source={source} userRole="user" />);
      expect(screen.getByRole('heading', { level: 3, name: 'Tech Blog' })).toBeInTheDocument();
    });

    it('should render RSS icon', () => {
      const source = createMockSource();
      const { container } = render(<SourceCard source={source} userRole="user" />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-primary');
    });

    it('should render feed URL', () => {
      const source = createMockSource({ feed_url: 'https://example.com/rss' });
      render(<SourceCard source={source} userRole="user" />);
      expect(screen.getByText('https://example.com/rss')).toBeInTheDocument();
    });

    it('should render status badge', () => {
      const source = createMockSource({ active: true });
      render(<SourceCard source={source} userRole="user" />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should render last crawled time', () => {
      const source = createMockSource({
        last_crawled_at: new Date(NOW.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      });
      render(<SourceCard source={source} userRole="user" />);
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    });

    it('should render "Never crawled" when last_crawled_at is null', () => {
      const source = createMockSource({ last_crawled_at: null });
      render(<SourceCard source={source} userRole="user" />);
      expect(screen.getByText('Never crawled')).toBeInTheDocument();
    });
  });

  describe('Active Status', () => {
    it('should show Active badge for active source', () => {
      const source = createMockSource({ active: true });
      render(<SourceCard source={source} userRole="user" />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should show Inactive badge for inactive source', () => {
      const source = createMockSource({ active: false });
      render(<SourceCard source={source} userRole="user" />);
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply custom className', () => {
      const source = createMockSource();
      const { container } = render(
        <SourceCard source={source} className="custom-class" userRole="user" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should have flex column layout', () => {
      const source = createMockSource();
      const { container } = render(<SourceCard source={source} userRole="user" />);
      expect(container.firstChild).toHaveClass('flex');
      expect(container.firstChild).toHaveClass('flex-col');
    });

    it('should truncate long source name', () => {
      const source = createMockSource({ name: 'A'.repeat(100) });
      render(<SourceCard source={source} userRole="user" />);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveClass('truncate');
    });

    it('should truncate long feed URL', () => {
      const source = createMockSource({ feed_url: 'https://example.com/' + 'a'.repeat(100) });
      render(<SourceCard source={source} userRole="user" />);
      const urlElement = screen.getByText(source.feed_url);
      expect(urlElement).toHaveClass('truncate');
    });
  });

  describe('Accessibility', () => {
    it('should have role listitem', () => {
      const source = createMockSource();
      render(<SourceCard source={source} userRole="user" />);
      expect(screen.getByRole('listitem')).toBeInTheDocument();
    });

    it('should have aria-label with source name', () => {
      const source = createMockSource({ name: 'Tech Blog' });
      render(<SourceCard source={source} userRole="user" />);
      expect(screen.getByRole('listitem')).toHaveAttribute('aria-label', 'Source: Tech Blog');
    });

    it('should hide RSS icon from screen readers', () => {
      const source = createMockSource();
      const { container } = render(<SourceCard source={source} userRole="user" />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have accessible feed URL with aria-label', () => {
      const source = createMockSource({ feed_url: 'https://example.com/feed' });
      render(<SourceCard source={source} userRole="user" />);
      expect(screen.getByLabelText('Feed URL: https://example.com/feed')).toBeInTheDocument();
    });

    it('should have time element for last crawled', () => {
      const lastCrawledAt = new Date(NOW.getTime() - 1 * 60 * 60 * 1000).toISOString();
      const source = createMockSource({ last_crawled_at: lastCrawledAt });
      render(<SourceCard source={source} userRole="user" />);
      const timeElement = screen.getByRole('time');
      expect(timeElement).toHaveAttribute('datetime', lastCrawledAt);
    });

    it('should have proper title attribute for truncated URL', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(100);
      const source = createMockSource({ feed_url: longUrl });
      render(<SourceCard source={source} userRole="user" />);
      const urlElement = screen.getByText(longUrl);
      expect(urlElement).toHaveAttribute('title', longUrl);
    });
  });

  describe('Last Crawled Time Formatting', () => {
    it('should show "Just now" for recent crawl', () => {
      const source = createMockSource({
        last_crawled_at: new Date(NOW.getTime() - 30 * 1000).toISOString(), // 30 seconds ago
      });
      render(<SourceCard source={source} userRole="user" />);
      expect(screen.getByText('Just now')).toBeInTheDocument();
    });

    it('should show minutes for crawl within last hour', () => {
      const source = createMockSource({
        last_crawled_at: new Date(NOW.getTime() - 45 * 60 * 1000).toISOString(),
      });
      render(<SourceCard source={source} userRole="user" />);
      expect(screen.getByText('45 minutes ago')).toBeInTheDocument();
    });

    it('should show hours for crawl within last day', () => {
      const source = createMockSource({
        last_crawled_at: new Date(NOW.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      });
      render(<SourceCard source={source} userRole="user" />);
      expect(screen.getByText('5 hours ago')).toBeInTheDocument();
    });

    it('should show days for crawl within last week', () => {
      const source = createMockSource({
        last_crawled_at: new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      });
      render(<SourceCard source={source} userRole="user" />);
      expect(screen.getByText('3 days ago')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle source with minimal data', () => {
      const source = createMockSource({
        name: 'Minimal',
        feed_url: 'https://min.com',
        last_crawled_at: null,
      });
      render(<SourceCard source={source} userRole="user" />);
      expect(screen.getByText('Minimal')).toBeInTheDocument();
      expect(screen.getByText('https://min.com')).toBeInTheDocument();
      expect(screen.getByText('Never crawled')).toBeInTheDocument();
    });

    it('should handle special characters in source name', () => {
      const source = createMockSource({ name: '<script>alert("xss")</script>' });
      render(<SourceCard source={source} userRole="user" />);
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
        '<script>alert("xss")</script>'
      );
    });

    it('should handle unicode in source name', () => {
      const source = createMockSource({ name: '日本語のソース名 🎉' });
      render(<SourceCard source={source} userRole="user" />);
      expect(screen.getByText('日本語のソース名 🎉')).toBeInTheDocument();
    });

    it('should handle undefined last_crawled_at', () => {
      const source = createMockSource();
      source.last_crawled_at = undefined as unknown as string | null;
      render(<SourceCard source={source} userRole="user" />);
      expect(screen.getByText('Never crawled')).toBeInTheDocument();
    });
  });

  describe('Role-Based Rendering', () => {
    const mockOnUpdateActive = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should render StatusBadge when userRole is "user"', () => {
      const source = createMockSource({ active: true });
      render(<SourceCard source={source} userRole="user" />);

      // Should show badge
      expect(screen.getByText('Active')).toBeInTheDocument();

      // Should NOT show toggle
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    });

    it('should render StatusBadge when userRole is null', () => {
      const source = createMockSource({ active: false });
      render(<SourceCard source={source} userRole={null} />);

      // Should show badge
      expect(screen.getByText('Inactive')).toBeInTheDocument();

      // Should NOT show toggle
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    });

    it('should render ActiveToggle when userRole is "admin" with onUpdateActive', () => {
      const source = createMockSource({ active: true });
      render(
        <SourceCard
          source={source}
          userRole="admin"
          onUpdateActive={mockOnUpdateActive}
        />
      );

      // Should show toggle
      expect(screen.getByRole('switch')).toBeInTheDocument();

      // Should NOT show badge
      expect(screen.queryByText('Active')).not.toBeInTheDocument();
    });

    it('should render StatusBadge when userRole is "admin" but no onUpdateActive', () => {
      const source = createMockSource({ active: true });
      render(<SourceCard source={source} userRole="admin" />);

      // Should show badge (fallback when no callback provided)
      expect(screen.getByText('Active')).toBeInTheDocument();

      // Should NOT show toggle
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    });

    it('should pass correct props to ActiveToggle', () => {
      const source = createMockSource({
        id: 42,
        name: 'Tech Blog',
        active: false,
      });

      render(
        <SourceCard
          source={source}
          userRole="admin"
          onUpdateActive={mockOnUpdateActive}
        />
      );

      const toggle = screen.getByRole('switch');

      // Verify toggle exists
      expect(toggle).toBeInTheDocument();

      // Verify initial state
      expect(toggle).not.toBeChecked();

      // Verify aria-label includes source name
      expect(screen.getByLabelText('Toggle Tech Blog active status')).toBeInTheDocument();
    });

    it('should pass correct props to StatusBadge for active source', () => {
      const source = createMockSource({ active: true });
      render(<SourceCard source={source} userRole="user" />);

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByLabelText('Status: Active')).toBeInTheDocument();
    });

    it('should pass correct props to StatusBadge for inactive source', () => {
      const source = createMockSource({ active: false });
      render(<SourceCard source={source} userRole="user" />);

      expect(screen.getByText('Inactive')).toBeInTheDocument();
      expect(screen.getByLabelText('Status: Inactive')).toBeInTheDocument();
    });

    it('should pass onUpdateActive callback to ActiveToggle', () => {
      const source = createMockSource({ id: 5, active: true });

      render(
        <SourceCard
          source={source}
          userRole="admin"
          onUpdateActive={mockOnUpdateActive}
        />
      );

      // Verify toggle is rendered (ActiveToggle receives the callback)
      const toggle = screen.getByRole('switch');
      expect(toggle).toBeInTheDocument();
      expect(toggle).toBeChecked();
    });

    it('should render ActiveToggle with correct initial state for inactive source', () => {
      const source = createMockSource({ active: false });

      render(
        <SourceCard
          source={source}
          userRole="admin"
          onUpdateActive={mockOnUpdateActive}
        />
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toBeInTheDocument();
      expect(toggle).not.toBeChecked();
    });

    it('should memoize handleToggle callback', () => {
      const source = createMockSource();

      const { rerender } = render(
        <SourceCard
          source={source}
          userRole="admin"
          onUpdateActive={mockOnUpdateActive}
        />
      );

      // Re-render with same onUpdateActive
      rerender(
        <SourceCard
          source={source}
          userRole="admin"
          onUpdateActive={mockOnUpdateActive}
        />
      );

      // Should not cause unnecessary re-renders
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('should handle switching between admin and non-admin roles', () => {
      const source = createMockSource({ active: true });

      const { rerender } = render(
        <SourceCard
          source={source}
          userRole="user"
        />
      );

      // Initial: non-admin - should show badge
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();

      // Re-render as admin
      rerender(
        <SourceCard
          source={source}
          userRole="admin"
          onUpdateActive={mockOnUpdateActive}
        />
      );

      // Should now show toggle
      expect(screen.queryByText('Active')).not.toBeInTheDocument();
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('should render correctly for admin with active source', () => {
      const source = createMockSource({ active: true });

      render(
        <SourceCard
          source={source}
          userRole="admin"
          onUpdateActive={mockOnUpdateActive}
        />
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toBeChecked();
    });

    it('should render correctly for admin with inactive source', () => {
      const source = createMockSource({ active: false });

      render(
        <SourceCard
          source={source}
          userRole="admin"
          onUpdateActive={mockOnUpdateActive}
        />
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).not.toBeChecked();
    });
  });
});
