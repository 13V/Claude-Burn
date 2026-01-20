import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

/**
 * Loads and refines the '1227 Earth.obj' model.
 * Uses MTLLoader to preserve native colors/textures.
 */
export async function createProceduralEarth(): Promise<THREE.Group> {
    const group = new THREE.Group();
    group.name = "low-poly-earth-group";

    const mtlLoader = new MTLLoader();
    const objLoader = new OBJLoader();

    // Set path for loaders
    mtlLoader.setPath('/1227/');
    objLoader.setPath('/1227/');

    return new Promise((resolve) => {
        mtlLoader.load('1227 Earth.mtl', (materials) => {
            materials.preload();
            objLoader.setMaterials(materials);

            objLoader.load('1227 Earth.obj', (object) => {
                object.name = "earth-model-inner";

                object.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        const mesh = child as THREE.Mesh;
                        const geom = mesh.geometry;

                        // 1. Re-center Geometry
                        geom.computeBoundingBox();
                        geom.center();

                        // 2. Normalize Scale to Radius 104.5
                        geom.computeBoundingSphere();
                        const currentRadius = geom.boundingSphere?.radius || 1;
                        const targetRadius = 104.5;
                        const scaleFactor = targetRadius / currentRadius;

                        geom.scale(scaleFactor, scaleFactor, scaleFactor);
                        mesh.scale.setScalar(1.0);

                        // 3. Material Refinement
                        // Ensure flat shading for the low-poly look
                        if (mesh.material) {
                            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                            mats.forEach(m => {
                                if (m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshPhongMaterial) {
                                    m.flatShading = true;
                                    m.needsUpdate = true;
                                }
                            });
                        }

                        mesh.castShadow = true;
                        mesh.receiveShadow = true;
                    }
                });

                object.position.set(0, 0, 0);
                group.add(object);

                console.log("1227 Earth OBJ Loaded, Centered, and Scaled.");
                resolve(group);
            }, undefined, (err) => {
                console.error("Failed to load OBJ:", err);
                resolve(group);
            });
        }, undefined, (err) => {
            console.error("Failed to load MTL:", err);
            // Fallback to loading OBJ without materials
            objLoader.load('1227 Earth.obj', (object) => {
                group.add(object);
                resolve(group);
            }, undefined, () => resolve(group));
        });
    });
}
