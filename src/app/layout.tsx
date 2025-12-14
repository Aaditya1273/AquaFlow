import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/layout/Header';
import SmoothScrolling from '@/components/SmoothScrolling';


const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'AquaFlow - Intent-Based DeFi Router',
  description: 'Revolutionary intent-based liquidity routing on Arbitrum with 76% gas savings. Just say what you want to swap.',
  keywords: ['DeFi', 'Arbitrum', 'Stylus', 'Intent-based', 'Liquidity', 'Router', 'Gas Savings', 'Natural Language'],
  authors: [{ name: 'AquaFlow Team' }],
  metadataBase: new URL('https://aquaflow.dev'),
  openGraph: {
    title: 'AquaFlow - Intent-Based DeFi Router',
    description: 'Revolutionary intent-based liquidity routing on Arbitrum with 76% gas savings',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AquaFlow - Intent-Based DeFi Router',
    description: 'Just say "Swap 100 USDC to USDT" and watch the magic happen',
    images: ['/og-image.png'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1e40af',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-black`}>
        <Providers>
          <SmoothScrolling />
          <Header />
          <main className="pt-16">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}