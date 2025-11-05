'use client';

import React from 'react';

interface ParticleEffectOverlayProps {
  className?: string;
}

const ParticleEffectOverlay: React.FC<ParticleEffectOverlayProps> = ({ className = '' }) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        background: `
          radial-gradient(ellipse at 20% 50%, rgba(100, 150, 255, 0.1) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 50%, rgba(150, 100, 255, 0.05) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 0%, rgba(100, 200, 255, 0.08) 0%, transparent 50%)
        `,
      }}
    />
  );
};

export default ParticleEffectOverlay;
