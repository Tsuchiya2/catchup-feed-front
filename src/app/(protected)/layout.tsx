'use client';

import * as React from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';

/**
 * Protected Layout
 *
 * Layout for protected pages (dashboard, articles, sources)
 * Features cyber/tech theme matching the brand.
 * Includes header navigation and logout functionality
 */
export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { logout } = useAuth();

  return (
    <div className="relative min-h-screen bg-background">
      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 bg-cyber-radial" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(190_100%_50%/0.08),transparent)]" />

      {/* Content */}
      <div className="relative">
        <Header onLogout={logout} />
        <main className="px-4 pb-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
