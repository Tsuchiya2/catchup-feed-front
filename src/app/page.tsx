import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { FileText, Rss, Zap } from 'lucide-react';

/**
 * Landing Page
 *
 * Public homepage that introduces Catchup Feed and provides a link to login.
 * Features a cyber/tech theme matching the brand logo.
 */
export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 bg-cyber-radial" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(190_100%_50%/0.15),transparent)]" />

      {/* Hero Section */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Logo/Icon with glow effect */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-primary/20 blur-2xl" />
              <Image
                src="/catch-feed-icon.webp"
                alt="Catchup Feed"
                width={80}
                height={80}
                className="relative rounded-2xl shadow-glow-lg"
              />
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-4">
            <h1 className="text-glow text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
              Catchup Feed
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Your personalized news aggregator. Stay updated with the latest articles from your
              favorite sources, all in one place.
            </p>
          </div>

          {/* CTA Button with glow */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" variant="glow" className="w-full sm:w-auto">
              <Link href="/login">Get Started</Link>
            </Button>
          </div>

          {/* Features with cyber styling */}
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            <div className="group flex flex-col items-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-glow-sm">
                <FileText className="h-7 w-7" />
              </div>
              <h3 className="font-semibold text-foreground">Centralized Articles</h3>
              <p className="text-sm text-muted-foreground">
                All your news in one convenient location
              </p>
            </div>

            <div className="group flex flex-col items-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-glow-sm">
                <Rss className="h-7 w-7" />
              </div>
              <h3 className="font-semibold text-foreground">Multiple Sources</h3>
              <p className="text-sm text-muted-foreground">
                Aggregate content from various RSS feeds
              </p>
            </div>

            <div className="group flex flex-col items-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-glow-sm">
                <Zap className="h-7 w-7" />
              </div>
              <h3 className="font-semibold text-foreground">Stay Updated</h3>
              <p className="text-sm text-muted-foreground">
                Never miss important news from your sources
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative cyber line */}
      <div className="absolute bottom-24 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      {/* Footer */}
      <footer className="relative border-t border-border/50 py-6">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Catchup Feed. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
