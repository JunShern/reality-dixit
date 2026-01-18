import type { Metadata } from "next";
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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
