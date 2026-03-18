import { useEffect, useRef, useState } from 'react';

type SlotColor = 'red' | 'black' | 'white';

interface Slot {
  number: number;
  color: SlotColor;
}

const SLOTS: Slot[] = [
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

// Triple the slots for infinite scroll illusion
const EXTENDED_SLOTS = [...SLOTS, ...SLOTS, ...SLOTS];

const colorBg: Record<SlotColor, string> = {
  red: 'bg-secondary',
  black: 'bg-[hsl(240_6%_12%)]',
  white: 'bg-[hsl(0_0%_88%)]',
};

const colorText: Record<SlotColor, string> = {
  red: 'text-muted-foreground/70',
  black: 'text-muted-foreground/50',
  white: 'text-[hsl(240_6%_15%)]',
};

const colorBorder: Record<SlotColor, string> = {
  red: 'border-secondary/30',
  black: 'border-[hsl(240_6%_20%)]',
  white: 'border-[hsl(0_0%_75%)]/30',
};

interface BlazeRouletteStripProps {
  spinning: boolean;
  highlightIndex?: number | null;
}

const BlazeRouletteStrip = ({ spinning, highlightIndex }: BlazeRouletteStripProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const speedRef = useRef(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!scrollRef.current) return;

    if (spinning) {
      speedRef.current = 3 + Math.random() * 2;

      const animate = () => {
        setOffset(prev => {
          const cardWidth = 56; // w-12 (48px) + gap
          const singleSetWidth = SLOTS.length * cardWidth;
          let next = prev + speedRef.current;
          // Loop back when we've scrolled past one full set
          if (next >= singleSetWidth) {
            next -= singleSetWidth;
          }
          return next;
        });
        animRef.current = requestAnimationFrame(animate);
      };
      animRef.current = requestAnimationFrame(animate);
    } else if (!spinning && speedRef.current > 0) {
      const decelerate = () => {
        speedRef.current *= 0.98;
        if (speedRef.current < 0.05) {
          speedRef.current = 0;
          if (animRef.current) cancelAnimationFrame(animRef.current);
          return;
        }
        setOffset(prev => {
          const cardWidth = 56;
          const singleSetWidth = SLOTS.length * cardWidth;
          let next = prev + speedRef.current;
          if (next >= singleSetWidth) next -= singleSetWidth;
          return next;
        });
        animRef.current = requestAnimationFrame(decelerate);
      };
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(decelerate);
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [spinning]);

  return (
    <div className="relative">
      {/* Center pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-0.5 h-full bg-muted-foreground/20" />
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
        <div
          className="w-0 h-0"
          style={{
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '7px solid hsl(var(--secondary))',
            filter: 'drop-shadow(0 0 3px hsla(var(--secondary), 0.4))',
          }}
        />
      </div>

      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 z-[5] pointer-events-none"
        style={{ background: 'linear-gradient(to right, hsl(240 6% 10%), transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-8 z-[5] pointer-events-none"
        style={{ background: 'linear-gradient(to left, hsl(240 6% 10%), transparent)' }} />

      {/* Cards strip */}
      <div className="overflow-hidden rounded-xl" ref={scrollRef}>
        <div
          className="flex gap-2 py-2 will-change-transform"
          style={{ transform: `translateX(-${offset}px)` }}
        >
          {EXTENDED_SLOTS.map((slot, i) => (
            <div
              key={i}
              className={`w-12 h-14 shrink-0 rounded-lg ${colorBg[slot.color]} border ${colorBorder[slot.color]} flex items-center justify-center transition-all duration-300 ${
                highlightIndex === slot.number ? 'ring-2 ring-primary scale-105' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full border-2 ${colorBorder[slot.color]} flex items-center justify-center`}>
                <span className={`text-xs font-bold ${colorText[slot.color]}`}>
                  {slot.number}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlazeRouletteStrip;
