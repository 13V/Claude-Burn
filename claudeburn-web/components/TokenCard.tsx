'use client';

import { useState } from 'react';

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

interface TokenCardProps {
    token: Token;
}

export default function TokenCard({ token }: TokenCardProps) {
    const [expanded, setExpanded] = useState(false);

    const getModeColor = (mode: string) => {
        switch (mode) {
            case 'aggressive':
                return 'text-red-400';
            case 'conservative':
                return 'text-blue-400';
            default:
                return 'text-yellow-400';
        }
    };

    const getModeEmoji = (mode: string) => {
        switch (mode) {
            case 'aggressive':
                return '⚡';
            case 'conservative':
                return '🛡️';
            default:
                return '⚖️';
        }
    };

    const formatDate = (timestamp: number) => {
        return timestamp ? new Date(timestamp).toLocaleDateString() : 'Never';
    };

    const chartUrl = `https://dexscreener.com/solana/${token.address}`;

    return (
        <div className="glass p-6 cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getModeEmoji(token.mode)}</span>
                        <h3 className="text-xl font-bold">
                            Token by @{token.ownerUsername}
                        </h3>
                    </div>
                    <div className="text-xs text-text-secondary font-mono break-all">
                        {token.address}
                    </div>
                </div>

                <div className={`text-sm font-semibold ${getModeColor(token.mode)} uppercase px-3 py-1 rounded-full border ${getModeColor(token.mode).replace('text', 'border')}`}>
                    {token.mode}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                    <div className="text-text-secondary text-xs mb-1">Burn %</div>
                    <div className="text-xl font-bold gradient-text">{token.burnPercentage}%</div>
                </div>
                <div>
                    <div className="text-text-secondary text-xs mb-1">Total Burned</div>
                    <div className="text-xl font-bold">{token.totalBurned.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                </div>
                <div>
                    <div className="text-text-secondary text-xs mb-1">Last Burn</div>
                    <div className="text-sm font-semibold">{formatDate(token.lastBurn)}</div>
                </div>
            </div>

            {expanded && (
                <div className="mt-6 border-t border-border-color pt-4">
                    <div className="text-sm text-text-secondary mb-3">
                        📊 Live Chart from DexScreener
                    </div>
                    <iframe
                        src={chartUrl}
                        className="w-full h-96 rounded-lg border border-border-color"
                        title={`Chart for ${token.address}`}
                    />
                    <a
                        href={chartUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 text-accent-primary hover:text-accent-secondary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        View on DexScreener →
                    </a>
                </div>
            )}

            <div className="text-center text-xs text-text-secondary mt-4">
                {expanded ? '▲ Click to collapse' : '▼ Click to view chart'}
            </div>
        </div>
    );
}
