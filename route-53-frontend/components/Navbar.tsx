'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    router.push('/');
  };

  const navLinkClass = (href: string) =>
    `px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
      pathname === href
        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:shadow-indigo-500/25 transition-shadow">
              V
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white block leading-none">
                Global VenueFinder
              </span>
              <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 tracking-wide">
                MULTI-REGION EVENT SPACES
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/" className={navLinkClass('/')}>
              Explore Spaces
            </Link>
            {user && (
              <Link href="/dashboard" className={navLinkClass('/dashboard')}>
                My Bookings
              </Link>
            )}
            {(user?.role === 'host' || user?.role === 'admin') && (
              <>
                <Link
                  href="/host/dashboard"
                  className={navLinkClass('/host/dashboard')}
                >
                  Host Dashboard
                </Link>
                <Link
                  href="/host/venues/new"
                  className={navLinkClass('/host/venues/new')}
                >
                  + List a Venue
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="h-9 w-32 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                  {user.name}
                </p>
                <span className="inline-block text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3.5 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Toggle navigation menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Explore Spaces
          </Link>
          {user && (
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              My Bookings
            </Link>
          )}
          {(user?.role === 'host' || user?.role === 'admin') && (
            <>
              <Link
                href="/host/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Host Dashboard
              </Link>
              <Link
                href="/host/venues/new"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                + List a Venue
              </Link>
            </>
          )}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {user ? (
              <>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500 uppercase">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex gap-2 w-full">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
