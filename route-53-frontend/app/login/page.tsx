'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { extractFieldErrors, loginFormSchema } from '../../lib/validations';

function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = loginFormSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(extractFieldErrors(parsed.error));
      return;
    }

    setSubmitting(true);
    try {
      const loggedInUser = await login(parsed.data);
      if (redirectTo) {
        router.push(redirectTo);
      } else if (loggedInUser.role === 'host') {
        router.push('/host/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setErrors({
        form: err instanceof Error ? err.message : 'Invalid email or password',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (role: 'renter' | 'host') => {
    setEmail(
      role === 'host'
        ? 'host@venuefinder.global'
        : 'renter@venuefinder.global',
    );
    setPassword('Password123!');
    setErrors({});
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md surface-resting rounded-3xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-3xl font-bold text-zinc-100">
            Welcome Back
          </h1>
          <p className="text-xs font-mono text-zinc-400">
            Sign in to manage your reservations or curate architectural spaces
          </p>
        </div>

        {/* Quick Demo Credentials */}
        <div className="p-3.5 rounded-2xl bg-[#09090b]/80 border border-white/[0.04] space-y-2.5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#D9AE54] text-center font-bold">
            Pre-Seeded Demo Credentials
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('renter')}
              className="py-2 px-3 rounded-xl text-xs font-mono font-medium border border-white/5 hover:border-[#D9AE54]/40 bg-[#161619] hover:bg-[#1e1e23] text-zinc-200 transition-colors cursor-pointer"
            >
              👤 Demo Renter
            </button>
            <button
              type="button"
              onClick={() => fillDemo('host')}
              className="py-2 px-3 rounded-xl text-xs font-mono font-medium border border-white/5 hover:border-[#D9AE54]/40 bg-[#161619] hover:bg-[#1e1e23] text-zinc-200 transition-colors cursor-pointer"
            >
              🏛️ Demo Host
            </button>
          </div>
        </div>

        {errors.form && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs font-medium text-rose-300">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-xl recessed-channel px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#D9AE54]"
            />
            {errors.email && (
              <p className="text-xs text-rose-400 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl recessed-channel px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#D9AE54]"
            />
            {errors.password && (
              <p className="text-xs text-rose-400 mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl btn-volumetric-gold font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-400">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-semibold text-[#D9AE54] hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="h-80 w-full max-w-md rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
