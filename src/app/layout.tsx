import type { Metadata } from "next";
import { Fira_Code } from "next/font/google";
import "./globals.css";

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrendScope — Stock Trend Scoring",
  description:
    "Score stocks by 10 technical indicators. Green = uptrend, red = downtrend, grey = neutral. Supports US, HK, SG, CN, ID markets.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TrendScope",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${firaCode.variable} h-full`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="theme-color" content="#09090b" />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 antialiased font-mono">
        {children}
      </body>
    </html>
  );
}
