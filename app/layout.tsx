import './globals.css';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/modules/auth/auth.config';
import Providers from '@/components/providers';
import Nav from '@/components/nav';

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 font-sans">
        <Providers session={session}>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
