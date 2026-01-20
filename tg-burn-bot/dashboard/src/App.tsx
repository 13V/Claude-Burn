import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Flame, Zap, Shield, Search, ExternalLink } from 'lucide-react';

interface Project {
  chatId: number;
  tokenCA: string;
  burnCount: number;
  lastBurnSignature?: string;
  aiActive: boolean;
  strategy?: string;
  crankActive: boolean;
}

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/stats');
        setProjects(response.data);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* HEADER */}
      <header className="mb-12 border-b-8 border-white pb-6">
        <h1 className="text-7xl font-black italic uppercase tracking-tighter mb-2">
          The Hall of Flame
        </h1>
        <p className="text-xl font-mono opacity-80">
          PROXIED REAL-TIME INCINERATION DATA // SOLANA DEFLATION ENGINE
        </p>
      </header>

      {/* TICKER */}
      <div className="mb-12 bg-white text-black overflow-hidden whitespace-nowrap p-4 border-4 border-white flex items-center">
        <div className="animate-marquee flex gap-8 font-black text-2xl uppercase">
          {projects.length > 0 ? (
            projects.map((p, i) => (
              <span key={i}>
                🔥 {p.tokenCA.slice(0, 6)}...: {p.burnCount} TOTAL BURNS {' // '}
              </span>
            ))
          ) : (
            <span>NO ACTIVE INCINERATIONS DETECTED... STAND BY {' // '}</span>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEADERBOARD */}
        <div className="lg:col-span-2">
          <section className="brutalist-card">
            <h2 className="text-4xl font-black uppercase mb-6 flex items-center gap-3">
              <Zap className="w-10 h-10 text-red-600" /> Live Burners
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-sm">
                <thead>
                  <tr className="border-b-4 border-white uppercase bg-white text-black">
                    <th className="p-3">Token CA</th>
                    <th className="p-3">Strategy</th>
                    <th className="p-3">Total Burnt</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Last Sig</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p, i) => (
                    <tr key={i} className="border-b-2 border-white/20 hover:bg-white/5 transition-colors">
                      <td className="p-3 font-bold text-red-500">{p.tokenCA.slice(0, 8)}...</td>
                      <td className="p-3 text-xs opacity-80">{p.strategy || "MANUAL"}</td>
                      <td className="p-3 font-black text-lg">{p.burnCount}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 uppercase font-black text-xs ${p.aiActive ? 'bg-red-600 text-white' : 'bg-white text-black'}`}>
                          {p.aiActive ? 'AI_ACTIVE' : 'CRANK'}
                        </span>
                      </td>
                      <td className="p-3">
                        {p.lastBurnSignature ? (
                          <a
                            href={`https://solscan.io/tx/${p.lastBurnSignature}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline flex items-center gap-1"
                          >
                            VIEW <ExternalLink size={12} />
                          </a>
                        ) : '---'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {projects.length === 0 && !loading && (
                <div className="p-12 text-center opacity-50 uppercase font-black italic">
                  No active tokens. Start the incinerator.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* SIDEBAR / INFO */}
        <div className="space-y-8">
          <section className="brutalist-card bg-red-600 border-red-600">
            <h3 className="text-3xl font-black uppercase mb-4 text-white">System Health</h3>
            <div className="space-y-2 opacity-90">
              <p className="flex justify-between"><span>BOT STATUS:</span> <span>ONLINE</span></p>
              <p className="flex justify-between"><span>ACTIVE AGENTS:</span> <span>{projects.filter(p => p.aiActive).length}</span></p>
              <p className="flex justify-between"><span>TOTAL DEFLATION:</span> <span>STABLE</span></p>
            </div>
          </section>

          <section className="brutalist-card">
            <h3 className="text-3xl font-black uppercase mb-4">How to Join</h3>
            <p className="text-sm opacity-80 mb-4">
              Connect your Telegram bot instance to appear on the Hall of Flame.
            </p>
            <button className="w-full bg-white text-black font-black py-4 uppercase border-4 border-black hover:bg-red-600 hover:text-white transition-all">
              Launch Bot DM
            </button>
          </section>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default App;
