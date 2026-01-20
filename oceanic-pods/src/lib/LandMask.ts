"use client";

// A singleton to handle landmask lookups
class LandMask {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private width: number = 256;
    private height: number = 128;
    private data: Uint8ClampedArray | null = null;
    private loaded: boolean = false;

    constructor() {
        if (typeof window !== "undefined") {
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        }
    }

    async init() {
        if (this.loaded || !this.ctx) return;

        return new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            // Using topology map: White = Land, Black = Water
            img.src = "/earth-topology.png";
            img.onload = () => {
                this.ctx!.drawImage(img, 0, 0, this.width, this.height);
                this.data = this.ctx!.getImageData(0, 0, this.width, this.height).data;
                this.loaded = true;
                resolve();
            };
            img.onerror = () => {
                console.warn("Failed to load landmask, skipping water checks.");
                resolve();
            };
        });
    }

    isWater(lat: number, lng: number): boolean {
        if (!this.loaded || !this.data) return true; // Default to water if not sure

        // Map lat/lng to x/y
        // lat: 90 (N) to -90 (S) -> y: 0 to height
        // lng: -180 (W) to 180 (E) -> x: 0 to width
        const x = Math.floor(((lng + 180) / 360) * this.width) % this.width;
        const y = Math.floor(((90 - lat) / 180) * this.height) % this.height;

        const idx = (y * this.width + x) * 4;
        // In topology map, r, g, b are same. 
        // 0 is ocean, > 0 is land.
        const brightness = this.data[idx];
        return brightness < 20; // Threshold for water
    }
}

export const landMask = new LandMask();
