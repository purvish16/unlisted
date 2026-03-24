import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Unlisted — Invest Before the IPO',
    template: '%s | Unlisted',
  },
  description:
    "India's first retail-accessible unlisted shares exchange. Discover, invest in, and trade shares of pre-IPO private companies.",
  keywords: ['unlisted shares', 'pre-IPO', 'private equity', 'India', 'startup investing'],
  authors: [{ name: 'Unlisted' }],
  metadataBase: new URL('https://investors.unlisted.in'),
  openGraph: {
    title: 'Unlisted — Invest Before the IPO',
    description: "India's first retail-accessible unlisted shares exchange.",
    type: 'website',
    locale: 'en_IN',
    url: 'https://investors.unlisted.in',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased bg-surface text-on-surface`}>
        {children}
      </body>
    </html>
  );
}
