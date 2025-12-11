import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
  },
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Background Effects - matching main theme */}
      <div className="pointer-events-none fixed inset-0 bg-cyber-radial" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(190_100%_50%/0.08),transparent)]" />

      {/* Content */}
      <div className="relative">
        <Header showAuthLinks={false} />
        <main className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
