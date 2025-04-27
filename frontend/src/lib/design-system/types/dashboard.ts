"use client";

/**
 * Dashboard layout system types for Fluxori
 */

/**
 * Dashboard information density options
 */
export type DashboardDensity = "compact" | "comfortable";

/**
 * Dashboard layout configuration for persisting user preferences
 */
export interface DashboardLayoutConfig {
  density: DashboardDensity;
  collapsed: Record<string, boolean>; // Section ID -> collapsed state
  layouts: {
    lg: Layout[];
    md: Layout[];
    sm: Layout[];
    xs: Layout[];
  };
}

/**
 * Dashboard grid item layout
 */
export interface Layout {
  i: string; // ID
  x: number; // Grid position X
  y: number; // Grid position Y
  w: number; // Width in grid units
  h: number; // Height in grid units
  minW?: number; // Min width
  maxW?: number; // Max width
  minH?: number; // Min height
  maxH?: number; // Max height
  static?: boolean; // If true, not draggable or resizable
  isDraggable?: boolean; // Can be dragged
  isResizable?: boolean; // Can be resized
}

/**
 * Dashboard card type variants
 */
export type DashboardCardType =
  | "metric"
  | "chart"
  | "list"
  | "table"
  | "text"
  | "action"
  | "ai-insight";

/**
 * Base dashboard card props shared across all card types
 */
export interface DashboardCardBaseProps {
  /** Unique ID for the card */
  id: string;

  /** Card title */
  title: string;

  /** Card description or subtitle (optional) */
  description?: string;

  /** Card type */
  type: DashboardCardType;

  /** Whether to show loading state */
  isLoading?: boolean;

  /** Whether there is an error */
  hasError?: boolean;

  /** Error message */
  errorMessage?: string;

  /** Last updated timestamp */
  lastUpdated?: Date;

  /** Network-aware optimizations enabled */
  networkAware?: boolean;

  /** Data refresh interval in ms (0 = no auto refresh) */
  refreshInterval?: number;

  /** Whether card is collapsible */
  collapsible?: boolean;

  /** Whether card is currently collapsed */
  collapsed?: boolean;

  /** Additional class name */
  className?: string;

  /** Override default height */
  height?: number | string;
}

/**
 * Dashboard metric card props for displaying KPIs
 */
export interface MetricCardProps extends DashboardCardBaseProps {
  type: "metric";

  /** Main metric value */
  value: number | string;

  /** Previous period value */
  previousValue?: number | string;

  /** Format string for the metric (e.g., '0.0%', '$0,0.00') */
  format?: string;

  /** Whether the metric is good when it goes up */
  isPositiveWhenUp?: boolean;

  /** Percent change from previous period */
  percentChange?: number;

  /** Icon to display */
  icon?: React.ReactNode;

  /** Chart data for sparkline */
  sparklineData?: number[];
}

/**
 * Dashboard chart card props
 */
export interface ChartCardProps extends DashboardCardBaseProps {
  type: "chart";

  /** Chart type */
  chartType: "line" | "bar" | "area" | "pie" | "scatter";

  /** Chart data (specific structure depends on chart library) */
  chartData: Record<string, any>;

  /** Chart options */
  chartOptions?: Record<string, any>;

  /** Whether to show chart legend */
  showLegend?: boolean;

  /** Whether to show data labels */
  showDataLabels?: boolean;

  /** Whether chart is interactive */
  interactive?: boolean;

  /** Can this chart be simplified for poor connections */
  canSimplify?: boolean;

  /** Alternative text representation for data saving mode */
  textAlternative?: string;
}

/**
 * Dashboard list card props
 */
export interface ListCardProps extends DashboardCardBaseProps {
  type: "list";

  /** List items */
  items: {
    id: string;
    label: React.ReactNode;
    value?: React.ReactNode;
    icon?: React.ReactNode;
    color?: string;
    link?: string;
  }[];

  /** Whether items are clickable */
  clickable?: boolean;

  /** Whether to show item dividers */
  showDividers?: boolean;

  /** Max items to show (with +X more) */
  maxItems?: number;
}

/**
 * Dashboard table card props
 */
export interface TableCardProps extends DashboardCardBaseProps {
  type: "table";

  /** Column definitions */
  columns: {
    id: string;
    header: React.ReactNode;
    accessorKey?: string;
    width?: number | string;
    cell?: (row: any) => React.ReactNode;
  }[];

  /** Row data */
  data: Record<string, any>[];

  /** Whether table is sortable */
  sortable?: boolean;

  /** Whether to enable pagination */
  paginated?: boolean;

  /** Default page size */
  pageSize?: number;

  /** Whether table rows are clickable */
  clickableRows?: boolean;

  /** Max number of rows to show on poor connections */
  poorConnectionRowLimit?: number;
}

/**
 * Dashboard text card props
 */
export interface TextCardProps extends DashboardCardBaseProps {
  type: "text";

  /** Content as markdown or plain text */
  content: string;

  /** Whether content is markdown */
  isMarkdown?: boolean;

  /** Whether to enable syntax highlighting for code blocks */
  enableSyntaxHighlighting?: boolean;

  /** Whether the text card has a call-to-action */
  hasCta?: boolean;

  /** Call-to-action label */
  ctaLabel?: string;

  /** Call-to-action function */
  onCtaClick?: () => void;
}

/**
 * Dashboard action card props
 */
export interface ActionCardProps extends DashboardCardBaseProps {
  type: "action";

  /** Primary action button label */
  primaryActionLabel: string;

  /** Primary action function */
  onPrimaryAction: () => void;

  /** Secondary action button label */
  secondaryActionLabel?: string;

  /** Secondary action function */
  onSecondaryAction?: () => void;

  /** Whether the action is currently processing */
  isProcessing?: boolean;

  /** Prompt text for the action */
  promptText?: string;

  /** Whether to disable actions on poor connections */
  disableOnPoorConnection?: boolean;
}

/**
 * Dashboard AI insight card props
 */
export interface AIInsightCardProps extends DashboardCardBaseProps {
  type: "ai-insight";

  /** Insight text content */
  insight: string;

  /** Confidence level (0-100) */
  confidenceScore: number;

  /** Data sources used for the insight */
  dataSources?: string[];

  /** Whether to show the full explanation */
  showExplanation?: boolean;

  /** Explanation text */
  explanation?: string;

  /** Icon based on insight type */
  insightIcon?: React.ReactNode;

  /** Actions the user can take based on this insight */
  actions?: {
    label: string;
    onClick: () => void;
  }[];

  /** Whether to show a simpler version on poor connections */
  simplifyOnPoorConnection?: boolean;
}

/**
 * Union type for all dashboard card props
 */
export type DashboardCardProps =
  | MetricCardProps
  | ChartCardProps
  | ListCardProps
  | TableCardProps
  | TextCardProps
  | ActionCardProps
  | AIInsightCardProps;

/**
 * Dashboard section props
 */
export interface DashboardSectionProps {
  /** Section ID */
  id: string;

  /** Section title */
  title: string;

  /** Section description */
  description?: string;

  /** Whether section is collapsible */
  collapsible?: boolean;

  /** Whether section is currently collapsed */
  collapsed?: boolean;

  /** Function to toggle collapse state */
  onToggleCollapse?: (id: string, collapsed: boolean) => void;

  /** Dashboard cards in this section */
  children: React.ReactNode;

  /** Section layout configuration (for grid-based layouts) */
  layout?: Layout[];

  /** Enable network-aware optimizations */
  networkAware?: boolean;

  /** Additional class name */
  className?: string;
}
