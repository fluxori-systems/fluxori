"use strict";
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
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
      if (f !== void 0 && typeof f !== "function")
        throw new TypeError("Function expected");
      return f;
    }
    var kind = contextIn.kind,
      key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target =
      !descriptorIn && ctor
        ? contextIn["static"]
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
      for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
      for (var p in contextIn.access) context.access[p] = contextIn.access[p];
      context.addInitializer = function (f) {
        if (done)
          throw new TypeError(
            "Cannot add initializers after decoration has completed",
          );
        extraInitializers.push(accept(f || null));
      };
      var result = (0, decorators[i])(
        kind === "accessor"
          ? { get: descriptor.get, set: descriptor.set }
          : descriptor[key],
        context,
      );
      if (kind === "accessor") {
        if (result === void 0) continue;
        if (result === null || typeof result !== "object")
          throw new TypeError("Object expected");
        if ((_ = accept(result.get))) descriptor.get = _;
        if ((_ = accept(result.set))) descriptor.set = _;
        if ((_ = accept(result.init))) initializers.unshift(_);
      } else if ((_ = accept(result))) {
        if (kind === "field") initializers.unshift(_);
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
          step(generator["throw"](value));
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
        (typeof Iterator === "function" ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
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
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
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
    if (typeof name === "symbol")
      name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", {
      configurable: true,
      value: prefix ? "".concat(prefix, " ", name) : name,
    });
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlagService = void 0;
var common_1 = require("@nestjs/common");
var firestore_1 = require("@google-cloud/firestore");
var types_1 = require("../interfaces/types");
var FeatureFlagService = (function () {
  var _classDecorators = [(0, common_1.Injectable)()];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var FeatureFlagService = (_classThis = /** @class */ (function () {
    function FeatureFlagService_1(featureFlagRepository, auditLogRepository) {
      this.featureFlagRepository = featureFlagRepository;
      this.auditLogRepository = auditLogRepository;
      this.logger = new common_1.Logger(FeatureFlagService.name);
      this.flagCache = new Map();
      this.subscriptions = new Set();
      this.flagChangeListeners = [];
    }
    /**
     * Initialize service and load flags into cache
     */
    FeatureFlagService_1.prototype.onModuleInit = function () {
      return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              this.logger.log("Initializing Feature Flag Service");
              return [4 /*yield*/, this.refreshCache()];
            case 1:
              _a.sent();
              // Set up a periodic refresh of the cache
              setInterval(function () {
                _this.refreshCache().catch(function (err) {
                  return _this.logger.error(
                    "Failed to refresh feature flag cache",
                    err,
                  );
                });
              }, 60000); // Refresh every 60 seconds
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Refresh the flag cache
     */
    FeatureFlagService_1.prototype.refreshCache = function () {
      return __awaiter(this, void 0, void 0, function () {
        var flags;
        var _this = this;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              this.logger.debug("Refreshing feature flag cache");
              return [4 /*yield*/, this.featureFlagRepository.findAll()];
            case 1:
              flags = _a.sent();
              // Update the cache
              this.flagCache.clear();
              flags.forEach(function (flag) {
                _this.flagCache.set(flag.key, flag);
              });
              // Notify subscribers of any changes
              this.notifySubscribers();
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Create a new feature flag
     */
    FeatureFlagService_1.prototype.createFlag = function (flagDTO, userId) {
      return __awaiter(this, void 0, void 0, function () {
        var existingFlag, newFlag;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                this.featureFlagRepository.findByKey(flagDTO.key),
              ];
            case 1:
              existingFlag = _a.sent();
              if (existingFlag) {
                throw new common_1.BadRequestException(
                  "Feature flag with key '".concat(
                    flagDTO.key,
                    "' already exists",
                  ),
                );
              }
              // Perform additional validation based on flag type
              this.validateFlagData(flagDTO);
              return [
                4 /*yield*/,
                this.featureFlagRepository.create(
                  __assign(__assign({}, flagDTO), {
                    lastModifiedBy: userId,
                    lastModifiedAt: firestore_1.Timestamp.now(),
                  }),
                ),
              ];
            case 2:
              newFlag = _a.sent();
              // Log the creation in the audit log
              return [
                4 /*yield*/,
                this.auditLogRepository.create({
                  flagId: newFlag.id,
                  flagKey: newFlag.key,
                  action: "created",
                  performedBy: userId,
                  timestamp: firestore_1.Timestamp.now(),
                  changes: [
                    {
                      field: "all",
                      oldValue: null,
                      newValue: newFlag,
                    },
                  ],
                }),
              ];
            case 3:
              // Log the creation in the audit log
              _a.sent();
              // Update the cache and notify subscribers
              this.flagCache.set(newFlag.key, newFlag);
              this.notifyFlagChange(newFlag.key, newFlag.enabled);
              return [2 /*return*/, newFlag];
          }
        });
      });
    };
    /**
     * Update an existing feature flag
     */
    FeatureFlagService_1.prototype.updateFlag = function (id, flagDTO, userId) {
      return __awaiter(this, void 0, void 0, function () {
        var existingFlag, changes, _i, _a, _b, key, value, updatedFlag;
        return __generator(this, function (_c) {
          switch (_c.label) {
            case 0:
              return [4 /*yield*/, this.featureFlagRepository.findById(id)];
            case 1:
              existingFlag = _c.sent();
              if (!existingFlag) {
                throw new common_1.NotFoundException(
                  "Feature flag with ID '".concat(id, "' not found"),
                );
              }
              // Validate the update data
              if (flagDTO.type && flagDTO.type !== existingFlag.type) {
                this.validateFlagData(
                  __assign(__assign({}, existingFlag), flagDTO),
                );
              }
              changes = [];
              for (_i = 0, _a = Object.entries(flagDTO); _i < _a.length; _i++) {
                (_b = _a[_i]), (key = _b[0]), (value = _b[1]);
                if (
                  JSON.stringify(existingFlag[key]) !== JSON.stringify(value)
                ) {
                  changes.push({
                    field: key,
                    oldValue: existingFlag[key],
                    newValue: value,
                  });
                }
              }
              return [
                4 /*yield*/,
                this.featureFlagRepository.update(
                  id,
                  __assign(__assign({}, flagDTO), {
                    lastModifiedBy: userId,
                    lastModifiedAt: firestore_1.Timestamp.now(),
                  }),
                ),
              ];
            case 2:
              updatedFlag = _c.sent();
              if (!(changes.length > 0)) return [3 /*break*/, 4];
              return [
                4 /*yield*/,
                this.auditLogRepository.create({
                  flagId: updatedFlag.id,
                  flagKey: updatedFlag.key,
                  action: "updated",
                  performedBy: userId,
                  timestamp: firestore_1.Timestamp.now(),
                  changes: changes,
                }),
              ];
            case 3:
              _c.sent();
              _c.label = 4;
            case 4:
              // Update the cache and notify subscribers
              this.flagCache.set(updatedFlag.key, updatedFlag);
              // If the enabled status changed, notify specifically about that
              if (
                flagDTO.enabled !== undefined &&
                flagDTO.enabled !== existingFlag.enabled
              ) {
                this.notifyFlagChange(updatedFlag.key, updatedFlag.enabled);
              }
              return [2 /*return*/, updatedFlag];
          }
        });
      });
    };
    /**
     * Toggle a feature flag on or off
     */
    FeatureFlagService_1.prototype.toggleFlag = function (
      id,
      toggleDTO,
      userId,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var existingFlag, updatedFlag;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [4 /*yield*/, this.featureFlagRepository.findById(id)];
            case 1:
              existingFlag = _a.sent();
              if (!existingFlag) {
                throw new common_1.NotFoundException(
                  "Feature flag with ID '".concat(id, "' not found"),
                );
              }
              // Skip if the flag is already in the desired state
              if (existingFlag.enabled === toggleDTO.enabled) {
                return [2 /*return*/, existingFlag];
              }
              return [
                4 /*yield*/,
                this.featureFlagRepository.toggleFlag(id, toggleDTO.enabled),
              ];
            case 2:
              updatedFlag = _a.sent();
              // Log the toggle in the audit log
              return [
                4 /*yield*/,
                this.auditLogRepository.create({
                  flagId: updatedFlag.id,
                  flagKey: updatedFlag.key,
                  action: "toggled",
                  performedBy: userId,
                  timestamp: firestore_1.Timestamp.now(),
                  changes: [
                    {
                      field: "enabled",
                      oldValue: existingFlag.enabled,
                      newValue: toggleDTO.enabled,
                    },
                  ],
                }),
              ];
            case 3:
              // Log the toggle in the audit log
              _a.sent();
              // Update the cache and notify subscribers
              this.flagCache.set(updatedFlag.key, updatedFlag);
              this.notifyFlagChange(updatedFlag.key, updatedFlag.enabled);
              return [2 /*return*/, updatedFlag];
          }
        });
      });
    };
    /**
     * Delete a feature flag
     */
    FeatureFlagService_1.prototype.deleteFlag = function (id, userId) {
      return __awaiter(this, void 0, void 0, function () {
        var existingFlag;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [4 /*yield*/, this.featureFlagRepository.findById(id)];
            case 1:
              existingFlag = _a.sent();
              if (!existingFlag) {
                throw new common_1.NotFoundException(
                  "Feature flag with ID '".concat(id, "' not found"),
                );
              }
              // Delete the flag
              return [4 /*yield*/, this.featureFlagRepository.delete(id)];
            case 2:
              // Delete the flag
              _a.sent();
              // Log the deletion in the audit log
              return [
                4 /*yield*/,
                this.auditLogRepository.create({
                  flagId: existingFlag.id,
                  flagKey: existingFlag.key,
                  action: "deleted",
                  performedBy: userId,
                  timestamp: firestore_1.Timestamp.now(),
                  changes: [
                    {
                      field: "all",
                      oldValue: existingFlag,
                      newValue: null,
                    },
                  ],
                }),
              ];
            case 3:
              // Log the deletion in the audit log
              _a.sent();
              // Update the cache and notify subscribers
              this.flagCache.delete(existingFlag.key);
              this.notifyFlagChange(existingFlag.key, false);
              return [2 /*return*/, true];
          }
        });
      });
    };
    /**
     * Get a feature flag by ID
     */
    FeatureFlagService_1.prototype.getFlagById = function (id) {
      return __awaiter(this, void 0, void 0, function () {
        var flag;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [4 /*yield*/, this.featureFlagRepository.findById(id)];
            case 1:
              flag = _a.sent();
              if (!flag) {
                throw new common_1.NotFoundException(
                  "Feature flag with ID '".concat(id, "' not found"),
                );
              }
              return [2 /*return*/, flag];
          }
        });
      });
    };
    /**
     * Get a feature flag by key
     */
    FeatureFlagService_1.prototype.getFlagByKey = function (key) {
      return __awaiter(this, void 0, void 0, function () {
        var cachedFlag, flag;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              // Try to get from cache first
              if (this.flagCache.has(key)) {
                cachedFlag = this.flagCache.get(key);
                if (cachedFlag) {
                  return [2 /*return*/, cachedFlag];
                }
              }
              return [4 /*yield*/, this.featureFlagRepository.findByKey(key)];
            case 1:
              flag = _a.sent();
              if (!flag) {
                throw new common_1.NotFoundException(
                  "Feature flag with key '".concat(key, "' not found"),
                );
              }
              // Update cache with the retrieved flag
              this.flagCache.set(key, flag);
              return [2 /*return*/, flag];
          }
        });
      });
    };
    /**
     * List all feature flags, optionally filtered by environment
     */
    FeatureFlagService_1.prototype.getAllFlags = function (environment) {
      return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          if (environment) {
            return [
              2 /*return*/,
              this.featureFlagRepository.findByEnvironment(environment),
            ];
          }
          return [2 /*return*/, this.featureFlagRepository.findAll()];
        });
      });
    };
    /**
     * Evaluate a feature flag based on context
     */
    FeatureFlagService_1.prototype.evaluateFlag = function (flagKey, context) {
      return __awaiter(this, void 0, void 0, function () {
        var flag,
          cachedFlag,
          now,
          isWithinRecurrence,
          hashInput,
          hash,
          normalizedHash,
          isEnabled,
          isUserTargeted,
          _a,
          userIds,
          userRoles,
          userEmails,
          isOrgTargeted,
          _b,
          organizationIds,
          organizationTypes,
          error_1;
        return __generator(this, function (_c) {
          switch (_c.label) {
            case 0:
              _c.trys.push([0, 3, , 4]);
              flag = null;
              if (this.flagCache.has(flagKey)) {
                cachedFlag = this.flagCache.get(flagKey);
                if (cachedFlag) {
                  flag = cachedFlag;
                }
              }
              if (!!flag) return [3 /*break*/, 2];
              return [
                4 /*yield*/,
                this.featureFlagRepository.findByKey(flagKey),
              ];
            case 1:
              flag = _c.sent();
              if (flag) {
                this.flagCache.set(flagKey, flag);
              }
              _c.label = 2;
            case 2:
              // If flag doesn't exist, return default disabled result
              if (!flag) {
                return [
                  2 /*return*/,
                  {
                    flagKey: flagKey,
                    enabled: false,
                    source: "error",
                    timestamp: new Date(),
                    reason: "Flag not found",
                  },
                ];
              }
              // If flag is disabled, short-circuit the evaluation
              if (!flag.enabled) {
                return [
                  2 /*return*/,
                  {
                    flagKey: flagKey,
                    enabled: false,
                    source: "evaluation",
                    timestamp: new Date(),
                    reason: "Flag is disabled",
                  },
                ];
              }
              // Check environment restrictions
              if (
                flag.environments &&
                flag.environments.length > 0 &&
                context.environment
              ) {
                if (
                  !flag.environments.includes(context.environment) &&
                  !flag.environments.includes(types_1.Environment.ALL)
                ) {
                  return [
                    2 /*return*/,
                    {
                      flagKey: flagKey,
                      enabled: flag.defaultValue,
                      source: "default",
                      timestamp: new Date(),
                      reason: "Environment mismatch",
                    },
                  ];
                }
              }
              // Check schedule constraints
              if (
                flag.type === types_1.FeatureFlagType.SCHEDULED &&
                flag.schedule
              ) {
                now = context.currentDate || new Date();
                // Check date range
                if (
                  flag.schedule.startDate &&
                  new Date(flag.schedule.startDate) > now
                ) {
                  return [
                    2 /*return*/,
                    {
                      flagKey: flagKey,
                      enabled: flag.defaultValue,
                      source: "default",
                      timestamp: new Date(),
                      reason: "Scheduled start date not reached",
                    },
                  ];
                }
                if (
                  flag.schedule.endDate &&
                  new Date(flag.schedule.endDate) < now
                ) {
                  return [
                    2 /*return*/,
                    {
                      flagKey: flagKey,
                      enabled: flag.defaultValue,
                      source: "default",
                      timestamp: new Date(),
                      reason: "Scheduled end date passed",
                    },
                  ];
                }
                // Check recurrence if specified
                if (flag.schedule.recurrence) {
                  isWithinRecurrence = this.checkRecurrenceSchedule(
                    now,
                    flag.schedule,
                  );
                  if (!isWithinRecurrence) {
                    return [
                      2 /*return*/,
                      {
                        flagKey: flagKey,
                        enabled: flag.defaultValue,
                        source: "default",
                        timestamp: new Date(),
                        reason: "Outside of scheduled recurrence window",
                      },
                    ];
                  }
                }
              }
              // Evaluate based on flag type
              switch (flag.type) {
                case types_1.FeatureFlagType.BOOLEAN:
                  // Simple boolean flag
                  return [
                    2 /*return*/,
                    {
                      flagKey: flagKey,
                      enabled: true,
                      source: "evaluation",
                      timestamp: new Date(),
                      reason: "Boolean flag enabled",
                    },
                  ];
                case types_1.FeatureFlagType.PERCENTAGE:
                  // Percentage rollout
                  if (!flag.percentage) {
                    return [
                      2 /*return*/,
                      {
                        flagKey: flagKey,
                        enabled: flag.defaultValue,
                        source: "default",
                        timestamp: new Date(),
                        reason: "Percentage not set",
                      },
                    ];
                  }
                  hashInput = flagKey;
                  if (context.userId) {
                    hashInput += context.userId;
                  } else if (context.userEmail) {
                    hashInput += context.userEmail;
                  } else if (context.organizationId) {
                    hashInput += context.organizationId;
                  }
                  hash = this.hashString(hashInput);
                  normalizedHash = hash % 100;
                  isEnabled = normalizedHash < flag.percentage;
                  return [
                    2 /*return*/,
                    {
                      flagKey: flagKey,
                      enabled: isEnabled,
                      source: "evaluation",
                      timestamp: new Date(),
                      reason: "Percentage rollout: "
                        .concat(normalizedHash, "% (threshold: ")
                        .concat(flag.percentage, "%)"),
                    },
                  ];
                case types_1.FeatureFlagType.USER_TARGETED:
                  // User targeting
                  if (!flag.userTargeting) {
                    return [
                      2 /*return*/,
                      {
                        flagKey: flagKey,
                        enabled: flag.defaultValue,
                        source: "default",
                        timestamp: new Date(),
                        reason: "User targeting not configured",
                      },
                    ];
                  }
                  isUserTargeted = false;
                  (_a = flag.userTargeting),
                    (userIds = _a.userIds),
                    (userRoles = _a.userRoles),
                    (userEmails = _a.userEmails);
                  // Check user ID targeting
                  if (
                    context.userId &&
                    userIds &&
                    userIds.includes(context.userId)
                  ) {
                    isUserTargeted = true;
                  }
                  // Check role targeting
                  if (
                    context.userRole &&
                    userRoles &&
                    userRoles.includes(context.userRole)
                  ) {
                    isUserTargeted = true;
                  }
                  // Check email targeting
                  if (
                    context.userEmail &&
                    userEmails &&
                    userEmails.includes(context.userEmail)
                  ) {
                    isUserTargeted = true;
                  }
                  return [
                    2 /*return*/,
                    {
                      flagKey: flagKey,
                      enabled: isUserTargeted,
                      source: "evaluation",
                      timestamp: new Date(),
                      reason: isUserTargeted
                        ? "User is in target group"
                        : "User is not in target group",
                    },
                  ];
                case types_1.FeatureFlagType.ORGANIZATION_TARGETED:
                  // Organization targeting
                  if (!flag.organizationTargeting) {
                    return [
                      2 /*return*/,
                      {
                        flagKey: flagKey,
                        enabled: flag.defaultValue,
                        source: "default",
                        timestamp: new Date(),
                        reason: "Organization targeting not configured",
                      },
                    ];
                  }
                  isOrgTargeted = false;
                  (_b = flag.organizationTargeting),
                    (organizationIds = _b.organizationIds),
                    (organizationTypes = _b.organizationTypes);
                  // Check organization ID targeting
                  if (
                    context.organizationId &&
                    organizationIds &&
                    organizationIds.includes(context.organizationId)
                  ) {
                    isOrgTargeted = true;
                  }
                  // Check organization type targeting
                  if (
                    context.organizationType &&
                    organizationTypes &&
                    organizationTypes.includes(context.organizationType)
                  ) {
                    isOrgTargeted = true;
                  }
                  return [
                    2 /*return*/,
                    {
                      flagKey: flagKey,
                      enabled: isOrgTargeted,
                      source: "evaluation",
                      timestamp: new Date(),
                      reason: isOrgTargeted
                        ? "Organization is in target group"
                        : "Organization is not in target group",
                    },
                  ];
                default:
                  return [
                    2 /*return*/,
                    {
                      flagKey: flagKey,
                      enabled: flag.defaultValue,
                      source: "default",
                      timestamp: new Date(),
                      reason: "Unknown flag type: ".concat(flag.type),
                    },
                  ];
              }
              return [3 /*break*/, 4];
            case 3:
              error_1 = _c.sent();
              this.logger.error(
                "Error evaluating flag ".concat(flagKey, ":"),
                error_1,
              );
              return [
                2 /*return*/,
                {
                  flagKey: flagKey,
                  enabled: false, // Safe default
                  source: "error",
                  timestamp: new Date(),
                  reason: "Evaluation error: ".concat(error_1.message),
                },
              ];
            case 4:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Check if a feature flag is enabled for the given context
     */
    FeatureFlagService_1.prototype.isEnabled = function (flagKey, context) {
      return __awaiter(this, void 0, void 0, function () {
        var result, error_2;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 2, , 3]);
              return [4 /*yield*/, this.evaluateFlag(flagKey, context)];
            case 1:
              result = _a.sent();
              return [2 /*return*/, result.enabled];
            case 2:
              error_2 = _a.sent();
              this.logger.error(
                "Error checking if flag ".concat(flagKey, " is enabled:"),
                error_2,
              );
              return [2 /*return*/, false]; // Safe default
            case 3:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Get flag audit logs
     */
    FeatureFlagService_1.prototype.getAuditLogs = function (flagId) {
      return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          return [2 /*return*/, this.auditLogRepository.findByFlagId(flagId)];
        });
      });
    };
    /**
     * Subscribe to flag changes
     */
    FeatureFlagService_1.prototype.addFlagChangeListener = function (callback) {
      this.flagChangeListeners.push(callback);
    };
    /**
     * Remove a flag change subscription
     */
    FeatureFlagService_1.prototype.removeFlagChangeListener = function (
      callback,
    ) {
      var index = this.flagChangeListeners.indexOf(callback);
      if (index !== -1) {
        this.flagChangeListeners.splice(index, 1);
      }
    };
    /**
     * Subscribe to multiple flag changes at once
     */
    FeatureFlagService_1.prototype.subscribe = function (subscription) {
      var _this = this;
      this.subscriptions.add(subscription);
      // Immediately evaluate the flags for this subscription
      this.evaluateFlagsForSubscription(subscription);
      // Return an unsubscribe function
      return function () {
        _this.subscriptions.delete(subscription);
      };
    };
    /**
     * Validate flag data based on its type
     */
    FeatureFlagService_1.prototype.validateFlagData = function (flagDTO) {
      // Validate key format (lowercase, alphanumeric with hyphens)
      if (!/^[a-z0-9-]+$/.test(flagDTO.key)) {
        throw new common_1.BadRequestException(
          "Flag key must be lowercase alphanumeric with hyphens only",
        );
      }
      // Type-specific validation
      switch (flagDTO.type) {
        case types_1.FeatureFlagType.PERCENTAGE:
          if (
            flagDTO.percentage === undefined ||
            flagDTO.percentage < 0 ||
            flagDTO.percentage > 100
          ) {
            throw new common_1.BadRequestException(
              "Percentage flags require a percentage value between 0-100",
            );
          }
          break;
        case types_1.FeatureFlagType.USER_TARGETED:
          if (
            !flagDTO.userTargeting ||
            (!flagDTO.userTargeting.userIds &&
              !flagDTO.userTargeting.userRoles &&
              !flagDTO.userTargeting.userEmails)
          ) {
            throw new common_1.BadRequestException(
              "User-targeted flags require user targeting configuration",
            );
          }
          break;
        case types_1.FeatureFlagType.ORGANIZATION_TARGETED:
          if (
            !flagDTO.organizationTargeting ||
            (!flagDTO.organizationTargeting.organizationIds &&
              !flagDTO.organizationTargeting.organizationTypes)
          ) {
            throw new common_1.BadRequestException(
              "Organization-targeted flags require organization targeting configuration",
            );
          }
          break;
        case types_1.FeatureFlagType.SCHEDULED:
          if (
            !flagDTO.schedule ||
            (!flagDTO.schedule.startDate &&
              !flagDTO.schedule.endDate &&
              !flagDTO.schedule.recurrence)
          ) {
            throw new common_1.BadRequestException(
              "Scheduled flags require schedule configuration",
            );
          }
          break;
      }
    };
    /**
     * Check if current time is within a recurrence schedule
     */
    FeatureFlagService_1.prototype.checkRecurrenceSchedule = function (
      now,
      schedule,
    ) {
      if (!schedule.recurrence) return true;
      // For 'once' type, we only need to check the date range, which is already done
      if (schedule.recurrence.type === "once") return true;
      // Check day of week for weekly recurrence
      if (
        schedule.recurrence.type === "weekly" &&
        schedule.recurrence.daysOfWeek &&
        schedule.recurrence.daysOfWeek.length > 0
      ) {
        var currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
        if (!schedule.recurrence.daysOfWeek.includes(currentDay)) {
          return false;
        }
      }
      // Check time ranges if specified
      if (
        schedule.recurrence.timeRanges &&
        schedule.recurrence.timeRanges.length > 0
      ) {
        var currentHour = now.getHours();
        var currentMinute = now.getMinutes();
        var currentTimeMinutes_1 = currentHour * 60 + currentMinute;
        // Check if the current time falls within any of the time ranges
        return schedule.recurrence.timeRanges.some(function (range) {
          var _a = range.startTime.split(":").map(Number),
            startHour = _a[0],
            startMinute = _a[1];
          var _b = range.endTime.split(":").map(Number),
            endHour = _b[0],
            endMinute = _b[1];
          var startTimeMinutes = startHour * 60 + startMinute;
          var endTimeMinutes = endHour * 60 + endMinute;
          return (
            currentTimeMinutes_1 >= startTimeMinutes &&
            currentTimeMinutes_1 <= endTimeMinutes
          );
        });
      }
      return true;
    };
    /**
     * Hash a string to a number (for percentage-based flags)
     */
    FeatureFlagService_1.prototype.hashString = function (str) {
      var hash = 0;
      for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash);
    };
    /**
     * Notify listeners about a flag change
     */
    FeatureFlagService_1.prototype.notifyFlagChange = function (
      flagKey,
      isEnabled,
    ) {
      var _this = this;
      // Notify specific flag listeners
      this.flagChangeListeners.forEach(function (listener) {
        try {
          listener(flagKey, isEnabled);
        } catch (error) {
          _this.logger.error("Error in flag change listener:", error);
        }
      });
      // Notify subscriptions
      this.notifySubscribers();
    };
    /**
     * Notify all subscriptions about their relevant flags
     */
    FeatureFlagService_1.prototype.notifySubscribers = function () {
      var _this = this;
      Array.from(this.subscriptions).forEach(function (subscription) {
        _this.evaluateFlagsForSubscription(subscription);
      });
    };
    /**
     * Evaluate all flags for a specific subscription
     */
    FeatureFlagService_1.prototype.evaluateFlagsForSubscription = function (
      subscription,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var result, _i, _a, flagKey, evaluation, error_3;
        return __generator(this, function (_b) {
          switch (_b.label) {
            case 0:
              _b.trys.push([0, 5, , 6]);
              result = {};
              (_i = 0), (_a = subscription.flagKeys);
              _b.label = 1;
            case 1:
              if (!(_i < _a.length)) return [3 /*break*/, 4];
              flagKey = _a[_i];
              return [
                4 /*yield*/,
                this.evaluateFlag(
                  flagKey,
                  subscription.evaluationContext || {},
                ),
              ];
            case 2:
              evaluation = _b.sent();
              result[flagKey] = evaluation.enabled;
              _b.label = 3;
            case 3:
              _i++;
              return [3 /*break*/, 1];
            case 4:
              // Notify the subscriber
              subscription.callback(result);
              return [3 /*break*/, 6];
            case 5:
              error_3 = _b.sent();
              this.logger.error(
                "Error evaluating flags for subscription:",
                error_3,
              );
              return [3 /*break*/, 6];
            case 6:
              return [2 /*return*/];
          }
        });
      });
    };
    return FeatureFlagService_1;
  })());
  __setFunctionName(_classThis, "FeatureFlagService");
  (function () {
    var _metadata =
      typeof Symbol === "function" && Symbol.metadata
        ? Object.create(null)
        : void 0;
    __esDecorate(
      null,
      (_classDescriptor = { value: _classThis }),
      _classDecorators,
      { kind: "class", name: _classThis.name, metadata: _metadata },
      null,
      _classExtraInitializers,
    );
    FeatureFlagService = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (FeatureFlagService = _classThis);
})();
exports.FeatureFlagService = FeatureFlagService;
