# Neural Pathfinder Dashboard - Integration Guide

This document provides step-by-step instructions to integrate the new DRL training UI components into the existing App.jsx file.

## Files Created

1. **SensorPanel.jsx** - Left panel with LiDAR, Odometry, Reward Breakdown
2. **RightPanel.jsx** - Right panel with Training Phase, Charts, Metrics Grid
3. **BottomControlBar.jsx** - New bottom control bar with START/PAUSE/RESET/CONVERGE
4. **TelemetryLog.jsx** - Expandable telemetry log at bottom of screen

## Changes Needed in App.jsx

### 1. Add Imports (After existing imports)

```javascript
import { LidarDisplay, OdometryData, RewardBreakdown } from './SensorPanel.jsx';
import { TrainingPhaseBadge, RewardChart, SuccessRateChart, MetricsGrid } from './RightPanel.jsx';
import BottomControlBar from './BottomControlBar.jsx';
import TelemetryLog from './TelemetryLog.jsx';
```

### 2. Replace Top Bar Buttons (Lines ~947-961)

**Find this section:**
```jsx
<button onClick={toggleDRLMode}>DRL TRAINING: ON/OFF</button>
```

**Replace with:**
```jsx
{/* Algorithm Selector */}
<div className="flex bg-slate-950/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-1 gap-1 shadow-2xl">
  {['DQN', 'TD3', 'PPO'].map(algo => (
    <button 
      key={algo}
      onClick={() => handleAlgorithmChange(algo)}
      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all tracking-widest ${
        selectedAlgorithm === algo 
          ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
          : 'text-white/30 hover:text-white/60'
      }`}
    >
      {algo}
    </button>
  ))}
</div>
```

### 3. Replace Left Panel (Lines ~993-1047)

**Find this entire section:**
```jsx
{!drlState.isRunning && (
  <div className="absolute top-24 md:top-32 left-4...">
    <FloatingHUD title="Mission Control"...>
      ...all the blocks/python code...
    </FloatingHUD>
  </div>
)}
```

**Replace with:**
```jsx
{/* LEFT PANEL - SENSOR DATA */}
{drlState.isRunning && (
  <div className="absolute top-24 md:top-32 left-4 md:left-8 w-[calc(100%-2rem)] md:w-80 lg:w-96 z-10 pointer-events-none flex flex-col gap-4">
    <FloatingHUD title="Sensor Data" icon={Activity} className="pointer-events-auto" isCollapsible={false}>
      <div className="p-4 space-y-4">
        {/* LiDAR Display */}
        <LidarDisplay lidarRays={drlState.lidarRays} />
        
        {/* Odometry Data */}
        <OdometryData 
          posX={drlState.posX}
          posY={drlState.posY}
          linearV={drlState.linearV}
          angularV={drlState.angularV}
        />
        
        {/* Reward Breakdown */}
        <RewardBreakdown 
          reward={drlState.reward}
          collisions={drlState.collisions}
          reachedGoal={drlState.distanceToGoal <= 2}
        />
      </div>
    </FloatingHUD>
  </div>
)}
```

### 4. Add Right Panel (After line ~1053 where RIGHT HUD comment is)

**Add this new section:**
```jsx
{/* RIGHT PANEL - TRAINING METRICS */}
{drlState.isRunning && (
  <div className="absolute top-24 md:top-32 right-4 md:right-8 w-[calc(100%-2rem)] md:w-80 z-10 pointer-events-none flex flex-col gap-4">
    <FloatingHUD title="Training Metrics" icon={Brain} className="pointer-events-auto" isCollapsible={false}>
      <div className="p-4 space-y-4">
        {/* Training Phase Badge */}
        <TrainingPhaseBadge phase={drlState.phase} episode={drlState.episode} />
        
        {/* Reward Chart */}
        <RewardChart data={rewardChartData} />
        
        {/* Success Rate Chart */}
        <SuccessRateChart data={successRateData} />
        
        {/* Metrics Grid */}
        <MetricsGrid 
          episode={drlState.episode}
          successRate={drlState.successRate}
          avgReward={drlState.cumulativeReward / Math.max(1, drlState.episode)}
          collisions={drlState.collisions}
          timeToGoal={drlState.timeToGoal}
          policyLoss={drlState.policyLoss}
        />
      </div>
    </FloatingHUD>
  </div>
)}
```

### 5. Replace Bottom Bar (Lines ~1062-1090)

**Find this section:**
```jsx
<div className="absolute bottom-12 left-1/2 -translate-x-1/2...">
  <AnimatePresence>
    {showTerminal && (...)}
  </AnimatePresence>
  <button onClick={() => setShowTerminal(!showTerminal)}>...</button>
</div>
```

**Replace with:**
```jsx
{/* Bottom Control Bar */}
{drlState.isRunning && (
  <BottomControlBar
    isRunning={!drlEngine.isPaused}
    selectedAlgorithm={selectedAlgorithm}
    speedMultiplier={speedMultiplier}
    learnMode={learnMode}
    onAlgorithmChange={handleAlgorithmChange}
    onSpeedChange={handleSpeedChange}
    onLearnModeToggle={toggleLearnMode}
    onPause={handlePause}
    onResume={handleResume}
    onReset={handleReset}
    onConverge={handleConverge}
  />
)}

{/* Telemetry Log */}
{drlState.isRunning && (
  <TelemetryLog 
    logs={drlState.logs}
    expanded={showTelemetryLog}
    onToggle={() => setShowTelemetryLog(!showTelemetryLog)}
  />
)}
```

### 6. Add Data Preparation for Charts (In App component, before return statement)

**Add this code:**
```javascript
// Prepare chart data from episode history
const rewardChartData = drlState.episodeRewards.map((r, i) => ({
  episode: i + 1,
  reward: r
}));

const successRateData = Array.from({ length: Math.min(20, drlState.episode) }, (_, i) => {
  const startIdx = Math.max(0, drlState.episode - 20 + i);
  const recentEpisodes = drlState.episodeSuccesses.slice(startIdx, startIdx + 1);
  const rate = recentEpisodes.filter(s => s).length / Math.max(1, recentEpisodes.length);
  return {
    episode: startIdx + 1,
    rate: rate * 100
  };
});
```

### 7. Update Episode Tracking in DRL Engine Callback

**In the useEffect that subscribes to DRL state, add:**
```javascript
useEffect(() => {
  if (drlState.isRunning) {
    const unsubscribe = roverState.subscribe((state) => {
      if (state.drlState && state.drlState.isRunning) {
        setDrlState(prev => {
          const newState = { ...state.drlState };
          
          // Track episode rewards for charts
          if (newState.episode !== prev.episode && prev.episode > 0) {
            newState.episodeRewards = [
              ...prev.episodeRewards || [],
              prev.cumulativeReward
            ].slice(-50); // Keep last 50 episodes
            
            newState.episodeSuccesses = [
              ...prev.episodeSuccesses || [],
              prev.distanceToGoal <= 2
            ].slice(-20); // Keep last 20 for rolling average
          } else {
            newState.episodeRewards = prev.episodeRewards || [];
            newState.episodeSuccesses = prev.episodeSuccesses || [];
          }
          
          return newState;
        });
      }
    });
    return unsubscribe;
  }
}, [drlState.isRunning]);
```

### 8. Remove Old Components

**Delete or comment out:**
- The old `DRLProgressTracker` component (lines ~579-690)
- The old `DRLTelemetryStream` component (lines ~692-730)
- Any references to `DebugPanelOverlay` when DRL is running

### 9. Update SimpleHUD to Show DRL Info

**Optional enhancement - modify SimpleHUD component to show algorithm:**
```jsx
const SimpleHUD = ({ battery, speed, signal, algorithm }) => {
  return (
    <motion.div ...>
      {/* Existing content */}
      <div className="w-px h-6 bg-white/10 hidden sm:block" />
      <div className="flex flex-col gap-1 hidden sm:flex">
        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest text-left">Algorithm</p>
        <p className="text-xs font-mono text-purple-400">{algorithm}</p>
      </div>
    </motion.div>
  );
};
```

Then pass the algorithm prop:
```jsx
<SimpleHUD battery={battery} speed={telemetry.speed} signal={4} algorithm={selectedAlgorithm} />
```

## Testing Checklist

After making these changes:

1. ✅ Verify LiDAR display shows 24 rays updating every 500ms
2. ✅ Check odometry values update smoothly
3. ✅ Confirm algorithm selector switches between DQN/TD3/PPO
4. ✅ Test START/PAUSE/RESET/CONVERGE buttons
5. ✅ Verify speed multiplier affects simulation rate
6. ✅ Check learn mode toggle shows/hides tooltips
7. ✅ Confirm charts display correctly with Recharts
8. ✅ Test telemetry log expand/collapse
9. ✅ Verify all panels use same glassmorphic style
10. ✅ Ensure 3D rover model remains visible and unchanged

## Notes

- All new components preserve the dark navy/black color scheme
- Glassmorphic styling matches existing design system
- Cyan (#06b6d4) remains the primary accent color
- ESP32 LINK indicator, environment switcher, LEO_ACTIVE badge remain unchanged
- 3D rover model and its animations are not modified
- Power/Velocity/Signal bottom bar preserved (moved up slightly to accommodate new controls)

## Final Result

The dashboard will now show:
- **Left Panel:** Real-time sensor data (LiDAR + Odometry + Rewards)
- **Center:** Unchanged 3D rover visualization
- **Right Panel:** Training metrics (Phase + Charts + Metric Cards)
- **Top Bar:** Algorithm selector [DQN][TD3][PPO]
- **Bottom:** Control bar with playback controls + Learn Mode toggle
- **Very Bottom:** Expandable telemetry log

All while preserving the core Neural Pathfinder aesthetic and functionality!
