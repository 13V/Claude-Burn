'use client';

import { useEffect, useState } from 'react';
import StatsOverview from '@/components/StatsOverview';
import TokenCard from '@/components/TokenCard';

interface Token {
  id: number;
  address: string;
  ownerUsername: string;
  burnPercentage: number;
  mode: string;
  createdAt: number;
  lastBurn: number;
  totalBurned: number;
  isActive: boolean;
}

export default function Home() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [stats, setStats] = useState({ totalTokens: 0, totalBurned: 0, activeBurns: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/tokens');
        const data = await response.json();

        if (data.success) {
          setTokens(data.tokens);
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen p-8">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto mb-16 text-center">
        <div className="animate-float mb-6">
          <h1 className="text-7xl font-black mb-4">
            <span className="gradient-text">🔥 CLAUDE BURN</span>
          </h1>
        </div>
        <p className="text-2xl text-text-secondary mb-4">
          AI-Powered Memecoin Buyback & Burn Ecosystem
        </p>
        <p className="text-lg text-text-secondary max-w-3xl mx-auto mb-8">
          Claude AI analyzes DexScreener charts in real-time and times perfect buybacks during dips.
          Smarter burns. Better results. Powered by artificial intelligence.
        </p>

        <div className="flex gap-4 justify-center items-center">
          <a
            href="https://t.me/ClaudeBurnBot"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            📱 Register Your Token
          </a>
          <a
            href="https://dexscreener.com/solana/claudeburn"
            target="_blank"
            rel="noopener noreferrer"
            className="glass px-6 py-3 rounded-lg font-semibold hover:border-accent-primary transition-all"
          >
            📊 View $CLAUDEBURN
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto">
        <StatsOverview
          totalTokens={stats.totalTokens}
          totalBurned={stats.totalBurned}
          activeBurns={stats.activeBurns}
        />
      </div>

      {/* Tokens Grid */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">
          <span className="gradient-text">🚀 Tokens Using Claude Burn</span>
        </h2>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-primary"></div>
            <p className="mt-4 text-text-secondary">Loading tokens...</p>
          </div>
        ) : tokens.length === 0 ? (
          <div className="glass p-12 text-center">
            <p className="text-xl text-text-secondary mb-4">No tokens registered yet</p>
            <p className="text-text-secondary">Be the first to use Claude Burn!</p>
            <a
              href="https://t.me/ClaudeBurnBot"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-block mt-6"
            >
              Register Now
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tokens.map((token) => (
              <TokenCard key={token.id} token={token} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-20 pt-8 border-t border-border-color text-center text-text-secondary">
        <p className="mb-2">
          Built with 🔥 by the Claude Burn team
        </p>
        <p className="text-sm">
          5% service fee on all buybacks goes to $CLAUDEBURN holders
        </p>
      </footer>
    </main>
  );
}
