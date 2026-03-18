import { useEffect, useRef } from 'react';

const LoginBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    let swirls: Swirl[] = [];
    let dice: DiceIcon[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    interface Particle {
      x: number; y: number; vx: number; vy: number;
      size: number; alpha: number; color: string; decay: number;
    }

    interface Swirl {
      cx: number; cy: number; radius: number; angle: number;
      speed: number; color: string; alpha: number; width: number;
    }

    interface DiceIcon {
      x: number; y: number; size: number; alpha: number;
      vy: number; rotation: number; rotSpeed: number;
    }

    // Create swirling light arcs
    for (let i = 0; i < 5; i++) {
      swirls.push({
        cx: Math.random() * canvas.width,
        cy: Math.random() * canvas.height,
        radius: 150 + Math.random() * 300,
        angle: Math.random() * Math.PI * 2,
        speed: 0.002 + Math.random() * 0.005,
        color: i % 2 === 0 ? '187, 100%, 50%' : '345, 100%, 50%',
        alpha: 0.08 + Math.random() * 0.12,
        width: 1 + Math.random() * 2,
      });
    }

    // Create floating dice icons
    for (let i = 0; i < 8; i++) {
      dice.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 16 + Math.random() * 24,
        alpha: 0.06 + Math.random() * 0.1,
        vy: -0.15 - Math.random() * 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: 0.005 + Math.random() * 0.01,
      });
    }

    const spawnParticle = () => {
      if (particles.length > 60) return;
      const isRed = Math.random() > 0.5;
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 10,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.5 - Math.random() * 1.5,
        size: 1 + Math.random() * 3,
        alpha: 0.3 + Math.random() * 0.5,
        color: isRed ? 'hsl(345, 100%, 50%)' : 'hsl(187, 100%, 50%)',
        decay: 0.002 + Math.random() * 0.003,
      });
    };

    const drawDice = (d: DiceIcon) => {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rotation);
      ctx.globalAlpha = d.alpha;

      const s = d.size;
      const r = s * 0.2;

      // Dice body
      ctx.strokeStyle = 'hsl(345, 100%, 50%)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-s / 2, -s / 2, s, s, r);
      ctx.stroke();

      // Dots (showing 4)
      ctx.fillStyle = 'hsl(345, 100%, 50%)';
      const dotR = s * 0.1;
      const offset = s * 0.22;
      [[-offset, -offset], [offset, -offset], [-offset, offset], [offset, offset]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(dx, dy, dotR, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw swirling arcs
      swirls.forEach(s => {
        s.angle += s.speed;
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.strokeStyle = `hsl(${s.color})`;
        ctx.lineWidth = s.width;
        ctx.shadowColor = `hsl(${s.color})`;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(s.cx, s.cy, s.radius, s.angle, s.angle + Math.PI * 1.2);
        ctx.stroke();
        ctx.restore();
      });

      // Draw floating dice
      dice.forEach(d => {
        d.y += d.vy;
        d.rotation += d.rotSpeed;
        if (d.y < -d.size) {
          d.y = canvas.height + d.size;
          d.x = Math.random() * canvas.width;
        }
        drawDice(d);
      });

      // Draw particles
      if (Math.random() < 0.3) spawnParticle();
      particles = particles.filter(p => p.alpha > 0);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Subtle grid lines
      ctx.save();
      ctx.globalAlpha = 0.03;
      ctx.strokeStyle = 'hsl(187, 100%, 50%)';
      ctx.lineWidth = 0.5;
      const gridSize = 80;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      ctx.restore();

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />
      {/* Radial gradient overlays */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-background via-transparent to-background opacity-80" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full opacity-15 blur-[150px]" style={{ background: 'hsl(187, 100%, 50%)' }} />
        <div className="absolute bottom-1/4 right-1/5 w-[400px] h-[400px] rounded-full opacity-10 blur-[130px]" style={{ background: 'hsl(345, 100%, 50%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-[100px]" style={{ background: 'hsl(270, 80%, 50%)' }} />
      </div>
    </>
  );
};

export default LoginBackground;
