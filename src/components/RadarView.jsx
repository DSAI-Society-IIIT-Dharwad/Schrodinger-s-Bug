import React, { useRef, useEffect } from 'react';

const RadarView = ({ telemetry }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 50; // pixels per meter

    const draw = () => {
      // Clear with dark overlay for trails
      ctx.fillStyle = 'rgba(5, 5, 8, 0.2)';
      ctx.fillRect(0, 0, width, height);

      // Draw Tactical Grid
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.05)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
      }

      // Draw Radar Circles
      ctx.lineWidth = 1;
      for (let r = 50; r < centerX; r += 50) {
        ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 - (r / centerX) * 0.05})`;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Crossed hair
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.beginPath(); ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); ctx.stroke();

      // Draw LiDAR Point Cloud
      if (telemetry && telemetry.lidar && Array.isArray(telemetry.lidar)) {
        telemetry.lidar.forEach((dist, i) => {
          if (dist >= 3.5) return; // Ignore max range
          
          const angle = (i * (360 / telemetry.lidar.length) * Math.PI) / 180 - Math.PI / 2;
          const x = centerX + Math.cos(angle) * dist * scale;
          const y = centerY + Math.sin(angle) * dist * scale;
          
          // Impact point with glow
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 4);
          gradient.addColorStop(0, 'rgba(34, 211, 238, 0.8)');
          gradient.addColorStop(1, 'rgba(34, 211, 238, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
          
          // Connect to center with very faint line
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.03)';
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(x, y);
          ctx.stroke();
        });
      }

      // Draw Robot (Digital Twin)
      ctx.save();
      ctx.translate(centerX, centerY);
      
      // Shadow/Glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(99, 102, 241, 0.6)';
      
      // Base
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      
      // Direction indicator
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -15);
      ctx.stroke();
      
      ctx.restore();

      // Telemetry HUD overlay on canvas
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText(`LIDAR_SAMPLES: ${telemetry.lidar?.length || 0}`, 20, 30);
      ctx.fillText(`MIN_DIST: ${(telemetry.min_dist || 0).toFixed(2)}m`, 20, 45);
    };

    let animationFrame;
    const animate = () => {
      draw();
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animationFrame);
  }, [telemetry]);

  return (
    <div className="relative w-full aspect-square hwi-glass rounded-[40px] border border-white/5 overflow-hidden flex items-center justify-center tactical-border">
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={400}
        className="w-full h-full max-w-[400px]"
      />
      
      {/* Radar Sweep Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="w-full h-full animate-radar bg-[conic-gradient(from_0deg,transparent_0deg,#6366f1_10deg,transparent_60deg)]" />
      </div>

      <div className="absolute top-6 right-8 flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
        <span className="text-[9px] font-mono text-cyan-300 uppercase tracking-[0.2em] font-black">Tactical LiDAR</span>
      </div>

      <div className="absolute bottom-6 left-8 flex flex-col gap-1">
        <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Azimuth: 360°</div>
        <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Range: 3.5m</div>
      </div>
    </div>
  );
};

export default RadarView;
