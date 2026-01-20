"use client";

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { WhalePod, getLivePods } from '@/lib/sonar';
import * as THREE from 'three';
import { createWhaleModel, animateWhale } from '@/lib/WhaleObject';
import SonarPing from '@/components/SonarPing';
import { MyWhalePanel } from '@/components/MyWhalePanel';
import { landMask } from '@/lib/LandMask';
import { createProceduralEarth } from '@/lib/ProceduralEarth';

// Dynamically import the Globe to avoid SSR issues
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

export default function Home() {
  const globeRef = useRef<any>(null);
  const [pods, setPods] = useState<WhalePod[]>([]);
  const [selectedPod, setSelectedPod] = useState<WhalePod | null>(null);
  const [narration, setNarration] = useState<string>("Scanning sonar data...");
  const [loading, setLoading] = useState(true);
  const [pingPosition, setPingPosition] = useState<{ x: number; y: number } | null>(null);
  const [personalPods, setPersonalPods] = useState<any[]>([]);
  const [customEarth, setCustomEarth] = useState<THREE.Group | null>(null);

  const fetchNarrative = async (pod: WhalePod) => {
    setNarration("Translating bio-signals...");
    try {
      const response = await fetch('/api/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pod })
      });
      const data = await response.json();
      setNarration(data.narrative);
    } catch (error) {
      setNarration("The depths remain silent.");
    }
  };

  const whaleModels = useRef<Map<string, THREE.Object3D>>(new Map());
  const timeOfDayRef = useRef(0);

  useEffect(() => {
    let animId: number;
    const animate = () => {
      const time = Date.now() * 0.001;
      const currentTOD = timeOfDayRef.current;
      const isNight = currentTOD > 0.3 && currentTOD < 0.7;

      whaleModels.current.forEach(podGroup => {
        const children = podGroup.children;
        children.forEach((whale, i) => {
          animateWhale(whale, time + i * 1.5, { isNight, siblings: children });
        });
      });
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, []);

  const playPing = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) { }
  };

  const handlePointClick = (point: any, event?: any) => {
    setSelectedPod(point as WhalePod);
    fetchNarrative(point as WhalePod);
    playPing();
    if (event) {
      setPingPosition({ x: event.clientX, y: event.clientY });
    }
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: point.lat, lng: point.lng, altitude: 0.8 }, 1000);
    }
  };

  useEffect(() => {
    landMask.init();
    getLivePods().then(data => {
      setPods(data);
      setLoading(false);
    });
    const saved = localStorage.getItem('personalPods');
    if (saved) setPersonalPods(JSON.parse(saved));
  }, []);

  // Dedicated Model Loading
  useEffect(() => {
    createProceduralEarth().then(earth => {
      setCustomEarth(earth);
      // Debug access
      (window as any).lowPolyEarth = earth;
    });
  }, []);

  const handleSpawnPersonalWhale = (whaleData: any) => {
    const coords = globeRef.current?.getPointOfView() || { lat: 0, lng: 0 };
    const newPod = {
      ...whaleData,
      id: `personal-${whaleData.owner}-${Date.now()}`,
      lat: coords.lat,
      lng: coords.lng,
      count: 1,
      status: 'Escorting Owner',
      depth: 10,
      description: `A custom whale belonging to ${whaleData.owner.slice(0, 4)}...${whaleData.owner.slice(-4)}.`,
      heading: Math.random() * 360,
      isPersonal: true
    };
    const updated = [...personalPods, newPod];
    setPersonalPods(updated);
    localStorage.setItem('personalPods', JSON.stringify(updated));
    setPingPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    playPing();
  };

  const [timeOfDay, setTimeOfDay] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay(prev => (prev + 0.0005) % 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    timeOfDayRef.current = timeOfDay;
  }, [timeOfDay]);

  // Model & Lighting Persistence
  useEffect(() => {
    if (!customEarth) return;

    const interval = setInterval(() => {
      if (globeRef.current) {
        const scene = globeRef.current.scene();
        if (scene) {
          if (!scene.getObjectByName('low-poly-earth-group')) {
            scene.add(customEarth);
            customEarth.position.set(0, 0, 0); // Explicit centering
            console.log("Globe injected into scene at (0,0,0)");
          }

          // Technical Lighting (Standard Neutral to avoid grey/white wash)
          const lights = [
            { name: 'high-ambient', type: THREE.AmbientLight, color: 0xffffff, intensity: 0.5 }, // Reduced ambient for depth
            { name: 'main-dir-light', type: THREE.DirectionalLight, color: 0xffffff, intensity: 2.0, pos: [200, 200, 500] }, // Boosted main
            { name: 'rim1', type: THREE.DirectionalLight, color: 0xffffff, intensity: 1.0, pos: [-300, 0, 100] },
            { name: 'rim2', type: THREE.DirectionalLight, color: 0xffffff, intensity: 1.0, pos: [300, 0, 100] }
          ];

          lights.forEach(l => {
            if (!scene.getObjectByName(l.name)) {
              const light = new (l.type as any)(l.color, l.intensity);
              light.name = l.name;
              if (l.pos) light.position.set(...l.pos);
              scene.add(light);
            }
          });
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [customEarth]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#00050a] scanline">
      <SonarPing position={pingPosition} onComplete={() => setPingPosition(null)} />
      <div className="w-full h-full absolute inset-0 flex items-center justify-center">
        <Globe
          ref={globeRef}
          showGlobe={false}
          showAtmosphere={false}
          backgroundColor="rgba(0,0,0,0)"
          objectsData={[...pods, ...personalPods]}
          objectLat="lat"
          objectLng="lng"
          objectAltitude={0.001} // Reduced to sit directly on surface
          objectLabel={(d: any) => `${d.name} [${d.species}]`}
          onObjectClick={(obj: any, event: any) => handlePointClick(obj, event)}
          objectThreeObject={(pod: any) => {
            const existing = whaleModels.current.get(pod.id);
            if (existing) return existing;
            const podGroup = new THREE.Group();
            const renderCount = Math.min(pod.count, 3);
            for (let i = 0; i < renderCount; i++) {
              const whale = createWhaleModel(pod.species, pod.isPersonal ? { color: pod.color, hat: pod.hat } : {});
              const podRadius = pod.isPersonal ? 0 : 3.0; // Reduced spread
              const angle = (i / renderCount) * Math.PI * 2;
              const startX = Math.cos(angle) * podRadius;
              const startY = Math.sin(angle) * podRadius;
              const startZ = i * 0.05;
              const startHeading = pod.isPersonal ? (pod.heading * Math.PI / 180) : (angle + Math.PI / 2);
              const sizeVar = pod.isPersonal ? 1.0 : (0.6 + Math.random() * 0.8);
              whale.position.set(startX, startY, startZ);
              whale.rotation.z = startHeading;
              whale.scale.multiplyScalar(sizeVar);
              (whale as any).__scaleVar = sizeVar;
              (whale as any).__podLat = pod.lat;
              (whale as any).__podLng = pod.lng;
              (whale as any).__initialX = startX;
              (whale as any).__initialY = startY;
              podGroup.add(whale);
            }
            whaleModels.current.set(pod.id, podGroup);
            return podGroup;
          }}
          htmlElementsData={personalPods}
          htmlLat={(d: any) => d.lat}
          htmlLng={(d: any) => d.lng}
          htmlAltitude={0.06}
          htmlElement={(pod: any) => {
            const el = document.createElement('div');
            el.className = 'pointer-events-none';
            el.innerHTML = `
              <div class="flex flex-col items-center -translate-y-8">
                <div class="bg-black border border-[#00f5d4] px-4 py-1 flex items-center gap-1.5 whitespace-nowrap">
                  <div class="w-1.5 h-1.5 bg-cyan-400"></div>
                  <span class="text-[10px] font-black text-white uppercase tracking-tighter">${pod.name}</span>
                </div>
                <div class="w-[1px] h-6 bg-[#00f5d4]"></div>
              </div>
            `;
            return el;
          }}
          arcsData={selectedPod ? [selectedPod] : []}
          arcStartLat="lat"
          arcStartLng="lng"
          arcEndLat={(d: any) => (d as any).destLat || d.lat}
          arcEndLng={(d: any) => (d as any).destLng || d.lng}
          arcColor={() => '#00f5d4'}
          arcDashLength={0.4}
          arcDashGap={2}
          arcDashAnimateTime={2000}
          ringsData={selectedPod ? [selectedPod] : []}
          ringColor={() => '#00f5d4'}
          ringMaxRadius={2}
          ringPropagationSpeed={3}
          ringRepeatPeriod={1000}
          onGlobeReady={() => {
            if (globeRef.current) {
              globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });
            }
          }}
        />
      </div>
      <AnimatePresence>
        {selectedPod && (
          <motion.div
            key={selectedPod.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.1, ease: "linear" }}
            className="absolute right-12 top-12 bottom-12 w-96 bg-black brutalist-border-bright p-10 z-20 flex flex-col gap-10 shadow-[20px_0_60px_-15px_rgba(0,245,212,0.1)]"
          >
            <div className="flex justify-between items-start border-b border-white/10 pb-6">
              <div>
                <span className="text-[10px] font-black tracking-widest text-[#00f5d4]">[POD_RECON]</span>
                <h2 className="text-3xl font-black text-white mt-1 uppercase">{selectedPod.name}</h2>
              </div>
              <button onClick={() => setSelectedPod(null)} className="text-[#00f5d4] font-black text-xl hover:brightness-150 transition-all px-2">[X]</button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-10 bg-[#00f5d4]" />
                <div>
                  <p className="text-[9px] text-[#00f5d4]/60 font-black tracking-widest">SPECIES_CLASS</p>
                  <p className="text-xl font-black tracking-tighter">{selectedPod.species}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-10 bg-[#00f5d4]" />
                <div>
                  <p className="text-[9px] text-[#00f5d4]/60 font-black tracking-widest">CURRENT_STATUS</p>
                  <p className="text-xl font-black tracking-tighter">{selectedPod.status} // {selectedPod.depth}M</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-10 bg-[#00f5d4]" />
                <div>
                  <p className="text-[9px] text-[#00f5d4]/60 font-black tracking-widest">VECTOR_AZIMUTH</p>
                  <p className="text-xl font-black tracking-tighter">{selectedPod.heading}° &rarr; {selectedPod.destination}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-[#00f5d4]/5 brutalist-border p-8 overflow-y-auto font-mono text-[11px] leading-relaxed text-zinc-400 capitalize-none">
              <span className="text-[#00f5d4] block mb-3 font-black tracking-widest animate-pulse">// SIGNAL_DECODED:</span>
              <p className="normal-case tracking-normal italic opacity-80">"{selectedPod.description}"</p>
              <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-[9px] text-zinc-600 font-black tracking-widest mb-1">COORDS_GPS</p>
                <p className="text-sm font-black text-[#00f5d4] tracking-widest">{selectedPod.lat.toFixed(6)}N // {selectedPod.lng.toFixed(6)}E</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <MyWhalePanel onSpawn={handleSpawnPersonalWhale} />
    </main>
  );
}
