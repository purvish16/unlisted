import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/shared/Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Unlisted — Invest Before the IPO', template: '%s | Unlisted' },
  description: "India's first retail-accessible unlisted shares exchange.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased bg-surface text-on-surface`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
