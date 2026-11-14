import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';


export const metadata: Metadata = {
  title: 'Global VenueFinder — Architectural Event Spaces',
  description:
    'Discover, inspect, and reserve world-class architectural venues, loft galleries, and executive pavilions across major international metropolises.',
  icons: {
    icon: [{ url: '/logo-2d.jpg', type: 'image/jpeg' }],
    shortcut: [{ url: '/logo-2d.jpg', type: 'image/jpeg' }],
    apple: [{ url: '/logo-2d.jpg' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@200..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#0b0b0c] text-zinc-100 font-sans antialiased selection:bg-[#d9ae54] selection:text-black">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/[0.06] bg-[#0c0c0e]/80 py-14 mt-20 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-zinc-200/60 dark:border-zinc-800/60">
                <div className="space-y-3.5 md:col-span-2">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/logo-2d.jpg"
                      alt="Global VenueFinder Logo"
                      className="w-9 h-9 rounded-xl object-cover shadow-md ring-1 ring-[#D9AE54]/40"
                    />
                    <span className="font-serif font-bold text-lg tracking-tight text-zinc-900 dark:text-white">
                      Global VenueFinder
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed font-normal">
                    The premium architectural marketplace for private summits, executive retreats, galas, and landmark event productions.
                  </p>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#d9ae54] mb-3.5">
                    Global Metropolises
                  </h4>
                  <ul className="space-y-2 text-xs text-zinc-400">
                    <li>New York City (US-East)</li>
                    <li>London (EU-West)</li>
                    <li>Dublin Docklands</li>
                    <li>Tokyo & San Francisco</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#d9ae54] mb-3.5">
                    Stateless Architecture
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                    Designed for AWS ECS multi-region active routing, AWS Route 53 health monitoring, and distributed MongoDB replication.
                  </p>
                </div>
              </div>

              <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-400">
                <p>© {new Date().getFullYear()} Global VenueFinder Inc. All rights reserved.</p>
                <div className="flex items-center gap-4 text-zinc-400">
                  <span>ISO 8601 UTC Synchronized</span>
                  <span>•</span>
                  <span>Integer Cents Precision</span>
                </div>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
