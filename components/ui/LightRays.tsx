'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

export type RaysOrigin = 'top-center' | 'top-left' | 'top-right' | 'center' | 'bottom-center';

interface LightRaysProps {
  raysOrigin?: RaysOrigin;
  raysColor?: string;
  raysSpeed?: number;
  lightSpread?: number;
  rayLength?: number;
  pulsating?: boolean;
  fadeDistance?: number;
  saturation?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  noiseAmount?: number;
  distortion?: number;
}

const LightRays = React.forwardRef<HTMLCanvasElement, LightRaysProps>(
  (
    {
      raysOrigin = 'top-center',
      raysColor,
      raysSpeed = 1,
      lightSpread = 1.2,
      rayLength = 2.5,
      pulsating = true,
      fadeDistance = 1.0,
      saturation = 0.8,
      followMouse = false,
      mouseInfluence = 0.5,
      noiseAmount = 0.05,
      distortion = 0.1,
    },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme } = useTheme();

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      let animationId: number;
      let time = 0;
      let mouseX = canvas.width / 2;
      let mouseY = canvas.height / 2;

      const handleMouseMove = (e: MouseEvent) => {
        if (followMouse) {
          mouseX = e.clientX;
          mouseY = e.clientY;
        }
      };

      window.addEventListener('mousemove', handleMouseMove);

      const animate = () => {
        // Clear canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Determine origin point
        let originX = canvas.width / 2;
        let originY = canvas.height / 2;

        if (raysOrigin === 'top-center') {
          originX = canvas.width / 2;
          originY = 0;
        } else if (raysOrigin === 'top-left') {
          originX = 0;
          originY = 0;
        } else if (raysOrigin === 'top-right') {
          originX = canvas.width;
          originY = 0;
        } else if (raysOrigin === 'bottom-center') {
          originX = canvas.width / 2;
          originY = canvas.height;
        }

        if (followMouse) {
          originX = originX * (1 - mouseInfluence) + mouseX * mouseInfluence;
          originY = originY * (1 - mouseInfluence) + mouseY * mouseInfluence;
        }

        // Determine color based on theme
        const isLight = theme === 'light';
        const color = raysColor || (isLight ? 'rgba(100, 100, 255, 0.15)' : 'rgba(100, 150, 255, 0.2)');

        // Draw rays
        const rayCount = Math.floor(12 * lightSpread);
        for (let i = 0; i < rayCount; i++) {
          const angle = (i / rayCount) * Math.PI * 2;
          const pulseAmount = pulsating ? Math.sin(time * raysSpeed * 0.01 + i) * 0.3 + 0.7 : 1;
          const length = (Math.max(canvas.width, canvas.height) * rayLength * pulseAmount) / 2;

          const endX = originX + Math.cos(angle) * length;
          const endY = originY + Math.sin(angle) * length;

          const gradient = ctx.createLinearGradient(originX, originY, endX, endY);
          gradient.addColorStop(0, color);
          gradient.addColorStop(0.5, color.replace(/[\d.]+\)$/, `${fadeDistance * 0.5})`));
          gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2 * saturation;
          ctx.beginPath();
          ctx.moveTo(originX, originY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }

        time += 1;
        animationId = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        window.removeEventListener('resize', resizeCanvas);
        window.removeEventListener('mousemove', handleMouseMove);
        cancelAnimationFrame(animationId);
      };
    }, [
      raysOrigin,
      raysColor,
      raysSpeed,
      lightSpread,
      rayLength,
      pulsating,
      fadeDistance,
      saturation,
      followMouse,
      mouseInfluence,
      theme,
    ]);

    return (
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.8 }}
      />
    );
  },
);

LightRays.displayName = 'LightRays';
export default LightRays;
