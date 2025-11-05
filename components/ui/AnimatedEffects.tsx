'use client';

import React from 'react';
import LightRays, { RaysOrigin } from '@/components/ui/LightRays';
import Particles from '@/components/ui/Particles';
import ParticleEffectOverlay from '@/components/ui/ParticleEffectOverlay';
import { AnimatePresence, motion } from 'framer-motion';

interface AnimatedEffectsProps {
  isVisible?: boolean;
  duration?: number;
  lightRaysProps?: {
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
  };
  particlesProps?: {
    particleCount?: number;
    particleSpread?: number;
    speed?: number;
    particleColors?: string[];
    moveParticlesOnHover?: boolean;
    particleHoverFactor?: number;
    alphaParticles?: boolean;
    particleBaseSize?: number;
    sizeRandomness?: number;
    cameraDistance?: number;
    disableRotation?: boolean;
  };
  className?: string;
}

export const AnimatedEffects: React.FC<AnimatedEffectsProps> = ({
  isVisible = true,
  duration = 1.5,
  lightRaysProps = {},
  particlesProps = {},
  className = '',
}) => {
  const defaultLightRaysProps = {
    raysOrigin: 'top-center' as RaysOrigin,
    raysSpeed: 1,
    rayLength: 2.5,
    lightSpread: 1.2,
    pulsating: true,
    fadeDistance: 1.0,
    saturation: 0.8,
    followMouse: false,
    noiseAmount: 0.05,
    distortion: 0.1,
  };

  const defaultParticlesProps = {
    particleCount: 300,
    particleBaseSize: 80,
    particleSpread: 12,
    speed: 0.12,
    alphaParticles: true,
    moveParticlesOnHover: false,
    disableRotation: false,
    cameraDistance: 20,
    sizeRandomness: 1.2,
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration, ease: 'easeInOut' }}
          className={`fixed inset-0 z-[5] pointer-events-none ${className}`}
        >
          {/* Layer 1: LightRays */}
          <div className="absolute inset-0 z-[6]">
            <LightRays {...defaultLightRaysProps} {...lightRaysProps} />
          </div>

          {/* Layer 2: Particles */}
          <div className="absolute inset-0 z-[6]">
            <Particles {...defaultParticlesProps} {...particlesProps} />
          </div>

          {/* Layer 3: Gradient Overlays */}
          <ParticleEffectOverlay className="z-[7]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedEffects;
