import React from 'react';
import { HyperLogo } from './logos/hyper-logo';

export const HyperLogoHeader = () => (
  <div className="flex items-center my-1.5">
    <HyperLogo className="size-7" />
    {/* Texte "Hyper" retiré car maintenant intégré dans le SVG */}
  </div>
);
