import { useEffect, useRef } from 'react';
import flameIcon from '@/assets/flame-icon.png';

const LoginBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load dice image
    const img = new Image();
    img.src = flameIcon;
    imageRef.current = img;

    let animationId: number;

    interface Swirl {
      cx: number; cy: number; radius: number; angle: number;
      speed: number; color: string; alpha: number; width: number;
    }

    interface FloatingIcon {
      x: number; y: number; size: number; alpha: number;
      vy: number; vx: number; rotation: number; rotSpeed: number;
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const swirls: Swirl[] = [];
    const icons: FloatingIcon[] = [];

    // Create slow swirling light arcs
    for (let i = 0; i < 5; i++) {
      swirls.push({
        cx: Math.random() * canvas.width,
        cy: Math.random() * canvas.height,
        radius: 150 + Math.random() * 300,
        angle: Math.random() * Math.PI * 2,
        speed: 0.0008 + Math.random() * 0.002,
        color: i % 2 === 0 ? '187, 100%, 50%' : '345, 100%, 50%',
        alpha: 0.06 + Math.random() * 0.1,
        width: 1 + Math.random() * 2,
      });
    }

    // Create floating blaze icons
    const iconCount = Math.min(12, Math.floor(canvas.width / 120));
    for (let i = 0; i < iconCount; i++) {
      icons.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 28 + Math.random() * 36,
        alpha: 0.08 + Math.random() * 0.12,
        vy: -0.08 - Math.random() * 0.15,
        vx: (Math.random() - 0.5) * 0.1,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: 0.002 + Math.random() * 0.004,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw swirling arcs (slower)
      swirls.forEach(s => {
        s.angle += s.speed;
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.strokeStyle = `hsl(${s.color})`;
        ctx.lineWidth = s.width;
        ctx.shadowColor = `hsl(${s.color})`;
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(s.cx, s.cy, s.radius, s.angle, s.angle + Math.PI * 1.2);
        ctx.stroke();
        ctx.restore();
      });

      // Draw floating blaze icons
      if (imageRef.current?.complete) {
        icons.forEach(icon => {
          icon.y += icon.vy;
          icon.x += icon.vx;
          icon.rotation += icon.rotSpeed;

          // Wrap around
          if (icon.y < -icon.size * 2) {
            icon.y = canvas.height + icon.size;
            icon.x = Math.random() * canvas.width;
          }
          if (icon.x < -icon.size) icon.x = canvas.width + icon.size;
          if (icon.x > canvas.width + icon.size) icon.x = -icon.size;

          ctx.save();
          ctx.translate(icon.x, icon.y);
          ctx.rotate(icon.rotation);
          ctx.globalAlpha = icon.alpha;
          ctx.drawImage(
            imageRef.current!,
            -icon.size / 2,
            -icon.size / 2,
            icon.size,
            icon.size
          );
          ctx.restore();
        });
      }

      // Subtle grid lines
      ctx.save();
      ctx.globalAlpha = 0.025;
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

    img.onload = () => draw();
    if (img.complete) draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />
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
