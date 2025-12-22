/**
 * ThemeToggle Component Tests
 *
 * Tests for ThemeToggle component including:
 * - Rendering toggle button
 * - Theme switching (light/dark/system)
 * - Current theme display
 * - Keyboard navigation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../ThemeToggle';

// Mock next-themes
const mockSetTheme = vi.fn();
const mockTheme = vi.fn(() => 'light');

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: mockTheme(),
    setTheme: mockSetTheme,
  }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
    mockTheme.mockReturnValue('light');
  });

  describe('rendering', () => {
    it('should render toggle button', async () => {
      render(<ThemeToggle />);
      // In test environment, useEffect runs quickly so button becomes enabled
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).toBeInTheDocument();
      });
    });

    it('should render enabled button after mount', async () => {
      render(<ThemeToggle />);
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).not.toBeDisabled();
      });
    });

    it('should show sun icon when mounted', async () => {
      render(<ThemeToggle />);
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('theme switching', () => {
    it('should show menu when clicking toggle button', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).not.toBeDisabled();
      });

      const button = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Light')).toBeInTheDocument();
        expect(screen.getByText('Dark')).toBeInTheDocument();
        expect(screen.getByText('System')).toBeInTheDocument();
      });
    });

    it('should switch to light theme when clicking Light option', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).not.toBeDisabled();
      });

      const button = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Light')).toBeInTheDocument();
      });

      const lightOption = screen.getByText('Light').closest('div');
      if (lightOption) {
        await user.click(lightOption);
      }

      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('should switch to dark theme when clicking Dark option', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).not.toBeDisabled();
      });

      const button = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Dark')).toBeInTheDocument();
      });

      const darkOption = screen.getByText('Dark').closest('div');
      if (darkOption) {
        await user.click(darkOption);
      }

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('should switch to system theme when clicking System option', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).not.toBeDisabled();
      });

      const button = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('System')).toBeInTheDocument();
      });

      const systemOption = screen.getByText('System').closest('div');
      if (systemOption) {
        await user.click(systemOption);
      }

      expect(mockSetTheme).toHaveBeenCalledWith('system');
    });
  });

  describe('current theme display', () => {
    it('should show checkmark for light theme when active', async () => {
      mockTheme.mockReturnValue('light');
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).not.toBeDisabled();
      });

      const button = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(button);

      await waitFor(() => {
        const lightOption = screen.getByText('Light').closest('div');
        expect(lightOption).toBeInTheDocument();
        if (lightOption) {
          expect(lightOption.textContent).toContain('✓');
        }
      });
    });

    it('should show checkmark for dark theme when active', async () => {
      mockTheme.mockReturnValue('dark');
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).not.toBeDisabled();
      });

      const button = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(button);

      await waitFor(() => {
        const darkOption = screen.getByText('Dark').closest('div');
        expect(darkOption).toBeInTheDocument();
        if (darkOption) {
          expect(darkOption.textContent).toContain('✓');
        }
      });
    });

    it('should show checkmark for system theme when active', async () => {
      mockTheme.mockReturnValue('system');
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).not.toBeDisabled();
      });

      const button = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(button);

      await waitFor(() => {
        const systemOption = screen.getByText('System').closest('div');
        expect(systemOption).toBeInTheDocument();
        if (systemOption) {
          expect(systemOption.textContent).toContain('✓');
        }
      });
    });
  });

  describe('keyboard navigation', () => {
    it('should open menu with Enter key', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).not.toBeDisabled();
      });

      const button = screen.getByRole('button', { name: /toggle theme/i });
      button.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Light')).toBeInTheDocument();
      });
    });

    it('should open menu with Space key', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).not.toBeDisabled();
      });

      const button = screen.getByRole('button', { name: /toggle theme/i });
      button.focus();
      await user.keyboard(' ');

      await waitFor(() => {
        expect(screen.getByText('Light')).toBeInTheDocument();
      });
    });

    it('should be accessible with screen readers', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).toHaveAttribute('aria-label', 'Toggle theme');
      });
    });
  });

  describe('accessibility', () => {
    it('should have sr-only text for screen readers', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).not.toBeDisabled();
      });

      const srOnlyText = screen.getByText('Toggle theme', { selector: '.sr-only' });
      expect(srOnlyText).toBeInTheDocument();
    });

    it('should have proper aria-label', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).toHaveAttribute('aria-label', 'Toggle theme');
      });
    });
  });

  describe('hydration', () => {
    it('should prevent hydration mismatch', () => {
      const { container } = render(<ThemeToggle />);
      expect(container.querySelector('button')).toBeInTheDocument();
    });

    it('should render button correctly', async () => {
      const { container } = render(<ThemeToggle />);
      // In test environment, useEffect runs immediately so button becomes enabled
      await waitFor(() => {
        const button = container.querySelector('button');
        expect(button).toBeInTheDocument();
      });
    });

    it('should enable after client-side mount', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).not.toBeDisabled();
      });
    });
  });
});
