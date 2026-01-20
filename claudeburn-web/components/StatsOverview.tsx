'use client';

interface StatsOverviewProps {
    totalTokens: number;
    totalBurned: number;
    activeBurns: number;
}

export default function StatsOverview({ totalTokens, totalBurned, activeBurns }: StatsOverviewProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="glass p-6 text-center">
                <div className="text-5xl font-bold gradient-text mb-2">{totalTokens}</div>
                <div className="text-text-secondary text-sm uppercase tracking-wider">Tokens Using System</div>
            </div>

            <div className="glass p-6 text-center glow animate-pulse-glow">
                <div className="text-5xl font-bold gradient-text mb-2">
                    {totalBurned.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div className="text-text-secondary text-sm uppercase tracking-wider">Total Tokens Burned</div>
            </div>

            <div className="glass p-6 text-center">
                <div className="text-5xl font-bold gradient-text mb-2">{activeBurns}</div>
                <div className="text-text-secondary text-sm uppercase tracking-wider">Active Last 24h</div>
            </div>
        </div>
    );
}
