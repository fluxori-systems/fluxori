/**
 * Network-aware charts components
 *
 * These charts integrate with the Fluxori Design System and the
 * South African market optimizations. They adapt to network conditions
 * to provide the best performance for various connection speeds.
 */

export { NetworkAwareLineChart } from "./NetworkAwareLineChart";
export { NetworkAwareBarChart } from "./NetworkAwareBarChart";
export { NetworkAwarePieChart } from "./NetworkAwarePieChart";
export type {
  NetworkAwareLineChartProps,
  NetworkAwareBarChartProps,
  NetworkAwarePieChartProps,
  ChartDataPoint,
} from "../../types/chart.types";

// Re-export the hook for custom chart implementations
export {
  useNetworkAwareChart,
  type ChartConnectionQuality,
} from "../../hooks/useNetworkAwareChart";
