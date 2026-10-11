'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// ── Public links (visible without login) ─────────────────────────────────────
const publicLinks = [
  { href: '/opportunities', label: 'Opportunities' },
  { href: '/search',        label: 'Search' },
];

// ── Private links (students only) ────────────────────────────────────────────
const privateLinks = [
  { href: '/dashboard',     label: 'Dashboard' },
  { href: '/matches',       label: 'Matches' },
  { href: '/applications',  label: 'Applications' },
  { href: '/help',          label: 'Help' },
];

export default function Nav() {
  const { data: session, status } = useSession();
  const pathname   = usePathname();
  const [menuOpen, setMenuOpen]         = useState(false);
  const [userOpen, setUserOpen]         = useState(false);
  const [unreadCount, setUnreadCount]   = useState(0);
  const isAdmin = session?.user.role === 'ADMIN';

  // Close dropdowns on route change
  useEffect(() => { setMenuOpen(false); setUserOpen(false); }, [pathname]);

  // Fetch unread notification count
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/v1/me/notifications')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.meta?.unread) setUnreadCount(d.meta.unread); })
      .catch(() => null);
  }, [status, pathname]);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  const linkCls = (href: string) =>
    `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
      isActive(href)
        ? 'bg-brand-50 text-brand-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-brand-700'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-white text-sm font-bold">S</span>
          <span className="text-lg font-semibold text-slate-900">SilkStudy</span>
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="hidden items-center gap-0.5 sm:flex">
          {/* Public links — always visible */}
          {publicLinks.map((l) => (
            <Link key={l.href} href={l.href} className={linkCls(l.href)}>{l.label}</Link>
          ))}

          {status === 'authenticated' && (
            <>
              {/* Private links */}
              {privateLinks.map((l) => (
                <Link key={l.href} href={l.href} className={linkCls(l.href)}>{l.label}</Link>
              ))}

              {/* Notifications bell */}
              <Link href="/notifications" className={`relative rounded-md px-2.5 py-1.5 transition-colors ${isActive('/notifications') ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-100 hover:text-brand-700'}`} title="Notifications">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {isAdmin && (
                <Link href="/admin" className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${isActive('/admin') ? 'bg-red-50 text-red-700' : 'text-red-600 hover:bg-red-50'}`}>
                  Admin
                </Link>
              )}

              {/* User dropdown */}
              <div className="relative ml-2 pl-2 border-l border-slate-200">
                <button
                  onClick={() => setUserOpen(!userOpen)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
                    {session.user.email[0].toUpperCase()}
                  </span>
                  <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userOpen && (
                  <div className="absolute right-0 mt-1 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-800 truncate">{session.user.email}</p>
                      <p className="text-xs text-slate-400 capitalize">{session.user.role.toLowerCase()}</p>
                    </div>
                    <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setUserOpen(false)}>
                      <span>👤</span> My Profile
                    </Link>
                    <Link href="/notifications" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setUserOpen(false)}>
                      <span>🔔</span> Notifications
                      {unreadCount > 0 && <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unreadCount}</span>}
                    </Link>
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <span>→</span> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {status !== 'authenticated' && status !== 'loading' && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-200">
              <Link href="/auth/login" className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-brand-700 transition-colors">
                Sign in
              </Link>
              <Link href="/auth/register" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 transition-colors">
                Get started
              </Link>
            </div>
          )}
        </nav>

        {/* ── Mobile menu button ── */}
        <button className="sm:hidden p-2 text-slate-600" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className="sm:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-0.5">
          {publicLinks.map((l) => (
            <Link key={l.href} href={l.href} className={`block rounded-md px-3 py-2 text-sm font-medium ${isActive(l.href) ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'}`}>
              {l.label}
            </Link>
          ))}

          {status === 'authenticated' && (
            <>
              <div className="border-t border-slate-100 pt-1 mt-1">
                {privateLinks.map((l) => (
                  <Link key={l.href} href={l.href} className={`block rounded-md px-3 py-2 text-sm font-medium ${isActive(l.href) ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                    {l.label}
                  </Link>
                ))}
                <Link href="/notifications" className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Notifications
                  {unreadCount > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">{unreadCount}</span>}
                </Link>
                <Link href="/profile" className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  My Profile
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="block rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                    Admin
                  </Link>
                )}
              </div>
              <div className="border-t border-slate-100 pt-2 mt-1">
                <p className="px-3 text-xs text-slate-400 truncate mb-1">{session.user.email}</p>
                <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full text-left rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                  Sign out
                </button>
              </div>
            </>
          )}

          {status !== 'authenticated' && status !== 'loading' && (
            <div className="border-t border-slate-100 pt-2 mt-1 flex gap-2">
              <Link href="/auth/login" className="flex-1 rounded-md px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50">Sign in</Link>
              <Link href="/auth/register" className="flex-1 rounded-md bg-brand-700 px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-800">Get started</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
