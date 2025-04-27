// Analytics components
export * from "./analytics";

// Competitor alerts components
export * from "./competitor-alerts";

// PIM integration components
export * from "./pim-integration";

// Marketplace strategy components - re-export explicitly to avoid collisions with ImpactLevel
// from pim-integration module
export {
  StrategyForm,
  StrategyReport,
  StrategyRequestForm,
  StrategyDashboard,
} from "./marketplace-strategy";

// Re-export types with namespace prefixes to avoid ambiguity
export type {
  AnalysisType,
  TimeFrame,
  PriorityLevel,
  MarketplaceData,
} from "./marketplace-strategy/StrategyForm";

export type {
  ImpactLevel as StrategyImpactLevel,
  DifficultyLevel,
  PricePosition,
  MarketplaceInsight,
  MarketplaceOpportunity,
  MarketplaceRecommendation,
  StrategyReportData,
  MarketplaceStrategy,
} from "./marketplace-strategy/StrategyReport";

export type {
  StrategyTemplate,
  SAMarketplace,
  SAMarketOptions,
  CreditEstimation,
  StrategyRequestFormValues,
} from "./marketplace-strategy/StrategyRequestForm";
