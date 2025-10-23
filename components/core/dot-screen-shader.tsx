'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { shaderMaterial, useTrailTexture } from '@react-three/drei';
import { useTheme } from 'next-themes';

type DotScreenPalette = {
  dot: string;
  background: string;
};

type DotScreenUniforms = {
  time: number;
  resolution: THREE.Vector2;
  dotColor: THREE.Color;
  bgColor: THREE.Color;
  mouseTrail: THREE.Texture;
  render: number;
  rotation: number;
  gridSize: number;
  dotOpacity: number;
};

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float time;
  uniform vec2 resolution;
  uniform vec3 dotColor;
  uniform vec3 bgColor;
  uniform sampler2D mouseTrail;
  uniform float render;
  uniform float rotation;
  uniform float gridSize;
  uniform float dotOpacity;

  varying vec2 vUv;

  float circle(vec2 uv, float radius, float blur) {
    float dist = length(uv);
    return smoothstep(radius + blur, radius - blur, dist);
  }

  void main() {
    vec2 uv = vUv;
    vec2 scaled = (uv - 0.5) * vec2(resolution.x / gridSize, resolution.y / gridSize);
    float s = sin(rotation);
    float c = cos(rotation);
    scaled = mat2(c, -s, s, c) * scaled;

    vec2 cell = fract(scaled) - 0.5;
    vec2 cellId = floor(scaled);

    float dotShape = circle(cell, 0.38, 0.18);
    float wave = 0.42 + 0.38 * sin(time * 0.6 + length(cellId) * 0.75);
    float baseDots = dotShape * wave;

    float trail = texture2D(mouseTrail, uv).r;
    float highlight = mix(baseDots, 1.0, trail);
    float intensity = clamp(highlight * dotOpacity, 0.0, 1.0) * render;

    vec3 color = mix(bgColor, dotColor, intensity);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const DotScreenMaterialImpl = shaderMaterial<DotScreenUniforms>(
  {
    time: 0,
    resolution: new THREE.Vector2(1, 1),
    dotColor: new THREE.Color('#2dd4bf'),
    bgColor: new THREE.Color('#020617'),
    mouseTrail: new THREE.Texture(),
    render: 0,
    rotation: 0,
    gridSize: 100,
    dotOpacity: 0.9,
  },
  vertexShader,
  fragmentShader,
);

const DOT_TRAIL_EASE = (t: number) => 1 - Math.pow(1 - t, 4);

const THEME_PALETTES: Record<'light' | 'dark' | 'fallback', DotScreenPalette> = {
  light: {
    dot: '#1f2937',
    background: '#f8fafc',
  },
  dark: {
    dot: '#22d3ee',
    background: '#020617',
  },
  fallback: {
    dot: '#2563eb',
    background: '#0f172a',
  },
};

type DotScreenSceneProps = {
  palette: DotScreenPalette;
};

function DotScreenScene({ palette }: DotScreenSceneProps) {
  const dotMaterial = useMemo(() => {
    const material = new DotScreenMaterialImpl();
    material.uniforms.gridSize.value = 100;
    material.uniforms.rotation.value = 0;
    material.uniforms.dotOpacity.value = 0.85;
    material.uniforms.render.value = 1;
    return material;
  }, []);

  const { size, viewport } = useThree();
  const { texture, pointer, update } = useTrailTexture({
    size: 512,
    radius: 0.1,
    maxAge: 400,
    interpolate: 1,
    ease: DOT_TRAIL_EASE,
  });

  useEffect(() => {
    dotMaterial.uniforms.mouseTrail.value = texture;
  }, [dotMaterial, texture]);

  useEffect(() => {
    const variantColor = new THREE.Color(palette.dot);
    const backgroundColor = new THREE.Color(palette.background);
    dotMaterial.uniforms.dotColor.value.copy(variantColor);
    dotMaterial.uniforms.bgColor.value.copy(backgroundColor);
  }, [dotMaterial, palette]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const x = event.clientX / size.width;
      const y = 1 - event.clientY / size.height;
      pointer.set(x, y);
      update();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [pointer, size.width, size.height, update]);

  useEffect(() => () => dotMaterial.dispose(), [dotMaterial]);

  useFrame((state) => {
    dotMaterial.uniforms.time.value = state.clock.elapsedTime;
    dotMaterial.uniforms.resolution.value.set(size.width * state.viewport.dpr, size.height * state.viewport.dpr);
    dotMaterial.uniforms.mouseTrail.value = texture;
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <primitive object={dotMaterial} attach="material" />
    </mesh>
  );
}

/**
 * DotScreenShader attaches an animated DotScreen background—place it inside a relatively positioned page wrapper and keep the canvas non-interactive.
 * Manual test: toggle “Arrière-plan DotScreen” in admin settings, refresh the home page, ensure the dots adopt light/dark palettes, and verify the mouse trail glows across the grid.
 */
export function DotScreenShader() {
  const { resolvedTheme, theme: currentTheme } = useTheme();

  const palette = useMemo<DotScreenPalette>(() => {
    const variant = resolvedTheme ?? currentTheme ?? 'fallback';
    if (variant === 'dark') return THEME_PALETTES.dark;
    if (variant === 'light') return THEME_PALETTES.light;
    return THEME_PALETTES.fallback;
  }, [currentTheme, resolvedTheme]);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0" aria-hidden="true">
      <Canvas
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.NoToneMapping,
        }}
        camera={{ position: [0, 0, 1], fov: 45 }}
      >
        <DotScreenScene palette={palette} />
      </Canvas>
    </div>
  );
}
