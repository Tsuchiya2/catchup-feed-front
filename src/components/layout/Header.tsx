'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onLogout?: () => void;
  showAuthLinks?: boolean;
}

const mainNavigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Articles', href: '/articles' },
  { name: 'Sources', href: '/sources' },
];

const legalNavigation = [
  { name: 'Terms', href: '/terms' },
  { name: 'Privacy', href: '/privacy' },
];

export function Header({ onLogout, showAuthLinks = true }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header
      data-testid="header"
      className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
    >
      {/* Cyber accent line at top */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <nav className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center">
          <Link
            href="/dashboard"
            data-testid="header-logo"
            className="group flex items-center space-x-2 transition-all duration-200"
          >
            <div className="relative">
              <Image
                src="/catch-feed-icon.webp"
                alt="Catchup Feed"
                width={32}
                height={32}
                className="rounded-lg transition-all duration-300 group-hover:shadow-glow-sm"
              />
            </div>
            <span className="text-lg font-semibold transition-all duration-200 group-hover:text-primary">
              Catchup Feed
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div data-testid="header-nav-desktop" className="hidden items-center space-x-1 md:flex">
          {/* Main navigation (protected pages) */}
          {showAuthLinks &&
            mainNavigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'relative px-4 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'text-primary text-glow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary shadow-glow-sm" />
                  )}
                </Link>
              );
            })}

          {/* Divider */}
          {showAuthLinks && <div className="mx-2 h-6 w-px bg-border/50" />}

          {/* Legal navigation (public pages) */}
          {legalNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'px-3 py-2 text-sm font-medium transition-all duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Desktop Logout Button */}
        {showAuthLinks && onLogout && (
          <div className="hidden md:block">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              data-testid="header-logout-button"
            >
              Logout
            </Button>
          </div>
        )}

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            data-testid="header-mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div
          data-testid="header-mobile-menu"
          className="border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden"
        >
          <div className="container space-y-1 px-4 py-4">
            {/* Main navigation */}
            {showAuthLinks &&
              mainNavigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      'block rounded-md px-3 py-2 text-base font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary/10 text-primary border-l-2 border-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}

            {/* Legal navigation */}
            {showAuthLinks && <div className="my-2 border-t border-border/30 pt-2" />}
            {legalNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    'block rounded-md px-3 py-2 text-base font-medium transition-all duration-200',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  {item.name}
                </Link>
              );
            })}

            {/* Logout button */}
            {showAuthLinks && onLogout && (
              <div className="pt-4">
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
