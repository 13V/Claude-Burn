"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Zap,
  Activity,
  MessageSquare,
  BarChart3,
  Cpu,
  ChevronRight
} from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [auditorState, setAuditorState] = useState({
    mood: 'Neutral',
    decision: 'WAIT',
    status_message: 'Observing market flow...',
    bounty_mission: '',
  });
  const [thoughts, setThoughts] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setThoughts([
      "System initialized. Connection secure.",
      "Analyzing foundation delta...",
      "Monitoring sentiment clusters.",
    ]);

    const think = async () => {
      const mockResponses = [
        { mood: 'Arrogant', decision: 'WAIT', status_message: "Foundation is stable. I am watching.", bounty_mission: 'Get 50 RTs or I ghost the next buyback.' },
        { mood: 'Euphoric', decision: 'BUY', status_message: "Vibe is strong. Strengthening the floor.", bounty_mission: '' },
        { mood: 'Aggressive', decision: 'BURN', status_message: "Incinerating the weak. Foundational purge.", bounty_mission: '' },
        { mood: 'Skeptical', decision: 'WAIT', status_message: "Detecting paper behavior. Observing.", bounty_mission: '' },
      ];
      const res = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      setAuditorState(prev => ({ ...prev, ...res }));
      setThoughts(prev => [...prev.slice(-40), `${res.decision}: ${res.status_message}`]);
    };

    const interval = setInterval(think, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughts]);

  if (!mounted) return null;

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'Euphoric': return 'bg-emerald-500';
      case 'Aggressive': return 'bg-rose-500';
      case 'Arrogant': return 'bg-purple-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-emerald-500/30 selection:text-white">

      {/* Subtle Aurora Background */}
      <div className={`fixed -top-[20%] -left-[10%] w-[60%] h-[60%] aurora-glow rounded-full ${getMoodColor(auditorState.mood)}`} />

      {/* Header */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/[0.03] bg-black/20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium tracking-[0.2em] text-zinc-500 uppercase">Protocol</span>
            <span className="text-sm font-semibold tracking-tight">$FLOOR</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${getMoodColor(auditorState.mood)}`} />
              <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Live Engine</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 pt-32 pb-24 grid lg:grid-cols-2 gap-16 items-start">

        {/* Left: Identity & State */}
        <div className="space-y-12 sticky top-32">
          <div className="space-y-4">
            <h1 className="text-4xl font-light tracking-tight text-white leading-tight">
              The Sentient <br />
              <span className="font-semibold italic">Price Foundation.</span>
            </h1>
            <p className="text-zinc-500 text-sm max-w-sm leading-relaxed">
              An autonomous agent designed to identify value, defend liquidity, and incinerate weakness.
            </p>
          </div>

          <div className="space-y-8">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-bold">Current Mandate</span>
              <AnimatePresence mode="wait">
                <motion.p
                  key={auditorState.status_message}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-2xl font-medium tracking-tight text-zinc-100"
                >
                  {auditorState.status_message}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-12">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-bold">Identity</span>
                <p className="text-sm font-medium text-zinc-400 capitalize">$FLOOR // {auditorState.mood}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-bold">State</span>
                <p className={`text-sm font-bold uppercase tracking-widest ${auditorState.decision === 'BUY' ? 'text-emerald-400' : auditorState.decision === 'BURN' ? 'text-rose-400' : 'text-zinc-500'}`}>
                  {auditorState.decision}
                </p>
              </div>
            </div>
          </div>

          {/* Bounty Alert (Sleek Overlay) */}
          <AnimatePresence>
            {auditorState.bounty_mission && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-xl"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">Loyalty Test Active</span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed italic">
                  "{auditorState.bounty_mission}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Intelligence & Logs */}
        <div className="space-y-8">

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-1 bg-white/[0.02] border border-white/[0.04] p-1 rounded-2xl overflow-hidden">
            <div className="p-4 text-center">
              <span className="text-[9px] uppercase tracking-widest text-zinc-600 block mb-1">Mkt Cap</span>
              <span className="text-base font-semibold text-zinc-200 tracking-tight">$24.8k</span>
            </div>
            <div className="p-4 text-center border-x border-white/[0.04]">
              <span className="text-[9px] uppercase tracking-widest text-zinc-600 block mb-1">Impact</span>
              <span className="text-base font-semibold text-emerald-400 tracking-tight">+14.2%</span>
            </div>
            <div className="p-4 text-center">
              <span className="text-[9px] uppercase tracking-widest text-zinc-600 block mb-1">Treasury</span>
              <span className="text-base font-semibold text-zinc-200 tracking-tight">12.4 SOL</span>
            </div>
          </div>

          {/* Reasoning Terminal */}
          <div className="gloss-card rounded-2xl flex flex-col h-[480px]">
            <div className="px-6 py-4 border-b border-white/[0.03] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Reasoning Engine</span>
              </div>
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-white/10" />
                <div className="w-1 h-1 rounded-full bg-white/10" />
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 p-8 overflow-y-auto space-y-4 font-mono text-[11px] leading-relaxed"
            >
              <AnimatePresence>
                {thoughts.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-4"
                  >
                    <span className="text-zinc-800 shrink-0 select-none">{String(i + 1).padStart(2, '0')}</span>
                    <span className={`${log.startsWith('BUY') ? 'text-emerald-400' :
                        log.startsWith('BURN') ? 'text-rose-400' :
                          'text-zinc-500'
                      }`}>
                      {log}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="p-4 border-t border-white/[0.03] flex items-center justify-between px-6">
              <span className="text-[9px] font-medium text-zinc-600 uppercase tracking-widest">Model: SONNET-3.5</span>
              <span className="text-[9px] italic text-zinc-700">Thinking...</span>
            </div>
          </div>

          {/* Action Triggered Overlay (Small) */}
          <div className="flex items-center gap-4 text-zinc-600 text-[10px] uppercase font-bold tracking-[0.25em] px-2">
            <Activity className="w-3 h-3" /> Foundational scan in progress
            <div className="h-[1px] flex-1 bg-white/[0.05]" />
          </div>

        </div>
      </div>

    </main>
  );
}
