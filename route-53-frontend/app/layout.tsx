import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';

export const metadata: Metadata = {
  title: 'Global VenueFinder — The Landmark Event Spaces Marketplace',
  description:
    'Discover, inspect, and reserve world-class architectural venues, loft galleries, and executive pavilions across major international metropolises.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/icon-192.png', sizes: '192x192' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col bg-[#FAFAFA] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 font-sans antialiased selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#0c0c0e] py-12 mt-20 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-zinc-200/70 dark:border-zinc-800/60">
                <div className="space-y-3 md:col-span-2">
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/icon-192.png"
                      alt="Logo"
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                    <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-white">
                      Global VenueFinder
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
                    The premium architectural marketplace for private summits, executive retreats, galas, and landmark event productions.
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200 mb-3">
                    Locations
                  </h4>
                  <ul className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <li>New York City (US-East)</li>
                    <li>London (EU-West)</li>
                    <li>Dublin Docklands</li>
                    <li>Tokyo & San Francisco</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200 mb-3">
                    Infrastructure
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Designed for AWS ECS multi-region active routing, AWS Route 53 health checks, and shared database replication.
                  </p>
                </div>
              </div>

              <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-400">
                <p>© {new Date().getFullYear()} Global VenueFinder Inc. All rights reserved.</p>
                <p className="flex items-center gap-4">
                  <span>ISO 8601 UTC Synchronized</span>
                  <span>•</span>
                  <span>Integer Cents Precision</span>
                </p>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
