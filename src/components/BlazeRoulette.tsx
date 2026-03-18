import { useState, useEffect, useRef } from 'react';

type RouletteColor = 'red' | 'black' | 'white';

interface RouletteSlot {
  number: number;
  color: RouletteColor;
}

// Blaze Double pattern: 0 is white, odds red, evens black (simplified)
const SLOTS: RouletteSlot[] = [
  { number: 1, color: 'red' },
  { number: 14, color: 'black' },
  { number: 2, color: 'red' },
  { number: 13, color: 'black' },
  { number: 3, color: 'red' },
  { number: 12, color: 'black' },
  { number: 4, color: 'red' },
  { number: 0, color: 'white' },
  { number: 11, color: 'black' },
  { number: 5, color: 'red' },
  { number: 10, color: 'black' },
  { number: 6, color: 'red' },
  { number: 9, color: 'black' },
  { number: 7, color: 'red' },
  { number: 8, color: 'black' },
];

const COLOR_MAP: Record<RouletteColor, string> = {
  red: 'hsl(var(--secondary))',
  black: 'hsl(240 6% 18%)',
  white: 'hsl(0 0% 92%)',
};

const TEXT_COLOR_MAP: Record<RouletteColor, string> = {
  red: '#fff',
  black: '#888',
  white: '#222',
};

interface BlazeRouletteProps {
  spinning: boolean;
  result?: number | null;
  size?: number;
}

const BlazeRoulette = ({ spinning, result, size = 140 }: BlazeRouletteProps) => {
  const [rotation, setRotation] = useState(0);
  const animRef = useRef<number | null>(null);
  const speedRef = useRef(0);

  useEffect(() => {
    if (spinning) {
      speedRef.current = 8 + Math.random() * 4;
      const animate = () => {
        setRotation(prev => prev + speedRef.current);
        animRef.current = requestAnimationFrame(animate);
      };
      animRef.current = requestAnimationFrame(animate);
    } else if (!spinning && speedRef.current > 0) {
      // Decelerate
      const decelerate = () => {
        speedRef.current *= 0.97;
        if (speedRef.current < 0.1) {
          speedRef.current = 0;
          if (animRef.current) cancelAnimationFrame(animRef.current);
          return;
        }
        setRotation(prev => prev + speedRef.current);
        animRef.current = requestAnimationFrame(decelerate);
      };
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(decelerate);
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [spinning]);

  const slotAngle = 360 / SLOTS.length;
  const innerRadius = size * 0.28;
  const outerRadius = size * 0.46;
  const center = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-700"
        style={{
          boxShadow: spinning
            ? '0 0 40px hsla(var(--secondary), 0.3), 0 0 80px hsla(var(--secondary), 0.1)'
            : '0 0 20px hsla(240, 6%, 20%, 0.3)',
        }}
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="drop-shadow-lg"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {/* Outer ring */}
        <circle cx={center} cy={center} r={size * 0.48} fill="none" stroke="hsl(240 6% 15%)" strokeWidth="2" />

        {/* Slots */}
        {SLOTS.map((slot, i) => {
          const startAngle = (i * slotAngle - 90) * (Math.PI / 180);
          const endAngle = ((i + 1) * slotAngle - 90) * (Math.PI / 180);

          const x1Inner = center + innerRadius * Math.cos(startAngle);
          const y1Inner = center + innerRadius * Math.sin(startAngle);
          const x1Outer = center + outerRadius * Math.cos(startAngle);
          const y1Outer = center + outerRadius * Math.sin(startAngle);
          const x2Inner = center + innerRadius * Math.cos(endAngle);
          const y2Inner = center + innerRadius * Math.sin(endAngle);
          const x2Outer = center + outerRadius * Math.cos(endAngle);
          const y2Outer = center + outerRadius * Math.sin(endAngle);

          const midAngle = ((i + 0.5) * slotAngle - 90) * (Math.PI / 180);
          const textR = (innerRadius + outerRadius) / 2;
          const tx = center + textR * Math.cos(midAngle);
          const ty = center + textR * Math.sin(midAngle);

          const path = `M ${x1Inner} ${y1Inner} L ${x1Outer} ${y1Outer} A ${outerRadius} ${outerRadius} 0 0 1 ${x2Outer} ${y2Outer} L ${x2Inner} ${y2Inner} A ${innerRadius} ${innerRadius} 0 0 0 ${x1Inner} ${y1Inner}`;

          return (
            <g key={i}>
              <path d={path} fill={COLOR_MAP[slot.color]} stroke="hsl(240 6% 10%)" strokeWidth="1" />
              <text
                x={tx}
                y={ty}
                textAnchor="middle"
                dominantBaseline="central"
                fill={TEXT_COLOR_MAP[slot.color]}
                fontSize={size * 0.07}
                fontWeight="700"
                fontFamily="monospace"
              >
                {slot.number}
              </text>
            </g>
          );
        })}

        {/* Center hub */}
        <circle cx={center} cy={center} r={innerRadius - 2} fill="hsl(240 6% 10%)" stroke="hsl(240 6% 20%)" strokeWidth="1.5" />

        {/* Blaze diamond icon in center */}
        <g transform={`translate(${center}, ${center})`}>
          <path
            d="M0 -12 L8 0 L0 12 L-8 0 Z"
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="1.5"
            opacity="0.6"
          />
          <path
            d="M0 -6 L4 0 L0 6 L-4 0 Z"
            fill="hsl(var(--secondary))"
            opacity="0.4"
          />
        </g>
      </svg>

      {/* Pointer / indicator at top */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: -2 }}
      >
        <div
          className="w-0 h-0"
          style={{
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `10px solid hsl(var(--secondary))`,
            filter: 'drop-shadow(0 0 4px hsla(var(--secondary), 0.5))',
          }}
        />
      </div>
    </div>
  );
};

export default BlazeRoulette;
