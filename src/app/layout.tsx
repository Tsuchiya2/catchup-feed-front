import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/QueryProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

/**
 * Get the base URL for metadata
 * Priority: NEXT_PUBLIC_APP_URL > VERCEL_URL > localhost
 */
function getMetadataBase(): URL {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return new URL(process.env.NEXT_PUBLIC_APP_URL);
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }
  return new URL('http://localhost:3000');
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: 'Catchup Feed - Stay Updated',
  description: 'Your personalized news aggregator with AI-powered insights',
  openGraph: {
    title: 'Catchup Feed - Stay Updated',
    description: 'Your personalized news aggregator with AI-powered insights',
    url: 'https://catchup-feed.com',
    siteName: 'Catchup Feed',
    images: [
      {
        url: '/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Catchup Feed - Your personalized news aggregator',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Catchup Feed - Stay Updated',
    description: 'Your personalized news aggregator with AI-powered insights',
    images: ['/og-image.webp'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.variable}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
