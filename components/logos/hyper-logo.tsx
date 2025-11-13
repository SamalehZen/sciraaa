import { TALA_LOGO_SVG } from './tala-logo-data';

type HyperLogoProps = {
  className?: string;
  width?: number;
  height?: number;
  color?: string;
};

export function HyperLogo({ className, width, height, color = 'currentColor' }: HyperLogoProps) {
  const resolvedWidth = typeof width === 'number' ? `${width}px` : width;
  const resolvedHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 0,
        width: resolvedWidth,
        height: resolvedHeight,
        color,
      }}
      dangerouslySetInnerHTML={{ __html: TALA_LOGO_SVG }}
    />
  );
}
