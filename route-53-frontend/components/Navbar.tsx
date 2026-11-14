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
    `px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all duration-200 ${
      pathname === href
        ? 'bg-[#D9AE54]/20 text-[#D9AE54] border border-[#D9AE54]/40 font-semibold shadow-xs'
        : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#0b0b0c]/85 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none select-none"
          >
            <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-md ring-1 ring-[#D9AE54]/30 group-hover:scale-105 transition-transform duration-200 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon-192.png"
                alt="Global VenueFinder Icon"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-base tracking-tight text-zinc-100 leading-tight">
                Global <span className="font-sans font-light text-[#D9AE54]">VenueFinder</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#121215] p-1 rounded-full border border-white/[0.06]">
            <Link href="/" className={navLinkClass('/')}>
              Collection
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
                  Host Portal
                </Link>
                <Link
                  href="/host/venues/new"
                  className={navLinkClass('/host/venues/new')}
                >
                  <span className="text-[#D9AE54] font-semibold">+ List Space</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right side auth controls + Edge Telemetry */}
        <div className="hidden md:flex items-center gap-3">
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-[#121215] border border-white/[0.06] text-[10px] font-mono text-zinc-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-zinc-300 font-semibold">Edge HTTPS</span>
            <span className="text-zinc-600">•</span>
            <span>US-East / EU-West</span>
          </div>

          {loading ? (
            <div className="h-8 w-28 rounded-full bg-zinc-800/70 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-[#141417] border border-white/[0.07]">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#e3ba60] to-[#b88c32] text-[#0b0b0c] font-bold text-xs flex items-center justify-center shadow-xs">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-zinc-200 leading-tight">
                    {user.name}
                  </p>
                  <span className="text-[9px] uppercase font-mono tracking-widest text-[#D9AE54] block leading-none mt-0.5">
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-full text-xs font-mono font-medium border border-white/10 hover:bg-white/[0.05] transition-colors cursor-pointer text-zinc-400 hover:text-zinc-200"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-full text-xs font-medium text-zinc-300 hover:text-white transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider btn-volumetric-gold shadow-xs"
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
          className="md:hidden p-2 rounded-xl text-zinc-300 hover:bg-white/[0.05]"
          aria-label="Toggle navigation menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-[#0c0c0e] px-4 py-4 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-xs font-mono text-zinc-200 hover:bg-white/[0.05]"
          >
            Collection
          </Link>
          {user && (
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-mono text-zinc-200 hover:bg-white/[0.05]"
            >
              My Bookings
            </Link>
          )}
          {(user?.role === 'host' || user?.role === 'admin') && (
            <>
              <Link
                href="/host/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-xs font-mono text-zinc-200 hover:bg-white/[0.05]"
              >
                Host Portal
              </Link>
              <Link
                href="/host/venues/new"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-xs font-semibold text-[#D9AE54]"
              >
                + List a Space
              </Link>
            </>
          )}
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
            {user ? (
              <div className="flex items-center justify-between w-full">
                <div>
                  <p className="text-xs font-bold text-zinc-100">{user.name}</p>
                  <p className="text-[10px] text-[#D9AE54] uppercase font-mono">{user.role}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#1a1a1e] text-zinc-300"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex gap-2 w-full pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-full text-xs font-semibold border border-white/10 text-zinc-300"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-full text-xs font-bold uppercase tracking-wider btn-volumetric-gold"
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
