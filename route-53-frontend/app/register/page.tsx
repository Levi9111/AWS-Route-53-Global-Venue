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
      <div className="w-full max-w-md surface-resting rounded-3xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-3xl font-bold text-zinc-100">
            Create Your Account
          </h1>
          <p className="text-xs font-mono text-zinc-400">
            Join Global VenueFinder as an Event Renter or Curated Host
          </p>
        </div>

        {errors.form && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs font-medium text-rose-300">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Role Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Account Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('renter')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  role === 'renter'
                    ? 'border-[#D9AE54] bg-[#D9AE54]/15 ring-1 ring-[#D9AE54]/40'
                    : 'border-white/5 bg-[#141417] hover:bg-[#1b1b1f]'
                }`}
              >
                <p className="text-xs font-bold text-zinc-100">
                  🎟️ Renter
                </p>
                <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                  Search & book spaces
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRole('host')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  role === 'host'
                    ? 'border-[#D9AE54] bg-[#D9AE54]/15 ring-1 ring-[#D9AE54]/40'
                    : 'border-white/5 bg-[#141417] hover:bg-[#1b1b1f]'
                }`}
              >
                <p className="text-xs font-bold text-zinc-100">
                  🏛️ Venue Host
                </p>
                <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                  Curate & host spaces
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Morgan"
              className="w-full rounded-xl recessed-channel px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#D9AE54]"
            />
            {errors.name && (
              <p className="text-xs text-rose-400 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@company.com"
              className="w-full rounded-xl recessed-channel px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#D9AE54]"
            />
            {errors.email && (
              <p className="text-xs text-rose-400 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Password (min 6 characters)
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
            {submitting
              ? 'Creating Account...'
              : `Create ${role === 'host' ? 'Host' : 'Renter'} Account`}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-[#D9AE54] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
