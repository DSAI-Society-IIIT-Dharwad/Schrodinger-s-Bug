import React, { useState, useEffect, useRef, Suspense, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
    OrbitControls,
    Environment,
} from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RotateCcw,
    X,
    Code,
    Zap,
    Ghost,
    Plane,
    Truck,
    AlertTriangle,
    Layers,
    Activity,
    Gamepad2,
    Plus,
    ChevronDown,
    Heart,
    Shield,
    Brain,
    TrendingUp,
    Target,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts';

/**
 * ANTIGRAVITY DRONE SIMULATION v42.0 (DRL Enhanced)
 * 
 * v42 ADDITIONS:
 * 1. COMPLETE DRL PIPELINE: State extraction, action generation, reward calculation
 * 2. PPO & TD3 MODES: Simulated policy networks with realistic training curves
 * 3. TRAINING VISUALIZATION: Real-time reward/loss charts, episode tracking
 * 4. AUTONOMOUS LEARNING: Drone appears to learn navigation over episodes
 */

const THEMES = {
    CYBERPUNK: { accent: "#00ffff", bg: "#010206", terrain: "#0a122a", fog: 0x010206, obj: "#0a1a3a" },
    STEALTH: { accent: "#ff3333", bg: "#050505", terrain: "#111111", fog: 0x050505, obj: "#1a1a1a" },
    ARCTIC: { accent: "#ffffff", bg: "#0a101a", terrain: "#1a2a3a", fog: 0x0a101a, obj: "#2a3a4a" },
    SOLAR: { accent: "#ffcc00", bg: "#0a0805", terrain: "#1a1205", fog: 0x0a0805, obj: "#2a2005" }
};

const DRONE_COLORS = [
    { name: 'CYAN', hex: '#00ffff' },
    { name: 'PHOENIX', hex: '#ff3333' },
    { name: 'TOXIC', hex: '#33ff33' },
    { name: 'COBALT', hex: '#3366ff' },
    { name: 'AMETHYST', hex: '#cc33ff' },
    { name: 'GHOST', hex: '#ffffff' }
];

const DRONE_TYPES = {
    PHANTOM: { id: 'PHANTOM', icon: Ghost, speed: 65, yaw: 4.8, batteryCap: 100, scale: 1, drain: 1.0 },
    SCOUT: { id: 'SCOUT', icon: Plane, speed: 105, yaw: 7.8, batteryCap: 65, scale: 0.7, drain: 1.8 },
    HEAVY: { id: 'HEAVY', icon: Truck, speed: 48, yaw: 2.5, batteryCap: 200, scale: 1.6, drain: 0.8 }
};

const BLOCK_COMMANDS = [
    { type: 'takeoff', label: 'TAKEOFF', defaultVal: 35 },
    { type: 'land', label: 'LAND', defaultVal: 0 },
    { type: 'forward', label: 'FORWARD', defaultVal: 80 },
    { type: 'backward', label: 'BACKWARD', defaultVal: 80 },
    { type: 'left', label: 'LEFT', defaultVal: 60 },
    { type: 'right', label: 'RIGHT', defaultVal: 60 },
    { type: 'up', label: 'UP', defaultVal: 50 },
    { type: 'down', label: 'DOWN', defaultVal: 50 },
    { type: 'rotate', label: 'ROTATE', defaultVal: 90 },
];

const getHeight = (x, z) => {
    return Math.sin(x * 0.2) * 2 + Math.cos(z * 0.3) * 1.5 + Math.sin(x * 0.5 + z * 0.5) * 0.8;
};

// --- Procedural Environment Objects ---
// Generate once, deterministic positions via seeded pseudo-random
function seededRandom(seed) {
    let s = seed;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const ENV_OBJECTS = (() => {
    const rng = seededRandom(42);
    const objects = [];
    // Crystalline Spires (alien equivalent of buildings)
    for (let i = 0; i < 12; i++) {
        const x = (rng() - 0.5) * 420;
        const z = (rng() - 0.5) * 420;
        if (Math.sqrt(x * x + z * z) < 28) continue;
        const h = 12 + rng() * 30;
        const w = 2 + rng() * 4;
        const y = getHeight(x, z) - 1 + h / 2;
        objects.push({ type: 'spire', x, y, z, h, w, radius: w * 0.8 });
    }
    // Bio-luminescent Flora (alien trees: tall stalks with glowing orbs)
    for (let i = 0; i < 25; i++) {
        const x = (rng() - 0.5) * 480;
        const z = (rng() - 0.5) * 480;
        if (Math.sqrt(x * x + z * z) < 22) continue;
        const h = 6 + rng() * 14;
        const y = getHeight(x, z) - 1 + h / 2;
        const orbR = 1.5 + rng() * 2.5;
        objects.push({ type: 'flora', x, y, z, h, orbR, radius: orbR + 0.5 });
    }
    // Hive Towers (alien structures with pulsing lights)
    for (let i = 0; i < 6; i++) {
        const x = (rng() - 0.5) * 380;
        const z = (rng() - 0.5) * 380;
        if (Math.sqrt(x * x + z * z) < 30) continue;
        const h = 18 + rng() * 28;
        const y = getHeight(x, z) - 1 + h / 2;
        objects.push({ type: 'hive', x, y, z, h, radius: 3 + rng() * 2 });
    }
    // Ancient Monoliths (large alien rocks)
    for (let i = 0; i < 15; i++) {
        const x = (rng() - 0.5) * 500;
        const z = (rng() - 0.5) * 500;
        if (Math.sqrt(x * x + z * z) < 20) continue;
        const r = 2 + rng() * 4;
        const y = getHeight(x, z) - 1 + r * 0.5;
        objects.push({ type: 'monolith', x, y, z, radius: r });
    }
    // Floating Spore Clouds (non-collidable ambient)
    for (let i = 0; i < 10; i++) {
        const x = (rng() - 0.5) * 400;
        const z = (rng() - 0.5) * 400;
        const y = 25 + rng() * 40;
        objects.push({ type: 'spore', x, y, z, radius: 0 }); // radius 0 = no collision
    }
    return objects;
})();

// Alien creature spawn data
const ALIEN_CREATURES = (() => {
    const rng = seededRandom(777);
    const creatures = [];
    // Floating Jellyfish (hover and bob in mid-air)
    for (let i = 0; i < 8; i++) {
        const x = (rng() - 0.5) * 350;
        const z = (rng() - 0.5) * 350;
        if (Math.sqrt(x * x + z * z) < 35) continue;
        creatures.push({ type: 'jellyfish', x, z, baseY: 12 + rng() * 25, speed: 0.3 + rng() * 0.5, phase: rng() * Math.PI * 2, size: 1.5 + rng() * 2 });
    }
    // Ground Crawlers (move along terrain surface)
    for (let i = 0; i < 6; i++) {
        const x = (rng() - 0.5) * 300;
        const z = (rng() - 0.5) * 300;
        if (Math.sqrt(x * x + z * z) < 30) continue;
        creatures.push({ type: 'crawler', x, z, speed: 2 + rng() * 4, phase: rng() * Math.PI * 2, size: 1.2 + rng() * 1.5 });
    }
    // Sky Serpents (large creatures circling high up)
    for (let i = 0; i < 3; i++) {
        creatures.push({ type: 'serpent', orbitR: 80 + rng() * 120, baseY: 50 + rng() * 40, speed: 0.1 + rng() * 0.15, phase: rng() * Math.PI * 2, size: 3 + rng() * 3 });
    }
    return creatures;
})();

// ============================================
// DRL SIMULATION SYSTEM (v42)
// ============================================

const GOAL_POSITION = { x: 150, y: 30, z: -150 };
const MAX_EPISODE_STEPS = 500;

// State extraction function
function getDroneState(pos, vel, heading, battery, hasCollided) {
    const distToGoal = Math.sqrt(
        Math.pow(pos.x - GOAL_POSITION.x, 2) +
        Math.pow(pos.y - GOAL_POSITION.y, 2) +
        Math.pow(pos.z - GOAL_POSITION.z, 2)
    );

    // Raycast to nearest obstacle (simplified)
    let minObstacleDist = Infinity;
    for (const obj of ENV_OBJECTS) {
        if (obj.radius === 0) continue; // Skip non-collidable
        const dx = pos.x - obj.x;
        const dy = pos.y - obj.y;
        const dz = pos.z - obj.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) - obj.radius;
        if (dist < minObstacleDist) minObstacleDist = dist;
    }
    minObstacleDist = Math.min(minObstacleDist, 100);

    // Normalize state vector
    return {
        posX: THREE.MathUtils.clamp(pos.x / 300, -1, 1),
        posY: THREE.MathUtils.clamp(pos.y / 150, 0, 1),
        posZ: THREE.MathUtils.clamp(pos.z / 300, -1, 1),
        velX: THREE.MathUtils.clamp(vel.x / 100, -1, 1),
        velY: THREE.MathUtils.clamp(vel.y / 100, -1, 1),
        velZ: THREE.MathUtils.clamp(vel.z / 100, -1, 1),
        heading: Math.sin(heading), // Normalized orientation
        obstacleDist: minObstacleDist / 100,
        goalDist: distToGoal / 300,
        battery: battery / 100,
        collision: hasCollided ? 1 : 0,
    };
}

// Gaussian noise generator
function gaussianNoise(mean = 0, std = 1) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + std * z;
}

// Action generator (pseudo-policy)
function getAction(state, mode, episode, trainingProgress) {
    const baseThrust = 0.5;
    const baseYaw = 0.0;

    // Calculate direction to goal
    const goalDirX = (GOAL_POSITION.x / 300) - state.posX;
    const goalDirY = (GOAL_POSITION.y / 150) - state.posY;
    const goalDirZ = (GOAL_POSITION.z / 300) - state.posZ;
    const goalDist = Math.sqrt(goalDirX ** 2 + goalDirY ** 2 + goalDirZ ** 2);

    // Deterministic base policy: move toward goal
    let thrust = baseThrust + (goalDist > 0.3 ? 0.3 : 0);
    let yaw = goalDirX * 0.3 - goalDirZ * 0.3;
    let pitch = goalDirY * 0.2;
    let roll = 0;

    // Obstacle avoidance
    if (state.obstacleDist < 0.15) {
        thrust *= 0.5;
        yaw += (Math.random() - 0.5) * 0.8;
        pitch += 0.2; // Climb
    }

    // Add exploration noise based on mode and training progress
    let noiseScale;
    if (mode === 'PPO') {
        // PPO: Smaller noise, decreases with training
        noiseScale = Math.max(0.05, 0.3 * (1 - trainingProgress));
    } else {
        // TD3: Larger noise, more aggressive exploration
        noiseScale = Math.max(0.1, 0.5 * (1 - trainingProgress));
    }

    thrust += gaussianNoise(0, noiseScale * 0.2);
    yaw += gaussianNoise(0, noiseScale * 0.4);
    pitch += gaussianNoise(0, noiseScale * 0.3);
    roll = gaussianNoise(0, noiseScale * 0.1);

    // Clamp actions
    thrust = THREE.MathUtils.clamp(thrust, 0, 1);
    yaw = THREE.MathUtils.clamp(yaw, -1, 1);
    pitch = THREE.MathUtils.clamp(pitch, -0.5, 0.5);
    roll = THREE.MathUtils.clamp(roll, -0.3, 0.3);

    return { thrust, yaw, pitch, roll };
}

// Reward calculation
function computeReward(state, prevState, action, hasCollided, isAtGoal) {
    let reward = 0;

    // Distance-based reward (moving closer to goal)
    const distDelta = prevState.goalDist - state.goalDist;
    reward += distDelta * 50;

    // Goal reached bonus
    if (isAtGoal) {
        reward += 200;
    }

    // Collision penalty
    if (hasCollided) {
        reward -= 150;
    }

    // Energy efficiency
    reward -= action.thrust * 0.5;

    // Stability reward (smooth movements)
    const instability = Math.abs(action.pitch) + Math.abs(action.roll);
    reward -= instability * 5;

    // Altitude stability
    const optimalAlt = 0.2; // Normalized optimal altitude
    const altDeviation = Math.abs(state.posY - optimalAlt);
    reward -= altDeviation * 10;

    // Survival bonus
    reward += 0.5;

    return reward;
}

// Training metrics tracker
class DRLMetrics {
    constructor() {
        this.episodeRewards = [];
        this.actorLosses = [];
        this.criticLosses = [];
        this.entropies = [];
        this.qValues = [];
        this.currentEpisode = 0;
        this.currentStep = 0;
        this.episodeReward = 0;
        this.trainingProgress = 0;
    }

    step(reward, mode) {
        this.episodeReward += reward;
        this.currentStep++;

        // Simulate realistic loss curves
        const progress = this.trainingProgress;
        
        if (mode === 'PPO') {
            // Actor loss: gradually decreasing with noise
            const actorLoss = 2.5 * Math.exp(-progress * 2) + 0.1 + gaussianNoise(0, 0.05);
            // Entropy: decreases over time
            const entropy = 1.5 * Math.exp(-progress * 1.5) + 0.2 + gaussianNoise(0, 0.03);
            
            this.actorLosses.push({ step: this.currentStep, value: Math.max(0.05, actorLoss) });
            this.entropies.push({ step: this.currentStep, value: Math.max(0.1, entropy) });
        } else {
            // TD3: Q-value estimation
            const qValue = 50 + progress * 100 + gaussianNoise(0, 5);
            // Critic loss: higher initially, stabilizes
            const criticLoss = 3.0 * Math.exp(-progress * 1.8) + 0.15 + gaussianNoise(0, 0.08);
            
            this.qValues.push({ step: this.currentStep, value: qValue });
            this.criticLosses.push({ step: this.currentStep, value: Math.max(0.08, criticLoss) });
        }
    }

    endEpisode(mode) {
        this.episodeRewards.push({
            episode: this.currentEpisode,
            reward: this.episodeReward,
        });

        // Calculate cumulative losses for display
        if (mode === 'PPO') {
            const recentActorLoss = this.actorLosses.slice(-10);
            const avgActorLoss = recentActorLoss.reduce((sum, x) => sum + x.value, 0) / recentActorLoss.length;
            this.actorLosses.push({ step: this.currentEpisode, value: avgActorLoss });
        } else {
            const recentCriticLoss = this.criticLosses.slice(-10);
            const avgCriticLoss = recentCriticLoss.reduce((sum, x) => sum + x.value, 0) / recentCriticLoss.length;
            this.criticLosses.push({ step: this.currentEpisode, value: avgCriticLoss });
        }

        this.currentEpisode++;
        this.currentStep = 0;
        this.episodeReward = 0;
        this.trainingProgress = Math.min(1, this.currentEpisode / 50); // Converge at ~50 episodes
    }

    getRecentRewards(n = 20) {
        return this.episodeRewards.slice(-n);
    }

    getRecentActorLosses(n = 20) {
        return this.actorLosses.slice(-n);
    }

    getRecentCriticLosses(n = 20) {
        return this.criticLosses.slice(-n);
    }
}

// Animated Alien Creature Component
function AlienCreature({ creature, theme }) {
    const ref = useRef();
    const tentacles = useRef([]);
    useFrame((state) => {
        if (!ref.current) return;
        const t = state.clock.elapsedTime;
        const c = creature;
        if (c.type === 'jellyfish') {
            ref.current.position.x = c.x + Math.sin(t * c.speed + c.phase) * 8;
            ref.current.position.z = c.z + Math.cos(t * c.speed * 0.7 + c.phase) * 8;
            ref.current.position.y = c.baseY + Math.sin(t * 0.8 + c.phase) * 4;
            ref.current.rotation.y = t * 0.3;
            // Pulse tentacles
            tentacles.current.forEach((ten, i) => {
                if (ten) {
                    ten.scale.y = 0.8 + Math.sin(t * 2 + i * 0.5) * 0.3;
                    ten.rotation.x = Math.sin(t * 1.5 + i) * 0.3;
                }
            });
        } else if (c.type === 'crawler') {
            const cx = c.x + Math.sin(t * c.speed * 0.1 + c.phase) * 30;
            const cz = c.z + Math.cos(t * c.speed * 0.08 + c.phase) * 30;
            const cy = getHeight(cx, cz) - 0.2;
            ref.current.position.set(cx, cy, cz);
            ref.current.rotation.y = Math.atan2(Math.cos(t * c.speed * 0.1 + c.phase) * 30, -Math.sin(t * c.speed * 0.08 + c.phase) * 30);
            // Body undulation
            ref.current.scale.y = 1 + Math.sin(t * 3) * 0.15;
        } else if (c.type === 'serpent') {
            ref.current.position.x = Math.cos(t * c.speed + c.phase) * c.orbitR;
            ref.current.position.z = Math.sin(t * c.speed + c.phase) * c.orbitR;
            ref.current.position.y = c.baseY + Math.sin(t * 0.5 + c.phase) * 10;
            ref.current.rotation.y = -(t * c.speed + c.phase) + Math.PI / 2;
            ref.current.rotation.z = Math.sin(t * 0.7) * 0.2;
        }
    });

    const c = creature;
    if (c.type === 'jellyfish') {
        return (
            <group ref={ref}>
                <mesh>
                    <sphereGeometry args={[c.size, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
                    <meshStandardMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={3} transparent opacity={0.6} side={THREE.DoubleSide} />
                </mesh>
                {/* Tentacles */}
                {[0, 1, 2, 3, 4, 5].map(i => (
                    <mesh key={i} ref={el => tentacles.current[i] = el} position={[Math.cos(i * Math.PI / 3) * c.size * 0.5, -c.size * 0.8, Math.sin(i * Math.PI / 3) * c.size * 0.5]}>
                        <cylinderGeometry args={[0.05, 0.02, c.size * 1.8, 4]} />
                        <meshStandardMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={3} transparent opacity={0.5} />
                    </mesh>
                ))}
            </group>
        );
    }
    if (c.type === 'crawler') {
        return (
            <group ref={ref}>
                {/* Segmented body */}
                {[0, 1, 2, 3, 4].map(i => (
                    <mesh key={i} position={[0, c.size * 0.3, -i * c.size * 0.5]} castShadow>
                        <sphereGeometry args={[c.size * (1 - i * 0.15) * 0.4, 8, 6]} />
                        <meshStandardMaterial color={theme.obj} roughness={0.6} metalness={0.4} />
                    </mesh>
                ))}
                {/* Eyes (front segment) */}
                <mesh position={[c.size * 0.2, c.size * 0.45, 0.1]}>
                    <sphereGeometry args={[c.size * 0.08, 6, 6]} />
                    <meshStandardMaterial emissive={theme.accent} emissiveIntensity={8} color={theme.accent} />
                </mesh>
                <mesh position={[-c.size * 0.2, c.size * 0.45, 0.1]}>
                    <sphereGeometry args={[c.size * 0.08, 6, 6]} />
                    <meshStandardMaterial emissive={theme.accent} emissiveIntensity={8} color={theme.accent} />
                </mesh>
                {/* Legs */}
                {[0, 1, 2].map(i => (
                    <group key={'leg' + i}>
                        <mesh position={[c.size * 0.4, 0, -i * c.size * 0.5]} rotation={[0, 0, -0.5]}>
                            <cylinderGeometry args={[0.04, 0.04, c.size * 0.5, 4]} />
                            <meshStandardMaterial color={theme.obj} />
                        </mesh>
                        <mesh position={[-c.size * 0.4, 0, -i * c.size * 0.5]} rotation={[0, 0, 0.5]}>
                            <cylinderGeometry args={[0.04, 0.04, c.size * 0.5, 4]} />
                            <meshStandardMaterial color={theme.obj} />
                        </mesh>
                    </group>
                ))}
            </group>
        );
    }
    if (c.type === 'serpent') {
        return (
            <group ref={ref}>
                {/* Long segmented body */}
                {Array.from({ length: 10 }, (_, i) => (
                    <mesh key={i} position={[0, Math.sin(i * 0.5) * 1.5, -i * c.size * 0.6]} castShadow>
                        <sphereGeometry args={[c.size * (1 - i * 0.06) * 0.5, 8, 6]} />
                        <meshStandardMaterial color={theme.obj} emissive={theme.accent} emissiveIntensity={0.3} metalness={0.5} roughness={0.5} />
                    </mesh>
                ))}
                {/* Head crest */}
                <mesh position={[0, c.size * 0.4, c.size * 0.3]}>
                    <coneGeometry args={[c.size * 0.3, c.size * 0.8, 6]} />
                    <meshStandardMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={4} />
                </mesh>
                <mesh position={[c.size * 0.2, c.size * 0.15, c.size * 0.4]}>
                    <sphereGeometry args={[c.size * 0.1, 6, 6]} />
                    <meshStandardMaterial emissive={theme.accent} emissiveIntensity={10} color={theme.accent} />
                </mesh>
                <mesh position={[-c.size * 0.2, c.size * 0.15, c.size * 0.4]}>
                    <sphereGeometry args={[c.size * 0.1, 6, 6]} />
                    <meshStandardMaterial emissive={theme.accent} emissiveIntensity={10} color={theme.accent} />
                </mesh>
            </group>
        );
    }
    return null;
}

function EnvironmentObjects({ theme }) {
    const sporeRef = useRef([]);
    useFrame((state) => {
        const t = state.clock.elapsedTime;
        sporeRef.current.forEach((s, i) => {
            if (s) {
                s.rotation.y = t * 0.2;
                s.scale.setScalar(0.8 + Math.sin(t * 0.5 + i) * 0.3);
            }
        });
    });
    return (
        <group>
            {ENV_OBJECTS.map((obj, i) => {
                if (obj.type === 'spire') {
                    return (
                        <group key={i}>
                            <mesh position={[obj.x, obj.y, obj.z]} castShadow receiveShadow>
                                <coneGeometry args={[obj.w, obj.h, 5]} />
                                <meshStandardMaterial color={theme.obj} metalness={0.9} roughness={0.1} transparent opacity={0.8} />
                            </mesh>
                            <mesh position={[obj.x, obj.y + obj.h * 0.35, obj.z]}>
                                <sphereGeometry args={[obj.w * 0.3, 8, 8]} />
                                <meshStandardMaterial emissive={theme.accent} emissiveIntensity={10} color={theme.accent} transparent opacity={0.8} />
                            </mesh>
                        </group>
                    );
                }
                if (obj.type === 'flora') {
                    const baseY = getHeight(obj.x, obj.z) - 1;
                    return (
                        <group key={i} position={[obj.x, 0, obj.z]}>
                            {/* Bio-luminescent stalk */}
                            <mesh position={[0, baseY + obj.h * 0.25, 0]} castShadow>
                                <cylinderGeometry args={[0.15, 0.3, obj.h * 0.5, 5]} />
                                <meshStandardMaterial color={theme.obj} emissive={theme.accent} emissiveIntensity={0.5} />
                            </mesh>
                            {/* Glowing orb */}
                            <mesh position={[0, baseY + obj.h * 0.5 + obj.orbR * 0.5, 0]}>
                                <sphereGeometry args={[obj.orbR, 10, 10]} />
                                <meshStandardMaterial emissive={theme.accent} emissiveIntensity={4} color={theme.accent} transparent opacity={0.35} />
                                <mesh position={[0, baseY + obj.h * 0.5 + obj.orbR * 0.5, 0]}>
                                    <sphereGeometry args={[obj.orbR, 10, 10]} />
                                    <meshStandardMaterial emissive={theme.accent} emissiveIntensity={6} color={theme.accent} transparent opacity={0.6} />
                                </mesh>
                            </mesh>
                        </group>
                    );
                }
                if (obj.type === 'hive') {
                    return (
                        <group key={i}>
                            <mesh position={[obj.x, obj.y, obj.z]} castShadow>
                                <cylinderGeometry args={[obj.radius * 0.6, obj.radius, obj.h, 8]} />
                                <meshStandardMaterial color={theme.obj} metalness={0.5} roughness={0.6} />
                            </mesh>
                            {/* Hive rings */}
                            {[0.25, 0.5, 0.75].map(frac => (
                                <mesh key={frac} position={[obj.x, obj.y - obj.h / 2 + obj.h * frac, obj.z]} rotation={[Math.PI / 2, 0, 0]}>
                                    <torusGeometry args={[obj.radius * (0.7 + frac * 0.2), 0.15, 8, 16]} />
                                    <meshStandardMaterial emissive={theme.accent} emissiveIntensity={6} color={theme.accent} />
                                </mesh>
                            ))}
                        </group>
                    );
                }
                if (obj.type === 'monolith') {
                    return (
                        <mesh key={i} position={[obj.x, obj.y, obj.z]} castShadow rotation={[0.1, 0.3, 0.15]}>
                            <dodecahedronGeometry args={[obj.radius, 0]} />
                            <meshStandardMaterial color={theme.obj} roughness={0.4} metalness={0.6} />
                        </mesh>
                    );
                }
                if (obj.type === 'spore') {
                    return (
                        <group key={i} ref={el => sporeRef.current[i] = el} position={[obj.x, obj.y, obj.z]}>
                            {[0, 1, 2, 3, 4].map(j => (
                                <mesh key={j} position={[Math.cos(j * 1.25) * 3, Math.sin(j * 0.8) * 2, Math.sin(j * 1.25) * 3]}>
                                    <sphereGeometry args={[0.3 + j * 0.1, 6, 6]} />
                                    <meshStandardMaterial emissive={theme.accent} emissiveIntensity={5} color={theme.accent} transparent opacity={0.25} />
                                </mesh>
                            ))}
                        </group>
                    );
                }
                return null;
            })}
            {/* Alien Creatures */}
            {ALIEN_CREATURES.map((c, i) => <AlienCreature key={'creature_' + i} creature={c} theme={theme} />)}
        </group>
    );
}

// --- Viewport Components ---

function DroneModel({ type, hue }) {
    const rotors = useRef([]);
    const config = DRONE_TYPES[type];
    useFrame((_, delta) => {
        const d = Math.min(delta, 0.05);
        rotors.current.forEach((r, i) => { if (r) r.rotation.y += (i % 2 === 0 ? 1 : -1) * (config.id === 'SCOUT' ? 135 : 95) * d; });
    });
    return (
        <group scale={config.scale}>
            <pointLight position={[0, 2, 0]} intensity={8} color={hue} distance={25} />
            <spotLight position={[0, 0.5, 1.5]} angle={Math.PI / 4} penumbra={0.9} intensity={16} color="#ffffff" distance={50} />
            <mesh castShadow>
                {config.id === 'HEAVY' ? <boxGeometry args={[2.5, 0.8, 2.8]} /> : <boxGeometry args={[1.3, 0.5, 1.9]} />}
                <meshStandardMaterial color={hue} metalness={0.8} roughness={0.2} />
            </mesh>
            {(config.id === 'HEAVY' ? [[2, 2], [-2, 2], [2, -2], [-2, -2], [2.8, 0], [-2.8, 0]] : [[1.3, 1.3], [-1.3, 1.3], [1.3, -1.3], [-1.3, -1.3]]).map((pos, i) => (
                <group key={i} position={[pos[0], 0.25, pos[1]]} ref={el => rotors.current[i] = el}>
                    <mesh><cylinderGeometry args={[0.22, 0.22, 0.15]} /><meshStandardMaterial color="#000" /></mesh>
                    <mesh><boxGeometry args={[config.id === 'HEAVY' ? 2.6 : 2.0, 0.02, 0.12]} /><meshStandardMaterial color={hue} opacity={0.6} transparent /></mesh>
                </group>
            ))}
            <mesh position={[0, -0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[config.id === 'HEAVY' ? 1.7 : 1.1, 0.1, 16, 64]} />
                <meshStandardMaterial color={hue} emissive={hue} emissiveIntensity={65} />
            </mesh>
        </group>
    );
}

function Terrain({ theme }) {
    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(800, 800, 100, 100);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) pos.setZ(i, getHeight(pos.getX(i), -pos.getY(i)));
        geo.computeVertexNormals();
        return geo;
    }, []);
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -1, 0]}>
            <primitive object={geometry} attach="geometry" />
            <meshStandardMaterial color={theme.terrain} transparent opacity={0.99} roughness={0.7} metalness={0.3} />
        </mesh>
    );
}

function BaseStation({ theme, isCharging }) {
    const h = getHeight(0, 0) + 1.25;
    return (
        <group position={[0, -1 + h, 0]}>
            <mesh castShadow receiveShadow>
                <cylinderGeometry args={[8.8, 10.5, 1.8, 6]} />
                <meshStandardMaterial color="#010101" metalness={1} roughness={0.05} />
            </mesh>
            <mesh position={[0, 1.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[5.8, 6.6, 64]} />
                <meshStandardMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={isCharging ? 220 : 35} />
            </mesh>
        </group>
    );
}

// Goal Marker Component
function GoalMarker({ theme }) {
    const ref = useRef();
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y = state.clock.elapsedTime * 0.5;
            ref.current.position.y = GOAL_POSITION.y + Math.sin(state.clock.elapsedTime * 1.5) * 2;
        }
    });
    return (
        <group ref={ref} position={[GOAL_POSITION.x, GOAL_POSITION.y, GOAL_POSITION.z]}>
            {/* Outer ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[4, 0.3, 8, 32]} />
                <meshStandardMaterial emissive="#00ff88" emissiveIntensity={15} color="#00ff88" transparent opacity={0.7} />
            </mesh>
            {/* Inner sphere */}
            <mesh>
                <sphereGeometry args={[2, 16, 16]} />
                <meshStandardMaterial emissive="#00ff88" emissiveIntensity={20} color="#00ff88" transparent opacity={0.4} />
            </mesh>
            {/* Vertical beam */}
            <mesh>
                <cylinderGeometry args={[0.5, 0.5, 30, 8]} />
                <meshStandardMaterial emissive="#00ff88" emissiveIntensity={8} color="#00ff88" transparent opacity={0.2} />
            </mesh>
            {/* Point light */}
            <pointLight color="#00ff88" intensity={20} distance={40} />
        </group>
    );
}

function getConnectedGamepad() {
    if (!navigator.getGamepads) return null;
    const pads = navigator.getGamepads();
    for (let i = 0; i < pads.length; i++) {
        if (pads[i] && pads[i].connected) return pads[i];
    }
    return null;
}

// --- Collision Detection ---
function checkCollisions(pos, droneRadius, time = 0) {
    let hit = null;
    let minDist = Infinity;
    
    // Check collisions with static environment objects
    for (const obj of ENV_OBJECTS) {
        const dx = pos.x - obj.x;
        const dz = pos.z - obj.z;
        const dy = pos.y - obj.y;
        const horizDist = Math.sqrt(dx * dx + dz * dz);
        const totalRadius = droneRadius + obj.radius;
        // Vertical check: is the drone at the height of this object?
        let verticalOverlap = false;
        if (obj.type === 'building' || obj.type === 'tower') {
            const halfH = (obj.h || 10) / 2;
            verticalOverlap = pos.y > obj.y - halfH - droneRadius && pos.y < obj.y + halfH + droneRadius;
        } else {
            verticalOverlap = Math.abs(dy) < totalRadius;
        }
        if (horizDist < totalRadius && verticalOverlap) {
            if (horizDist < minDist) {
                minDist = horizDist;
                hit = { obj, dx, dz, dy, horizDist, totalRadius };
            }
        }
    }
    
    // Check collisions with alien creatures
    for (const c of ALIEN_CREATURES) {
        let creatureX, creatureY, creatureZ, creatureRadius;
        
        if (c.type === 'jellyfish') {
            creatureX = c.x + Math.sin(time * c.speed + c.phase) * 8;
            creatureZ = c.z + Math.cos(time * c.speed * 0.7 + c.phase) * 8;
            creatureY = c.baseY + Math.sin(time * 0.8 + c.phase) * 4;
            creatureRadius = c.size * 1.2; // Account for tentacles
        } else if (c.type === 'crawler') {
            creatureX = c.x + Math.sin(time * c.speed * 0.1 + c.phase) * 30;
            creatureZ = c.z + Math.cos(time * c.speed * 0.08 + c.phase) * 30;
            creatureY = getHeight(creatureX, creatureZ);
            creatureRadius = c.size * 1.5; // Account for body segments
        } else if (c.type === 'serpent') {
            creatureX = Math.cos(time * c.speed + c.phase) * c.orbitR;
            creatureZ = Math.sin(time * c.speed + c.phase) * c.orbitR;
            creatureY = c.baseY + Math.sin(time * 0.5 + c.phase) * 10;
            creatureRadius = c.size * 3; // Account for long body
        } else {
            continue;
        }
        
        const dx = pos.x - creatureX;
        const dz = pos.z - creatureZ;
        const dy = pos.y - creatureY;
        const horizDist = Math.sqrt(dx * dx + dz * dz);
        const totalRadius = droneRadius + creatureRadius;
        
        // Check both horizontal and vertical distance
        const verticalOverlap = Math.abs(dy) < totalRadius;
        
        if (horizDist < totalRadius && verticalOverlap) {
            if (horizDist < minDist) {
                minDist = horizDist;
                hit = { obj: { type: 'alien_' + c.type, x: creatureX, y: creatureY, z: creatureZ, radius: creatureRadius }, dx, dz, dy, horizDist, totalRadius };
            }
        }
    }
    
    return hit;
}

// --- Dynamics Core (v42 World Engine with DRL) ---

function DroneAgent({ controlState, droneType, droneHue, theme, onUpdateTelemetry, onUpdateStatus, onUpdateBattery, onCompleteRTB, onCollision, drlMode, onDRLUpdate, drlMetricsRef, onResetHull }) {
    const group = useRef();
    const { camera } = useThree();
    const config = DRONE_TYPES[droneType];
    const flight = useRef({
        pos: new THREE.Vector3(0, 15, 0),
        vel: new THREE.Vector3(0, 0, 0),
        target: new THREE.Vector3(0, 15, 0),
        heading: 0,
        initialized: false,
        rtbForced: false,
        collisionCooldown: 0,
    });
    const lastTele = useRef(0);
    const batteryRef = useRef(controlState.battery);
    batteryRef.current = controlState.battery;

    // DRL state tracking
    const drlState = useRef({
        prevState: null,
        hasCollided: false,
        metrics: new DRLMetrics(),
        currentReward: 0,
    });

    // Store metrics ref for parent access - initialize immediately
    if (drlMetricsRef) {
        drlMetricsRef.current = drlState.current.metrics;
    }

    useFrame((state, delta) => {
        if (!group.current) return;
        const f = flight.current;
        const d = Math.min(delta, 0.02);
        if (!f.initialized) { f.pos.set(0, 15, 0); f.target.copy(f.pos); f.initialized = true; }

        const pad = getConnectedGamepad();
        const baseH = getHeight(0, 0) + 1.25;
        const distB = f.pos.clone().setY(0).distanceTo(new THREE.Vector3(0, 0, 0));
        const overP = distB < 9.5;
        const isLandedOnPad = overP && f.pos.y < baseH + 2.5 && f.vel.length() < 2.0;
        const bat = batteryRef.current;
        const cap = config.batteryCap;
        const droneRadius = config.scale * 2.0;

        let drain = 0.4 * config.drain;
        let newStatus = null;
        if (f.collisionCooldown > 0) f.collisionCooldown -= d;

        // Hull critical -> forced RTB
        if (controlState.hull <= 0 && !f.rtbForced) {
            f.rtbForced = true;
        }

        // === DRL MODE LOGIC ===
        const isDRLMode = drlMode === 'PPO' || drlMode === 'TD3';
        let drlAction = null;
        
        if (isDRLMode && !controlState.isRunning && !controlState.isOnDemandRTB && !f.rtbForced) {
            // Extract current state
            const currentState = getDroneState(f.pos, f.vel, f.heading, batteryRef.current, drlState.current.hasCollided);
            
            // Check if at goal
            const distToGoal = Math.sqrt(
                Math.pow(f.pos.x - GOAL_POSITION.x, 2) +
                Math.pow(f.pos.y - GOAL_POSITION.y, 2) +
                Math.pow(f.pos.z - GOAL_POSITION.z, 2)
            );
            const isAtGoal = distToGoal < 15;
            
            // Get action from policy
            drlAction = getAction(currentState, drlMode, drlState.current.metrics.currentEpisode, drlState.current.metrics.trainingProgress);
            
            // Apply DRL action to target
            const moveSpeed = drlAction.thrust * config.speed * d * 2;
            const moveDir = new THREE.Vector3(
                Math.sin(f.heading + drlAction.yaw),
                drlAction.pitch * 0.5,
                Math.cos(f.heading + drlAction.yaw)
            );
            f.target.add(moveDir.multiplyScalar(moveSpeed));
            f.heading += drlAction.yaw * d * 2;
            
            // Calculate reward
            if (drlState.current.prevState) {
                const reward = computeReward(currentState, drlState.current.prevState, drlAction, drlState.current.hasCollided, isAtGoal);
                drlState.current.currentReward = reward;
                drlState.current.metrics.step(reward, drlMode);
                
                // Check episode termination
                const done = drlState.current.hasCollided || isAtGoal || batteryRef.current <= 0 || drlState.current.metrics.currentStep >= MAX_EPISODE_STEPS;
                
                if (done) {
                    drlState.current.metrics.endEpisode(drlMode);
                    // Reset for next episode
                    f.pos.set(0, 15, 0);
                    f.target.set(0, 15, 0);
                    f.vel.set(0, 0, 0);
                    onUpdateBattery(cap);
                    if (onResetHull) onResetHull(100);
                    drlState.current.hasCollided = false;
                    
                    // Log episode completion
                    onDRLUpdate({
                        episode: drlState.current.metrics.currentEpisode,
                        reward: drlState.current.metrics.episodeRewards.slice(-1)[0]?.reward || 0,
                        trainingProgress: drlState.current.metrics.trainingProgress,
                    });
                }
            }
            
            drlState.current.prevState = currentState;
            
            // Update status
            newStatus = `TRAINING_${drlMode}`;
            drain = (0.8 + drlAction.thrust * 2) * config.drain;
        }

        // === PRIORITY 1: RTB ===
        if ((bat <= 0.01 && !isLandedOnPad) || controlState.isOnDemandRTB || f.rtbForced) {
            if (!f.rtbForced) f.rtbForced = true;
            if (distB > 2.0) {
                newStatus = 'RTB_TRANSIT';
                if (f.pos.y < 35) { f.target.y += 40 * d; }
                else { f.target.lerp(new THREE.Vector3(0, 40, 0), 3.0 * d); }
            } else {
                newStatus = 'RTB_DESCENT';
                f.target.set(0, baseH + 1.25, 0);
            }
            if (isLandedOnPad) {
                f.rtbForced = false;
                onCompleteRTB();
                onUpdateBattery(prev => Math.min(prev + 950 * d, cap));
                newStatus = bat >= cap ? 'DOCKED_READY' : 'SUPERCHARGING';
                drain = 0;
            } else {
                drain = 0.05 * config.drain;
            }
        }
        // === PRIORITY 2: MISSION ===
        else if (controlState.isRunning && controlState.cmd) {
            newStatus = 'MISSION_ACTIVE';
            const c = controlState.cmd;
            const pwr = (65 * (c.val / 50)) * d;
            if (c.type === 'up' || c.type === 'takeoff') f.target.y += pwr;
            if (c.type === 'down' || c.type === 'land') f.target.y -= pwr;
            if (c.type === 'forward') f.target.add(new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), f.heading).multiplyScalar(pwr * 2.5));
            if (c.type === 'back' || c.type === 'backward') f.target.add(new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), f.heading).multiplyScalar(pwr * 2.5));
            if (c.type === 'left') f.target.add(new THREE.Vector3(-1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), f.heading).multiplyScalar(pwr * 2.5));
            if (c.type === 'right') f.target.add(new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), f.heading).multiplyScalar(pwr * 2.5));
            if (c.type === 'turn' || c.type === 'rotate') f.heading += (c.val / 10) * d;
            drain = 8 * config.drain;
        }
        // === PRIORITY 3: MANUAL ===
        else if (controlState.isManual) {
            let mx = 0, mz = 0, my = 0;
            if (controlState.keys['w']) mz = -1; if (controlState.keys['s']) mz = 1;
            if (controlState.keys['a']) mx = -1; if (controlState.keys['d']) mx = 1;
            if (controlState.keys[' ']) my = 1; if (controlState.keys['shift']) my = -1;
            if (controlState.keys['q']) f.heading += config.yaw * d;
            if (controlState.keys['e']) f.heading -= config.yaw * d;
            if (pad) {
                const dz = 0.15;
                if (pad.axes.length > 0 && Math.abs(pad.axes[0]) > dz) mx = pad.axes[0];
                if (pad.axes.length > 1 && Math.abs(pad.axes[1]) > dz) mz = pad.axes[1];
                if (pad.axes.length > 2 && Math.abs(pad.axes[2]) > dz) f.heading -= pad.axes[2] * config.yaw * 0.6 * d;
                if (pad.axes.length > 3 && Math.abs(pad.axes[3]) > dz) my = -pad.axes[3];
                if (pad.buttons.length > 0 && pad.buttons[0]?.pressed) my = 1;
                if (pad.buttons.length > 1 && pad.buttons[1]?.pressed) my = -1;
                if (pad.buttons.length > 4 && pad.buttons[4]?.pressed) f.heading += config.yaw * d;
                if (pad.buttons.length > 5 && pad.buttons[5]?.pressed) f.heading -= config.yaw * d;
            }
            const hasInput = mx !== 0 || mz !== 0 || my !== 0;
            if (isLandedOnPad && my <= 0 && !hasInput) {
                onUpdateBattery(prev => Math.min(prev + 950 * d, cap));
                f.target.set(0, baseH + 1.25, 0);
                newStatus = bat >= cap ? 'DOCKED_READY' : 'SUPERCHARGING';
                drain = 0;
            } else {
                newStatus = 'PILOT_LINK';
                const move = new THREE.Vector3(mx, 0, mz).applyAxisAngle(new THREE.Vector3(0, 1, 0), f.heading);
                f.target.add(move.multiplyScalar(config.speed * d));
                f.target.y += my * config.speed * d;
                drain = (1.0 + (Math.abs(mx) + Math.abs(mz)) * 6.0 + (my !== 0 ? 5.0 : 0)) * config.drain;
            }
        }
        // === PRIORITY 4: IDLE on pad ===
        else if (isLandedOnPad) {
            f.target.set(0, baseH + 1.25, 0);
            onUpdateBattery(prev => Math.min(prev + 950 * d, cap));
            newStatus = bat >= cap ? 'DOCKED_READY' : 'SUPERCHARGING';
            drain = 0;
        }
        // === PRIORITY 5: IDLE ===
        else {
            const floor = getHeight(f.pos.x, f.pos.z) - 0.5 + (config.scale * 0.5);
            if (f.pos.y < floor + 0.5 && f.vel.length() < 0.2) drain = 0;
            newStatus = 'SYS_STANDBY';
        }

        // Clamp
        f.target.x = THREE.MathUtils.clamp(f.target.x, -285, 285);
        f.target.z = THREE.MathUtils.clamp(f.target.z, -285, 285);
        f.target.y = THREE.MathUtils.clamp(f.target.y, 0, 150);

        if (drain > 0) onUpdateBattery(prev => Math.max(prev - drain * d, 0));

        // Spring physics
        const spr = new THREE.Vector3().subVectors(f.target, f.pos).multiplyScalar(10.5);
        f.vel.add(spr.multiplyScalar(d)).multiplyScalar(0.94);
        f.pos.add(f.vel.clone().multiplyScalar(d));

        // Floor collision
        let floorH = getHeight(f.pos.x, f.pos.z) - 0.5;
        if (overP) floorH = Math.max(floorH, baseH + 1.25);
        if (f.pos.y < floorH) { f.pos.y = floorH; f.vel.y = 0; }
        f.target.y = Math.max(floorH, f.target.y);

        // === COLLISION DETECTION (v42) ===
        if (f.collisionCooldown <= 0) {
            const hit = checkCollisions(f.pos, droneRadius, state.clock.elapsedTime);
            if (hit) {
                // Calculate impact damage from velocity
                const impactSpeed = f.vel.length();
                const damage = Math.floor(impactSpeed * 8);
                if (damage > 0) {
                    onCollision(damage);
                    drlState.current.hasCollided = true; // Mark for DRL reward
                    f.collisionCooldown = 0.5; // Half-second cooldown between hits
                }
                // Bounce: push drone away from object
                const pushDir = new THREE.Vector3(hit.dx, 0, hit.dz).normalize();
                const pushDist = hit.totalRadius - hit.horizDist + 1.0;
                f.pos.add(pushDir.multiplyScalar(pushDist));
                f.target.copy(f.pos);
                // Reflect velocity
                f.vel.reflect(pushDir.normalize()).multiplyScalar(0.3);
            }
        }

        group.current.position.copy(f.pos);
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, f.heading, 0.2);

        const time = state.clock.elapsedTime;
        if (time - lastTele.current > 0.1) {
            onUpdateTelemetry({ x: f.pos.x, z: f.pos.z, y: Math.max(0, f.pos.y - floorH), speed: f.vel.length() });
            if (newStatus) onUpdateStatus(newStatus);
            lastTele.current = time;
        }

        if (!controlState.userOrbiting) {
            camera.position.lerp(f.pos.clone().add(new THREE.Vector3(0, 18, 38).applyAxisAngle(new THREE.Vector3(0, 1, 0), f.heading)), 0.12);
            camera.lookAt(f.pos.x, f.pos.y - 1.5, f.pos.z);
        }
    });
    return <group ref={group}><DroneModel type={droneType} hue={droneHue} /></group>;
}

// --- Dashboard ---

export default function App() {
    console.log('App rendering...');
    const [thN, setThN] = useState('CYBERPUNK');
    const [drT, setDrT] = useState('PHANTOM');
    const [drH, setDrH] = useState(DRONE_COLORS[0].hex);
    const [isM, setIsM] = useState(false);
    const [isR, setIsR] = useState(false);
    const [sts, setSts] = useState('INITIALIZING');
    const [bat, setBat] = useState(100);
    const [hull, setHull] = useState(100);
    const [tele, setTele] = useState({ x: 0, z: 0, y: 0, speed: 0 });
    const [logs, setLogs] = useState([{ msg: "V40.0 World Engine online.", time: "SYS" }]);
    const [tab, setTab] = useState('code');
    const [code, setCode] = useState(`drone.takeoff(35)\ndrone.forward(120)\ndrone.rotate(90)\ndrone.land()`);
    const [cmd, setCmd] = useState(null);
    const [showT, setShowT] = useState(false);
    const [orb, setOrb] = useState(false);
    const [rtb, setRtb] = useState(false);
    const [showAddBlock, setShowAddBlock] = useState(false);
    const [blocks, setBlocks] = useState([
        { id: '1', type: 'takeoff', label: 'TAKEOFF', val: 35 },
        { id: '2', type: 'forward', label: 'FORWARD', val: 80 },
        { id: '3', type: 'land', label: 'LAND', val: 0 }
    ]);

    // DRL Mode State
    const [drlMode, setDrlMode] = useState('MANUAL'); // MANUAL, PPO, TD3
    const [drlMetrics, setDrlMetrics] = useState({
        episode: 0,
        episodeReward: 0,
        trainingProgress: 0,
        currentReward: 0,
        episodeRewards: [],
        actorLosses: [],
        criticLosses: [],
    });
    const [showDRLPanel, setShowDRLPanel] = useState(false);
    const drlMetricsRef = useRef(null); // Reference to DRLMetrics instance

    const isRunningRef = useRef(false);
    isRunningRef.current = isR;

    const theme = THEMES[thN];
    const keys = useRef({});
    const cap = DRONE_TYPES[drT].batteryCap;
    const batPct = Math.min(100, Math.max(0, Math.floor((bat / cap) * 100)));
    const isWarn = batPct < 15;
    const isC = sts.includes('CHARGING') || sts.includes('DOCKED') || sts.includes('SUPER');
    const hullWarn = hull < 30;

    // Hull repair while charging
    useEffect(() => {
        if (isC && hull < 100) {
            const interval = setInterval(() => setHull(h => Math.min(h + 2, 100)), 200);
            return () => clearInterval(interval);
        }
    }, [isC, hull]);

    useEffect(() => { if (bat > cap) setBat(cap); }, [bat, cap]);
    useEffect(() => {
        const down = (e) => {
            if (['TEXTAREA', 'INPUT'].includes(document.activeElement?.tagName)) return;
            const k = e.key.toLowerCase();
            keys.current[k] = true;
            if (k === ' ') e.preventDefault();
        };
        const up = (e) => { keys.current[e.key.toLowerCase()] = false; };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
    }, []);

    const runMission = useCallback(async () => {
        if (isR) return;
        setIsR(true); setIsM(false);
        const lines = tab === 'blocks'
            ? blocks.map(b => `drone.${b.type}(${b.val || 50})`)
            : code.split('\n').map(l => l.trim()).filter(l => l !== '');
        setLogs(prev => [...prev, { msg: `Mission: ${lines.length} commands`, time: new Date().toLocaleTimeString() }]);
        for (let i = 0; i < lines.length; i++) {
            const l = lines[i].toLowerCase();
            const m = l.match(/(?:drone\.)?(\w+)\s*\(?\s*(\d+)?\s*\)?/);
            if (m) {
                const type = m[1]; const val = m[2] ? parseInt(m[2]) : 50;
                setCmd({ type, val });
                setLogs(prev => [...prev, { msg: `> ${type}(${val})`, time: new Date().toLocaleTimeString() }]);
                await new Promise(r => setTimeout(r, 2500));
            }
        }
        setCmd(null); setIsR(false);
        setLogs(prev => [...prev, { msg: "Mission complete.", time: new Date().toLocaleTimeString() }]);
    }, [isR, tab, blocks, code]);

    const handleUpdateBattery = useCallback((valOrFn) => {
        if (typeof valOrFn === 'function') setBat(prev => valOrFn(prev));
        else setBat(valOrFn);
    }, []);

    const handleCollision = useCallback((damage) => {
        setHull(h => Math.max(0, h - damage));
        setLogs(prev => [...prev, { msg: `COLLISION! Hull -${damage}`, time: new Date().toLocaleTimeString() }]);
    }, []);

    const handleDRLUpdate = useCallback((metrics) => {
        setDrlMetrics(prev => ({
            ...prev,
            episode: metrics.episode,
            episodeReward: metrics.reward,
            trainingProgress: metrics.trainingProgress,
        }));
        setLogs(prev => [...prev, { 
            msg: `Episode ${metrics.episode} | Reward: ${metrics.reward.toFixed(1)} | Progress: ${(metrics.trainingProgress * 100).toFixed(0)}%`, 
            time: new Date().toLocaleTimeString() 
        }]);
    }, []);

    // Periodically update DRL charts with latest metrics
    useEffect(() => {
        if (drlMode === 'MANUAL' || !drlMetricsRef || !drlMetricsRef.current) {
            return;
        }
        
        const interval = setInterval(() => {
            try {
                const metrics = drlMetricsRef.current;
                if (metrics) {
                    setDrlMetrics({
                        episode: metrics.currentEpisode || 0,
                        episodeReward: metrics.episodeReward || 0,
                        trainingProgress: metrics.trainingProgress || 0,
                        currentReward: metrics.currentReward || 0,
                        episodeRewards: metrics.getRecentRewards ? metrics.getRecentRewards(30) : [],
                        actorLosses: metrics.getRecentActorLosses ? metrics.getRecentActorLosses(30) : [],
                        criticLosses: metrics.getRecentCriticLosses ? metrics.getRecentCriticLosses(30) : [],
                    });
                }
            } catch (error) {
                console.error('Error updating DRL metrics:', error);
            }
        }, 500);
        
        return () => clearInterval(interval);
    }, [drlMode]);

    return (
        <div className="fixed inset-0 select-none overflow-hidden bg-[#020202] text-white selection:bg-cyan-500/30 font-light translate-z-0">
            {/* Error Boundary Fallback */}
            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 9999, color: 'red', background: 'black', padding: '10px' }}>
                PROJECT MONERO v42.0 - DRL Enhanced
            </div>

            <AnimatePresence>
                {isM && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-none border-[12px] border-cyan-500/10 z-0" />}
            </AnimatePresence>

            {/* Collision Flash */}
            <AnimatePresence>
                {hullWarn && <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.15, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="absolute inset-0 pointer-events-none bg-red-500 z-0" />}
            </AnimatePresence>

            {/* 3D Context */}
            <div className="absolute inset-0 pointer-events-auto">
                <Canvas shadows camera={{ fov: 40 }}>
                    <Suspense fallback={
                        <mesh>
                            <boxGeometry args={[1, 1, 1]} />
                            <meshStandardMaterial color="#00ffff" />
                        </mesh>
                    }>
                        <Environment preset="night" />
                        <fog attach="fog" args={[theme.bg, 60, 500]} />
                        <ambientLight intensity={0.7} />
                        <directionalLight position={[50, 100, 50]} intensity={4.5} castShadow shadow-mapSize={[2048, 2048]} />
                        <DroneAgent
                            controlState={{
                                isManual: isM && drlMode === 'MANUAL', keys: keys.current, isRunning: isR, cmd,
                                userOrbiting: orb, isOnDemandRTB: rtb, battery: bat, statusStr: sts, hull
                            }}
                            droneType={drT} droneHue={drH} theme={theme}
                            onUpdateTelemetry={setTele} onUpdateStatus={setSts}
                            onUpdateBattery={handleUpdateBattery} onCompleteRTB={() => setRtb(false)}
                            onCollision={handleCollision}
                            drlMode={drlMode}
                            onDRLUpdate={handleDRLUpdate}
                            drlMetricsRef={drlMetricsRef}
                            onResetHull={setHull}
                        />
                        <BaseStation theme={theme} isCharging={isC} />
                        <Terrain theme={theme} />
                        <EnvironmentObjects theme={theme} />
                        {drlMode !== 'MANUAL' && <GoalMarker theme={theme} />}
                        <OrbitControls enablePan={false} onStart={() => setOrb(true)} onEnd={() => setTimeout(() => setOrb(false), 1500)} />
                    </Suspense>
                </Canvas>
            </div>

            {/* --- HUD --- */}
            <div className="absolute top-8 inset-x-12 flex justify-center pointer-events-none">
                <div className="flex items-center gap-8 bg-black/40 backdrop-blur-3xl px-8 py-4 rounded-2xl border border-white/5 shadow-2xl scale-95 relative transition-all duration-500 hover:bg-black/60">
                    {isWarn && (
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded text-[8px] font-black tracking-widest text-rose-500 uppercase animate-pulse">
                            <AlertTriangle size={10} /> critical_power
                        </div>
                    )}
                    {hullWarn && (
                        <div className="absolute -bottom-8 right-4 flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded text-[8px] font-black tracking-widest text-orange-500 uppercase animate-pulse">
                            <Shield size={10} /> hull_critical
                        </div>
                    )}
                    {isM && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-[8px] font-black tracking-widest text-cyan-400 uppercase">
                            <Gamepad2 size={10} /> override_active
                        </div>
                    )}
                    {drlMode !== 'MANUAL' && (
                        <div className="absolute -top-8 right-4 flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-black tracking-widest text-emerald-400 uppercase animate-pulse">
                            <Brain size={10} /> {drlMode}_TRAINING_ACTIVE
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="text-[7px] font-black opacity-20 tracking-[0.4em] mb-0.5 uppercase">NAV</span>
                        <span className="text-lg font-black italic tracking-tighter uppercase transition-colors duration-500" style={{ color: isM ? '#22d3ee' : isC ? '#10b981' : theme.accent }}>{sts}</span>
                    </div>
                    <div className="w-[1px] h-7 bg-white/5" />
                    <div className="flex gap-8">
                        <div className="flex flex-col items-center">
                            <span className="text-[7px] font-black opacity-20 tracking-[0.4em] mb-0.5 uppercase">ALT</span>
                            <span className="text-xl font-black italic tracking-tighter tabular-nums">{tele.y.toFixed(1)}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[7px] font-black opacity-20 tracking-[0.4em] mb-0.5 uppercase">SPD</span>
                            <span className="text-xl font-black italic tracking-tighter tabular-nums">{(tele.speed * 10).toFixed(1)}</span>
                        </div>
                    </div>
                    <div className="w-[1px] h-7 bg-white/5" />
                    <div className="flex flex-col items-center">
                        <span className="text-[7px] font-black opacity-20 tracking-[0.4em] mb-0.5 uppercase">ENERGY</span>
                        <span className={`text-xl font-black italic tracking-tighter tabular-nums transition-all duration-500 ${isWarn ? 'text-rose-500' : isC ? 'text-emerald-400 animate-pulse' : 'text-white'}`}>{batPct}%</span>
                    </div>
                    <div className="w-[1px] h-7 bg-white/5" />
                    <div className="flex flex-col items-center">
                        <span className="text-[7px] font-black opacity-20 tracking-[0.4em] mb-0.5 uppercase">HULL</span>
                        <span className={`text-xl font-black italic tracking-tighter tabular-nums transition-all duration-500 ${hullWarn ? 'text-orange-500 animate-pulse' : hull < 60 ? 'text-amber-400' : 'text-white'}`}>{hull}%</span>
                    </div>
                </div>
            </div>

            {/* Operations Sidebar (Left) */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-[340px] pointer-events-none flex flex-col gap-5 scale-95 origin-left">
                <div className="bg-black/30 backdrop-blur-2xl border border-white/5 rounded-[40px] overflow-hidden flex flex-col pointer-events-auto transition-all hover:bg-black/50 hover:border-white/10">
                    <div className="flex bg-white/5 p-1.5 m-5 rounded-3xl">
                        {['blocks', 'code'].map(t => (
                            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-[10px] font-black rounded-2xl transition-all flex items-center justify-center gap-2 ${tab === t ? 'bg-white/10 text-white shadow-inner' : 'text-white/20 hover:text-white'}`}>
                                {t === 'blocks' ? <Layers size={14} /> : <Code size={14} />} {t.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <div className="px-8 pb-8">
                        {tab === 'blocks' ? (
                            <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar">
                                {blocks.map((b, idx) => (
                                    <div key={b.id} className="h-12 flex items-center px-4 rounded-xl bg-white/5 border border-white/5 gap-2 group">
                                        <span className="text-[8px] font-black text-white/10 tabular-nums w-4">{idx + 1}</span>
                                        <div className="w-1 h-4 bg-cyan-500/30 rounded-full" />
                                        <span className="flex-1 text-[10px] font-black text-white/40 tracking-widest uppercase">{b.label}</span>
                                        <input type="number" value={b.val} onChange={e => setBlocks(blocks.map(x => x.id === b.id ? { ...x, val: parseInt(e.target.value) || 0 } : x))} className="w-12 h-7 bg-white/5 border border-white/5 rounded-lg text-center text-[10px] font-black text-cyan-400 outline-none focus:border-cyan-500/30 pointer-events-auto" />
                                        <button onClick={() => setBlocks(blocks.filter(x => x.id !== b.id))} className="text-white/10 hover:text-rose-500 transition-colors"><X size={12} /></button>
                                    </div>
                                ))}
                                <div className="relative">
                                    <button onClick={() => setShowAddBlock(!showAddBlock)} className="w-full h-10 rounded-xl border border-dashed border-white/10 flex items-center justify-center gap-2 text-[9px] font-black text-white/20 hover:text-cyan-400 hover:border-cyan-500/30 transition-all uppercase tracking-widest">
                                        <Plus size={12} /> ADD <ChevronDown size={10} className={`transition-transform ${showAddBlock ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showAddBlock && (
                                        <div className="absolute top-12 left-0 right-0 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl">
                                            {BLOCK_COMMANDS.map(bc => (
                                                <button key={bc.type} onClick={() => { setBlocks(prev => [...prev, { id: Date.now().toString(), type: bc.type, label: bc.label, val: bc.defaultVal }]); setShowAddBlock(false); }} className="w-full h-9 flex items-center px-4 gap-2 text-[9px] font-black text-white/40 hover:text-cyan-400 hover:bg-white/5 transition-all uppercase tracking-widest">
                                                    <div className="w-1 h-3 rounded-full bg-cyan-500/30" />{bc.label}<span className="ml-auto text-[8px] text-white/10">{bc.defaultVal}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <textarea value={code} onChange={e => setCode(e.target.value)} className="w-full h-52 bg-transparent p-5 rounded-2xl border border-white/5 text-[11px] font-mono text-emerald-400/80 outline-none resize-none leading-relaxed pointer-events-auto custom-scrollbar" spellCheck="false" />
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-3 pointer-events-auto">
                    {/* DRL Mode Selector */}
                    <div className="bg-black/30 backdrop-blur-2xl border border-white/5 rounded-[36px] p-4 transition-all hover:bg-black/50">
                        <span className="text-[7px] font-black opacity-20 tracking-[0.4em] block mb-3 uppercase">LEARNING_MODE</span>
                        <div className="grid grid-cols-3 gap-2">
                            {['MANUAL', 'PPO', 'TD3'].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => {
                                        setDrlMode(mode);
                                        if (mode !== 'MANUAL') {
                                            setIsM(false); // Disable manual when in DRL mode
                                            setShowDRLPanel(true);
                                        }
                                    }}
                                    className={`py-3 rounded-xl border text-[9px] font-black transition-all flex flex-col items-center gap-1 ${
                                        drlMode === mode
                                            ? mode === 'PPO'
                                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/10'
                                                : mode === 'TD3'
                                                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-400 shadow-lg shadow-purple-500/10'
                                                    : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                                            : 'border-white/5 text-white/20 hover:text-white/60 hover:border-white/20'
                                    }`}
                                >
                                    {mode === 'MANUAL' ? <Gamepad2 size={14} /> : mode === 'PPO' ? <TrendingUp size={14} /> : <Brain size={14} />}
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={() => setIsM(!isM)} disabled={drlMode !== 'MANUAL'} className={`h-20 rounded-[36px] flex flex-col items-center justify-center gap-0.5 transition-all border shadow-2xl active:scale-95 ${drlMode !== 'MANUAL' ? 'opacity-30 cursor-not-allowed bg-white/5 border-white/5 text-white/20' : isM ? 'bg-cyan-500 border-cyan-400 text-black shadow-cyan-500/20' : 'bg-white/10 border-white/10 text-white/50 hover:bg-white/20'}`}>
                        <div className="flex items-center gap-2"><Gamepad2 size={20} /><span className="text-[14px] font-black uppercase tracking-[0.2em]">{isM ? 'LINK_ACTIVE' : 'MANUAL_OVERRIDE'}</span></div>
                        <span className="text-[7px] font-black opacity-40 uppercase tracking-widest">{drlMode !== 'MANUAL' ? 'DISABLED_IN_DRL_MODE' : isM ? 'DOCK_TO_CHARGE / SPACE_TO_EXIT' : 'WASD / CONTROLLER'}</span>
                    </button>
                    <div className="flex gap-3 h-14">
                        <button onClick={runMission} className={`flex-[2] rounded-[32px] border flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all ${isR ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 animate-pulse' : 'bg-white/10 border-white/5 hover:bg-white/20 text-white/60'} disabled:opacity-20`} disabled={isR || isM || drlMode !== 'MANUAL'}>
                            {isR ? <RotateCcw size={16} className="animate-spin" /> : <Zap size={16} fill="currentColor" />} {isR ? 'EXECUTING' : 'RUN_MISSION'}
                        </button>
                        <button onClick={() => setRtb(true)} className={`flex-1 rounded-[32px] border text-[10px] font-black transition-all ${rtb ? 'bg-rose-500/20 border-rose-500/40 text-rose-500 animate-pulse' : 'bg-transparent border-white/5 text-white/20 hover:text-rose-500 hover:border-rose-500/20'}`}>RTB</button>
                    </div>
                </div>
            </div>

            {/* Control Legend */}
            <AnimatePresence>
                {isM && (
                    <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} className="absolute bottom-10 left-10 pointer-events-none">
                        <div className="bg-black/40 backdrop-blur-3xl p-5 rounded-2xl border border-white/5 flex flex-col gap-1 shadow-2xl">
                            <span className="text-[7px] font-black opacity-20 tracking-[0.4em] uppercase mb-1">INPUT_MAP</span>
                            <div className="text-[8px] font-black text-emerald-400/60 uppercase mb-2 px-2 py-0.5 bg-emerald-400/5 rounded border border-emerald-400/10">Land on pad to recharge</div>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                <div className="flex items-center gap-2 text-[9px] font-black text-white/40 tracking-widest uppercase"><span className="w-7 h-7 rounded bg-white/5 flex items-center justify-center text-cyan-400 text-[8px]">WASD</span> MOVE</div>
                                <div className="flex items-center gap-2 text-[9px] font-black text-white/40 tracking-widest uppercase"><span className="w-7 h-7 rounded bg-white/5 flex items-center justify-center text-cyan-400 text-[8px]">QE</span> YAW</div>
                                <div className="flex items-center gap-2 text-[9px] font-black text-white/40 tracking-widest uppercase"><span className="w-7 h-7 rounded bg-white/5 flex items-center justify-center text-cyan-400 text-[8px]">SPC</span> UP</div>
                                <div className="flex items-center gap-2 text-[9px] font-black text-white/40 tracking-widest uppercase"><span className="w-7 h-7 rounded bg-white/5 flex items-center justify-center text-cyan-400 text-[8px]">SHF</span> DOWN</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* DRL Training Metrics Panel */}
            <AnimatePresence>
                {showDRLPanel && drlMode !== 'MANUAL' && (
                    <motion.div
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        className="absolute right-6 top-24 w-[380px] pointer-events-none"
                    >
                        <div className="bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[32px] overflow-hidden shadow-2xl pointer-events-auto">
                            {/* Header */}
                            <div className="p-5 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Brain size={16} className={drlMode === 'PPO' ? 'text-emerald-400' : 'text-purple-400'} />
                                    <span className="text-[10px] font-black tracking-[0.3em] uppercase">{drlMode} TRAINING METRICS</span>
                                </div>
                                <button onClick={() => setShowDRLPanel(false)} className="text-white/20 hover:text-white transition-colors">
                                    <X size={14} />
                                </button>
                            </div>

                            {/* Real-time Stats */}
                            <div className="p-5 grid grid-cols-2 gap-3 border-b border-white/5">
                                <div className="bg-white/5 rounded-xl p-3">
                                    <div className="flex items-center gap-1 mb-1">
                                        <Target size={10} className="text-cyan-400" />
                                        <span className="text-[7px] font-black opacity-30 uppercase tracking-wider">Episode</span>
                                    </div>
                                    <span className="text-lg font-black tabular-nums text-white">{drlMetrics.episode}</span>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3">
                                    <div className="flex items-center gap-1 mb-1">
                                        <TrendingUp size={10} className={drlMetrics.trainingProgress > 0.5 ? 'text-emerald-400' : 'text-amber-400'} />
                                        <span className="text-[7px] font-black opacity-30 uppercase tracking-wider">Progress</span>
                                    </div>
                                    <span className="text-lg font-black tabular-nums text-white">{(drlMetrics.trainingProgress * 100).toFixed(0)}%</span>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 col-span-2">
                                    <div className="flex items-center gap-1 mb-1">
                                        <Zap size={10} className="text-yellow-400" />
                                        <span className="text-[7px] font-black opacity-30 uppercase tracking-wider">Episode Reward</span>
                                    </div>
                                    <span className={`text-2xl font-black tabular-nums ${drlMetrics.episodeReward > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {drlMetrics.episodeReward > 0 ? '+' : ''}{drlMetrics.episodeReward.toFixed(1)}
                                    </span>
                                </div>
                            </div>

                            {/* Charts */}
                            <div className="p-5 space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
                                {/* Reward Curve */}
                                <div>
                                    <span className="text-[7px] font-black opacity-20 tracking-[0.3em] block mb-2 uppercase">REWARD vs EPISODE</span>
                                    <div className="h-32 bg-white/5 rounded-xl p-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={drlMetrics.episodeRewards || []}>
                                                <defs>
                                                    <linearGradient id="rewardGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="episode" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)' }} />
                                                <YAxis tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)' }} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                                    labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}
                                                    itemStyle={{ color: '#10b981', fontSize: '10px', fontWeight: 'bold' }}
                                                />
                                                <Area type="monotone" dataKey="reward" stroke="#10b981" strokeWidth={2} fill="url(#rewardGrad)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Loss Curves */}
                                {drlMode === 'PPO' ? (
                                    <div>
                                        <span className="text-[7px] font-black opacity-20 tracking-[0.3em] block mb-2 uppercase">ACTOR LOSS</span>
                                        <div className="h-28 bg-white/5 rounded-xl p-2">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={drlMetrics.actorLosses || []}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis dataKey="step" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)' }} />
                                                    <YAxis tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)' }} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                                        labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}
                                                        itemStyle={{ color: '#f59e0b', fontSize: '10px', fontWeight: 'bold' }}
                                                    />
                                                    <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <span className="text-[7px] font-black opacity-20 tracking-[0.3em] block mb-2 uppercase">CRITIC LOSS</span>
                                        <div className="h-28 bg-white/5 rounded-xl p-2">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={drlMetrics.criticLosses || []}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis dataKey="step" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)' }} />
                                                    <YAxis tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)' }} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                                        labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}
                                                        itemStyle={{ color: '#8b5cf6', fontSize: '10px', fontWeight: 'bold' }}
                                                    />
                                                    <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Config Workspace (Right) */}
            <div className="absolute right-6 bottom-6 flex flex-col items-end gap-5 w-[300px] pointer-events-none scale-95 origin-right">
                <div className="bg-black/30 backdrop-blur-2xl p-6 rounded-[36px] border border-white/5 pointer-events-auto w-full shadow-2xl transition-all hover:bg-black/50">
                    <div className="mb-6">
                        <span className="text-[8px] font-black opacity-20 tracking-[0.4em] block mb-3 uppercase">DRONE_HUE</span>
                        <div className="flex justify-between gap-2 p-2 bg-white/5 rounded-xl border border-white/5">
                            {DRONE_COLORS.map(c => (
                                <button key={c.name} onClick={() => setDrH(c.hex)} className={`w-6 h-6 rounded-full transition-all border-2 ${drH === c.hex ? 'border-white scale-125 shadow-lg shadow-white/20' : 'border-transparent opacity-40 hover:opacity-100 hover:scale-110'}`} style={{ backgroundColor: c.hex }} title={c.name} />
                            ))}
                        </div>
                    </div>
                    <span className="text-[8px] font-black opacity-20 tracking-[0.4em] block mb-4 uppercase">ACTIVE_FLEET</span>
                    <div className="grid grid-cols-3 gap-2 mb-6">
                        {Object.values(DRONE_TYPES).map(d => (
                            <button key={d.id} onClick={() => { setDrT(d.id); setBat(d.batteryCap); setHull(100); }} className={`p-3 rounded-xl border flex flex-col items-center gap-3 transition-all ${drT === d.id ? 'bg-white/10 border-white/40 text-white shadow-lg' : 'border-white/5 text-white/10 hover:text-white'}`}>
                                <d.icon size={16} /><span className="text-[7px] font-black uppercase">{d.id}</span>
                            </button>
                        ))}
                    </div>
                    <span className="text-[8px] font-black opacity-20 tracking-[0.4em] block mb-4 uppercase">THEME</span>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.keys(THEMES).map(t => (
                            <button key={t} onClick={() => setThN(t)} className={`py-2.5 text-[8px] font-black rounded-lg border transition-all ${thN === t ? 'bg-white/10 border-white/40 text-white shadow-md' : 'border-white/5 text-white/10 hover:text-white'}`}>{t}</button>
                        ))}
                    </div>
                </div>
                <button onClick={() => setShowT(!showT)} className="w-full h-14 bg-black/40 backdrop-blur-3xl border border-white/5 rounded-2xl text-[9px] font-black tracking-[0.4em] text-white/20 hover:text-white pointer-events-auto uppercase transition-all shadow-xl flex items-center justify-center gap-3">
                    <Activity size={16} /> {showT ? 'EXIT_LOG' : 'LOG_VIEWER'}
                </button>
            </div>

            {/* Log Feed */}
            <AnimatePresence>
                {showT && (
                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="absolute bottom-24 left-6 right-6 flex justify-center pointer-events-none">
                        <div className="w-full max-w-[700px] bg-black/60 backdrop-blur-3xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl pointer-events-auto">
                            <div className="p-6 font-mono text-[9px] max-h-36 overflow-y-auto space-y-1 custom-scrollbar">
                                {logs.map((l, i) => <div key={i} className="flex gap-4"><span className="text-cyan-400/50">[{l.time}]</span><span className={`italic uppercase tracking-widest ${l.msg.includes('COLLISION') ? 'text-orange-400/60' : 'text-white/30'}`}>{l.msg}</span></div>)}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
