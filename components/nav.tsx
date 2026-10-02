'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function Nav() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-white text-sm font-bold">
            S
          </span>
          <span className="text-lg font-semibold text-slate-900">SilkStudy</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 sm:flex">
          {status === 'authenticated' ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-600 hover:text-brand-700 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/search"
                className="text-sm font-medium text-slate-600 hover:text-brand-700 transition-colors"
              >
                Search
              </Link>
              <Link
                href="/profile"
                className="text-sm font-medium text-slate-600 hover:text-brand-700 transition-colors"
              >
                My Profile
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  {session.user.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-slate-600 hover:text-brand-700 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/login"
                className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="sm:hidden p-2 text-slate-600"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-2">
          {status === 'authenticated' ? (
            <>
              <Link href="/dashboard" className="block py-2 text-sm font-medium text-slate-700" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link href="/search" className="block py-2 text-sm font-medium text-slate-700" onClick={() => setMenuOpen(false)}>Search</Link>
              <Link href="/profile" className="block py-2 text-sm font-medium text-slate-700" onClick={() => setMenuOpen(false)}>My Profile</Link>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full text-left py-2 text-sm text-red-600">Sign out</button>
            </>
          ) : (
            <Link href="/auth/login" className="block py-2 text-sm font-medium text-brand-700" onClick={() => setMenuOpen(false)}>Sign in</Link>
          )}
        </div>
      )}
    </header>
  );
}
