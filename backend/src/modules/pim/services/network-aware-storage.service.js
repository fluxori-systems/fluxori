'use strict';
/**
 * Network-Aware Storage Service for PIM Module
 *
 * This service extends the standard storage service with network awareness
 * specifically optimized for South African market conditions, including
 * variable connection quality and load shedding resilience.
 */
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
Object.defineProperty(exports, '__esModule', { value: true });
exports.NetworkAwareStorageService = void 0;
var common_1 = require('@nestjs/common');
var image_model_1 = require('../models/image.model');
/**
 * Network-Aware Storage Service
 *
 * Provides storage functionality with adaptations for variable network quality
 * and resilience during load shedding incidents.
 */
var NetworkAwareStorageService = (function () {
  var _classDecorators = [(0, common_1.Injectable)()];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var NetworkAwareStorageService = (_classThis = /** @class */ (function () {
    function NetworkAwareStorageService_1(
      storageService,
      configService,
      featureFlagService,
      marketContextService,
    ) {
      this.storageService = storageService;
      this.configService = configService;
      this.featureFlagService = featureFlagService;
      this.marketContextService = marketContextService;
      this.logger = new common_1.Logger(NetworkAwareStorageService.name);
      this.operationQueue = [];
      this.isProcessingQueue = false;
      this.networkStatus = {
        connectionType: 'unknown',
        connectionQuality: 'medium',
        quality: 'medium',
      };
      this.loadSheddingActive = false;
      this.processingInterval = null;
    }
    /**
     * Initialize the service and start operation queue processing
     */
    NetworkAwareStorageService_1.prototype.onModuleInit = function () {
      return __awaiter(this, void 0, void 0, function () {
        var isLoadSheddingResilience,
          processingIntervalMs,
          networkCheckIntervalMs;
        var _this = this;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                this.featureFlagService.isEnabled(
                  'pim.loadSheddingResilience',
                  {
                    attributes: { defaultValue: true },
                  },
                ),
              ];
            case 1:
              isLoadSheddingResilience = _a.sent();
              if (!isLoadSheddingResilience) return [3 /*break*/, 3];
              this.logger.log(
                'Load shedding resilience enabled for NetworkAwareStorageService',
              );
              processingIntervalMs =
                this.configService.get('QUEUE_PROCESSING_INTERVAL_MS') || 30000;
              this.processingInterval = setInterval(function () {
                return _this.processQueue();
              }, processingIntervalMs);
              networkCheckIntervalMs =
                this.configService.get('NETWORK_CHECK_INTERVAL_MS') || 60000;
              setInterval(function () {
                return _this.updateNetworkStatus();
              }, networkCheckIntervalMs);
              // Initial network status check
              return [4 /*yield*/, this.updateNetworkStatus()];
            case 2:
              // Initial network status check
              _a.sent();
              return [3 /*break*/, 4];
            case 3:
              this.logger.log(
                'Load shedding resilience disabled for NetworkAwareStorageService',
              );
              _a.label = 4;
            case 4:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Update the current network status
     * In a real implementation, this would detect actual network conditions
     * For now, we'll use a placeholder implementation
     */
    NetworkAwareStorageService_1.prototype.updateNetworkStatus = function () {
      return __awaiter(this, void 0, void 0, function () {
        var simulatedNetworkStatus, error_1, errorMessage, errorStack;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 3, , 4]);
              simulatedNetworkStatus = {
                connectionType: 'wifi', // or 'cellular', 'ethernet'
                connectionQuality: 'medium', // 'high', 'medium', 'low'
                quality: 'medium', // For backward compatibility
                estimatedBandwidth: 2500, // Kbps
                latency: 200, // ms
                // We would get this from an external service in production
                loadSheddingStage: 0, // 0-8, where 0 means no load shedding
              };
              // Update internal network status
              this.networkStatus = simulatedNetworkStatus;
              // Update load shedding flag
              this.loadSheddingActive =
                (this.networkStatus.loadSheddingStage || 0) > 0;
              // Log current status (only when there's a change or every 5 minutes)
              this.logger.debug(
                'Network status: '.concat(JSON.stringify(this.networkStatus)),
              );
              if (
                !(
                  !this.loadSheddingActive &&
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
              errorMessage =
                error_1 instanceof Error ? error_1.message : String(error_1);
              errorStack = error_1 instanceof Error ? error_1.stack : undefined;
              this.logger.error(
                'Error updating network status: '.concat(errorMessage),
                errorStack,
              );
              return [3 /*break*/, 4];
            case 4:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Process the operation queue
     */
    NetworkAwareStorageService_1.prototype.processQueue = function () {
      return __awaiter(this, void 0, void 0, function () {
        var sortedQueue,
          batch_1,
          processingResults,
          _loop_1,
          this_1,
          i,
          error_2,
          errorMessage,
          errorStack;
        var _this = this;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              if (this.isProcessingQueue || this.operationQueue.length === 0) {
                return [2 /*return*/];
              }
              this.isProcessingQueue = true;
              _a.label = 1;
            case 1:
              _a.trys.push([1, 3, 4, 5]);
              sortedQueue = __spreadArray([], this.operationQueue, true).sort(
                function (a, b) {
                  if (a.priority !== b.priority) {
                    var priorityOrder = { high: 0, medium: 1, low: 2 };
                    return (
                      priorityOrder[a.priority] - priorityOrder[b.priority]
                    );
                  }
                  return a.createdAt.getTime() - b.createdAt.getTime();
                },
              );
              batch_1 = sortedQueue.slice(0, 5);
              return [
                4 /*yield*/,
                Promise.allSettled(
                  batch_1.map(function (entry) {
                    return _this.processQueueEntry(entry);
                  }),
                ),
              ];
            case 2:
              processingResults = _a.sent();
              _loop_1 = function (i) {
                var result = processingResults[i];
                if (result.status === 'fulfilled' && result.value) {
                  this_1.operationQueue = this_1.operationQueue.filter(
                    function (entry) {
                      return entry.id !== batch_1[i].id;
                    },
                  );
                }
              };
              this_1 = this;
              // Remove successfully processed operations
              for (i = 0; i < batch_1.length; i++) {
                _loop_1(i);
              }
              this.logger.log(
                'Processed '
                  .concat(batch_1.length, ' queued operations, ')
                  .concat(this.operationQueue.length, ' remaining'),
              );
              return [3 /*break*/, 5];
            case 3:
              error_2 = _a.sent();
              errorMessage =
                error_2 instanceof Error ? error_2.message : String(error_2);
              errorStack = error_2 instanceof Error ? error_2.stack : undefined;
              this.logger.error(
                'Error processing operation queue: '.concat(errorMessage),
                errorStack,
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
     * Process a single queued operation
     *
     * @param entry The queue entry to process
     * @returns Whether the operation was successful
     */
    NetworkAwareStorageService_1.prototype.processQueueEntry = function (
      entry,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var _a, error_3, maxRetries, errorMessage;
        return __generator(this, function (_b) {
          switch (_b.label) {
            case 0:
              _b.trys.push([0, 7, , 8]);
              // Update retry information
              entry.retries += 1;
              entry.lastRetry = new Date();
              _a = entry.operation;
              switch (_a) {
                case 'upload':
                  return [3 /*break*/, 1];
                case 'delete':
                  return [3 /*break*/, 3];
                case 'update':
                  return [3 /*break*/, 5];
              }
              return [3 /*break*/, 6];
            case 1:
              return [
                4 /*yield*/,
                this.storageService.uploadFile(
                  entry.params.file,
                  entry.params.filePath,
                  entry.params.options,
                ),
              ];
            case 2:
              _b.sent();
              return [3 /*break*/, 6];
            case 3:
              return [
                4 /*yield*/,
                this.storageService.deleteFile(entry.params.filePath),
              ];
            case 4:
              _b.sent();
              return [3 /*break*/, 6];
            case 5:
              // Handle update operation if needed
              return [3 /*break*/, 6];
            case 6:
              this.logger.log(
                'Successfully processed queued operation '
                  .concat(entry.id, ' (')
                  .concat(entry.operation, ')'),
              );
              return [2 /*return*/, true];
            case 7:
              error_3 = _b.sent();
              maxRetries = 5;
              errorMessage =
                error_3 instanceof Error ? error_3.message : String(error_3);
              if (entry.retries < maxRetries) {
                this.logger.warn(
                  'Failed to process operation '
                    .concat(entry.id, ', will retry (')
                    .concat(entry.retries, '/')
                    .concat(maxRetries, '): ')
                    .concat(errorMessage),
                );
                return [2 /*return*/, false];
              } else {
                this.logger.error(
                  'Failed to process operation '
                    .concat(entry.id, ' after ')
                    .concat(entry.retries, ' retries: ')
                    .concat(errorMessage),
                );
                // Remove from queue to avoid infinite retries
                return [2 /*return*/, true];
              }
              return [3 /*break*/, 8];
            case 8:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Queue an operation for later execution
     *
     * @param operation Operation type
     * @param params Operation parameters
     * @param priority Operation priority
     * @returns Operation ID
     */
    NetworkAwareStorageService_1.prototype.queueOperation = function (
      operation,
      params,
      priority,
    ) {
      if (priority === void 0) {
        priority = 'medium';
      }
      var id = 'op-'
        .concat(Date.now(), '-')
        .concat(Math.random().toString(36).substring(2, 10));
      this.operationQueue.push({
        id: id,
        operation: operation,
        params: params,
        retries: 0,
        createdAt: new Date(),
        priority: priority,
      });
      this.logger.log(
        'Queued '
          .concat(operation, ' operation ')
          .concat(id, ' with ')
          .concat(priority, ' priority'),
      );
      return id;
    };
    /**
     * Upload a file to storage with network awareness
     *
     * @param file File buffer to upload
     * @param filePath Path to store the file
     * @param options Upload options
     * @returns Public URL of the uploaded file
     */
    NetworkAwareStorageService_1.prototype.uploadFile = function (
      file,
      filePath,
      options,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var bucketName, error_4, bucketName;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              // Check if we have a network issue or load shedding
              if (
                (this.loadSheddingActive ||
                  this.networkStatus.connectionQuality === 'low') &&
                (options === null || options === void 0
                  ? void 0
                  : options.enableLoadSheddingResilience) !== false
              ) {
                // Queue the operation for later
                this.queueOperation(
                  'upload',
                  { file: file, filePath: filePath, options: options },
                  'medium',
                );
                bucketName =
                  this.configService.get('GCS_BUCKET_NAME') ||
                  'fluxori-uploads';
                return [
                  2 /*return*/,
                  'https://storage.googleapis.com/'
                    .concat(bucketName, '/')
                    .concat(filePath),
                ];
              }
              _a.label = 1;
            case 1:
              _a.trys.push([1, 3, , 4]);
              return [
                4 /*yield*/,
                this.storageService.uploadFile(file, filePath, {
                  contentType:
                    options === null || options === void 0
                      ? void 0
                      : options.contentType,
                  metadata:
                    options === null || options === void 0
                      ? void 0
                      : options.metadata,
                  isPublic:
                    options === null || options === void 0
                      ? void 0
                      : options.isPublic,
                }),
              ];
            case 2:
              return [2 /*return*/, _a.sent()];
            case 3:
              error_4 = _a.sent();
              // On error, queue for retry if load shedding resilience is enabled
              if (
                (options === null || options === void 0
                  ? void 0
                  : options.enableLoadSheddingResilience) !== false
              ) {
                this.queueOperation(
                  'upload',
                  { file: file, filePath: filePath, options: options },
                  'medium',
                );
                bucketName =
                  this.configService.get('GCS_BUCKET_NAME') ||
                  'fluxori-uploads';
                return [
                  2 /*return*/,
                  'https://storage.googleapis.com/'
                    .concat(bucketName, '/')
                    .concat(filePath),
                ];
              } else {
                throw error_4;
              }
              return [3 /*break*/, 4];
            case 4:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Delete a file with network resilience
     *
     * @param filePath Path of the file to delete
     * @param options Delete options
     */
    NetworkAwareStorageService_1.prototype.deleteFile = function (
      filePath,
      options,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var error_5;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              // Check if we have a network issue or load shedding
              if (
                (this.loadSheddingActive ||
                  this.networkStatus.connectionQuality === 'low') &&
                (options === null || options === void 0
                  ? void 0
                  : options.enableLoadSheddingResilience) !== false
              ) {
                // Queue the operation for later
                this.queueOperation('delete', { filePath: filePath }, 'low');
                return [2 /*return*/];
              }
              _a.label = 1;
            case 1:
              _a.trys.push([1, 3, , 4]);
              return [4 /*yield*/, this.storageService.deleteFile(filePath)];
            case 2:
              _a.sent();
              return [3 /*break*/, 4];
            case 3:
              error_5 = _a.sent();
              // On error, queue for retry if load shedding resilience is enabled
              if (
                (options === null || options === void 0
                  ? void 0
                  : options.enableLoadSheddingResilience) !== false
              ) {
                this.queueOperation('delete', { filePath: filePath }, 'low');
              } else {
                throw error_5;
              }
              return [3 /*break*/, 4];
            case 4:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Get network-optimized image options based on current conditions
     *
     * @param originalOptions Original image options
     * @returns Network-optimized image options
     */
    NetworkAwareStorageService_1.prototype.getNetworkOptimizedImageOptions =
      function (originalOptions) {
        return __awaiter(this, void 0, void 0, function () {
          var optimizedOptions,
            networkQuality,
            organizationId,
            marketContext,
            isNetworkAwareEnabled,
            connectionQuality;
          var _a;
          return __generator(this, function (_b) {
            switch (_b.label) {
              case 0:
                optimizedOptions = __assign({}, originalOptions);
                networkQuality =
                  originalOptions.networkQuality || this.networkStatus;
                organizationId =
                  (_a = originalOptions.metadata) === null || _a === void 0
                    ? void 0
                    : _a.organizationId;
                if (!organizationId) {
                  return [2 /*return*/, optimizedOptions];
                }
                return [
                  4 /*yield*/,
                  this.marketContextService.getMarketContext(organizationId),
                ];
              case 1:
                marketContext = _b.sent();
                isNetworkAwareEnabled =
                  marketContext.features.networkAwareComponents;
                // If network awareness is not enabled, return original options
                if (!isNetworkAwareEnabled) {
                  return [2 /*return*/, optimizedOptions];
                }
                connectionQuality =
                  networkQuality.connectionQuality || networkQuality.quality;
                if (connectionQuality === 'low' || this.loadSheddingActive) {
                  // For poor connections or during load shedding
                  optimizedOptions.compressionQuality =
                    image_model_1.CompressionQuality.LOW;
                  optimizedOptions.generateThumbnails = false;
                  // Handle resize option safely
                  if (
                    originalOptions.resizeOption ===
                    image_model_1.ResizeOption.LARGE
                  ) {
                    optimizedOptions.resizeOption =
                      image_model_1.ResizeOption.MEDIUM;
                  }
                  optimizedOptions.optimizeForLowBandwidth = true;
                  optimizedOptions.enableLoadSheddingResilience = true;
                } else if (connectionQuality === 'medium') {
                  // For medium connections
                  optimizedOptions.compressionQuality =
                    image_model_1.CompressionQuality.MEDIUM;
                  optimizedOptions.generateThumbnails = true;
                  optimizedOptions.optimizeForLowBandwidth = true;
                } else {
                  // For good connections
                  // Use original settings or defaults
                  optimizedOptions.compressionQuality =
                    optimizedOptions.compressionQuality ||
                    image_model_1.CompressionQuality.ADAPTIVE;
                  optimizedOptions.generateThumbnails =
                    optimizedOptions.generateThumbnails !== false;
                  optimizedOptions.optimizeForLowBandwidth =
                    optimizedOptions.optimizeForLowBandwidth !== false;
                }
                return [2 /*return*/, optimizedOptions];
            }
          });
        });
      };
    /**
     * Get current network status
     *
     * @returns Current network quality information
     */
    NetworkAwareStorageService_1.prototype.getCurrentNetworkStatus =
      function () {
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            return [2 /*return*/, __assign({}, this.networkStatus)];
          });
        });
      };
    /**
     * Check if load shedding is currently active
     *
     * @returns Whether load shedding is active
     */
    NetworkAwareStorageService_1.prototype.isLoadSheddingActive = function () {
      return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          return [2 /*return*/, this.loadSheddingActive];
        });
      });
    };
    /**
     * Get network quality information
     *
     * @returns Network quality details
     */
    NetworkAwareStorageService_1.prototype.getNetworkQuality = function () {
      // Make sure to include quality field for backward compatibility
      return __assign(__assign({}, this.networkStatus), {
        quality: this.networkStatus.connectionQuality,
      });
    };
    return NetworkAwareStorageService_1;
  })());
  __setFunctionName(_classThis, 'NetworkAwareStorageService');
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
    NetworkAwareStorageService = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (NetworkAwareStorageService = _classThis);
})();
exports.NetworkAwareStorageService = NetworkAwareStorageService;
