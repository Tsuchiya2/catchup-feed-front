'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Theme Provider Component
 *
 * Wraps the application with next-themes provider for dark mode support.
 * Configured to use class-based theme switching compatible with Tailwind CSS.
 *
 * Features:
 * - System preference detection
 * - localStorage persistence
 * - No transition flash on page load
 * - Defaults to system theme
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
