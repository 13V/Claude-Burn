import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { landMask } from './LandMask';

interface SpeciesConfig {
    color: number;
    scale: number;
    speed: number;
    tailFreq: number;
    modelPath: string;
}

const SPECIES_CONFIG: Record<string, SpeciesConfig> = {
    'Blue Whale': { color: 0x1e90ff, scale: 0.01, speed: 0.8, tailFreq: 2, modelPath: '/Whale/model.obj' },
    'Humpback': { color: 0x3498db, scale: 0.008, speed: 1.0, tailFreq: 3, modelPath: '/Whale/model.obj' },
    'Orca': { color: 0x00ced1, scale: 0.005, speed: 1.8, tailFreq: 5, modelPath: '/Whale/model.obj' },
    'Minke': { color: 0x5dade2, scale: 0.007, speed: 1.5, tailFreq: 4, modelPath: '/Whale/model.obj' },
    'Gray Whale': { color: 0x85c1e9, scale: 0.009, speed: 0.9, tailFreq: 2.5, modelPath: '/Whale/model.obj' },
    'Sperm Whale': { color: 0x2980b9, scale: 0.012, speed: 0.7, tailFreq: 1.8, modelPath: '/Sperm Whale/Mesh_SpermWhale.obj' },
    'Fin Whale': { color: 0x34495e, scale: 0.011, speed: 1.2, tailFreq: 2.5, modelPath: '/Whale/model.obj' },
    'Sei Whale': { color: 0x5dade2, scale: 0.01, speed: 1.3, tailFreq: 3, modelPath: '/Whale/model.obj' },
    'Right Whale': { color: 0x2c3e50, scale: 0.011, speed: 0.5, tailFreq: 1.5, modelPath: '/Whale/model.obj' },
    'Beluga': { color: 0xffffff, scale: 0.004, speed: 1.1, tailFreq: 4, modelPath: '/Whale/model.obj' },
    'Narwhal': { color: 0xecf0f1, scale: 0.005, speed: 1.2, tailFreq: 4.5, modelPath: '/Whale/model.obj' },
    'Bowhead Whale': { color: 0x2e4053, scale: 0.012, speed: 0.5, tailFreq: 1.2, modelPath: '/Whale/model.obj' },
    'Bottlenose Whale': { color: 0x5499c7, scale: 0.006, speed: 1.7, tailFreq: 5, modelPath: '/Whale/model.obj' },
    'default': { color: 0x00f5d4, scale: 0.008, speed: 1.0, tailFreq: 3, modelPath: '/Whale/model.obj' }
};

// Cache for loaded models
const modelCache: Map<string, THREE.Group> = new Map();
const loadingPromises: Map<string, Promise<THREE.Group>> = new Map();

// Create a simple procedural whale as fallback/placeholder
function createProceduralWhale(config: SpeciesConfig): THREE.Group {
    const group = new THREE.Group();

    const material = new THREE.MeshPhongMaterial({
        color: config.color,
        emissive: config.color,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.95,
        flatShading: true
    });

    // Body: Aligned along Y axis (North)
    const bodyGeom = new THREE.CapsuleGeometry(0.2, 0.6, 8, 16);
    const body = new THREE.Mesh(bodyGeom, material);
    // Capsule is Y-aligned by default
    group.add(body);

    // Head: At +Y
    const headGeom = new THREE.SphereGeometry(0.2, 16, 16);
    const head = new THREE.Mesh(headGeom, material);
    head.position.set(0, 0.4, 0); // North
    head.scale.set(0.9, 1.4, 0.7);
    group.add(head);

    // Fins: Spread in the XY plane
    const finGeom = new THREE.BoxGeometry(0.5, 0.2, 0.03);
    const leftFin = new THREE.Mesh(finGeom, material);
    leftFin.position.set(0.25, 0.1, -0.05); // Side=+X (East), Y=0.1, Depth=-Z
    leftFin.rotation.z = Math.PI / 5;
    group.add(leftFin);

    const rightFin = leftFin.clone();
    rightFin.position.set(-0.25, 0.1, -0.05); // Side=-X (West)
    rightFin.rotation.z = -Math.PI / 5;
    group.add(rightFin);

    // Tail group for animation: Swaying in XZ plane? No, sway side-to-side (X)
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, -0.45, 0);
    const flukeGeom = new THREE.BoxGeometry(0.7, 0.15, 0.03);
    const flukes = new THREE.Mesh(flukeGeom, material);
    tailGroup.add(flukes);
    group.add(tailGroup);

    (group as any).__tail = tailGroup;
    (group as any).__fins = [leftFin, rightFin];
    (group as any).__materials = [material]; // Cache material

    return group;
}

// Load OBJ model asynchronously
async function loadOBJModel(path: string): Promise<THREE.Group> {
    // Check cache first
    if (modelCache.has(path)) {
        return modelCache.get(path)!.clone();
    }

    // Check if already loading
    if (loadingPromises.has(path)) {
        const cached = await loadingPromises.get(path)!;
        return cached.clone();
    }

    // Start loading
    const promise = new Promise<THREE.Group>((resolve, reject) => {
        const loader = new OBJLoader();
        loader.load(
            path,
            (obj) => {
                modelCache.set(path, obj);
                resolve(obj.clone());
            },
            undefined,
            (error) => {
                console.error('Error loading whale model:', error);
                reject(error);
            }
        );
    });

    loadingPromises.set(path, promise);
    return promise;
}

function createHat(style: string): THREE.Group {
    const group = new THREE.Group();
    if (style === 'top-hat') {
        const brim = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, 0.02, 16),
            new THREE.MeshPhongMaterial({ color: 0x222222 })
        );
        const top = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 0.2, 16),
            new THREE.MeshPhongMaterial({ color: 0x222222 })
        );
        top.position.y = 0.1;
        group.add(brim, top);
    } else if (style === 'party-hat') {
        const cone = new THREE.Mesh(
            new THREE.ConeGeometry(0.1, 0.25, 16),
            new THREE.MeshPhongMaterial({ color: 0xff00ff })
        );
        cone.position.y = 0.125;
        group.add(cone);
    }
    return group;
}

export function createWhaleModel(species: string, options: { color?: number, hat?: string } = {}): THREE.Group {
    const config = { ...(SPECIES_CONFIG[species] || SPECIES_CONFIG['default']) };
    if (options.color) config.color = options.color;

    const group = new THREE.Group();
    group.scale.setScalar(config.scale);

    // Create procedural whale as immediate placeholder
    const placeholder = createProceduralWhale(config);
    group.add(placeholder);

    // Initial Hat for placeholder
    if (options.hat && options.hat !== 'none') {
        const hat = createHat(options.hat);
        hat.position.set(0, 0.6, 0.1);
        (hat as any).__isHat = true;
        group.add(hat);
    }

    // Load actual model asynchronously and replace
    loadOBJModel(config.modelPath).then((loadedModel) => {
        // Apply material to loaded model
        const material = new THREE.MeshPhongMaterial({
            color: config.color,
            emissive: config.color,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.95,
        });

        loadedModel.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.material = material;
            }
        });

        // Remove placeholder and add loaded model
        group.remove(placeholder);

        // Remove placeholder hat if it was added
        const oldHat = group.children.find(c => (c as any).__isHat);
        if (oldHat) group.remove(oldHat);

        // Rotate loaded model to be Y-forward and Z-up (tangent to surface)
        // Standard OBJ is Y-up, Z-forward. 
        // 1. Rotate around X by -90deg: Y(up) -> Z(normal), Z(forward) -> -Y(south)
        // 2. Rotate around Z by 180deg: -Y(south) -> Y(north)
        loadedModel.rotation.x = -Math.PI / 2;
        loadedModel.rotation.z = Math.PI;

        // Ensure standard facing for Sperm Whale if it's different
        if (species === 'Sperm Whale') {
            loadedModel.rotation.z = Math.PI; // Correct for this specific model
        }

        group.add(loadedModel);

        // Store reference for animation
        (group as any).__loadedModel = loadedModel;
        (group as any).__materials = [material]; // Cache material

        // Add Hat to loaded model
        if (options.hat && options.hat !== 'none') {
            const hat = createHat(options.hat);
            // Position on head. Standard OBJ is Y-up, Z-forward after our rotation.
            // But we rotated it standard. Let's just put it on the group.
            hat.position.set(0, 0.5, 0.2); // Relative to group center, above head
            hat.rotation.x = Math.PI / 6; // Tilt forward
            group.add(hat);
        }
    }).catch(() => {
        // Keep placeholder on error
        console.warn(`Using procedural whale for ${species}`);
    });

    // Store config for animation
    (group as any).__config = config;
    (group as any).__initialZ = 0; // Altitude base
    (group as any).__initialRotZ = 0; // Heading base
    (group as any).__isBreaching = false;
    (group as any).__breachProgress = 0;

    // Particle System Setup: Use InstancedMesh instead of individual meshes
    const particleCount = 40; // Reduced for performance
    const pGeom = new THREE.SphereGeometry(0.02, 4, 4);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    const instancedParticles = new THREE.InstancedMesh(pGeom, pMat, particleCount);
    instancedParticles.frustumCulled = false;
    group.add(instancedParticles);

    (group as any).__instancedParticles = instancedParticles;
    (group as any).__particlePool = [];

    // Initialize pool
    for (let i = 0; i < particleCount; i++) {
        (group as any).__particlePool.push({
            id: i,
            life: 0,
            maxLife: 0,
            position: new THREE.Vector3(),
            velocity: new THREE.Vector3()
        });
    }

    return group;
}

function emitParticle(whale: any, position: THREE.Vector3, velocity: THREE.Vector3, life: number) {
    const p = whale.__particlePool.find((item: any) => item.life <= 0);
    if (p) {
        p.position.copy(position);
        p.velocity.copy(velocity);
        p.life = life;
        p.maxLife = life;
    }
}

export function animateWhale(group: THREE.Object3D, time: number, options: { isNight: boolean, siblings?: THREE.Object3D[] } = { isNight: false }) {
    const whale = group as any;
    const isNight = options.isNight;
    const siblings = options.siblings || [];
    const tail = whale.__tail;
    const fins = whale.__fins;
    const config = whale.__config as SpeciesConfig;

    if (!config) return;

    const localTime = time * config.speed * (1.5 / (whale.__scaleVar || 1));

    // Breach Logic
    if (!whale.__isBreaching && Math.random() < 0.0005) { // Rare chance to start breaching
        whale.__isBreaching = true;
        whale.__breachProgress = 0;
    }

    if (whale.__isBreaching) {
        whale.__breachProgress += 0.015;
        if (whale.__breachProgress > 1) {
            whale.__isBreaching = false;
            whale.__breachProgress = 0;
            // No reset to initial state, keep current wandering position
            return;
        }

        const p = whale.__breachProgress;
        const jumpHeight = 1.5;
        const jumpZ = 4 * jumpHeight * p * (1 - p);

        // Directional momentum based on current wandering heading
        const forwardSpeed = 0.6;
        const forwardDist = p * forwardSpeed;
        const currentAngle = whale.__wanderAngle || whale.__initialRotZ || 0;

        const vx = -Math.sin(currentAngle) * forwardDist;
        const vy = Math.cos(currentAngle) * forwardDist;

        whale.position.x += vx * 0.05; // Delta move
        whale.position.y += vy * 0.05;
        whale.position.z = (whale.__initialZ || 0) + jumpZ;

        // Pitch during jump
        whale.rotation.x = (p - 0.5) * Math.PI * 0.8;
        whale.rotation.y = Math.sin(p * Math.PI) * 0.3;
        whale.rotation.z = currentAngle + Math.sin(p * Math.PI * 2) * 0.05;
    } else {
        // Normal swimming with wandering movement
        if (whale.__wanderAngle === undefined) whale.__wanderAngle = whale.__initialRotZ || 0;

        // 1. Update Heading (Wander)
        // Significantly reduced noise for smoothness (0.01 instead of 0.04)
        whale.__wanderAngle += (Math.random() - 0.5) * 0.012;

        // 2. Return force to keep them near the pod center
        const dx = whale.position.x - (whale.__initialX || 0);
        const dy = whale.position.y - (whale.__initialY || 0);
        const distSq = dx * dx + dy * dy;

        if (distSq > 0.12) { // radius ~0.35
            const angleToCenter = Math.atan2(-dx, dy);
            let diff = angleToCenter - whale.__wanderAngle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            // Much stronger steering back (0.1 instead of 0.01)
            whale.__wanderAngle += diff * 0.12;
        }

        // 2.2 Land Avoidance
        const podLat = whale.__podLat || 0;
        const podLng = whale.__podLng || 0;
        // Approx conversion from local units to degrees (radius 100 globe)
        const dLat = (whale.position.y / 100) * (180 / Math.PI);
        const dLng = (whale.position.x / (100 * Math.cos(podLat * Math.PI / 180))) * (180 / Math.PI);
        const currentLat = podLat + dLat;
        const currentLng = podLng + dLng;

        if (!landMask.isWater(currentLat, currentLng)) {
            // Hit land! Turn around immediately
            whale.__wanderAngle += Math.PI;
            // Nudge back towards center
            whale.position.x -= Math.sin(whale.__wanderAngle) * 0.05;
            whale.position.y += Math.cos(whale.__wanderAngle) * 0.05;
        }

        // 2.5 Separation force: Avoid other whales in the same pod (only if siblings exist)
        if (siblings.length > 1) {
            siblings.forEach((other: any) => {
                if (other === group) return;
                const odx = whale.position.x - other.position.x;
                const ody = whale.position.y - other.position.y;
                const odistSq = odx * odx + ody * ody;
                const dist = Math.sqrt(odistSq) || 0.001;

                if (odistSq < 0.4) { // Large safety bubble
                    // 1. Steering Force: Turn away from neighbors
                    const angleAway = Math.atan2(odx, ody);
                    let steeringDiff = angleAway - whale.__wanderAngle;
                    while (steeringDiff < -Math.PI) steeringDiff += Math.PI * 2;
                    while (steeringDiff > Math.PI) steeringDiff -= Math.PI * 2;
                    whale.__wanderAngle += steeringDiff * 0.2; // Even more aggressive turn

                    // 2. Repellent Nudge: Immediate physical separation
                    const pushFactor = 0.01;
                    whale.position.x += (odx / dist) * pushFactor;
                    whale.position.y += (ody / dist) * pushFactor;
                }
            });
        }

        // 3. Move Forward
        // Increased speed for actual "swimming around" feel
        // Smaller whales swim slightly faster relative to their size
        const swimSpeed = config.speed * 0.025 * (1.2 / (whale.__scaleVar || 1));
        whale.position.x += -Math.sin(whale.__wanderAngle) * swimSpeed;
        whale.position.y += Math.cos(whale.__wanderAngle) * swimSpeed;

        // Match rotation to wander angle with smoothing
        whale.rotation.z = whale.__wanderAngle + Math.sin(localTime * 0.5) * 0.05;

        // Pitch sway
        whale.rotation.x = Math.sin(localTime * 0.3) * 0.05;
        // Altitude sway
        const initialZ = whale.__initialZ ?? 0;
        whale.position.z = initialZ + Math.sin(localTime * 1.5) * 0.03;
    }

    // Bioluminescence Update: Use cached materials instead of traverse
    const pulse = (Math.sin(time * 2) + 1) * 0.5;
    const targetIntensity = isNight ? (1.0 + pulse * 1.5) : 0.4;
    const materials = whale.__materials;

    if (materials) {
        materials.forEach((mat: THREE.MeshPhongMaterial) => {
            mat.emissiveIntensity = targetIntensity;
            if (isNight) {
                mat.emissive.setHex(config.color);
            } else {
                mat.emissiveIntensity = 0.4;
            }
        });
    }

    // Particle Update: Efficiently update InstancedMesh
    const iMesh = whale.__instancedParticles;
    const dummy = new THREE.Object3D();
    const pMat = iMesh.material as THREE.MeshBasicMaterial;

    whale.__particlePool.forEach((p: any, i: number) => {
        if (p.life > 0) {
            p.life -= 0.016;
            p.position.add(p.velocity);

            dummy.position.copy(p.position);
            const scale = (p.life / p.maxLife);
            dummy.scale.setScalar(scale);
            dummy.updateMatrix();
            iMesh.setMatrixAt(i, dummy.matrix);
        } else {
            dummy.scale.setScalar(0);
            dummy.updateMatrix();
            iMesh.setMatrixAt(i, dummy.matrix);
        }
    });
    iMesh.instanceMatrix.needsUpdate = true;

    if (isNight) {
        pMat.color.setHex(config.color);
        pMat.opacity = 0.8;
    } else {
        pMat.color.setHex(0xffffff);
        pMat.opacity = 0.4;
    }

    // Particle Emission
    if (whale.__isBreaching && whale.__breachProgress > 0.2 && whale.__breachProgress < 0.5) {
        // Splash particles
        for (let i = 0; i < 2; i++) {
            emitParticle(whale,
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3((Math.random() - 0.5) * 0.05, 0.1, (Math.random() - 0.5) * 0.05),
                1.0
            );
        }
    } else if (!whale.__isBreaching) {
        // Bubble trail
        if (Math.random() < 0.3) {
            emitParticle(whale,
                new THREE.Vector3(0, -0.4, 0), // Near tail
                new THREE.Vector3((Math.random() - 0.5) * 0.005, -0.01, (Math.random() - 0.5) * 0.005),
                2.0
            );
        }
    }

    // Animate procedural tail if present (sway Up/Down in Z)
    if (tail) {
        // Mammals sway tails up and down
        tail.rotation.x = Math.sin(localTime * config.tailFreq) * 0.4;
    }

    // Animate procedural fins if present (slight flapping)
    if (fins) {
        fins.forEach((fin: THREE.Mesh, i: number) => {
            // Roll and pitch of fins
            fin.rotation.x = (i === 0 ? 1 : -1) * (Math.PI / 10 + Math.sin(localTime * 1.5) * 0.15);
            fin.rotation.z = Math.sin(localTime * 1.5) * 0.1;
        });
    }
}
