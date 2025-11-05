"use client";

import React from "react";

interface ParticleEffectOverlayProps {
  className?: string;
}

const ParticleEffectOverlay: React.FC<ParticleEffectOverlayProps> = ({
  className = "",
}) => {
  return (
    <>
      <div className={`absolute top-0 left-0 w-full h-full z-10 ${className}`}>
        <div className="w-full h-full bg-gradient-to-t from-background to-50% to-transparent z-20" />
      </div>
      <div className={`absolute top-0 left-0 w-full h-full z-10 ${className}`}>
        <div className="w-full h-full bg-gradient-to-l from-background to-20% to-transparent z-20" />
      </div>
      <div className={`absolute top-0 left-0 w-full h-full z-10 ${className}`}>
        <div className="w-full h-full bg-gradient-to-r from-background to-20% to-transparent z-20" />
      </div>
    </>
  );
};

export type { ParticleEffectOverlayProps };
export default ParticleEffectOverlay;
