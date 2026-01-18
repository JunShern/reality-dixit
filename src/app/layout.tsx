import type { Metadata } from "next";
import Link from "next/link";
import { Dice6 } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reality Dixit",
  description: "A photo-based party game where you match pictures to prompts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-paper min-h-screen">
        <header className="p-4">
          <Link href="/" className="inline-flex items-center gap-2 text-coral hover:opacity-80 transition-opacity">
            <Dice6 size={24} strokeWidth={1.5} />
            <span className="text-xl font-medium">Reality Dixit</span>
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
