'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Palette, Zap, Waves, PenTool } from 'lucide-react';

interface MyWhalePanelProps {
    onSpawn: (whaleData: any) => void;
}

const SPECIES = [
    'Blue Whale', 'Humpback', 'Orca', 'Minke', 'Gray Whale',
    'Sperm Whale', 'Fin Whale', 'Sei Whale', 'Right Whale', 'Beluga', 'Narwhal'
];

const HATS = [
    { id: 'none', name: 'No Hat' },
    { id: 'top-hat', name: 'Top Hat' },
    { id: 'party-hat', name: 'Party Hat' }
];

export const MyWhalePanel: React.FC<MyWhalePanelProps> = ({ onSpawn }) => {
    const { connected, publicKey } = useWallet();
    const [species, setSpecies] = useState('Humpback');
    const [color, setColor] = useState('#00f5d4');
    const [hat, setHat] = useState('none');
    const [name, setName] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSpawn = () => {
        if (!name) {
            alert("Please give your whale a name!");
            return;
        }
        onSpawn({
            species,
            color: parseInt(color.replace('#', '0x')),
            hat,
            name,
            owner: publicKey?.toString()
        });
        setIsExpanded(false);
    };

    return (
        <div className="fixed bottom-12 right-12 z-50 flex flex-col items-end gap-6">
            <AnimatePresence>
                {isExpanded && connected && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.1 }}
                        className="w-96 bg-black brutalist-border-bright p-10 shadow-[20px_20px_60px_-15px_rgba(0,245,212,0.1)]"
                    >
                        <div className="flex items-center gap-3 mb-8 text-[#00f5d4] font-black uppercase tracking-[0.3em] text-xs">
                            <Zap className="w-5 h-5 fill-current" />
                            <span>WHALE_FORGING_CHAMBER</span>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[9px] text-zinc-500 uppercase font-black tracking-widest flex items-center gap-2">
                                    <Waves className="w-3 h-3" /> // SPECIES_CLASS
                                </label>
                                <select
                                    value={species}
                                    onChange={(e) => setSpecies(e.target.value)}
                                    className="w-full bg-black brutalist-border px-6 py-3 text-white font-black text-xs focus:outline-none focus:border-[#00f5d4] transition-colors appearance-none"
                                >
                                    {SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[9px] text-zinc-500 uppercase font-black tracking-widest flex items-center gap-2">
                                        <Palette className="w-3 h-3" /> // LUMEN_INDEX
                                    </label>
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="w-full h-12 bg-black brutalist-border p-2 cursor-pointer"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[9px] text-zinc-500 uppercase font-black tracking-widest flex items-center gap-2">
                                        <Zap className="w-3 h-3" /> // ATTACHMENT
                                    </label>
                                    <select
                                        value={hat}
                                        onChange={(e) => setHat(e.target.value)}
                                        className="w-full bg-black brutalist-border px-4 py-3 text-white font-black text-xs focus:outline-none appearance-none"
                                    >
                                        {HATS.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] text-zinc-500 uppercase font-black tracking-widest flex items-center gap-2">
                                    <PenTool className="w-3 h-3" /> // UNIT_DESIGNATION
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="DESIGNATE_NAME..."
                                    className="w-full bg-black brutalist-border px-6 py-3 text-white font-black text-xs placeholder:text-zinc-800 focus:outline-none focus:border-[#00f5d4]"
                                />
                            </div>

                            <button
                                onClick={handleSpawn}
                                className="w-full py-5 mt-4 bg-[#00f5d4] text-black font-black uppercase text-xs tracking-[0.3em] hover:brightness-110 active:translate-y-1 transition-all"
                            >
                                COMMENCE_DEPLOYMENT
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center gap-4">
                {connected && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`w-16 h-16 flex items-center justify-center transition-all brutalist-border ${isExpanded ? 'bg-[#00f5d4] text-black' : 'bg-black text-[#00f5d4] hover:bg-[#00f5d4]/10'}`}
                    >
                        <User className="w-8 h-8" />
                    </button>
                )}
                <div className="wallet-adapter-wrapper">
                    <WalletMultiButton />
                </div>
            </div>
        </div>
    );
};
