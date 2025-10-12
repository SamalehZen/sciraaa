"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { shaderMaterial, useTrailTexture } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "next-themes";
import { useMediaQuery } from "@/hooks/use-media-query";

// Dot screen shader material (implements required uniforms)
const DotMaterialImpl = shaderMaterial(
  {
    time: 0,
    resolution: new THREE.Vector2(1, 1),
    dotColor: new THREE.Color("#ffffff"),
    bgColor: new THREE.Color("#121212"),
    mouseTrail: null,
    rotation: 0,
    gridSize: 12,
    dotOpacity: 0.1,
  },
  /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  /* glsl */ `
    precision highp float;
    varying vec2 vUv;
    uniform float time;
    uniform vec2 resolution;
    uniform vec3 dotColor;
    uniform vec3 bgColor;
    uniform sampler2D mouseTrail;
    uniform float rotation;
    uniform float gridSize;
    uniform float dotOpacity;

    mat2 rot2(float a){
      float s = sin(a); float c = cos(a);
      return mat2(c,-s,s,c);
    }

    void main(){
      vec2 uv = vUv;
      // Subtle animated offset
      vec2 offset = vec2(sin(time*0.07), cos(time*0.06)) * 0.05;
      uv = (uv - 0.5);
      uv = rot2(rotation) * uv;
      uv += offset;
      uv += 0.5;

      // Dot grid (cell size derived from gridSize)
      vec2 g = uv * gridSize;
      vec2 gv = fract(g) - 0.5;
      float d = length(gv);
      float base = smoothstep(0.48, 0.32, d); // dot mask

      // Mouse/touch trail influences the intensity
      float trail = texture2D(mouseTrail, vUv).r;
      float trailGlow = smoothstep(0.2, 0.95, trail);

      float intensity = clamp(base * dotOpacity + trailGlow * (0.55 + 0.25 * dotOpacity), 0.0, 1.0);
      vec3 col = mix(bgColor, dotColor, intensity);

      gl_FragColor = vec4(col, 1.0);
    }
  `
);

extend({ DotMaterial: DotMaterialImpl });

type DotMaterialType = typeof DotMaterialImpl extends new (...args: any) => infer T
  ? T
  : any;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      dotMaterial: any;
    }
  }
}

function FullscreenDots({
  onMove,
  reducedMotion,
  themeColors,
  trailTexture,
}: {
  onMove: (e: any) => void;
  reducedMotion: boolean;
  themeColors: { dotColor: string; bgColor: string; dotOpacity: number };
  trailTexture: THREE.Texture;
}) {
  const materialRef = useRef<DotMaterialType>(null!);
  const { size } = useThree();

  useFrame((state, delta) => {
    if (!materialRef.current) return;
    const m = materialRef.current as any;
    m.resolution.set(size.width, size.height);
    if (!reducedMotion) m.time += delta; // freeze when reduced motion
  });

  useEffect(() => {
    if (!materialRef.current) return;
    const m = materialRef.current as any;
    m.dotColor = new THREE.Color(themeColors.dotColor);
    m.bgColor = new THREE.Color(themeColors.bgColor);
    m.dotOpacity = themeColors.dotOpacity;
  }, [themeColors]);

  useEffect(() => {
    if (!materialRef.current) return;
    const m = materialRef.current as any;
    m.mouseTrail = trailTexture;
  }, [trailTexture]);

  return (
    <mesh onPointerMove={onMove} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      {/* @ts-ignore - injected by extend */}
      <dotMaterial ref={materialRef} gridSize={reducedMotion ? 10 : 12} rotation={0.2} />
    </mesh>
  );
}

export function DotScreenShader() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => setMounted(true), []);

  const themeColors = useMemo(() => {
    if (!mounted) {
      return { dotColor: "#FFFFFF", bgColor: "#121212", dotOpacity: 0.05 };
    }
    if (resolvedTheme === "dark") {
      return { dotColor: "#FFFFFF", bgColor: "#121212", dotOpacity: 0.025 };
    }
    if (resolvedTheme === "light") {
      return { dotColor: "#e1e1e1", bgColor: "#F4F5F5", dotOpacity: 0.15 };
    }
    return { dotColor: "#FFFFFF", bgColor: "#121212", dotOpacity: 0.05 };
  }, [mounted, resolvedTheme]);

  const [trailTexture, onMove] = useTrailTexture({
    size: 256,
    maxAge: reducedMotion ? 400 : 900,
    radius: reducedMotion ? 0.18 : 0.28,
    intensity: reducedMotion ? 0.06 : 0.18,
    smoothing: 0.15,
    minForce: 0.15,
    interpolate: 2,
    blend: "screen",
  });

  // Avoid SSR hydration mismatch
  if (!mounted) return null;

  const [eventSource, setEventSource] = useState<HTMLElement | undefined>(undefined);
  useEffect(() => {
    setEventSource(document.body);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
      <Canvas
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        dpr={[1.75, 2.5]}
        // @ts-ignore - eventSource is set after mount
        eventSource={eventSource}
        eventPrefix="client"
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NoToneMapping;
          (gl as any).outputColorSpace = THREE.SRGBColorSpace;
          gl.setClearColor(0x000000, 0);
        }}
      >
        <FullscreenDots onMove={onMove} reducedMotion={reducedMotion} themeColors={themeColors} trailTexture={trailTexture} />
      </Canvas>
    </div>
  );
}

export default DotScreenShader;
