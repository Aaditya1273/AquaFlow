import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/layout/Header';
import { NetworkIndicator } from '@/components/abstraction/NetworkIndicator';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AquaFlow - Unified Arbitrum Liquidity',
  description: 'Intent-based liquidity routing across the Arbitrum ecosystem. Powered by Stylus.',
  keywords: ['DeFi', 'Arbitrum', 'Stylus', 'Liquidity', 'Intent-based', 'Web3'],
  authors: [{ name: 'AquaFlow Team' }],
  openGraph: {
    title: 'AquaFlow - Unified Arbitrum Liquidity',
    description: 'Intent-based liquidity routing across the Arbitrum ecosystem. Powered by Stylus.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AquaFlow - Unified Arbitrum Liquidity',
    description: 'Intent-based liquidity routing across the Arbitrum ecosystem. Powered by Stylus.',
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#28A0F0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={cn(inter.className, 'min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white antialiased')}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            
            {/* Floating Network Indicator */}
            <div className="fixed bottom-4 right-4 z-40">
              <NetworkIndicator />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}