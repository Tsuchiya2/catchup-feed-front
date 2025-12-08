import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SourceFilter } from './SourceFilter';
import * as useSourcesModule from '@/hooks/useSources';
import type { Source } from '@/types/api';

// Mock useSources hook
vi.mock('@/hooks/useSources', () => ({
  useSources: vi.fn(),
}));

describe('SourceFilter', () => {
  const createMockSource = (overrides: Partial<Source> = {}): Source => ({
    id: 1,
    name: 'Test Source',
    feed_url: 'https://example.com/feed.xml',
    active: true,
    last_crawled_at: new Date().toISOString(),
    ...overrides,
  });

  const mockSources = [
    createMockSource({ id: 1, name: 'Tech Blog' }),
    createMockSource({ id: 2, name: 'News Feed' }),
    createMockSource({ id: 3, name: 'Dev Updates' }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSourcesModule.useSources).mockReturnValue({
      sources: mockSources,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  describe('Rendering', () => {
    it('should render with label', () => {
      render(<SourceFilter value={null} onChange={vi.fn()} />);

      expect(screen.getByLabelText('Source')).toBeInTheDocument();
    });

    it('should render All Sources option', () => {
      render(<SourceFilter value={null} onChange={vi.fn()} />);

      expect(screen.getByRole('option', { name: 'All Sources' })).toBeInTheDocument();
    });

    it('should render source options from API', () => {
      render(<SourceFilter value={null} onChange={vi.fn()} />);

      expect(screen.getByRole('option', { name: 'Tech Blog' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'News Feed' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Dev Updates' })).toBeInTheDocument();
    });

    it('should show selected source value', () => {
      render(<SourceFilter value={2} onChange={vi.fn()} />);

      expect(screen.getByLabelText('Source')).toHaveValue('2');
    });

    it('should show All Sources when value is null', () => {
      render(<SourceFilter value={null} onChange={vi.fn()} />);

      expect(screen.getByLabelText('Source')).toHaveValue('');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <SourceFilter value={null} onChange={vi.fn()} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Loading State', () => {
    it('should disable select when loading', () => {
      vi.mocked(useSourcesModule.useSources).mockReturnValue({
        sources: [],
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<SourceFilter value={null} onChange={vi.fn()} />);

      expect(screen.getByLabelText('Source')).toBeDisabled();
    });

    it('should show only All Sources option when loading', () => {
      vi.mocked(useSourcesModule.useSources).mockReturnValue({
        sources: [],
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<SourceFilter value={null} onChange={vi.fn()} />);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('All Sources');
    });
  });

  describe('Selection', () => {
    it('should call onChange with source ID when source is selected', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SourceFilter value={null} onChange={onChange} />);

      await user.selectOptions(screen.getByLabelText('Source'), '1');

      expect(onChange).toHaveBeenCalledWith(1);
    });

    it('should call onChange with null when All Sources is selected', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SourceFilter value={1} onChange={onChange} />);

      await user.selectOptions(screen.getByLabelText('Source'), '');

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('should call onChange when changing between sources', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SourceFilter value={1} onChange={onChange} />);

      await user.selectOptions(screen.getByLabelText('Source'), '2');

      expect(onChange).toHaveBeenCalledWith(2);
    });

    it('should parse source ID as integer', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SourceFilter value={null} onChange={onChange} />);

      await user.selectOptions(screen.getByLabelText('Source'), '3');

      expect(onChange).toHaveBeenCalledWith(3);
      expect(typeof onChange.mock.calls[0]![0]).toBe('number');
    });
  });

  describe('Disabled State', () => {
    it('should disable select when disabled prop is true', () => {
      render(<SourceFilter value={null} onChange={vi.fn()} disabled={true} />);

      expect(screen.getByLabelText('Source')).toBeDisabled();
    });

    it('should disable select when both disabled and loading', () => {
      vi.mocked(useSourcesModule.useSources).mockReturnValue({
        sources: mockSources,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<SourceFilter value={null} onChange={vi.fn()} disabled={true} />);

      expect(screen.getByLabelText('Source')).toBeDisabled();
    });

    it('should not disable select by default', () => {
      render(<SourceFilter value={null} onChange={vi.fn()} />);

      expect(screen.getByLabelText('Source')).not.toBeDisabled();
    });
  });

  describe('Empty Sources', () => {
    it('should only show All Sources when no sources available', () => {
      vi.mocked(useSourcesModule.useSources).mockReturnValue({
        sources: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<SourceFilter value={null} onChange={vi.fn()} />);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('All Sources');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label', () => {
      render(<SourceFilter value={null} onChange={vi.fn()} />);

      expect(screen.getByRole('combobox', { name: 'Filter by source' })).toBeInTheDocument();
    });

    it('should have associated label', () => {
      render(<SourceFilter value={null} onChange={vi.fn()} />);

      const select = screen.getByLabelText('Source');
      expect(select).toHaveAttribute('id', 'source-filter');
    });
  });
});
