// Authored icon set: 24px grid, 2px square-capped strokes, matching the broadcast slabs.
type P = { className?: string };
const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, "aria-hidden": true } as const;

export const ArrowRight = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 12h15M13 6l6 6-6 6" strokeLinecap="square" />
  </svg>
);

export const Check = ({ className }: P) => (
  <svg {...base} strokeWidth={2.8} className={className}>
    <path d="M4.5 12.5l4.8 4.8L19.5 7" strokeLinecap="square" />
  </svg>
);

export const Lock = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="5" y="10.5" width="14" height="10" />
    <path d="M8 10.5V8a4 4 0 018 0v2.5" />
  </svg>
);

export const Globe = ({ className }: P) => (
  <svg {...base} strokeWidth={1.8} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.6 2.7 3.9 5.7 3.9 9s-1.3 6.3-3.9 9c-2.6-2.7-3.9-5.7-3.9-9S9.4 5.7 12 3z" />
  </svg>
);

export const Chevron = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M6 9l6 6 6-6" strokeLinecap="square" />
  </svg>
);

export const Expand = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" strokeLinecap="square" />
  </svg>
);
