'use client';

import React, { useEffect, useRef } from 'react';

export type Colors = {
  [key: string]: string;
};

interface LiquidProps {
  isHovered: boolean;
  colors: Colors;
}

export const Liquid: React.FC<LiquidProps> = ({ isHovered, colors }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const animate = () => {
      time += isHovered ? 0.08 : 0.02;

      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      ctx.clearRect(0, 0, width, height);

      const colorArray = Object.values(colors);
      
      for (let i = 0; i < colorArray.length; i++) {
        const x = Math.sin(time * 0.5 + i * 0.5) * 50 + width / 2;
        const y = Math.cos(time * 0.3 + i * 0.3) * 50 + height / 2;
        const radius = 80 + Math.sin(time + i) * 20;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, colorArray[i]);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      animationId = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize);
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [isHovered, colors]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ filter: 'blur(40px)', opacity: 0.6 }}
    />
  );
};
