'use strict';
/**
 * Market Context Interface
 *
 * Interface and service for handling market-specific functionality
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.MarketFeature = void 0;
/**
 * Market feature enum - standard feature names
 */
var MarketFeature;
(function (MarketFeature) {
  MarketFeature['LOAD_SHEDDING_RESILIENCE'] = 'loadSheddingResilience';
  MarketFeature['NETWORK_AWARE_COMPONENTS'] = 'networkAwareComponents';
  MarketFeature['MULTI_WAREHOUSE_SUPPORT'] = 'multiWarehouseSupport';
  MarketFeature['EU_VAT_COMPLIANCE'] = 'euVatCompliance';
  MarketFeature['MARKETPLACE_INTEGRATION'] = 'marketplaceIntegration';
})(MarketFeature || (exports.MarketFeature = MarketFeature = {}));
