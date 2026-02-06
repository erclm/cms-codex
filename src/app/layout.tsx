import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const appSans = Space_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const appMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CMS Codex Demo",
  description: "MVP storefront + admin powered by Supabase and Codex.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${appSans.variable} ${appMono.variable} antialiased`}
      >
        <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-6xl fade-rise">{children}</div>
        </div>
      </body>
    </html>
  );
}
