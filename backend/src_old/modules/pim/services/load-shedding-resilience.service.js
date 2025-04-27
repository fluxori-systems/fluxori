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
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadSheddingResilienceService = void 0;
/**
 * Load Shedding Resilience Service for PIM Module
 *
 * This service provides patterns and utilities for making the PIM module
 * resilient to load shedding (scheduled power outages) in South Africa.
 */
var common_1 = require("@nestjs/common");
/**
 * Load Shedding Resilience Service
 *
 * Provides patterns for making operations resilient to power outages,
 * including operation queueing, data caching, and recovery mechanisms.
 */
var LoadSheddingResilienceService = (function () {
  var _classDecorators = [(0, common_1.Injectable)()];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var LoadSheddingResilienceService = (_classThis = /** @class */ (function () {
    function LoadSheddingResilienceService_1(
      configService,
      featureFlagService,
      marketContextService,
    ) {
      this.configService = configService;
      this.featureFlagService = featureFlagService;
      this.marketContextService = marketContextService;
      this.logger = new common_1.Logger(LoadSheddingResilienceService.name);
      /**
       * Queue of operations to process
       */
      this.operationQueue = [];
      /**
       * Whether the queue is currently being processed
       */
      this.isProcessingQueue = false;
      /**
       * Current load shedding info
       */
      this.loadSheddingInfo = {
        stage: 0,
        active: false,
      };
      /**
       * Interval for processing the queue
       */
      this.processingInterval = null;
      /**
       * Interval for checking load shedding status
       */
      this.checkInterval = null;
      /**
       * Local in-memory cache
       */
      this.localCache = new Map();
    }
    /**
     * Initialize the service on module initialization
     */
    LoadSheddingResilienceService_1.prototype.onModuleInit = function () {
      return __awaiter(this, void 0, void 0, function () {
        var isLoadSheddingEnabled, queueIntervalMs, checkIntervalMs;
        var _this = this;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                this.featureFlagService.isEnabled(
                  "pim.loadSheddingResilience",
                  {
                    attributes: { defaultValue: true }, // Default to enabled if no flag exists
                  },
                ),
              ];
            case 1:
              isLoadSheddingEnabled = _a.sent();
              if (!isLoadSheddingEnabled) return [3 /*break*/, 3];
              this.logger.log("Load shedding resilience enabled");
              queueIntervalMs =
                this.configService.get("LOAD_SHEDDING_QUEUE_INTERVAL_MS") ||
                30000;
              this.processingInterval = setInterval(function () {
                return _this.processQueue();
              }, queueIntervalMs);
              checkIntervalMs =
                this.configService.get("LOAD_SHEDDING_CHECK_INTERVAL_MS") ||
                300000;
              this.checkInterval = setInterval(function () {
                return _this.updateLoadSheddingStatus();
              }, checkIntervalMs);
              // Initial load shedding status check
              return [4 /*yield*/, this.updateLoadSheddingStatus()];
            case 2:
              // Initial load shedding status check
              _a.sent();
              return [3 /*break*/, 4];
            case 3:
              this.logger.log("Load shedding resilience disabled");
              _a.label = 4;
            case 4:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Update load shedding status from external source
     * In a production environment, this would connect to:
     * - EskomSePush API
     * - Local power utility API
     * - Other load shedding information service
     */
    LoadSheddingResilienceService_1.prototype.updateLoadSheddingStatus =
      function () {
        return __awaiter(this, void 0, void 0, function () {
          var simulatedSchedule, error_1;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                _a.trys.push([0, 3, , 4]);
                simulatedSchedule = {
                  stage: 0, // 0-8, where 0 means no load shedding
                  area: "Area 7",
                  startTime: new Date(),
                  endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
                  active: false,
                };
                // Update internal state
                this.loadSheddingInfo = {
                  stage: simulatedSchedule.stage,
                  active: simulatedSchedule.active,
                  nextStartTime:
                    simulatedSchedule.stage > 0
                      ? simulatedSchedule.startTime
                      : undefined,
                  nextEndTime:
                    simulatedSchedule.stage > 0
                      ? simulatedSchedule.endTime
                      : undefined,
                  areaCode: "Area 7",
                  areaName: "Johannesburg North",
                };
                // Log current status
                this.logger.debug(
                  "Load shedding status: Stage "
                    .concat(this.loadSheddingInfo.stage, ", Active: ")
                    .concat(this.loadSheddingInfo.active),
                );
                if (
                  !(
                    !this.loadSheddingInfo.active &&
                    this.operationQueue.length > 0 &&
                    !this.isProcessingQueue
                  )
                )
                  return [3 /*break*/, 2];
                return [4 /*yield*/, this.processQueue()];
              case 1:
                _a.sent();
                _a.label = 2;
              case 2:
                return [3 /*break*/, 4];
              case 3:
                error_1 = _a.sent();
                this.logger.error(
                  "Error updating load shedding status: ".concat(
                    error_1 instanceof Error
                      ? error_1.message
                      : String(error_1),
                  ),
                );
                return [3 /*break*/, 4];
              case 4:
                return [2 /*return*/];
            }
          });
        });
      };
    /**
     * Enqueue an operation for resilient execution
     *
     * @param type Operation type
     * @param params Operation parameters
     * @param callback Function to execute
     * @param options Additional options
     * @returns Operation ID
     */
    LoadSheddingResilienceService_1.prototype.enqueueOperation = function (
      type_1,
      params_1,
      callback_1,
    ) {
      return __awaiter(
        this,
        arguments,
        void 0,
        function (type, params, callback, options) {
          var id;
          var _this = this;
          if (options === void 0) {
            options = {};
          }
          return __generator(this, function (_a) {
            id = "op_"
              .concat(Date.now(), "_")
              .concat(Math.random().toString(36).substring(2, 10));
            this.operationQueue.push({
              id: id,
              type: type,
              params: params,
              callback: callback,
              retries: 0,
              maxRetries: options.maxRetries || 5,
              createdAt: new Date(),
              priority: options.priority || 5, // Default priority (1-10, 1 is highest)
            });
            this.logger.log(
              "Enqueued operation "
                .concat(id, " of type ")
                .concat(type, " with priority ")
                .concat(options.priority || 5),
            );
            // If we're not in load shedding and not already processing, trigger processing
            if (!this.loadSheddingInfo.active && !this.isProcessingQueue) {
              setImmediate(function () {
                return _this.processQueue();
              });
            }
            return [2 /*return*/, id];
          });
        },
      );
    };
    /**
     * Process the operation queue
     * Executes operations based on priority and load shedding status
     */
    LoadSheddingResilienceService_1.prototype.processQueue = function () {
      return __awaiter(this, void 0, void 0, function () {
        var criticalOnly,
          sortedQueue,
          batchSize,
          batch_1,
          results,
          completedIds_1,
          error_2;
        var _this = this;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              if (this.isProcessingQueue || this.operationQueue.length === 0) {
                return [2 /*return*/];
              }
              // If load shedding is active, only process critical operations
              if (this.loadSheddingInfo.active) {
                criticalOnly = this.operationQueue.filter(function (op) {
                  return op.priority <= 3;
                });
                if (criticalOnly.length === 0) {
                  this.logger.log(
                    "Load shedding active, no critical operations to process",
                  );
                  return [2 /*return*/];
                }
              }
              this.isProcessingQueue = true;
              _a.label = 1;
            case 1:
              _a.trys.push([1, 3, 4, 5]);
              sortedQueue = __spreadArray([], this.operationQueue, true).sort(
                function (a, b) {
                  return a.priority - b.priority;
                },
              );
              batchSize = this.loadSheddingInfo.active ? 3 : 10;
              batch_1 = sortedQueue.slice(0, batchSize);
              this.logger.log(
                "Processing "
                  .concat(batch_1.length, " operations from queue (")
                  .concat(this.operationQueue.length, " total)"),
              );
              return [
                4 /*yield*/,
                Promise.allSettled(
                  batch_1.map(function (op) {
                    return _this.executeOperation(op);
                  }),
                ),
              ];
            case 2:
              results = _a.sent();
              completedIds_1 = results
                .map(function (result, index) {
                  return result.status === "fulfilled" && result.value
                    ? batch_1[index].id
                    : null;
                })
                .filter(function (id) {
                  return id !== null;
                });
              this.operationQueue = this.operationQueue.filter(function (op) {
                return !completedIds_1.includes(op.id);
              });
              this.logger.log(
                "Completed "
                  .concat(completedIds_1.length, " operations, ")
                  .concat(this.operationQueue.length, " remaining in queue"),
              );
              return [3 /*break*/, 5];
            case 3:
              error_2 = _a.sent();
              this.logger.error(
                "Error processing operation queue: ".concat(
                  error_2 instanceof Error ? error_2.message : String(error_2),
                ),
              );
              return [3 /*break*/, 5];
            case 4:
              this.isProcessingQueue = false;
              return [7 /*endfinally*/];
            case 5:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Execute a single operation with retry logic
     *
     * @param operation Operation to execute
     * @returns Whether the operation completed successfully
     */
    LoadSheddingResilienceService_1.prototype.executeOperation = function (
      operation,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 2, , 3]);
              operation.lastRetryAt = new Date();
              operation.retries++;
              // Execute the operation
              return [4 /*yield*/, operation.callback(operation.params)];
            case 1:
              // Execute the operation
              _a.sent();
              this.logger.log(
                "Successfully executed operation "
                  .concat(operation.id, " of type ")
                  .concat(operation.type),
              );
              return [2 /*return*/, true];
            case 2:
              error_3 = _a.sent();
              // Log the error
              this.logger.error(
                "Error executing operation "
                  .concat(operation.id, " of type ")
                  .concat(operation.type, ": ")
                  .concat(
                    error_3 instanceof Error
                      ? error_3.message
                      : String(error_3),
                  ),
              );
              // Check if we should retry
              if (operation.retries < operation.maxRetries) {
                this.logger.log(
                  "Operation "
                    .concat(operation.id, " will be retried (")
                    .concat(operation.retries, "/")
                    .concat(operation.maxRetries, ")"),
                );
                return [2 /*return*/, false]; // Keep in queue for retry
              } else {
                this.logger.warn(
                  "Operation "
                    .concat(operation.id, " failed after ")
                    .concat(
                      operation.retries,
                      " retries and will be removed from queue",
                    ),
                );
                return [2 /*return*/, true]; // Remove from queue
              }
              return [3 /*break*/, 3];
            case 3:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Execute an operation with load shedding resilience
     * If load shedding is active, the operation will be queued for later execution
     *
     * @param type Operation type
     * @param params Operation parameters
     * @param callback Function to execute
     * @param options Additional options
     * @returns Operation result or undefined if queued
     */
    LoadSheddingResilienceService_1.prototype.executeWithResilience = function (
      type_1,
      params_1,
      callback_1,
    ) {
      return __awaiter(
        this,
        arguments,
        void 0,
        function (type, params, callback, options) {
          var cached, executeImmediately, result, error_4;
          var _this = this;
          if (options === void 0) {
            options = {};
          }
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                // Check cache first if cache key is provided
                if (options.cacheKey) {
                  cached = this.getFromCache(options.cacheKey);
                  if (cached) {
                    this.logger.debug(
                      "Cache hit for key ".concat(options.cacheKey),
                    );
                    return [2 /*return*/, cached];
                  }
                }
                executeImmediately =
                  options.executeImmediatelyIfPossible !== false &&
                  (!this.loadSheddingInfo.active || options.priority === 1);
                if (!executeImmediately) return [3 /*break*/, 6];
                _a.label = 1;
              case 1:
                _a.trys.push([1, 3, , 5]);
                return [4 /*yield*/, callback(params)];
              case 2:
                result = _a.sent();
                // Cache result if cache key is provided
                if (options.cacheKey) {
                  this.addToCache(options.cacheKey, result, options.cacheTtlMs);
                }
                return [2 /*return*/, result];
              case 3:
                error_4 = _a.sent();
                // If execution fails, queue for retry
                this.logger.warn(
                  "Operation "
                    .concat(type, " failed with error: ")
                    .concat(
                      error_4 instanceof Error
                        ? error_4.message
                        : String(error_4),
                      ". Queueing for retry.",
                    ),
                );
                return [
                  4 /*yield*/,
                  this.enqueueOperation(type, params, callback, {
                    priority: options.priority,
                    maxRetries: options.maxRetries,
                  }),
                ];
              case 4:
                _a.sent();
                return [2 /*return*/, undefined];
              case 5:
                return [3 /*break*/, 8];
              case 6:
                // Queue for later execution
                return [
                  4 /*yield*/,
                  this.enqueueOperation(
                    type,
                    params,
                    function (p) {
                      return __awaiter(_this, void 0, void 0, function () {
                        var result;
                        return __generator(this, function (_a) {
                          switch (_a.label) {
                            case 0:
                              return [4 /*yield*/, callback(p)];
                            case 1:
                              result = _a.sent();
                              // Cache result if cache key is provided
                              if (options.cacheKey) {
                                this.addToCache(
                                  options.cacheKey,
                                  result,
                                  options.cacheTtlMs,
                                );
                              }
                              return [2 /*return*/, result];
                          }
                        });
                      });
                    },
                    {
                      priority: options.priority,
                      maxRetries: options.maxRetries,
                    },
                  ),
                ];
              case 7:
                // Queue for later execution
                _a.sent();
                return [2 /*return*/, undefined];
              case 8:
                return [2 /*return*/];
            }
          });
        },
      );
    };
    /**
     * Execute a batch of operations with load shedding resilience
     * This method processes a collection of items in batches, with retry logic and
     * pauses between batches to avoid overloading systems during load shedding
     *
     * @param items Collection of items to process
     * @param callback Function to execute for each item
     * @param options Batch execution options
     * @returns Information about the batch processing
     */
    LoadSheddingResilienceService_1.prototype.executeBatchWithResilience =
      function (items_1, callback_1) {
        return __awaiter(
          this,
          arguments,
          void 0,
          function (items, callback, options) {
            var batchSize,
              pauseAfterBatch_1,
              retryCount_1,
              retryDelay_1,
              continueOnError,
              processed_1,
              succeeded_1,
              failed_1,
              results,
              i,
              batch,
              loadSheddingStatus,
              batchPromises,
              batchResults,
              error_5;
            var _this = this;
            if (options === void 0) {
              options = {};
            }
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  _a.trys.push([0, 9, , 10]);
                  batchSize = options.batchSize || 10;
                  pauseAfterBatch_1 = options.pauseAfterBatch || 1000;
                  retryCount_1 = options.retryCount || 2;
                  retryDelay_1 = options.retryDelay || 3000;
                  continueOnError = options.continueOnError !== false;
                  processed_1 = 0;
                  succeeded_1 = 0;
                  failed_1 = 0;
                  results = [];
                  i = 0;
                  _a.label = 1;
                case 1:
                  if (!(i < items.length)) return [3 /*break*/, 8];
                  batch = items.slice(i, i + batchSize);
                  this.logger.log(
                    "Processing batch "
                      .concat(Math.floor(i / batchSize) + 1, " of ")
                      .concat(Math.ceil(items.length / batchSize)),
                  );
                  return [4 /*yield*/, this.getLoadSheddingInfo()];
                case 2:
                  loadSheddingStatus = _a.sent();
                  if (
                    !(loadSheddingStatus.active && loadSheddingStatus.stage > 4)
                  )
                    return [3 /*break*/, 4];
                  // Skip processing during severe load shedding
                  this.logger.warn(
                    "Pausing batch processing due to load shedding stage ".concat(
                      loadSheddingStatus.stage,
                    ),
                  );
                  // Wait for some time and then check again
                  return [
                    4 /*yield*/,
                    new Promise(function (resolve) {
                      return setTimeout(resolve, 60000);
                    }),
                  ];
                case 3:
                  // Wait for some time and then check again
                  _a.sent(); // 1 minute
                  // Go back one step in the loop to retry this batch
                  i -= batchSize;
                  return [3 /*break*/, 7];
                case 4:
                  batchPromises = batch.map(function (item) {
                    return __awaiter(_this, void 0, void 0, function () {
                      var retries, success, result, lastError, error_6;
                      return __generator(this, function (_a) {
                        switch (_a.label) {
                          case 0:
                            retries = 0;
                            success = false;
                            _a.label = 1;
                          case 1:
                            if (!(retries <= retryCount_1 && !success))
                              return [3 /*break*/, 8];
                            _a.label = 2;
                          case 2:
                            _a.trys.push([2, 6, , 7]);
                            if (!(retries > 0)) return [3 /*break*/, 4];
                            this.logger.log(
                              "Retry "
                                .concat(retries, "/")
                                .concat(retryCount_1, " for item"),
                            );
                            // Wait before retry
                            return [
                              4 /*yield*/,
                              new Promise(function (resolve) {
                                return setTimeout(resolve, retryDelay_1);
                              }),
                            ];
                          case 3:
                            // Wait before retry
                            _a.sent();
                            _a.label = 4;
                          case 4:
                            return [4 /*yield*/, callback(item)];
                          case 5:
                            result = _a.sent();
                            success = true;
                            return [3 /*break*/, 7];
                          case 6:
                            error_6 = _a.sent();
                            lastError =
                              error_6 instanceof Error
                                ? error_6
                                : new Error(String(error_6));
                            this.logger.warn(
                              "Error processing item (retry "
                                .concat(retries, "/")
                                .concat(retryCount_1, "): ")
                                .concat(lastError.message),
                            );
                            retries++;
                            return [3 /*break*/, 7];
                          case 7:
                            return [3 /*break*/, 1];
                          case 8:
                            // Update counters
                            processed_1++;
                            if (success) {
                              succeeded_1++;
                            } else {
                              failed_1++;
                            }
                            // Add to results
                            return [
                              2 /*return*/,
                              {
                                success: success,
                                item: item,
                                result: success ? result : undefined,
                                error: success ? undefined : lastError,
                              },
                            ];
                        }
                      });
                    });
                  });
                  return [4 /*yield*/, Promise.all(batchPromises)];
                case 5:
                  batchResults = _a.sent();
                  results.push.apply(results, batchResults);
                  // Check if we should continue after errors
                  if (
                    !continueOnError &&
                    batchResults.some(function (r) {
                      return !r.success;
                    })
                  ) {
                    this.logger.error(
                      "Stopping batch processing due to errors and continueOnError=false",
                    );
                    return [3 /*break*/, 8];
                  }
                  if (!(i + batchSize < items.length)) return [3 /*break*/, 7];
                  this.logger.debug(
                    "Pausing for ".concat(
                      pauseAfterBatch_1,
                      "ms between batches",
                    ),
                  );
                  return [
                    4 /*yield*/,
                    new Promise(function (resolve) {
                      return setTimeout(resolve, pauseAfterBatch_1);
                    }),
                  ];
                case 6:
                  _a.sent();
                  _a.label = 7;
                case 7:
                  i += batchSize;
                  return [3 /*break*/, 1];
                case 8:
                  return [
                    2 /*return*/,
                    {
                      processed: processed_1,
                      succeeded: succeeded_1,
                      failed: failed_1,
                      results: results,
                    },
                  ];
                case 9:
                  error_5 = _a.sent();
                  this.logger.error(
                    "Error in batch execution: ".concat(
                      error_5 instanceof Error
                        ? error_5.message
                        : String(error_5),
                    ),
                  );
                  throw error_5;
                case 10:
                  return [2 /*return*/];
              }
            });
          },
        );
      };
    /**
     * Get current load shedding information
     *
     * @returns Current load shedding status
     */
    LoadSheddingResilienceService_1.prototype.getLoadSheddingInfo =
      function () {
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            return [2 /*return*/, __assign({}, this.loadSheddingInfo)];
          });
        });
      };
    /**
     * Get current load shedding status (alias for getLoadSheddingInfo)
     *
     * @returns Current load shedding status
     */
    LoadSheddingResilienceService_1.prototype.getCurrentStatus = function () {
      return __awaiter(this, void 0, void 0, function () {
        var info;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [4 /*yield*/, this.getLoadSheddingInfo()];
            case 1:
              info = _a.sent();
              // Add currentStage field for backward compatibility
              return [
                2 /*return*/,
                __assign(__assign({}, info), { currentStage: info.stage }),
              ];
          }
        });
      });
    };
    /**
     * Check if load shedding is currently active
     *
     * @returns Whether load shedding is active
     */
    LoadSheddingResilienceService_1.prototype.isLoadSheddingActive =
      function () {
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            return [2 /*return*/, this.loadSheddingInfo.active];
          });
        });
      };
    /**
     * Get current load shedding stage
     *
     * @returns Current load shedding stage (0-8, where 0 means no load shedding)
     */
    LoadSheddingResilienceService_1.prototype.getLoadSheddingStage =
      function () {
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            return [2 /*return*/, this.loadSheddingInfo.stage];
          });
        });
      };
    /**
     * Get operation queue statistics
     *
     * @returns Queue statistics
     */
    LoadSheddingResilienceService_1.prototype.getQueueStats = function () {
      return __awaiter(this, void 0, void 0, function () {
        var operationsByType, operationsByPriority, _i, _a, op;
        return __generator(this, function (_b) {
          operationsByType = {};
          operationsByPriority = {};
          for (_i = 0, _a = this.operationQueue; _i < _a.length; _i++) {
            op = _a[_i];
            operationsByType[op.type] = (operationsByType[op.type] || 0) + 1;
            operationsByPriority[op.priority] =
              (operationsByPriority[op.priority] || 0) + 1;
          }
          return [
            2 /*return*/,
            {
              totalOperations: this.operationQueue.length,
              operationsByType: operationsByType,
              operationsByPriority: operationsByPriority,
            },
          ];
        });
      });
    };
    /**
     * Add an item to the cache
     *
     * @param key Cache key
     * @param data Data to cache
     * @param ttlMs Time to live in milliseconds
     */
    LoadSheddingResilienceService_1.prototype.addToCache = function (
      key,
      data,
      ttlMs,
    ) {
      var defaultTtlMs = 3600000; // 1 hour
      var expiresAt = new Date(Date.now() + (ttlMs || defaultTtlMs));
      this.localCache.set(key, { data: data, expiresAt: expiresAt });
      // Clean expired cache entries
      this.cleanCache();
    };
    /**
     * Get an item from the cache
     *
     * @param key Cache key
     * @returns Cached data or undefined if not found or expired
     */
    LoadSheddingResilienceService_1.prototype.getFromCache = function (key) {
      var cached = this.localCache.get(key);
      if (!cached) {
        return undefined;
      }
      // Check if expired
      if (cached.expiresAt < new Date()) {
        this.localCache.delete(key);
        return undefined;
      }
      return cached.data;
    };
    /**
     * Clean expired cache entries
     */
    LoadSheddingResilienceService_1.prototype.cleanCache = function () {
      var _this = this;
      var now = new Date();
      var keysToDelete = [];
      // First collect keys to delete
      this.localCache.forEach(function (value, key) {
        if (value.expiresAt < now) {
          keysToDelete.push(key);
        }
      });
      // Then delete them
      keysToDelete.forEach(function (key) {
        _this.localCache.delete(key);
      });
    };
    return LoadSheddingResilienceService_1;
  })());
  __setFunctionName(_classThis, "LoadSheddingResilienceService");
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
    LoadSheddingResilienceService = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (LoadSheddingResilienceService = _classThis);
})();
exports.LoadSheddingResilienceService = LoadSheddingResilienceService;
