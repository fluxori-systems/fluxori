'use strict';
var __extends =
  (this && this.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b)
            if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError(
          'Class extends value ' + String(b) + ' is not a constructor or null',
        );
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
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
exports.CreditAllocationRepository = void 0;
var common_1 = require('@nestjs/common');
var firestore_base_repository_1 = require('../../../common/repositories/firestore-base.repository');
/**
 * Repository for credit allocations
 */
var CreditAllocationRepository = (function () {
  var _classDecorators = [(0, common_1.Injectable)()];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var _classSuper = firestore_base_repository_1.FirestoreBaseRepository;
  var CreditAllocationRepository = (_classThis = /** @class */ (function (
    _super,
  ) {
    __extends(CreditAllocationRepository_1, _super);
    function CreditAllocationRepository_1(firestoreConfigService) {
      var _this =
        _super.call(this, firestoreConfigService, 'credit_allocations', {
          useVersioning: true,
          enableCache: true,
          cacheTTLMs: 5 * 60 * 1000, // 5 minutes
          requiredFields: [
            'organizationId',
            'modelType',
            'totalCredits',
            'remainingCredits',
            'isActive',
          ],
        }) || this;
      _this.collectionName = 'credit_allocations';
      return _this;
    }
    /**
     * Find active allocation by organization
     * @param organizationId Organization ID
     * @returns Active credit allocation or null if not found
     */
    CreditAllocationRepository_1.prototype.findActiveByOrganization = function (
      organizationId,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var allocations;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                this.find({
                  filter: {
                    organizationId: organizationId,
                    isActive: true,
                  },
                  queryOptions: {
                    orderBy: 'createdAt',
                    direction: 'desc',
                    limit: 1,
                  },
                }),
              ];
            case 1:
              allocations = _a.sent();
              return [
                2 /*return*/,
                allocations.length > 0 ? allocations[0] : null,
              ];
          }
        });
      });
    };
    /**
     * Find all allocations for an organization
     * @param organizationId Organization ID
     * @returns Array of credit allocations
     */
    CreditAllocationRepository_1.prototype.findByOrganization = function (
      organizationId,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          return [
            2 /*return*/,
            this.find({
              filter: { organizationId: organizationId },
              queryOptions: {
                orderBy: 'createdAt',
                direction: 'desc',
              },
            }),
          ];
        });
      });
    };
    /**
     * Find active allocation for a specific user
     * @param organizationId Organization ID
     * @param userId User ID
     * @returns Active credit allocation or null if not found
     */
    CreditAllocationRepository_1.prototype.findActiveByUser = function (
      organizationId,
      userId,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var allocations;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                this.find({
                  filter: {
                    organizationId: organizationId,
                    userId: userId,
                    isActive: true,
                  },
                  queryOptions: {
                    orderBy: 'createdAt',
                    direction: 'desc',
                    limit: 1,
                  },
                }),
              ];
            case 1:
              allocations = _a.sent();
              return [
                2 /*return*/,
                allocations.length > 0 ? allocations[0] : null,
              ];
          }
        });
      });
    };
    /**
     * Find allocations by type
     * @param organizationId Organization ID
     * @param modelType Credit model type
     * @returns Array of credit allocations
     */
    CreditAllocationRepository_1.prototype.findByType = function (
      organizationId,
      modelType,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          return [
            2 /*return*/,
            this.find({
              filter: {
                organizationId: organizationId,
                modelType: modelType,
              },
              queryOptions: {
                orderBy: 'createdAt',
                direction: 'desc',
              },
            }),
          ];
        });
      });
    };
    /**
     * Update specific fields of an entity
     * @param id Entity ID
     * @param fields Fields to update
     * @returns Updated entity
     */
    CreditAllocationRepository_1.prototype.updateFields = function (
      id,
      fields,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          return [2 /*return*/, this.update(id, fields)];
        });
      });
    };
    /**
     * Decrement remaining credits in an allocation
     * @param allocationId Allocation ID
     * @param amount Amount to decrement
     * @returns Updated allocation
     */
    CreditAllocationRepository_1.prototype.decrementCredits = function (
      allocationId,
      amount,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var allocation;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [4 /*yield*/, this.findById(allocationId)];
            case 1:
              allocation = _a.sent();
              if (!allocation) {
                throw new Error(
                  'Credit allocation not found: '.concat(allocationId),
                );
              }
              if (allocation.remainingCredits < amount) {
                throw new Error(
                  'Insufficient credits in allocation: '.concat(allocationId),
                );
              }
              return [
                2 /*return*/,
                this.updateFields(allocationId, {
                  remainingCredits: allocation.remainingCredits - amount,
                }),
              ];
          }
        });
      });
    };
    /**
     * Add credits to an allocation
     * @param allocationId Allocation ID
     * @param amount Amount to add
     * @returns Updated allocation
     */
    CreditAllocationRepository_1.prototype.addCredits = function (
      allocationId,
      amount,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var allocation;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [4 /*yield*/, this.findById(allocationId)];
            case 1:
              allocation = _a.sent();
              if (!allocation) {
                throw new Error(
                  'Credit allocation not found: '.concat(allocationId),
                );
              }
              return [
                2 /*return*/,
                this.updateFields(allocationId, {
                  remainingCredits: allocation.remainingCredits + amount,
                }),
              ];
          }
        });
      });
    };
    /**
     * Deactivate an allocation
     * @param allocationId Allocation ID
     * @returns Updated allocation
     */
    CreditAllocationRepository_1.prototype.deactivate = function (
      allocationId,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          return [
            2 /*return*/,
            this.updateFields(allocationId, {
              isActive: false,
            }),
          ];
        });
      });
    };
    return CreditAllocationRepository_1;
  })(_classSuper));
  __setFunctionName(_classThis, 'CreditAllocationRepository');
  (function () {
    var _a;
    var _metadata =
      typeof Symbol === 'function' && Symbol.metadata
        ? Object.create(
            (_a = _classSuper[Symbol.metadata]) !== null && _a !== void 0
              ? _a
              : null,
          )
        : void 0;
    __esDecorate(
      null,
      (_classDescriptor = { value: _classThis }),
      _classDecorators,
      { kind: 'class', name: _classThis.name, metadata: _metadata },
      null,
      _classExtraInitializers,
    );
    CreditAllocationRepository = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (CreditAllocationRepository = _classThis);
})();
exports.CreditAllocationRepository = CreditAllocationRepository;
