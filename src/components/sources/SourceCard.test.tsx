import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
      const link = screen.getByRole('link', { name: /visit feed:/i });
      expect(link).toHaveClass('truncate');
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
      expect(screen.getByLabelText('Visit feed: https://example.com/feed')).toBeInTheDocument();
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
      const link = screen.getByRole('link', { name: /visit feed:/i });
      expect(link).toHaveAttribute('title', longUrl);
    });
  });

  describe('Feed URL Link', () => {
    it('should render feed URL as clickable link', () => {
      const source = createMockSource({ feed_url: 'https://example.com/feed.xml' });
      render(<SourceCard source={source} userRole="user" />);

      const link = screen.getByRole('link', { name: /visit feed:/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://example.com/feed.xml');
    });

    it('should open link in new tab', () => {
      const source = createMockSource({ feed_url: 'https://example.com/feed.xml' });
      render(<SourceCard source={source} userRole="user" />);

      const link = screen.getByRole('link', { name: /visit feed:/i });
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should include security attributes', () => {
      const source = createMockSource({ feed_url: 'https://example.com/feed.xml' });
      render(<SourceCard source={source} userRole="user" />);

      const link = screen.getByRole('link', { name: /visit feed:/i });
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should have correct accessibility label', () => {
      const source = createMockSource({ feed_url: 'https://example.com/feed.xml' });
      render(<SourceCard source={source} userRole="user" />);

      const link = screen.getByRole('link', { name: /visit feed:/i });
      expect(link).toHaveAttribute('aria-label', 'Visit feed: https://example.com/feed.xml');
    });

    it('should show tooltip with full URL', () => {
      const source = createMockSource({ feed_url: 'https://example.com/feed.xml' });
      render(<SourceCard source={source} userRole="user" />);

      const link = screen.getByRole('link', { name: /visit feed:/i });
      expect(link).toHaveAttribute('title', 'https://example.com/feed.xml');
    });

    it('should truncate long URLs visually', () => {
      const source = createMockSource({ feed_url: 'https://example.com/' + 'a'.repeat(100) });
      render(<SourceCard source={source} userRole="user" />);

      const link = screen.getByRole('link', { name: /visit feed:/i });
      expect(link).toHaveClass('truncate');
    });

    it('should be keyboard accessible', () => {
      const source = createMockSource({ feed_url: 'https://example.com/feed.xml' });
      render(<SourceCard source={source} userRole="user" />);

      const link = screen.getByRole('link', { name: /visit feed:/i });

      // Link should be focusable (not have tabIndex -1)
      expect(link).not.toHaveAttribute('tabIndex', '-1');

      // Link should be able to receive focus
      link.focus();
      expect(link).toHaveFocus();
    });

    it('should have hover and focus styles', () => {
      const source = createMockSource({ feed_url: 'https://example.com/feed.xml' });
      render(<SourceCard source={source} userRole="user" />);

      const link = screen.getByRole('link', { name: /visit feed:/i });
      expect(link).toHaveClass('hover:text-primary');
      expect(link).toHaveClass('transition-colors');
      expect(link).toHaveClass('focus-visible:ring-2');
    });

    it('should maintain block-level layout', () => {
      const source = createMockSource({ feed_url: 'https://example.com/feed.xml' });
      render(<SourceCard source={source} userRole="user" />);

      const link = screen.getByRole('link', { name: /visit feed:/i });
      expect(link).toHaveClass('block');
      expect(link).toHaveClass('text-xs');
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
      const link = screen.getByRole('link', { name: /visit feed:/i });
      expect(link).toHaveTextContent('https://min.com');
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

  describe('Edit Button', () => {
    const mockOnEdit = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('Visibility', () => {
      it('should show edit button when userRole is admin and onEdit is provided', () => {
        const source = createMockSource({ name: 'Tech Blog' });
        render(<SourceCard source={source} userRole="admin" onEdit={mockOnEdit} />);

        const editButton = screen.getByTestId('source-edit-button');
        expect(editButton).toBeInTheDocument();
      });

      it('should NOT show edit button when userRole is user', () => {
        const source = createMockSource();
        render(<SourceCard source={source} userRole="user" onEdit={mockOnEdit} />);

        expect(screen.queryByTestId('source-edit-button')).not.toBeInTheDocument();
      });

      it('should NOT show edit button when userRole is null', () => {
        const source = createMockSource();
        render(<SourceCard source={source} userRole={null} onEdit={mockOnEdit} />);

        expect(screen.queryByTestId('source-edit-button')).not.toBeInTheDocument();
      });

      it('should NOT show edit button when onEdit is not provided (even for admin)', () => {
        const source = createMockSource();
        render(<SourceCard source={source} userRole="admin" />);

        expect(screen.queryByTestId('source-edit-button')).not.toBeInTheDocument();
      });

      it('should show edit button only when both admin role AND onEdit callback are present', () => {
        const source = createMockSource();

        // Admin without onEdit - no button
        const { rerender } = render(<SourceCard source={source} userRole="admin" />);
        expect(screen.queryByTestId('source-edit-button')).not.toBeInTheDocument();

        // Admin with onEdit - button appears
        rerender(<SourceCard source={source} userRole="admin" onEdit={mockOnEdit} />);
        expect(screen.getByTestId('source-edit-button')).toBeInTheDocument();

        // User with onEdit - no button
        rerender(<SourceCard source={source} userRole="user" onEdit={mockOnEdit} />);
        expect(screen.queryByTestId('source-edit-button')).not.toBeInTheDocument();
      });
    });

    describe('Click Behavior', () => {
      it('should call onEdit with correct source object when clicked', () => {
        const source = createMockSource({
          id: 42,
          name: 'Tech Blog',
          feed_url: 'https://example.com/feed',
          active: true,
        });

        render(<SourceCard source={source} userRole="admin" onEdit={mockOnEdit} />);

        const editButton = screen.getByTestId('source-edit-button');
        fireEvent.click(editButton);

        expect(mockOnEdit).toHaveBeenCalledTimes(1);
        expect(mockOnEdit).toHaveBeenCalledWith(source);
      });

      it('should handle multiple clicks correctly', () => {
        const source = createMockSource({ id: 1, name: 'Test Source' });

        render(<SourceCard source={source} userRole="admin" onEdit={mockOnEdit} />);

        const editButton = screen.getByTestId('source-edit-button');

        // First click
        fireEvent.click(editButton);
        expect(mockOnEdit).toHaveBeenCalledTimes(1);
        expect(mockOnEdit).toHaveBeenCalledWith(source);

        // Second click
        fireEvent.click(editButton);
        expect(mockOnEdit).toHaveBeenCalledTimes(2);
        expect(mockOnEdit).toHaveBeenCalledWith(source);
      });

      it('should pass complete source object including all properties', () => {
        const source = createMockSource({
          id: 123,
          name: 'Complete Source',
          feed_url: 'https://complete.com/feed',
          active: false,
          last_crawled_at: '2025-01-10T10:00:00Z',
        });

        render(<SourceCard source={source} userRole="admin" onEdit={mockOnEdit} />);

        const editButton = screen.getByTestId('source-edit-button');
        fireEvent.click(editButton);

        expect(mockOnEdit).toHaveBeenCalledWith({
          id: 123,
          name: 'Complete Source',
          feed_url: 'https://complete.com/feed',
          active: false,
          last_crawled_at: '2025-01-10T10:00:00Z',
        });
      });
    });

    describe('Accessibility', () => {
      it('should have correct aria-label containing source name', () => {
        const source = createMockSource({ name: 'Tech Blog' });
        render(<SourceCard source={source} userRole="admin" onEdit={mockOnEdit} />);

        const editButton = screen.getByTestId('source-edit-button');
        expect(editButton).toHaveAttribute('aria-label', 'Edit source: Tech Blog');
      });

      it('should have correct aria-label for different source names', () => {
        const source = createMockSource({ name: 'News Feed 123' });
        render(<SourceCard source={source} userRole="admin" onEdit={mockOnEdit} />);

        const editButton = screen.getByTestId('source-edit-button');
        expect(editButton).toHaveAttribute('aria-label', 'Edit source: News Feed 123');
      });

      it('should have correct data-testid', () => {
        const source = createMockSource();
        render(<SourceCard source={source} userRole="admin" onEdit={mockOnEdit} />);

        const editButton = screen.queryByTestId('source-edit-button');
        expect(editButton).toBeInTheDocument();
      });

      it('should be keyboard accessible and focusable', () => {
        const source = createMockSource({ name: 'Test Source' });
        render(<SourceCard source={source} userRole="admin" onEdit={mockOnEdit} />);

        const editButton = screen.getByTestId('source-edit-button');

        // Button should be focusable
        editButton.focus();
        expect(editButton).toHaveFocus();

        // Button should not have tabIndex -1 (should be in tab order)
        expect(editButton).not.toHaveAttribute('tabIndex', '-1');
      });

      it('should have proper button role', () => {
        const source = createMockSource();
        render(<SourceCard source={source} userRole="admin" onEdit={mockOnEdit} />);

        const editButton = screen.getByTestId('source-edit-button');
        // Button element should have role="button" (implicit)
        expect(editButton.tagName).toBe('BUTTON');
      });

      it('should render Pencil icon for visual indication', () => {
        const source = createMockSource();
        const { container } = render(
          <SourceCard source={source} userRole="admin" onEdit={mockOnEdit} />
        );

        const editButton = screen.getByTestId('source-edit-button');
        const icon = editButton.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });
    });

    describe('Styling', () => {
      it('should have ghost variant and icon size', () => {
        const source = createMockSource();
        render(<SourceCard source={source} userRole="admin" onEdit={mockOnEdit} />);

        const editButton = screen.getByTestId('source-edit-button');
        expect(editButton).toHaveClass('h-8');
        expect(editButton).toHaveClass('w-8');
      });

      it('should not shrink in flex layout', () => {
        const source = createMockSource();
        render(<SourceCard source={source} userRole="admin" onEdit={mockOnEdit} />);

        const editButton = screen.getByTestId('source-edit-button');
        expect(editButton).toHaveClass('shrink-0');
      });
    });

    describe('Integration with Other Features', () => {
      it('should coexist with ActiveToggle for admin', () => {
        const mockOnUpdateActive = vi.fn();
        const source = createMockSource({ active: true });

        render(
          <SourceCard
            source={source}
            userRole="admin"
            onEdit={mockOnEdit}
            onUpdateActive={mockOnUpdateActive}
          />
        );

        // Both edit button and toggle should be present
        expect(screen.getByTestId('source-edit-button')).toBeInTheDocument();
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      it('should not interfere with status badge for non-admin', () => {
        const source = createMockSource({ active: true });

        render(<SourceCard source={source} userRole="user" onEdit={mockOnEdit} />);

        // Badge should be visible, edit button should not
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.queryByTestId('source-edit-button')).not.toBeInTheDocument();
      });

      it('should render correctly alongside other card elements', () => {
        const source = createMockSource({
          name: 'Tech Blog',
          feed_url: 'https://example.com/feed',
          active: true,
          last_crawled_at: new Date(NOW.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        });

        render(<SourceCard source={source} userRole="admin" onEdit={mockOnEdit} />);

        // All elements should be present
        expect(screen.getByRole('heading', { name: 'Tech Blog' })).toBeInTheDocument();
        expect(screen.getByTestId('source-edit-button')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /visit feed:/i })).toBeInTheDocument();
        expect(screen.getByText('1 hour ago')).toBeInTheDocument();
      });
    });

    describe('Edge Cases', () => {
      it('should handle source with special characters in name', () => {
        const source = createMockSource({ name: '<script>XSS</script>' });
        render(<SourceCard source={source} userRole="admin" onEdit={mockOnEdit} />);

        const editButton = screen.getByTestId('source-edit-button');
        expect(editButton).toHaveAttribute('aria-label', 'Edit source: <script>XSS</script>');

        fireEvent.click(editButton);
        expect(mockOnEdit).toHaveBeenCalledWith(source);
      });

      it('should handle source with unicode characters in name', () => {
        const source = createMockSource({ name: '日本語ソース 🎉' });
        render(<SourceCard source={source} userRole="admin" onEdit={mockOnEdit} />);

        const editButton = screen.getByTestId('source-edit-button');
        expect(editButton).toHaveAttribute('aria-label', 'Edit source: 日本語ソース 🎉');

        fireEvent.click(editButton);
        expect(mockOnEdit).toHaveBeenCalledWith(source);
      });

      it('should handle very long source names', () => {
        const longName = 'A'.repeat(200);
        const source = createMockSource({ name: longName });
        render(<SourceCard source={source} userRole="admin" onEdit={mockOnEdit} />);

        const editButton = screen.getByTestId('source-edit-button');
        expect(editButton).toHaveAttribute('aria-label', `Edit source: ${longName}`);
      });
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
      render(<SourceCard source={source} userRole="admin" onUpdateActive={mockOnUpdateActive} />);

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

      render(<SourceCard source={source} userRole="admin" onUpdateActive={mockOnUpdateActive} />);

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

      render(<SourceCard source={source} userRole="admin" onUpdateActive={mockOnUpdateActive} />);

      // Verify toggle is rendered (ActiveToggle receives the callback)
      const toggle = screen.getByRole('switch');
      expect(toggle).toBeInTheDocument();
      expect(toggle).toBeChecked();
    });

    it('should render ActiveToggle with correct initial state for inactive source', () => {
      const source = createMockSource({ active: false });

      render(<SourceCard source={source} userRole="admin" onUpdateActive={mockOnUpdateActive} />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toBeInTheDocument();
      expect(toggle).not.toBeChecked();
    });

    it('should memoize handleToggle callback', () => {
      const source = createMockSource();

      const { rerender } = render(
        <SourceCard source={source} userRole="admin" onUpdateActive={mockOnUpdateActive} />
      );

      // Re-render with same onUpdateActive
      rerender(<SourceCard source={source} userRole="admin" onUpdateActive={mockOnUpdateActive} />);

      // Should not cause unnecessary re-renders
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('should handle switching between admin and non-admin roles', () => {
      const source = createMockSource({ active: true });

      const { rerender } = render(<SourceCard source={source} userRole="user" />);

      // Initial: non-admin - should show badge
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();

      // Re-render as admin
      rerender(<SourceCard source={source} userRole="admin" onUpdateActive={mockOnUpdateActive} />);

      // Should now show toggle
      expect(screen.queryByText('Active')).not.toBeInTheDocument();
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('should render correctly for admin with active source', () => {
      const source = createMockSource({ active: true });

      render(<SourceCard source={source} userRole="admin" onUpdateActive={mockOnUpdateActive} />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toBeChecked();
    });

    it('should render correctly for admin with inactive source', () => {
      const source = createMockSource({ active: false });

      render(<SourceCard source={source} userRole="admin" onUpdateActive={mockOnUpdateActive} />);

      const toggle = screen.getByRole('switch');
      expect(toggle).not.toBeChecked();
    });
  });
});
