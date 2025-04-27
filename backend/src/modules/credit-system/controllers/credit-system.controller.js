'use strict';
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
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === 'function' ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g['throw'] = verb(1)),
      (g['return'] = verb(2)),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                    ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
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
exports.CreditSystemController = void 0;
var common_1 = require('@nestjs/common');
var firebase_auth_guard_1 = require('src/modules/auth/guards/firebase-auth.guard');
var logging_interceptor_1 = require('src/common/observability/interceptors/logging.interceptor');
var metrics_interceptor_1 = require('src/common/observability/interceptors/metrics.interceptor');
var tracing_interceptor_1 = require('src/common/observability/interceptors/tracing.interceptor');
/**
 * Controller for credit system operations
 */
var CreditSystemController = (function () {
  var _classDecorators = [
    (0, common_1.Controller)('api/credit-system'),
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard),
    (0, common_1.UseInterceptors)(
      logging_interceptor_1.LoggingInterceptor,
      metrics_interceptor_1.MetricsInterceptor,
      tracing_interceptor_1.TracingInterceptor,
    ),
  ];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var _instanceExtraInitializers = [];
  var _createAllocation_decorators;
  var _getActiveAllocation_decorators;
  var _addCredits_decorators;
  var _getTransactions_decorators;
  var _getUsageLogs_decorators;
  var _checkCredits_decorators;
  var _recordUsage_decorators;
  var _releaseReservation_decorators;
  var _getUsageStats_decorators;
  var _getSystemStatus_decorators;
  var _optimizeModel_decorators;
  var CreditSystemController = (_classThis = /** @class */ (function () {
    function CreditSystemController_1(
      creditSystemService,
      tokenTrackingService,
    ) {
      this.creditSystemService =
        (__runInitializers(this, _instanceExtraInitializers),
        creditSystemService);
      this.tokenTrackingService = tokenTrackingService;
    }
    /**
     * Create a new credit allocation
     */
    CreditSystemController_1.prototype.createAllocation = function (
      createDto,
      user,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var resetDate, expirationDate;
        return __generator(this, function (_a) {
          // Check authorization
          if (!user.admin && user.organizationId !== createDto.organizationId) {
            throw new common_1.ForbiddenException(
              'You do not have permission to create allocations for this organization',
            );
          }
          if (createDto.resetDate) {
            resetDate = new Date(createDto.resetDate);
          }
          if (createDto.expirationDate) {
            expirationDate = new Date(createDto.expirationDate);
          }
          return [
            2 /*return*/,
            this.creditSystemService.createAllocation(
              createDto.organizationId,
              createDto.modelType,
              createDto.totalCredits,
              createDto.userId,
              resetDate,
              expirationDate,
              createDto.metadata,
            ),
          ];
        });
      });
    };
    /**
     * Get active allocation for an organization or user
     */
    CreditSystemController_1.prototype.getActiveAllocation = function (
      organizationId,
      user,
      userId,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var allocation;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              // Check authorization
              if (!user.admin && user.organizationId !== organizationId) {
                throw new common_1.ForbiddenException(
                  'You do not have permission to view allocations for this organization',
                );
              }
              return [
                4 /*yield*/,
                this.creditSystemService.getActiveAllocation(
                  organizationId,
                  userId,
                ),
              ];
            case 1:
              allocation = _a.sent();
              if (!allocation) {
                throw new common_1.NotFoundException(
                  'No active allocation found for organization '.concat(
                    organizationId,
                  ),
                );
              }
              return [2 /*return*/, allocation];
          }
        });
      });
    };
    /**
     * Add credits to an allocation
     */
    CreditSystemController_1.prototype.addCredits = function (
      addCreditsDto,
      user,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          // Only admins can add credits
          if (!user.admin) {
            throw new common_1.ForbiddenException(
              'Only administrators can add credits',
            );
          }
          return [
            2 /*return*/,
            this.creditSystemService.addCreditsToAllocation(
              addCreditsDto.allocationId,
              addCreditsDto.amount,
              user.id,
              addCreditsDto.metadata,
            ),
          ];
        });
      });
    };
    /**
     * Get recent transactions for an organization
     */
    CreditSystemController_1.prototype.getTransactions = function (
      organizationId,
      user,
      limit,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          // Check authorization
          if (!user.admin && user.organizationId !== organizationId) {
            throw new common_1.ForbiddenException(
              'You do not have permission to view transactions for this organization',
            );
          }
          return [
            2 /*return*/,
            this.creditSystemService.getRecentTransactions(
              organizationId,
              limit,
            ),
          ];
        });
      });
    };
    /**
     * Get recent usage logs for an organization
     */
    CreditSystemController_1.prototype.getUsageLogs = function (
      organizationId,
      user,
      limit,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          // Check authorization
          if (!user.admin && user.organizationId !== organizationId) {
            throw new common_1.ForbiddenException(
              'You do not have permission to view usage logs for this organization',
            );
          }
          return [
            2 /*return*/,
            this.creditSystemService.getRecentUsageLogs(organizationId, limit),
          ];
        });
      });
    };
    /**
     * Check if an organization has enough credits for an operation
     */
    CreditSystemController_1.prototype.checkCredits = function (
      checkCreditsDto,
      user,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          // Check authorization
          if (
            !user.admin &&
            user.organizationId !== checkCreditsDto.organizationId
          ) {
            throw new common_1.ForbiddenException(
              'You do not have permission to check credits for this organization',
            );
          }
          return [
            2 /*return*/,
            this.creditSystemService.checkCredits(checkCreditsDto),
          ];
        });
      });
    };
    /**
     * Record credit usage for an operation
     */
    CreditSystemController_1.prototype.recordUsage = function (
      recordUsageDto,
      user,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          // Check authorization
          if (
            !user.admin &&
            user.organizationId !== recordUsageDto.organizationId
          ) {
            throw new common_1.ForbiddenException(
              'You do not have permission to record usage for this organization',
            );
          }
          return [
            2 /*return*/,
            this.creditSystemService.recordUsage(recordUsageDto),
          ];
        });
      });
    };
    /**
     * Release a credit reservation
     */
    CreditSystemController_1.prototype.releaseReservation = function (
      reservationId,
      user,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                this.creditSystemService.releaseReservation(reservationId),
              ];
            case 1:
              result = _a.sent();
              if (!result) {
                throw new common_1.BadRequestException(
                  'Failed to release reservation: '.concat(reservationId),
                );
              }
              return [2 /*return*/, { success: true }];
          }
        });
      });
    };
    /**
     * Get usage statistics for a period
     */
    CreditSystemController_1.prototype.getUsageStats = function (
      organizationId,
      startDateStr,
      endDateStr,
      user,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var startDate, endDate;
        return __generator(this, function (_a) {
          // Check authorization
          if (!user.admin && user.organizationId !== organizationId) {
            throw new common_1.ForbiddenException(
              'You do not have permission to view usage statistics for this organization',
            );
          }
          startDate = new Date(startDateStr);
          endDate = new Date(endDateStr);
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new common_1.BadRequestException(
              'Invalid date format. Please use ISO format (YYYY-MM-DD)',
            );
          }
          return [
            2 /*return*/,
            this.creditSystemService.getUsageStatistics(
              organizationId,
              startDate,
              endDate,
            ),
          ];
        });
      });
    };
    /**
     * Get system status
     */
    CreditSystemController_1.prototype.getSystemStatus = function (user) {
      return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          // Only admins can view system status
          if (!user.admin) {
            throw new common_1.ForbiddenException(
              'Only administrators can view system status',
            );
          }
          return [2 /*return*/, this.creditSystemService.getSystemStatus()];
        });
      });
    };
    /**
     * Optimize model selection
     */
    CreditSystemController_1.prototype.optimizeModel = function (
      optimizeDto,
      user,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              // Check authorization
              if (
                !user.admin &&
                user.organizationId !== optimizeDto.organizationId
              ) {
                throw new common_1.ForbiddenException(
                  'You do not have permission to optimize models for this organization',
                );
              }
              return [
                4 /*yield*/,
                this.tokenTrackingService.optimizeModelSelection(
                  optimizeDto.organizationId,
                  optimizeDto.userPrompt,
                  optimizeDto.taskComplexity,
                  optimizeDto.preferredModel,
                ),
              ];
            case 1:
              result = _a.sent();
              if (!result.model) {
                throw new common_1.BadRequestException(result.reason);
              }
              return [
                2 /*return*/,
                {
                  model: {
                    id: result.model.id,
                    provider: result.model.provider,
                    model: result.model.model,
                    displayName: result.model.displayName,
                    complexity: result.model.complexity,
                  },
                  reason: result.reason,
                },
              ];
          }
        });
      });
    };
    return CreditSystemController_1;
  })());
  __setFunctionName(_classThis, 'CreditSystemController');
  (function () {
    var _metadata =
      typeof Symbol === 'function' && Symbol.metadata
        ? Object.create(null)
        : void 0;
    _createAllocation_decorators = [(0, common_1.Post)('allocations')];
    _getActiveAllocation_decorators = [(0, common_1.Get)('allocations/active')];
    _addCredits_decorators = [(0, common_1.Post)('allocations/add-credits')];
    _getTransactions_decorators = [
      (0, common_1.Get)('transactions/:organizationId'),
    ];
    _getUsageLogs_decorators = [
      (0, common_1.Get)('usage-logs/:organizationId'),
    ];
    _checkCredits_decorators = [(0, common_1.Post)('check-credits')];
    _recordUsage_decorators = [(0, common_1.Post)('record-usage')];
    _releaseReservation_decorators = [
      (0, common_1.Post)('release-reservation/:reservationId'),
    ];
    _getUsageStats_decorators = [
      (0, common_1.Get)('usage-stats/:organizationId'),
    ];
    _getSystemStatus_decorators = [(0, common_1.Get)('system-status')];
    _optimizeModel_decorators = [(0, common_1.Post)('optimize-model')];
    __esDecorate(
      _classThis,
      null,
      _createAllocation_decorators,
      {
        kind: 'method',
        name: 'createAllocation',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'createAllocation' in obj;
          },
          get: function (obj) {
            return obj.createAllocation;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      _classThis,
      null,
      _getActiveAllocation_decorators,
      {
        kind: 'method',
        name: 'getActiveAllocation',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'getActiveAllocation' in obj;
          },
          get: function (obj) {
            return obj.getActiveAllocation;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      _classThis,
      null,
      _addCredits_decorators,
      {
        kind: 'method',
        name: 'addCredits',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'addCredits' in obj;
          },
          get: function (obj) {
            return obj.addCredits;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      _classThis,
      null,
      _getTransactions_decorators,
      {
        kind: 'method',
        name: 'getTransactions',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'getTransactions' in obj;
          },
          get: function (obj) {
            return obj.getTransactions;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      _classThis,
      null,
      _getUsageLogs_decorators,
      {
        kind: 'method',
        name: 'getUsageLogs',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'getUsageLogs' in obj;
          },
          get: function (obj) {
            return obj.getUsageLogs;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      _classThis,
      null,
      _checkCredits_decorators,
      {
        kind: 'method',
        name: 'checkCredits',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'checkCredits' in obj;
          },
          get: function (obj) {
            return obj.checkCredits;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      _classThis,
      null,
      _recordUsage_decorators,
      {
        kind: 'method',
        name: 'recordUsage',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'recordUsage' in obj;
          },
          get: function (obj) {
            return obj.recordUsage;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      _classThis,
      null,
      _releaseReservation_decorators,
      {
        kind: 'method',
        name: 'releaseReservation',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'releaseReservation' in obj;
          },
          get: function (obj) {
            return obj.releaseReservation;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      _classThis,
      null,
      _getUsageStats_decorators,
      {
        kind: 'method',
        name: 'getUsageStats',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'getUsageStats' in obj;
          },
          get: function (obj) {
            return obj.getUsageStats;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      _classThis,
      null,
      _getSystemStatus_decorators,
      {
        kind: 'method',
        name: 'getSystemStatus',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'getSystemStatus' in obj;
          },
          get: function (obj) {
            return obj.getSystemStatus;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      _classThis,
      null,
      _optimizeModel_decorators,
      {
        kind: 'method',
        name: 'optimizeModel',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'optimizeModel' in obj;
          },
          get: function (obj) {
            return obj.optimizeModel;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      null,
      (_classDescriptor = { value: _classThis }),
      _classDecorators,
      { kind: 'class', name: _classThis.name, metadata: _metadata },
      null,
      _classExtraInitializers,
    );
    CreditSystemController = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (CreditSystemController = _classThis);
})();
exports.CreditSystemController = CreditSystemController;
