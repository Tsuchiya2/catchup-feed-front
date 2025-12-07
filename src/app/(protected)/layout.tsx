'use client';

import * as React from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';

/**
 * Protected Layout
 *
 * Layout for protected pages (dashboard, articles, sources)
 * Includes header navigation and logout functionality
 */
export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={logout} />
      <main className="px-4 pb-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
