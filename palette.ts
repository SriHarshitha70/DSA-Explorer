/** Shared palette index helper for stable per-value coloring. */
export const VIZ_COLORS = [
  "var(--color-viz-1)",
  "var(--color-viz-2)",
  "var(--color-viz-3)",
  "var(--color-viz-4)",
  "var(--color-viz-5)",
  "var(--color-viz-6)",
];
export const colorFor = (i: number) => VIZ_COLORS[Math.abs(i) % VIZ_COLORS.length];
