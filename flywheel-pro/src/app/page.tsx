"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Zap,
  Cpu,
  RefreshCw,
  Terminal,
  Activity,
  Layers,
  ChevronRight,
  Monitor,
  Lock
} from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-blue-500 selection:text-white antialiased overflow-x-hidden">

      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden h-screen w-screen">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-600/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
      </div>

      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white flex items-center justify-center rounded-sm">
              <Cpu className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold tracking-tighter text-xl uppercase">Flywheel Pro</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest opacity-60">
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
            <a href="#" className="hover:text-white transition-colors">Changelog</a>
          </div>
          <button className="px-5 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all rounded-sm flex items-center gap-2">
            Launch Engine <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-40">

        {/* HERO */}
        <div className="grid lg:grid-cols-2 gap-20 items-center mb-40">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 glass rounded-full border border-white/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">PaaS Operational</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] text-gradient">
              AUTONOMOUS EXECUTION. <br />
              <span className="opacity-50">UNLOCKED.</span>
            </h1>

            <p className="max-w-md text-lg text-zinc-400 leading-relaxed font-light">
              The first multi-tenant growth engine for Solana memecoins. Implement professional flywheel cycles—Accrual, Buyback, and Burn—without writing a single line of code.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button className="px-8 py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all rounded-sm">
                Get Started
              </button>
              <button className="px-8 py-4 glass border border-white/10 font-bold uppercase tracking-widest hover:bg-white/5 transition-all rounded-sm flex items-center justify-center gap-2">
                <Monitor className="w-4 h-4" /> Watch Demo
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/10 blur-[100px] animate-pulse rounded-full" />
            <div className="relative glass border border-white/10 p-4 rounded-xl rotate-2 hover:rotate-0 transition-transform duration-700">
              <Image
                src="/hero.png"
                alt="Flywheel Pro Turbine"
                width={600}
                height={600}
                className="rounded-lg"
                priority
              />
            </div>
          </div>
        </div>

        {/* STATS STRIP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-y border-white/5 py-12 mb-40 font-mono text-center">
          <div className="space-y-1">
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Active Engines</p>
            <p className="text-3xl font-bold tracking-tighter">14</p>
          </div>
          <div className="space-y-1">
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Total SOL Flow</p>
            <p className="text-3xl font-bold tracking-tighter">1,240.40</p>
          </div>
          <div className="space-y-1">
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Tokens Burned</p>
            <p className="text-3xl font-bold tracking-tighter">840.2M</p>
          </div>
          <div className="space-y-1">
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Global MC Impact</p>
            <p className="text-3xl font-bold tracking-tighter">$2.4M</p>
          </div>
        </div>

        {/* FEATURES */}
        <div className="grid md:grid-cols-3 gap-8 mb-40">
          {[
            {
              icon: <Zap className="w-6 h-6" />,
              title: "1-Click Launch",
              desc: "Paste your Pump.fun address and set your thresholds. Your autonomous bot is active in seconds."
            },
            {
              icon: <Shield className="w-6 h-6" />,
              title: "Encrypted Protocol",
              desc: "Bot wallets are managed through high-end encryption. Your treasury, your control."
            },
            {
              icon: <Activity className="w-6 h-6" />,
              title: "Real-time Monitor",
              desc: "Premium dashboards for your community to track buybacks and burns in real-time."
            }
          ].map((f, i) => (
            <div key={i} className="p-8 glass space-y-4 hover:border-white/20 transition-all group">
              <div className="w-12 h-12 bg-white/5 flex items-center justify-center rounded-sm text-white group-hover:bg-blue-500 transition-colors">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold tracking-tighter uppercase">{f.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="glass p-12 md:p-20 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">READY TO OVERCLOCK?</h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Join the elite circle of developers using automated growth incentives.
          </p>
          <button className="px-12 py-4 bg-white text-black font-bold uppercase tracking-widest hover:scale-105 transition-all">
            Enter the Matrix
          </button>
        </div>

      </div>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold uppercase tracking-widest opacity-40">
          <span>© 2026 Flywheel Pro // Silent Luxury Inc.</span>
          <div className="flex gap-8">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">X // Twitter</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
