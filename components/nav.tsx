'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

const navLinks = [
  { href: '/dashboard',     label: 'Dashboard' },
  { href: '/search',        label: 'Search' },
  { href: '/matches',       label: 'Matches' },
  { href: '/applications',  label: 'Applications' },
  { href: '/profile',       label: 'Profile' },
];

export default function Nav() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = session?.user.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-white text-sm font-bold">
            S
          </span>
          <span className="text-lg font-semibold text-slate-900">SilkStudy</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          {status === 'authenticated' ? (
            <>
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-brand-700 transition-colors"
                >
                  {l.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Admin
                </Link>
              )}
              <div className="ml-4 flex items-center gap-2 pl-4 border-l border-slate-200">
                <span className="hidden lg:block text-xs text-slate-400 max-w-[140px] truncate">
                  {session.user.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors whitespace-nowrap"
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-brand-700 transition-colors">
                Sign in
              </Link>
              <Link href="/auth/register" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 transition-colors">
                Get started
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="sm:hidden p-2 text-slate-600"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          {status === 'authenticated' ? (
            <>
              {navLinks.map((l) => (
                <Link key={l.href} href={l.href} className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>
                  {l.label}
                </Link>
              ))}
              {isAdmin && (
                <Link href="/admin" className="block rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50" onClick={() => setMenuOpen(false)}>
                  Admin
                </Link>
              )}
              <div className="pt-2 border-t border-slate-100">
                <p className="px-3 text-xs text-slate-400 truncate mb-1">{session.user.email}</p>
                <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full text-left rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>Sign in</Link>
              <Link href="/auth/register" className="block rounded-md px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50" onClick={() => setMenuOpen(false)}>Get started</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
