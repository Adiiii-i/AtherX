import { useMemo } from 'react';

/**
 * Ambient floating particle field — pure CSS animations, no canvas.
 * Creates a constellation-like background effect.
 */
export default function Particles({ count = 60 }) {
  const particles = useMemo(() => {
    const colors = [
      'rgba(241, 225, 148,', // sand
      'rgba(231, 207, 110,',  // light sand
      'rgba(180, 147, 58,',   // dark sand
      'rgba(91, 14, 20,',    // burgundy
      'rgba(148, 41, 41,',    // light burgundy
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
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-burgundy-900/[0.12] blur-[100px] animate-float" />
      <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-sand-400/[0.08] blur-[80px] animate-float" style={{ animationDelay: '-4s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-burgundy-950/[0.06] blur-[120px] animate-pulse-glow" />
    </div>
  );
}
