import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/modules/auth/auth.config';
import Providers from '@/components/providers';
import Nav from '@/components/nav';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'SilkStudy', template: '%s | SilkStudy' },
  description: 'Discover study-abroad opportunities matched to your profile.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-slate-50">
        <Providers session={session}>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
