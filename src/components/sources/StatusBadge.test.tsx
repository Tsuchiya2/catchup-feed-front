import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  describe('Active State', () => {
    it('should render "Active" text when active is true', () => {
      render(<StatusBadge active={true} />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should use success variant when active', () => {
      const { container } = render(<StatusBadge active={true} />);
      // The Badge component with success variant (cyber glow theme)
      const badge = container.firstChild as HTMLElement | null;
      // Check for success variant class - uses cyan/aqua colors
      expect(badge?.className).toMatch(/text-\[#a0ffff\]|bg-\[#a0ffff\]/i);
    });

    it('should have correct aria-label for active state', () => {
      render(<StatusBadge active={true} />);
      expect(screen.getByLabelText('Status: Active')).toBeInTheDocument();
    });
  });

  describe('Inactive State', () => {
    it('should render "Inactive" text when active is false', () => {
      render(<StatusBadge active={false} />);
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('should use secondary variant when inactive', () => {
      const { container } = render(<StatusBadge active={false} />);
      // The Badge component with secondary variant (gray theme)
      const badge = container.firstChild as HTMLElement | null;
      expect(badge?.className).toMatch(/text-gray-400|bg-gray-600/i);
    });

    it('should have correct aria-label for inactive state', () => {
      render(<StatusBadge active={false} />);
      expect(screen.getByLabelText('Status: Inactive')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(<StatusBadge active={true} className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should maintain base styling with custom className', () => {
      const { container } = render(<StatusBadge active={true} className="custom-class" />);
      // Should still be a badge (have inline-flex from badge styles)
      expect(container.firstChild).toHaveClass('inline-flex');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined active as falsy (inactive)', () => {
      // TypeScript would complain, but testing runtime behavior
      render(<StatusBadge active={undefined as unknown as boolean} />);
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('should handle null active as falsy (inactive)', () => {
      // TypeScript would complain, but testing runtime behavior
      render(<StatusBadge active={null as unknown as boolean} />);
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label attribute', () => {
      render(<StatusBadge active={true} />);
      const badge = screen.getByText('Active');
      expect(badge).toHaveAttribute('aria-label');
    });

    it('should be readable by screen readers with status information', () => {
      render(<StatusBadge active={true} />);
      expect(screen.getByLabelText('Status: Active')).toBeInTheDocument();
    });

    it('should have visible text for sighted users', () => {
      render(<StatusBadge active={false} />);
      expect(screen.getByText('Inactive')).toBeVisible();
    });
  });
});
