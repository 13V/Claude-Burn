import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Claude Burn - AI-Powered Buyback & Burn",
  description: "The AI-powered memecoin buyback and burn ecosystem on Solana. Claude AI analyzes charts and times perfect buybacks.",
  keywords: ["solana", "memecoin", "buyback", "burn", "ai", "claude", "defi"],
  openGraph: {
    title: "Claude Burn - AI-Powered Buyback & Burn",
    description: "AI-powered memecoin buyback ecosystem on Solana",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
