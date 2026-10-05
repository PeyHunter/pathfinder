import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

// Macs render SF Pro via -apple-system; Inter is the closest match everywhere else.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pathfinder",
  description: "Turn a messy list of concepts into a learning path you can follow step by step.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 bg-white/72 backdrop-blur-xl backdrop-saturate-180 border-b border-black/5">
          <nav className="mx-auto flex h-12 max-w-[980px] items-center justify-between px-5 text-[13px]">
            <Link href="/" className="font-semibold tracking-tight text-ink text-[15px]">
              Pathfinder
            </Link>
            <div className="flex items-center gap-7 text-ink/80">
              <Link href="/" className="hover:text-ink transition-colors">Paths</Link>
              <Link href="/new" className="hover:text-ink transition-colors">New path</Link>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-mist text-ink-3 text-xs">
          <div className="mx-auto max-w-[980px] px-5 py-5">Pathfinder: learn anything, one step at a time.</div>
        </footer>
      </body>
    </html>
  );
}
