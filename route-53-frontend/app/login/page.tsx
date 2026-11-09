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
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Welcome Back
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in to manage your bookings or host event spaces
          </p>
        </div>

        {/* Quick Demo Credentials */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
            Quick Fill Demo Accounts
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('renter')}
              className="py-1.5 px-3 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              👤 Demo Renter
            </button>
            <button
              type="button"
              onClick={() => fillDemo('host')}
              className="py-1.5 px-3 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              🏛️ Demo Host
            </button>
          </div>
        </div>

        {errors.form && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-700 dark:text-rose-300">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            {errors.email && (
              <p className="text-xs text-rose-600 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            {errors.password && (
              <p className="text-xs text-rose-600 mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm shadow-sm transition-colors cursor-pointer"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
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
