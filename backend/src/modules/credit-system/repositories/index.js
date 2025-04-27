'use strict';
/**
 * Repositories index for Credit System module
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.CreditUsageLogRepository =
  exports.CreditReservationRepository =
  exports.CreditPricingTierRepository =
  exports.CreditTransactionRepository =
  exports.CreditAllocationRepository =
    void 0;
var credit_allocation_repository_1 = require('./credit-allocation.repository');
Object.defineProperty(exports, 'CreditAllocationRepository', {
  enumerable: true,
  get: function () {
    return credit_allocation_repository_1.CreditAllocationRepository;
  },
});
var credit_transaction_repository_1 = require('./credit-transaction.repository');
Object.defineProperty(exports, 'CreditTransactionRepository', {
  enumerable: true,
  get: function () {
    return credit_transaction_repository_1.CreditTransactionRepository;
  },
});
var credit_pricing_tier_repository_1 = require('./credit-pricing-tier.repository');
Object.defineProperty(exports, 'CreditPricingTierRepository', {
  enumerable: true,
  get: function () {
    return credit_pricing_tier_repository_1.CreditPricingTierRepository;
  },
});
var credit_reservation_repository_1 = require('./credit-reservation.repository');
Object.defineProperty(exports, 'CreditReservationRepository', {
  enumerable: true,
  get: function () {
    return credit_reservation_repository_1.CreditReservationRepository;
  },
});
var credit_usage_log_repository_1 = require('./credit-usage-log.repository');
Object.defineProperty(exports, 'CreditUsageLogRepository', {
  enumerable: true,
  get: function () {
    return credit_usage_log_repository_1.CreditUsageLogRepository;
  },
});
