type P = { className?: string; size?: number };

const base = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  "aria-hidden": true,
});

export const BagIcon = ({ className, size = 20 }: P) => (
  <svg {...base(size, className)}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
);
export const ArrowRight = ({ className, size = 18 }: P) => (
  <svg {...base(size, className)}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
);
export const ArrowUpRight = ({ className, size = 18 }: P) => (
  <svg {...base(size, className)}><path d="M7 17 17 7" /><path d="M8 7h9v9" /></svg>
);
export const Plus = ({ className, size = 18 }: P) => (
  <svg {...base(size, className)}><path d="M12 5v14M5 12h14" /></svg>
);
export const Minus = ({ className, size = 18 }: P) => (
  <svg {...base(size, className)}><path d="M5 12h14" /></svg>
);
export const Close = ({ className, size = 20 }: P) => (
  <svg {...base(size, className)}><path d="m6 6 12 12M18 6 6 18" /></svg>
);
export const Pin = ({ className, size = 18 }: P) => (
  <svg {...base(size, className)}><path d="M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.800 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
);
export const Phone = ({ className, size = 18 }: P) => (
  <svg {...base(size, className)}><path d="M6.5 3.500h3l1.500 4-2 1.500a12 12 0 0 0 6 6l1.500-2 4 1.500v3a2 2 0 0 1-2.200 2A17 17 0 0 1 4.500 5.700a2 2 0 0 1 2-2.200Z" /></svg>
);
export const Lock = ({ className, size = 16 }: P) => (
  <svg {...base(size, className)}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);
export const MenuIcon = ({ className, size = 22 }: P) => (
  <svg {...base(size, className)}><path d="M4 8h16M4 16h16" /></svg>
);
export const Check = ({ className, size = 16 }: P) => (
  <svg {...base(size, className)}><path d="m5 12.500 4.500 4.500L19 7.500" /></svg>
);
export const Copy = ({ className, size = 16 }: P) => (
  <svg {...base(size, className)}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></svg>
);
