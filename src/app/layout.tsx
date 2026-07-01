import "./globals.css";

import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoApply",
  description:
    "LinkedIn EasyApply assist: a Supabase-auth dashboard and REST API consumed by a Chrome extension that pre-fills applications in your own browser session.",
};

const PORTFOLIO_URL = process.env.NEXT_PUBLIC_PORTFOLIO_URL ?? "#";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="text-sm font-semibold tracking-tight text-foreground"
              >
                AutoApply
              </Link>
              <nav className="flex items-center gap-4 text-sm text-muted-foreground">
                <Link
                  href="/dashboard"
                  className="transition-colors hover:text-foreground"
                >
                  Dashboard
                </Link>
                <Link
                  href="/settings"
                  className="transition-colors hover:text-foreground"
                >
                  Settings
                </Link>
              </nav>
            </div>
            <Link
              href={PORTFOLIO_URL}
              className="text-sm text-primary transition-colors hover:text-primary/80"
            >
              ← Back to portfolio
            </Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
