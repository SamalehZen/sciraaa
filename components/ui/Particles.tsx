'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
}

interface ParticlesProps {
  particleCount?: number;
  particleBaseSize?: number;
  particleSpread?: number;
  speed?: number;
  particleColors?: string[];
  moveParticlesOnHover?: boolean;
  particleHoverFactor?: number;
  alphaParticles?: boolean;
  sizeRandomness?: number;
  cameraDistance?: number;
  disableRotation?: boolean;
}

const Particles = React.forwardRef<HTMLCanvasElement, ParticlesProps>(
  (
    {
      particleCount = 300,
      particleBaseSize = 80,
      particleSpread = 12,
      speed = 0.12,
      particleColors,
      moveParticlesOnHover = false,
      particleHoverFactor = 0.5,
      alphaParticles = true,
      sizeRandomness = 1.2,
      cameraDistance = 20,
      disableRotation = false,
    },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const mouseRef = useRef({ x: 0, y: 0 });
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

      const isLight = theme === 'light';
      const defaultColors = particleColors || (
        isLight
          ? ['rgba(100, 150, 255, 0.6)', 'rgba(150, 100, 255, 0.5)']
          : ['rgba(100, 150, 255, 0.7)', 'rgba(100, 200, 255, 0.6)']
      );

      // Initialize particles
      if (particlesRef.current.length === 0) {
        particlesRef.current = Array.from({ length: particleCount }, () => ({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * speed * particleSpread,
          vy: (Math.random() - 0.5) * speed * particleSpread,
          size: particleBaseSize * (0.5 + Math.random() * (sizeRandomness - 1)),
          opacity: alphaParticles ? Math.random() * 0.7 + 0.3 : 0.6,
          color: defaultColors[Math.floor(Math.random() * defaultColors.length)],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
        }));
      }

      const handleMouseMove = (e: MouseEvent) => {
        mouseRef.current = { x: e.clientX, y: e.clientY };
      };

      window.addEventListener('mousemove', handleMouseMove);

      let animationId: number;

      const animate = () => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particlesRef.current.forEach((particle) => {
          // Update position
          particle.x += particle.vx;
          particle.y += particle.vy;

          // Wrap around edges
          if (particle.x < 0) particle.x = canvas.width;
          if (particle.x > canvas.width) particle.x = 0;
          if (particle.y < 0) particle.y = canvas.height;
          if (particle.y > canvas.height) particle.y = 0;

          // Update rotation
          if (!disableRotation) {
            particle.rotation += particle.rotationSpeed;
          }

          // Apply hover effect
          if (moveParticlesOnHover) {
            const dx = mouseRef.current.x - particle.x;
            const dy = mouseRef.current.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 200) {
              const force = (1 - distance / 200) * particleHoverFactor;
              particle.vx -= (dx / distance) * force * 0.05;
              particle.vy -= (dy / distance) * force * 0.05;
            }
          }

          // Draw particle
          ctx.save();
          ctx.globalAlpha = particle.opacity;
          ctx.translate(particle.x, particle.y);
          ctx.rotate(particle.rotation);
          ctx.fillStyle = particle.color;
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
          ctx.restore();
        });

        animationId = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        window.removeEventListener('resize', resizeCanvas);
        window.removeEventListener('mousemove', handleMouseMove);
        cancelAnimationFrame(animationId);
      };
    }, [
      particleCount,
      particleBaseSize,
      particleSpread,
      speed,
      particleColors,
      moveParticlesOnHover,
      particleHoverFactor,
      alphaParticles,
      sizeRandomness,
      disableRotation,
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

Particles.displayName = 'Particles';
export default Particles;
