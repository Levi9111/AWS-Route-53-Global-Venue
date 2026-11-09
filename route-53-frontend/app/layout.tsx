import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';

export const metadata: Metadata = {
  title: 'Global VenueFinder — Airbnb for Event Spaces',
  description:
    'Discover, compare, and book extraordinary global event venues across US-East, EU-West, and Asia-Pacific.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white">
                  Global VenueFinder
                </span>
                <span>•</span>
                <span>Stateless Multi-Region Event Marketplace</span>
              </div>
              <p>
                All times in UTC (ISO 8601) • Minor-unit integer pricing (cents)
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
