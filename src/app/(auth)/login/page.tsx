'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';

/**
 * Login Page
 *
 * Public page that displays the login form.
 * Features a cyber/tech theme matching the brand logo.
 * Authenticated users will be redirected to /dashboard by middleware.
 */
export default function LoginPage() {
  const { login } = useAuth();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6 lg:px-8">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 bg-cyber-radial" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,hsl(190_100%_50%/0.12),transparent)]" />

      {/* Content */}
      <div className="relative w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute -inset-3 rounded-full bg-primary/20 blur-xl" />
              <Image
                src="/catch-feed-icon.webp"
                alt="Catchup Feed"
                width={64}
                height={64}
                className="relative rounded-2xl shadow-glow"
              />
            </div>
          </div>
          <h1 className="text-glow-sm text-3xl font-bold tracking-tight">Catchup Feed</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access your personalized news feed
          </p>
        </div>

        <LoginForm onLogin={login} />

        {/* Back to Home Link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
