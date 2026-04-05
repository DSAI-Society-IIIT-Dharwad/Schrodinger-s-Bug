#  Leo Mars Rover Simulation

A high-fidelity, interactive 3D Mars Rover simulation built with **React**, **Three.js (React Three Fiber)**, and **TailwindCSS**. This project features a procedural terrain engine, a custom kinematic drivetrain, and a mobile-optimized mission control system.

##  Experience the Mission

The simulation drops you into a scientific exploration mission on an alien planet. You can explore the terrain manually or program automated mission sequences using a block-based command system.

### Peak Features
- **Deterministic Kinematic Drivetrain**: Procedural height sampling for perfectly stable movement across uneven terrain.
- **Dynamic Terrain Engine**: Mathematically generated hills, craters, and rocks with a safe "Landing Zone" at the origin.
- **Mobile Optimized Interface**: Full touch controls, responsive HUD, and adaptive layouts for scientific exploration on the go.
- **Mission Control System**: Drag-and-drop command blocks to automate rover patterns.
- **Integrated HUD**: Real-time telemetry including position, altitude, battery health, and signal strength.
- **Synthetic Audio Engine**: Real-time synthesized engine sounds and UI feedback.

---

##  How to Control

###  Desktop Controls
| Input | Action |
|-------|--------|
| `W` / `ArrowUp` | Drive Forward |
| `S` / `ArrowDown` | Reverse |
| `A` / `ArrowLeft` | Pivot Left |
| `D` / `ArrowRight` | Pivot Right |
| `Space` | Toggle Manual/Auto Mode |

###  Mobile Controls
- **Manual Mode**: Engaging 'MANUAL' mode reveals a virtual Arrow Pad on the bottom left for touch interaction.
- **Responsive HUD**: Telemetry data and Mission Control panels collapse gracefully for a clean mobile viewport.

---

##  Technical Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Sreejith-nair511/Rover_motion.git
   ```
2. Navigate to the project directory:
   ```bash
   cd Rover
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Development
Start the development server:
```bash
npm run dev
```

### Production
Build for production:
```bash
npm run build
```

---

##  Programming the Rover

The **Mission Control** panel allows you to queue commands:
1. **FORWARD**: Drives the rover 10 meters.
2. **RIGHT/LEFT**: Pivots the rover 90 degrees.
3. **U-TURN**: Performs a 180-degree turn.
4. **START SEQUENCE**: Executes all queued blocks in order.

---

##  System Architecture

- **Grounding Physics**: The rover uses a 100Hz sampling loop to calculate the exact height of the terrain beneath its four independent suspension points, ensuring the model never "phases" through the ground.
- **Terrain Blending**: Uses a distance-based weight function to ensure a flat origin `[0,0,0]` while gradually introducing noise-based terrain features beyond a 15-meter radius.
- **Shadow Maps**: Optimized `PCFShadowMap` for realistic grounding visuals without heavy GPU overhead.

---
*Created by Sreejith Nair | Mission Status: Operational*
