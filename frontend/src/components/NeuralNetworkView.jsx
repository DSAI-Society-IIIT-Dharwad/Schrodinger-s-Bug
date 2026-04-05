import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const LAYER_CONFIG = [
  { id: 'input', label: 'LiDAR Input [24]', nodes: 24, visible: 12, color: '#6366f1' },
  { id: 'hidden1', label: 'Hidden Dense [256]', nodes: 256, visible: 10, color: '#818cf8' },
  { id: 'hidden2', label: 'Hidden Dense [256]', nodes: 256, visible: 10, color: '#c084fc' },
  { id: 'output', label: 'Policy [2]', nodes: 2, visible: 2, color: '#f472b6' },
];

export default function NeuralNetworkView({ metrics }) {
  const { lidar = [], action_linear = 0, action_angular = 0 } = metrics;

  // Use useMemo to generate node positions
  const nodePositions = useMemo(() => {
    const width = 800;
    const height = 400;
    const padding = 60;
    const layers = LAYER_CONFIG.length;
    const layerSpacing = (width - padding * 2) / (layers - 1);

    return LAYER_CONFIG.map((layer, lIdx) => {
      const x = padding + lIdx * layerSpacing;
      const nodeCount = layer.visible;
      const nodeSpacing = (height - padding * 2) / (nodeCount - 1 || 1);
      
      return Array.from({ length: nodeCount }).map((_, nIdx) => ({
        x,
        y: padding + nIdx * nodeSpacing + (layer.id === 'output' ? (height - padding * 2) / 3 : 0),
        id: `${layer.id}-${nIdx}`,
        layer: layer.id,
        color: layer.color
      }));
    });
  }, []);

  return (
    <div className="w-full h-full relative p-4 flex flex-col justify-center items-center">
      <svg viewBox="0 0 800 400" className="w-full h-full drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]">
        {/* Connections */}
        <g opacity="0.15">
          {nodePositions.map((layer, lIdx) => {
            if (lIdx === nodePositions.length - 1) return null;
            const nextLayer = nodePositions[lIdx + 1];
            
            return layer.map((startNode) => (
              nextLayer.map((endNode) => (
                <motion.line
                  key={`link-${startNode.id}-${endNode.id}`}
                  x1={startNode.x} y1={startNode.y}
                  x2={endNode.x} y2={endNode.y}
                  stroke={startNode.color}
                  strokeWidth="0.5"
                  initial={{ opacity: 0.1 }}
                  animate={{ 
                    opacity: [0.1, 0.4, 0.1],
                    strokeWidth: [0.5, 0.8, 0.5]
                  }}
                  transition={{ 
                    duration: 2 + Math.random() * 3, 
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                />
              ))
            ));
          })}
        </g>

        {/* Inference Pulses */}
        <g>
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.circle
              key={`pulse-${i}`}
              r="2"
              fill="white"
              initial={{ cx: 60, cy: 60, opacity: 0 }}
              animate={{
                cx: [nodePositions[0][0].x, nodePositions[3][0].x],
                cy: [
                  nodePositions[0][Math.floor(Math.random() * 12)].y, 
                  nodePositions[3][Math.floor(Math.random() * 2)].y
                ],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "linear"
              }}
            />
          ))}
        </g>

        {/* Nodes */}
        {nodePositions.map((layer, lIdx) => (
          <g key={`layer-nodes-${lIdx}`}>
            {layer.map((node, nIdx) => {
              // Activation logic
              let activation = 0.2;
              if (node.layer === 'input') {
                const scanIdx = Math.floor(nIdx * (24 / 12));
                const val = lidar[scanIdx] || 0;
                activation = Math.max(0.2, (3.5 - val) / 3.5);
              } else if (node.layer === 'output') {
                activation = nIdx === 0 ? Math.abs(action_linear) : Math.abs(action_angular);
                activation = 0.2 + activation * 0.8;
              } else {
                activation = 0.2 + Math.random() * 0.3;
              }

              return (
                <g key={node.id}>
                  <motion.circle
                    cx={node.x} cy={node.y} r="5"
                    fill={node.color}
                    animate={{ 
                      r: [5, 6, 5],
                      fillOpacity: activation,
                      boxShadow: `0 0 ${activation * 20}px ${node.color}`
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  {/* Label for special layers */}
                  {nIdx === 0 && (
                    <text x={node.x} y={20} fill={node.color} textAnchor="middle" className="text-[10px] uppercase font-mono font-black italic">
                      {LAYER_CONFIG[lIdx].label}
                    </text>
                  )}
                  {nIdx === layer.length - 1 && (lIdx === 1 || lIdx === 2) && (
                    <text x={node.x} y={380} fill={node.color} textAnchor="middle" className="text-[8px] font-mono opacity-40">
                      ... (256 UNITS)
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        ))}
      </svg>
      
      {/* Legend / Status Overlay */}
      <div className="absolute top-4 left-4 hwi-glass p-3 rounded-xl border border-white/5 pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[8px] font-mono uppercase text-slate-400">Model // Forward_Pass</span>
        </div>
        <div className="text-[10px] font-black text-white italic">SYNAPTIC_SYNC: ACTIVE</div>
      </div>
    </div>
  );
}
