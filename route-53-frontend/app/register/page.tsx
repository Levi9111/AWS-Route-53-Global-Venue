'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../api/types';
import { extractFieldErrors, registerFormSchema } from '../../lib/validations';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'renter' | 'host'>('renter');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = registerFormSchema.safeParse({
      name,
      email,
      password,
      role,
    });

    if (!parsed.success) {
      setErrors(extractFieldErrors(parsed.error));
      return;
    }

    setSubmitting(true);
    try {
      const createdUser = await register({
        ...parsed.data,
        role: parsed.data.role as UserRole,
      });
      if (createdUser.role === 'host') {
        router.push('/host/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setErrors({
        form: err instanceof Error ? err.message : 'Registration failed',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Create Your Account
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Join Global VenueFinder as an Event Renter or Venue Host
          </p>
        </div>

        {errors.form && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-700 dark:text-rose-300">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Role Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Account Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('renter')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  role === 'renter'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  🎟️ Renter
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Search & book spaces
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRole('host')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  role === 'host'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  🏛️ Venue Host
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  List & manage venues
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Morgan"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            {errors.name && (
              <p className="text-xs text-rose-600 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@company.com"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            {errors.email && (
              <p className="text-xs text-rose-600 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password (min 6 characters)
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
            {submitting
              ? 'Creating Account...'
              : `Create ${role === 'host' ? 'Host' : 'Renter'} Account`}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
