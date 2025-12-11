import Link from 'next/link';

export function Footer() {
  return (
    <footer data-testid="footer" className="relative border-t border-border/50 py-8 mt-16">
      {/* Cyber accent line */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Copyright */}
          <p data-testid="footer-copyright" className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Catchup Feed. All rights reserved.
          </p>

          {/* Legal Links */}
          <div className="flex gap-6">
            <Link
              href="/terms"
              data-testid="footer-link-terms"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              data-testid="footer-link-privacy"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
