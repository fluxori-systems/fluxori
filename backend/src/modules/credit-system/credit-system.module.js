'use strict';
var __esDecorate =
  (this && this.__esDecorate) ||
  function (
    ctor,
    descriptorIn,
    decorators,
    contextIn,
    initializers,
    extraInitializers,
  ) {
    function accept(f) {
      if (f !== void 0 && typeof f !== 'function')
        throw new TypeError('Function expected');
      return f;
    }
    var kind = contextIn.kind,
      key = kind === 'getter' ? 'get' : kind === 'setter' ? 'set' : 'value';
    var target =
      !descriptorIn && ctor
        ? contextIn['static']
          ? ctor
          : ctor.prototype
        : null;
    var descriptor =
      descriptorIn ||
      (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _,
      done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
      var context = {};
      for (var p in contextIn) context[p] = p === 'access' ? {} : contextIn[p];
      for (var p in contextIn.access) context.access[p] = contextIn.access[p];
      context.addInitializer = function (f) {
        if (done)
          throw new TypeError(
            'Cannot add initializers after decoration has completed',
          );
        extraInitializers.push(accept(f || null));
      };
      var result = (0, decorators[i])(
        kind === 'accessor'
          ? { get: descriptor.get, set: descriptor.set }
          : descriptor[key],
        context,
      );
      if (kind === 'accessor') {
        if (result === void 0) continue;
        if (result === null || typeof result !== 'object')
          throw new TypeError('Object expected');
        if ((_ = accept(result.get))) descriptor.get = _;
        if ((_ = accept(result.set))) descriptor.set = _;
        if ((_ = accept(result.init))) initializers.unshift(_);
      } else if ((_ = accept(result))) {
        if (kind === 'field') initializers.unshift(_);
        else descriptor[key] = _;
      }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
  };
var __runInitializers =
  (this && this.__runInitializers) ||
  function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
      value = useValue
        ? initializers[i].call(thisArg, value)
        : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
  };
var __setFunctionName =
  (this && this.__setFunctionName) ||
  function (f, name, prefix) {
    if (typeof name === 'symbol')
      name = name.description ? '['.concat(name.description, ']') : '';
    return Object.defineProperty(f, 'name', {
      configurable: true,
      value: prefix ? ''.concat(prefix, ' ', name) : name,
    });
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.CreditSystemModule = void 0;
var common_1 = require('@nestjs/common');
var firestore_config_1 = require('src/config/firestore.config');
var feature_flags_1 = require('src/modules/feature-flags');
var agent_framework_1 = require('src/modules/agent-framework');
var credit_system_controller_1 = require('./controllers/credit-system.controller');
var credit_system_service_1 = require('./services/credit-system.service');
var token_tracking_service_1 = require('./services/token-tracking.service');
var credit_allocation_repository_1 = require('./repositories/credit-allocation.repository');
var credit_transaction_repository_1 = require('./repositories/credit-transaction.repository');
var credit_pricing_tier_repository_1 = require('./repositories/credit-pricing-tier.repository');
var credit_reservation_repository_1 = require('./repositories/credit-reservation.repository');
var credit_usage_log_repository_1 = require('./repositories/credit-usage-log.repository');
var agent_framework_adapter_1 = require('./utils/agent-framework-adapter');
var feature_flag_adapter_1 = require('./utils/feature-flag-adapter');
/**
 * Credit System Module for tracking, managing, and optimizing AI model usage
 */
var CreditSystemModule = (function () {
  var _classDecorators = [
    (0, common_1.Module)({
      imports: [agent_framework_1.AgentFrameworkModule],
      controllers: [credit_system_controller_1.CreditSystemController],
      providers: [
        // Core services
        credit_system_service_1.CreditSystemService,
        token_tracking_service_1.TokenTrackingService,
        // Repositories
        credit_allocation_repository_1.CreditAllocationRepository,
        credit_transaction_repository_1.CreditTransactionRepository,
        credit_pricing_tier_repository_1.CreditPricingTierRepository,
        credit_reservation_repository_1.CreditReservationRepository,
        credit_usage_log_repository_1.CreditUsageLogRepository,
        // Adapters
        {
          provide: 'AgentFrameworkDependencies',
          useClass: agent_framework_adapter_1.AgentFrameworkAdapter,
        },
        {
          provide: 'FeatureFlagDependencies',
          useClass: feature_flag_adapter_1.FeatureFlagAdapter,
        },
        // External dependencies
        firestore_config_1.FirestoreConfigService,
        feature_flags_1.FeatureFlagService,
        agent_framework_1.ModelRegistryRepository,
        agent_framework_1.TokenEstimator,
      ],
      exports: [
        credit_system_service_1.CreditSystemService,
        token_tracking_service_1.TokenTrackingService,
      ],
    }),
  ];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var CreditSystemModule = (_classThis = /** @class */ (function () {
    function CreditSystemModule_1() {}
    return CreditSystemModule_1;
  })());
  __setFunctionName(_classThis, 'CreditSystemModule');
  (function () {
    var _metadata =
      typeof Symbol === 'function' && Symbol.metadata
        ? Object.create(null)
        : void 0;
    __esDecorate(
      null,
      (_classDescriptor = { value: _classThis }),
      _classDecorators,
      { kind: 'class', name: _classThis.name, metadata: _metadata },
      null,
      _classExtraInitializers,
    );
    CreditSystemModule = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (CreditSystemModule = _classThis);
})();
exports.CreditSystemModule = CreditSystemModule;
