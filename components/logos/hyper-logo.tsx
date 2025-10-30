export function HyperLogo({
  className,
  width,
  height,
  color = 'currentColor',
}: {
  className?: string;
  width?: number;
  height?: number;
  color?: string;
}) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={width}
      height={height}
    >
      {/* Fond carré blanc coins arrondis */}
      <rect 
        x="2" y="2" 
        width="96" height="96" 
        rx="20" 
        fill="white" 
        stroke="black" 
        strokeWidth="2"
      />
      
      {/* H ultra minimaliste */}
      <rect x="16" y="33" width="2" height="34" rx="1" fill="black"/>
      <rect x="30" y="33" width="2" height="34" rx="1" fill="black"/>
      <rect x="16" y="49" width="16" height="2" rx="1" fill="black"/>
      
      {/* Étoile géométrique - losange tourné */}
      <rect 
        x="61" y="41" 
        width="11" height="11" 
        transform="rotate(45 66.5 46.5)" 
        fill="black"
      />
      
      {/* Deux petits points au-dessus */}
      <circle cx="60" cy="33" r="1.8" fill="black"/>
      <circle cx="73" cy="33" r="1.8" fill="black"/>
      
      {/* Texte yper */}
      <text
        x="66.5"
        y="68"
        fontFamily="Arial, sans-serif"
        fontSize="10.5"
        fontWeight="400"
        fill="black"
        textAnchor="middle"
        letterSpacing="0.5"
      >
        yper
      </text>
    </svg>
  );
}
