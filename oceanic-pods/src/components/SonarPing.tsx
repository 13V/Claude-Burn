'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SonarPingProps {
    position: { x: number; y: number } | null;
    onComplete: () => void;
}

export default function SonarPing({ position, onComplete }: SonarPingProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (position) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                onComplete();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [position, onComplete]);

    if (!position || !isVisible) return null;

    return (
        <div
            className="fixed pointer-events-none z-50"
            style={{ left: position.x, top: position.y }}
        >
            <AnimatePresence>
                {[0, 0.3, 0.6].map((delay, i) => (
                    <motion.div
                        key={i}
                        className="absolute left-0 top-0"
                        initial={{ scale: 0, opacity: 0.8 }}
                        animate={{ scale: 4, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 1.5,
                            delay,
                            ease: 'easeOut',
                        }}
                        style={{
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        <div
                            className="w-12 h-12 rounded-full border-2"
                            style={{
                                borderColor: '#00f5d4',
                                boxShadow: '0 0 20px rgba(0, 245, 212, 0.4)',
                            }}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
