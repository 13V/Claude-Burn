import type { Metadata } from "next";
import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";

import { WalletContextProvider } from "@/components/WalletContextProvider";

export const metadata: Metadata = {
  title: "OCEANIC PODS | Global Whale Tracker",
  description: "Real-time migration tracking of the world's most majestic marine pods.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}
