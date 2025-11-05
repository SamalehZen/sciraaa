"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import LightRays from "@/components/light-rays";
import Particles from "@/components/particles";
import ParticleEffectOverlay from "@/components/particle-effect-overlay";

interface AnimatedEffectsProps {
  isVisible?: boolean;
  duration?: number;
  lightRaysProps?: React.ComponentProps<typeof LightRays>;
  particlesProps?: React.ComponentProps<typeof Particles>;
}

const AnimatedEffects: React.FC<AnimatedEffectsProps> = ({
  isVisible = true,
  duration = 5,
  lightRaysProps = {},
  particlesProps = {},
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration }}
        >
          <div className="absolute inset-0">
            <LightRays {...lightRaysProps} />
          </div>
          <div className="absolute inset-0">
            <Particles {...particlesProps} />
          </div>
          <ParticleEffectOverlay />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export type { AnimatedEffectsProps };
export { AnimatedEffects };
export default AnimatedEffects;
