import { useMemo } from 'react';

/**
 * Ambient floating particle field — pure CSS animations, no canvas.
 * Creates a constellation-like background effect.
 */
export default function Particles({ count = 60 }) {
  const particles = useMemo(() => {
    const colors = [
      'rgba(245, 245, 220,',  // amber
      'rgba(229, 209, 168,',   // orange
      'rgba(234, 179, 8,',  // yellow
      'rgba(59, 130, 246,',  // blue
      'rgba(229, 209, 168,',  // orange
    ];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      duration: Math.random() * 30 + 15,
      delay: Math.random() * -30,
      opacity: Math.random() * 0.6 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)],
      drift: Math.random() * 60 + 20,
    }));
  }, [count]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `${p.color} ${p.opacity})`,
            boxShadow: `0 0 ${p.size * 3}px ${p.color} ${p.opacity * 0.5})`,
            animation: `particleFloat ${p.duration}s ${p.delay}s infinite ease-in-out`,
            '--drift': `${p.drift}px`,
          }}
        />
      ))}

      {/* Large ambient orbs for depth */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-stone-500/[0.07] blur-[100px] animate-float" />
      <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-orange-500/[0.05] blur-[80px] animate-float" style={{ animationDelay: '-4s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-yellow-600/[0.04] blur-[120px] animate-pulse-glow" />
    </div>
  );
}
