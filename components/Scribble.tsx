// Hand-drawn-feel SVG elements. Wobbly paths, real-looking ink.

export function ScribbleArrow({ className = "", size = 80, color = "#b8523a" }: any) {
  return (
    <svg viewBox="0 0 100 60" width={size} height={size * 0.6} className={className}>
      <defs>
        <filter id="ink"><feTurbulence baseFrequency="0.9" numOctaves="2" /><feDisplacementMap in="SourceGraphic" scale="1.5" /></filter>
      </defs>
      <g filter="url(#ink)" stroke={color} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 6 32 Q 22 28, 42 30 T 78 32" />
        <path d="M 70 22 L 86 32 L 72 44" />
      </g>
    </svg>
  );
}

export function ScribbleCircle({ className = "", size = 100, color = "#b8523a" }: any) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
      <defs>
        <filter id="ink2"><feTurbulence baseFrequency="0.7" numOctaves="3" seed="2" /><feDisplacementMap in="SourceGraphic" scale="2" /></filter>
      </defs>
      <g filter="url(#ink2)" stroke={color} fill="none" strokeWidth="2.5" strokeLinecap="round">
        <ellipse cx="50" cy="50" rx="42" ry="40" transform="rotate(-12 50 50)" />
        <ellipse cx="50" cy="50" rx="40" ry="38" transform="rotate(8 50 50)" opacity="0.4" />
      </g>
    </svg>
  );
}

export function ScribbleUnderline({ className = "", width = 200, color = "#b8523a" }: any) {
  return (
    <svg viewBox="0 0 200 12" width={width} height={width * 0.06} className={className}>
      <defs>
        <filter id="ink3"><feTurbulence baseFrequency="1.0" numOctaves="2" seed="5" /><feDisplacementMap in="SourceGraphic" scale="1.8" /></filter>
      </defs>
      <g filter="url(#ink3)" stroke={color} fill="none" strokeWidth="2.5" strokeLinecap="round">
        <path d="M 4 6 Q 50 2, 100 5 T 196 6" />
      </g>
    </svg>
  );
}

export function Redacted({ width = "auto", text = "REDACTED" }: { width?: string | number; text?: string }) {
  return (
    <span className="redacted" style={{ width }}>
      {text.replace(/./g, "█")}
    </span>
  );
}

export function ScribbleX({ size = 36, color = "#b8523a" }: any) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      <defs>
        <filter id="ink4"><feTurbulence baseFrequency="0.9" numOctaves="2" /><feDisplacementMap in="SourceGraphic" scale="1.2" /></filter>
      </defs>
      <g filter="url(#ink4)" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none">
        <line x1="6" y1="6" x2="34" y2="34" />
        <line x1="34" y1="6" x2="6" y2="34" />
      </g>
    </svg>
  );
}

export function Coffee({ size = 90, opacity = 0.18 }: any) {
  return (
    <svg viewBox="0 0 100 80" width={size} height={size * 0.8} style={{ opacity }}>
      <defs>
        <filter id="blur1"><feGaussianBlur stdDeviation="2" /></filter>
      </defs>
      <g filter="url(#blur1)" fill="#5a3a18">
        <ellipse cx="40" cy="40" rx="36" ry="28" opacity="0.7" />
        <ellipse cx="48" cy="42" rx="28" ry="20" opacity="0.5" />
        <ellipse cx="65" cy="32" rx="14" ry="9" opacity="0.6" />
      </g>
    </svg>
  );
}

export function Signature({ name = "FREELONS COMMITTEE", className = "" }: any) {
  return (
    <span className={`signature ${className}`}>{name}</span>
  );
}

// Replaces emoji ↑ — hand-drawn ink up-arrow
export function ArrowUp({ size = 22, color = "currentColor" }: any) {
  return (
    <svg viewBox="0 0 24 28" width={size} height={size * (28/24)} style={{ display: "inline-block", verticalAlign: "-3px" }}>
      <defs><filter id="iup"><feTurbulence baseFrequency="0.9" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="1.2"/></filter></defs>
      <g filter="url(#iup)" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="4" x2="12" y2="24" />
        <polyline points="5,12 12,4 19,12" />
      </g>
    </svg>
  );
}

// Replaces emoji 🔥 — hand-drawn flame
export function FlameMark({ size = 22, color = "currentColor" }: any) {
  return (
    <svg viewBox="0 0 24 28" width={size} height={size * (28/24)} style={{ display: "inline-block", verticalAlign: "-3px" }}>
      <defs><filter id="fl"><feTurbulence baseFrequency="0.8" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="1.4"/></filter></defs>
      <g filter="url(#fl)" stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 12 26 C 5 22, 4 14, 9 8 C 9 12, 11 13, 12 11 C 13 7, 17 6, 16 2 C 22 8, 22 18, 16 24 C 16 20, 14 19, 13 22 C 13 25, 14 26, 12 26 Z" />
      </g>
    </svg>
  );
}

// Replaces ▸ — hand-drawn forward marker
export function ForwardMark({ size = 14, color = "currentColor" }: any) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} style={{ display: "inline-block", verticalAlign: "-2px", marginLeft: 6 }}>
      <defs><filter id="fwd"><feTurbulence baseFrequency="1.2" numOctaves="2" seed="2"/><feDisplacementMap in="SourceGraphic" scale="1"/></filter></defs>
      <g filter="url(#fwd)" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3,3 10,8 3,13" />
      </g>
    </svg>
  );
}

// Replaces ✕ — hand-drawn close mark
export function CloseMark({ size = 12, color = "currentColor" }: any) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} style={{ display: "inline-block", verticalAlign: "-1px", marginLeft: 4 }}>
      <defs><filter id="cls"><feTurbulence baseFrequency="1.2" numOctaves="2"/><feDisplacementMap in="SourceGraphic" scale="0.8"/></filter></defs>
      <g filter="url(#cls)" stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round">
        <line x1="3" y1="3" x2="13" y2="13"/>
        <line x1="13" y1="3" x2="3" y2="13"/>
      </g>
    </svg>
  );
}
