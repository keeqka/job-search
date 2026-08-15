/** Fixed categorical order — never cycle or reassign per filter. See dataviz skill. */
export const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
];

export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

export const CHART_GRID = 'var(--viz-grid)';
export const CHART_AXIS = 'var(--viz-axis)';

/** Truncates free-text axis labels (e.g. rejection reasons) so they never overflow a fixed-width axis. */
export function truncateLabel(value: string, maxLength = 16): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}
