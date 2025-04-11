'use client';

// Export all dashboard components for easy imports
export { DashboardCard } from './DashboardCard';
export { DashboardGrid } from './DashboardGrid';
export { DashboardLayout } from './DashboardLayout';
export { DashboardSection } from './DashboardSection';
export { MetricCard } from './MetricCard';
export { ChartCard } from './ChartCard';

// Re-export types
export type { 
  BaseDashboardCardProps
} from './DashboardCard';

export type {
  DashboardGridProps
} from './DashboardGrid';

export type {
  DashboardLayoutProps
} from './DashboardLayout';

export type {
  DashboardMetricCardProps
} from './MetricCard';

export type {
  DashboardChartCardProps
} from './ChartCard';