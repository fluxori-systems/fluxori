// Export components
export { KeywordProductMappingTable } from "./KeywordProductMappingTable";
export { KeywordProductMappingForm } from "./KeywordProductMappingForm";
export { MappingListItem } from "./MappingListItem";
export { PimIntegrationDashboard } from "./PimIntegrationDashboard";

// Export types with explicit names to avoid ambiguity
export type {
  AttributeRecommendation as PimAttributeRecommendation,
  KeywordData as PimKeywordData,
  SuggestedKeyword as PimSuggestedKeyword,
} from "./KeywordProductMappingTable";

export type { KeywordProductMapping as PimKeywordProductMapping } from "./MappingListItem";
