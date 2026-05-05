type Props = { size?: number; opacity?: number; className?: string; variant?: "purple" | "ink" | "salmon" };

// Real rubber-stamp feel — uneven ink, ring breaks, bleed
export default function HexBadge({ size = 100, opacity = 1, className = "", variant = "purple" }: Props) {
  const color =
    variant === "purple" ? "#5b3c8c" :
    variant === "salmon" ? "#b8523a" : "#14110d";

  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} style={{ opacity }}>
      <defs>
        <filter id="rough" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="11" />
          <feDisplacementMap in="SourceGraphic" scale="3.2" />
        </filter>
        <filter id="bleed">
          <feGaussianBlur stdDeviation="0.8" />
        </filter>
        <filter id="inkSplatter">
          <feTurbulence baseFrequency="2.0" numOctaves="2" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2 1.6" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>

      {/* outer hex — heavy ink */}
      <g filter="url(#rough)">
        <polygon points="60,10 100,32 100,78 60,100 20,78 20,32"
          fill="none" stroke={color} strokeWidth="5" strokeLinejoin="round" />
      </g>

      {/* second hex — slightly offset, less ink (double-stamp look) */}
      <g filter="url(#rough)" opacity="0.55" transform="translate(2.5, 1.5)">
        <polygon points="60,18 92,35 92,75 60,92 28,75 28,35"
          fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      </g>

      {/* random ink splatter dots */}
      <g fill={color} opacity="0.6">
        <circle cx="14" cy="42" r="0.9" />
        <circle cx="11" cy="63" r="0.6" />
        <circle cx="105" cy="40" r="0.8" />
        <circle cx="108" cy="71" r="0.5" />
        <circle cx="58" cy="6" r="0.5" />
        <circle cx="61" cy="106" r="0.4" />
      </g>

      {/* The F — clean, slightly tilted */}
      <text
        x="60" y="76"
        textAnchor="middle"
        fontFamily="Bebas Neue, Impact, sans-serif"
        fontSize="68"
        fill={color}
        fontWeight="bold"
        letterSpacing="-3"
        transform="rotate(-2 60 60)"
      >F</text>

      {/* ink-skip mask — light overlay simulating where pad didn't transfer */}
      <rect width="120" height="120" fill="#d4c69d" opacity="0.18" filter="url(#inkSplatter)" />
    </svg>
  );
}
