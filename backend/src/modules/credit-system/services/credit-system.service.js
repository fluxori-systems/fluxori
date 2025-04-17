"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditSystemService = void 0;
var common_1 = require("@nestjs/common");
var types_1 = require("../interfaces/types");
/**
 * Service for managing credit system operations
 */
var CreditSystemService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var CreditSystemService = _classThis = /** @class */ (function () {
        function CreditSystemService_1(allocationRepository, transactionRepository, pricingRepository, reservationRepository, usageLogRepository, featureFlagService, modelRegistryRepository, agentFrameworkDeps) {
            this.allocationRepository = allocationRepository;
            this.transactionRepository = transactionRepository;
            this.pricingRepository = pricingRepository;
            this.reservationRepository = reservationRepository;
            this.usageLogRepository = usageLogRepository;
            this.featureFlagService = featureFlagService;
            this.modelRegistryRepository = modelRegistryRepository;
            this.agentFrameworkDeps = agentFrameworkDeps;
            this.logger = new common_1.Logger(CreditSystemService.name);
            this.reservationExpirationMs = 5 * 60 * 1000; // 5 minutes
            this.isInitialized = false;
            this.cacheHitCount = 0;
            this.cacheMissCount = 0;
            this.responseTimeMs = [];
            this.modelPricingCache = new Map();
        }
        /**
         * Initialize service
         */
        CreditSystemService_1.prototype.onModuleInit = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log("Initializing Credit System Service");
                            // Load active pricing tiers into cache
                            return [4 /*yield*/, this.refreshPricingCache()];
                        case 1:
                            // Load active pricing tiers into cache
                            _a.sent();
                            // Clean up any expired reservations
                            return [4 /*yield*/, this.cleanupExpiredReservations()];
                        case 2:
                            // Clean up any expired reservations
                            _a.sent();
                            // Set up periodic tasks
                            setInterval(function () { return _this.refreshPricingCache(); }, 30 * 60 * 1000); // Refresh pricing cache every 30 minutes
                            setInterval(function () { return _this.cleanupExpiredReservations(); }, 5 * 60 * 1000); // Cleanup expired reservations every 5 minutes
                            this.isInitialized = true;
                            this.logger.log("Credit System Service initialized");
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Refresh the pricing cache
         */
        CreditSystemService_1.prototype.refreshPricingCache = function () {
            return __awaiter(this, void 0, void 0, function () {
                var activeTiers, _i, activeTiers_1, tier, cacheKey, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            this.logger.debug("Refreshing pricing cache");
                            return [4 /*yield*/, this.pricingRepository.findAllActive()];
                        case 1:
                            activeTiers = _a.sent();
                            // Clear the cache
                            this.modelPricingCache.clear();
                            // Add active tiers to cache
                            for (_i = 0, activeTiers_1 = activeTiers; _i < activeTiers_1.length; _i++) {
                                tier = activeTiers_1[_i];
                                cacheKey = "".concat(tier.modelId, ":").concat(tier.modelProvider);
                                this.modelPricingCache.set(cacheKey, {
                                    modelId: tier.modelId,
                                    provider: tier.modelProvider,
                                    inputCost: tier.inputTokenCost,
                                    outputCost: tier.outputTokenCost,
                                    timestamp: Date.now(),
                                });
                            }
                            this.logger.debug("Refreshed pricing cache with ".concat(activeTiers.length, " tiers"));
                            return [3 /*break*/, 3];
                        case 2:
                            error_1 = _a.sent();
                            this.logger.error("Error refreshing pricing cache: ".concat(error_1.message), error_1.stack);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Clean up expired reservations
         */
        CreditSystemService_1.prototype.cleanupExpiredReservations = function () {
            return __awaiter(this, void 0, void 0, function () {
                var count, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            this.logger.debug("Cleaning up expired reservations");
                            return [4 /*yield*/, this.reservationRepository.cleanupExpired()];
                        case 1:
                            count = _a.sent();
                            if (count > 0) {
                                this.logger.log("Cleaned up ".concat(count, " expired credit reservations"));
                            }
                            return [3 /*break*/, 3];
                        case 2:
                            error_2 = _a.sent();
                            this.logger.error("Error cleaning up expired reservations: ".concat(error_2.message), error_2.stack);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Create a new credit allocation for an organization
         * @param organizationId Organization ID
         * @param modelType Credit model type
         * @param totalCredits Total credits to allocate
         * @param userId Optional user ID for user-specific allocation
         * @param resetDate Optional date when credits reset
         * @param expirationDate Optional date when allocation expires
         * @param metadata Optional metadata
         * @returns Created credit allocation
         */
        CreditSystemService_1.prototype.createAllocation = function (organizationId, modelType, totalCredits, userId, resetDate, expirationDate, metadata) {
            return __awaiter(this, void 0, void 0, function () {
                var allocation, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log("Creating allocation of ".concat(totalCredits, " credits for organization ").concat(organizationId));
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, , 5]);
                            return [4 /*yield*/, this.allocationRepository.create({
                                    organizationId: organizationId,
                                    userId: userId,
                                    modelType: modelType,
                                    totalCredits: totalCredits,
                                    remainingCredits: totalCredits,
                                    resetDate: resetDate,
                                    expirationDate: expirationDate,
                                    isActive: true,
                                    metadata: metadata,
                                })];
                        case 2:
                            allocation = _a.sent();
                            // Record the transaction
                            return [4 /*yield*/, this.transactionRepository.create({
                                    organizationId: organizationId,
                                    userId: userId,
                                    amount: totalCredits,
                                    transactionType: "credit",
                                    usageType: types_1.CreditUsageType.TOKEN_USAGE, // Default
                                    metadata: __assign({ allocationId: allocation.id, allocationCreated: true }, metadata),
                                })];
                        case 3:
                            // Record the transaction
                            _a.sent();
                            return [2 /*return*/, allocation];
                        case 4:
                            error_3 = _a.sent();
                            this.logger.error("Error creating allocation: ".concat(error_3.message), error_3.stack);
                            throw new Error("Failed to create credit allocation: ".concat(error_3.message));
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get active credit allocation for an organization
         * @param organizationId Organization ID
         * @param userId Optional user ID for user-specific allocation
         * @returns Active credit allocation or null if not found
         */
        CreditSystemService_1.prototype.getActiveAllocation = function (organizationId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var userAllocation, error_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            if (!userId) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.allocationRepository.findActiveByUser(organizationId, userId)];
                        case 1:
                            userAllocation = _a.sent();
                            if (userAllocation) {
                                return [2 /*return*/, userAllocation];
                            }
                            _a.label = 2;
                        case 2: 
                        // Fall back to organization-level allocation
                        return [2 /*return*/, this.allocationRepository.findActiveByOrganization(organizationId)];
                        case 3:
                            error_4 = _a.sent();
                            this.logger.error("Error fetching active allocation: ".concat(error_4.message), error_4.stack);
                            throw new Error("Failed to fetch active credit allocation: ".concat(error_4.message));
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Check if an organization has enough credits for an operation
         * @param request Credit check request
         * @returns Credit check response
         */
        CreditSystemService_1.prototype.checkCredits = function (request) {
            return __awaiter(this, void 0, void 0, function () {
                var startTime, cost, allocation, featureKey, featureEnabled, pendingReservations, availableCredits, hasCredits, reservation, error_5;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            startTime = Date.now();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 8, , 9]);
                            return [4 /*yield*/, this.calculateCost(request.modelId, request.expectedInputTokens, request.expectedOutputTokens)];
                        case 2:
                            cost = _a.sent();
                            return [4 /*yield*/, this.getActiveAllocation(request.organizationId, request.userId)];
                        case 3:
                            allocation = _a.sent();
                            if (!allocation) {
                                return [2 /*return*/, {
                                        hasCredits: false,
                                        availableCredits: 0,
                                        estimatedCost: cost,
                                        reason: "No active credit allocation found",
                                    }];
                            }
                            featureKey = "credit-intensive-".concat(request.usageType.toLowerCase());
                            return [4 /*yield*/, this.featureFlagService.isEnabled(featureKey, {
                                    organizationId: request.organizationId,
                                    userId: request.userId,
                                })];
                        case 4:
                            featureEnabled = _a.sent();
                            if (!featureEnabled) {
                                return [2 /*return*/, {
                                        hasCredits: false,
                                        availableCredits: allocation.remainingCredits,
                                        estimatedCost: cost,
                                        reason: "Feature is disabled by feature flag",
                                    }];
                            }
                            return [4 /*yield*/, this.reservationRepository.getTotalReserved(request.organizationId)];
                        case 5:
                            pendingReservations = _a.sent();
                            availableCredits = allocation.remainingCredits - pendingReservations;
                            hasCredits = availableCredits >= cost;
                            if (!(hasCredits && request.operationId)) return [3 /*break*/, 7];
                            return [4 /*yield*/, this.reservationRepository.create({
                                    organizationId: request.organizationId,
                                    userId: request.userId,
                                    operationId: request.operationId,
                                    reservationAmount: cost,
                                    usageType: request.usageType,
                                    status: "pending",
                                    expirationDate: new Date(Date.now() + this.reservationExpirationMs),
                                    metadata: request.metadata,
                                })];
                        case 6:
                            reservation = _a.sent();
                            // Record response time
                            this.recordResponseTime(startTime);
                            return [2 /*return*/, {
                                    hasCredits: true,
                                    availableCredits: availableCredits,
                                    estimatedCost: cost,
                                    reservationId: reservation.id,
                                }];
                        case 7:
                            // Record response time
                            this.recordResponseTime(startTime);
                            return [2 /*return*/, {
                                    hasCredits: hasCredits,
                                    availableCredits: availableCredits,
                                    estimatedCost: cost,
                                    reason: hasCredits ? undefined : "Insufficient credits",
                                }];
                        case 8:
                            error_5 = _a.sent();
                            this.logger.error("Error checking credits: ".concat(error_5.message), error_5.stack);
                            // Record response time
                            this.recordResponseTime(startTime);
                            return [2 /*return*/, {
                                    hasCredits: false,
                                    availableCredits: 0,
                                    estimatedCost: 0,
                                    reason: "Error checking credits: ".concat(error_5.message),
                                }];
                        case 9: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Record credit usage for an operation
         * @param request Credit usage request
         * @returns Created usage log
         */
        CreditSystemService_1.prototype.recordUsage = function (request) {
            return __awaiter(this, void 0, void 0, function () {
                var startTime, cost, usageLog, reservation, reservationCost, error_6;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            startTime = Date.now();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 9, , 10]);
                            return [4 /*yield*/, this.calculateCost(request.modelId, request.inputTokens, request.outputTokens)];
                        case 2:
                            cost = _a.sent();
                            return [4 /*yield*/, this.usageLogRepository.create({
                                    organizationId: request.organizationId,
                                    userId: request.userId,
                                    usageType: request.usageType,
                                    modelId: request.modelId,
                                    modelProvider: request.modelProvider,
                                    inputTokens: request.inputTokens,
                                    outputTokens: request.outputTokens,
                                    totalTokens: request.inputTokens + request.outputTokens,
                                    creditsUsed: cost,
                                    processingTime: request.processingTime,
                                    success: request.success,
                                    errorMessage: request.errorMessage,
                                    resourceId: request.resourceId,
                                    resourceType: request.resourceType,
                                    metadata: __assign(__assign({}, request.metadata), { operationId: request.operationId, reservationId: request.reservationId }),
                                })];
                        case 3:
                            usageLog = _a.sent();
                            if (!request.reservationId) return [3 /*break*/, 7];
                            return [4 /*yield*/, this.reservationRepository.findById(request.reservationId)];
                        case 4:
                            reservation = _a.sent();
                            if (!reservation) return [3 /*break*/, 7];
                            // Mark the reservation as confirmed
                            return [4 /*yield*/, this.reservationRepository.updateStatus(request.reservationId, "confirmed")];
                        case 5:
                            // Mark the reservation as confirmed
                            _a.sent();
                            reservationCost = reservation.reservationAmount;
                            // Deduct the credits from the allocation
                            return [4 /*yield*/, this.deductCredits(request.organizationId, reservationCost, request.usageType, request.userId, request.modelId, request.modelProvider, request.inputTokens, request.outputTokens, request.operationId, request.resourceId, request.resourceType, request.metadata)];
                        case 6:
                            // Deduct the credits from the allocation
                            _a.sent();
                            // Record response time
                            this.recordResponseTime(startTime);
                            return [2 /*return*/, usageLog];
                        case 7: 
                        // Deduct the credits from the allocation if no reservation or reservation not found
                        return [4 /*yield*/, this.deductCredits(request.organizationId, cost, request.usageType, request.userId, request.modelId, request.modelProvider, request.inputTokens, request.outputTokens, request.operationId, request.resourceId, request.resourceType, request.metadata)];
                        case 8:
                            // Deduct the credits from the allocation if no reservation or reservation not found
                            _a.sent();
                            // Record response time
                            this.recordResponseTime(startTime);
                            return [2 /*return*/, usageLog];
                        case 9:
                            error_6 = _a.sent();
                            this.logger.error("Error recording usage: ".concat(error_6.message), error_6.stack);
                            // Record response time
                            this.recordResponseTime(startTime);
                            throw new Error("Failed to record credit usage: ".concat(error_6.message));
                        case 10: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Calculate cost for token usage
         * @param modelId Model ID
         * @param inputTokens Input tokens
         * @param outputTokens Output tokens
         * @returns Calculated cost in credits
         */
        CreditSystemService_1.prototype.calculateCost = function (modelId, inputTokens, outputTokens) {
            return __awaiter(this, void 0, void 0, function () {
                var modelInfo, cacheKey, pricing, inputCost, outputCost, pricingTier, inputCost, outputCost, inputCost, outputCost, inputCost, outputCost, inputCost, outputCost, inputCost, outputCost, inputCost, outputCost, error_7;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 4, , 5]);
                            return [4 /*yield*/, this.getModelInfoForPricing(modelId)];
                        case 1:
                            modelInfo = _a.sent();
                            cacheKey = "".concat(modelId, ":").concat(modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.provider);
                            if (this.modelPricingCache.has(cacheKey)) {
                                this.cacheHitCount++;
                                pricing = this.modelPricingCache.get(cacheKey);
                                if (pricing) {
                                    inputCost = (inputTokens * pricing.inputCost) / 1000;
                                    outputCost = (outputTokens * pricing.outputCost) / 1000;
                                    // Minimum cost is 1 credit
                                    return [2 /*return*/, Math.max(1, Math.ceil(inputCost + outputCost))];
                                }
                            }
                            this.cacheMissCount++;
                            if (!modelInfo) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.pricingRepository.findActiveForModel(modelId, modelInfo.provider)];
                        case 2:
                            pricingTier = _a.sent();
                            if (pricingTier) {
                                // Update cache
                                this.modelPricingCache.set(cacheKey, {
                                    modelId: modelId,
                                    provider: modelInfo.provider,
                                    inputCost: pricingTier.inputTokenCost,
                                    outputCost: pricingTier.outputTokenCost,
                                    timestamp: Date.now(),
                                });
                                inputCost = (inputTokens * pricingTier.inputTokenCost) / 1000;
                                outputCost = (outputTokens * pricingTier.outputTokenCost) / 1000;
                                // Minimum cost is 1 credit
                                return [2 /*return*/, Math.max(1, Math.ceil(inputCost + outputCost))];
                            }
                            _a.label = 3;
                        case 3:
                            // If not found in database, use fallback pricing based on model name
                            if (modelId.includes("gpt-4")) {
                                inputCost = (inputTokens * 0.03) / 1000 * 100;
                                outputCost = (outputTokens * 0.06) / 1000 * 100;
                                return [2 /*return*/, Math.max(1, Math.ceil(inputCost + outputCost))];
                            }
                            else if (modelId.includes("gpt-3.5")) {
                                inputCost = (inputTokens * 0.001) / 1000 * 100;
                                outputCost = (outputTokens * 0.002) / 1000 * 100;
                                return [2 /*return*/, Math.max(1, Math.ceil(inputCost + outputCost))];
                            }
                            else if (modelId.includes("vertex") || modelId.includes("gemini")) {
                                inputCost = (inputTokens * 0.0005) / 1000 * 100;
                                outputCost = (outputTokens * 0.0015) / 1000 * 100;
                                return [2 /*return*/, Math.max(1, Math.ceil(inputCost + outputCost))];
                            }
                            else if (modelId.includes("embed")) {
                                inputCost = (inputTokens * 0.0001) / 1000 * 100;
                                outputCost = 0;
                                return [2 /*return*/, Math.max(1, Math.ceil(inputCost + outputCost))];
                            }
                            else {
                                inputCost = (inputTokens * 0.01) / 1000 * 100;
                                outputCost = (outputTokens * 0.02) / 1000 * 100;
                                return [2 /*return*/, Math.max(1, Math.ceil(inputCost + outputCost))];
                            }
                            return [3 /*break*/, 5];
                        case 4:
                            error_7 = _a.sent();
                            this.logger.error("Error calculating cost: ".concat(error_7.message), error_7.stack);
                            // Fallback to a safe default
                            return [2 /*return*/, Math.max(1, Math.ceil((inputTokens + outputTokens) / 1000))];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get model information for pricing
         * @param modelId Model ID
         * @returns Model information or null if not found
         */
        CreditSystemService_1.prototype.getModelInfoForPricing = function (modelId) {
            return __awaiter(this, void 0, void 0, function () {
                var allModels, model, error_8;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.modelRegistryRepository.findAll()];
                        case 1:
                            allModels = _a.sent();
                            model = allModels.find(function (m) { return m.model === modelId; });
                            if (model) {
                                return [2 /*return*/, {
                                        provider: model.provider,
                                        costPer1kInputTokens: model.costPer1kInputTokens,
                                        costPer1kOutputTokens: model.costPer1kOutputTokens,
                                    }];
                            }
                            return [2 /*return*/, null];
                        case 2:
                            error_8 = _a.sent();
                            this.logger.error("Error getting model info: ".concat(error_8.message), error_8.stack);
                            return [2 /*return*/, null];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Deduct credits from an allocation
         * @param organizationId Organization ID
         * @param amount Amount to deduct
         * @param usageType Usage type
         * @param userId Optional user ID
         * @param modelId Optional model ID
         * @param modelProvider Optional model provider
         * @param inputTokens Optional input tokens
         * @param outputTokens Optional output tokens
         * @param operationId Optional operation ID
         * @param resourceId Optional resource ID
         * @param resourceType Optional resource type
         * @param metadata Optional metadata
         * @returns Updated allocation
         */
        CreditSystemService_1.prototype.deductCredits = function (organizationId, amount, usageType, userId, modelId, modelProvider, inputTokens, outputTokens, operationId, resourceId, resourceType, metadata) {
            return __awaiter(this, void 0, void 0, function () {
                var allocation;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getActiveAllocation(organizationId, userId)];
                        case 1:
                            allocation = _a.sent();
                            if (!allocation) {
                                throw new Error("No active credit allocation found for organization ".concat(organizationId));
                            }
                            if (allocation.remainingCredits < amount) {
                                throw new Error("Insufficient credits: Required ".concat(amount, ", Available ").concat(allocation.remainingCredits));
                            }
                            // Create transaction record
                            return [4 /*yield*/, this.transactionRepository.create({
                                    organizationId: organizationId,
                                    userId: userId,
                                    amount: amount,
                                    transactionType: "debit",
                                    usageType: usageType,
                                    modelId: modelId,
                                    modelProvider: modelProvider,
                                    inputTokens: inputTokens,
                                    outputTokens: outputTokens,
                                    operationId: operationId,
                                    resourceId: resourceId,
                                    resourceType: resourceType,
                                    metadata: metadata,
                                })];
                        case 2:
                            // Create transaction record
                            _a.sent();
                            // Deduct credits from allocation
                            return [2 /*return*/, this.allocationRepository.decrementCredits(allocation.id, amount)];
                    }
                });
            });
        };
        /**
         * Add credits to an allocation
         * @param allocationId Allocation ID
         * @param amount Amount to add
         * @param userId User ID making the change
         * @param metadata Optional metadata
         * @returns Updated allocation
         */
        CreditSystemService_1.prototype.addCreditsToAllocation = function (allocationId, amount, userId, metadata) {
            return __awaiter(this, void 0, void 0, function () {
                var allocation, error_9;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            return [4 /*yield*/, this.allocationRepository.findById(allocationId)];
                        case 1:
                            allocation = _a.sent();
                            if (!allocation) {
                                throw new Error("Credit allocation not found: ".concat(allocationId));
                            }
                            // Create transaction record
                            return [4 /*yield*/, this.transactionRepository.create({
                                    organizationId: allocation.organizationId,
                                    userId: userId,
                                    amount: amount,
                                    transactionType: "credit",
                                    usageType: types_1.CreditUsageType.TOKEN_USAGE, // Default
                                    metadata: __assign({ allocationId: allocationId, creditAddedBy: userId }, metadata),
                                })];
                        case 2:
                            // Create transaction record
                            _a.sent();
                            // Add credits to allocation
                            return [2 /*return*/, this.allocationRepository.addCredits(allocationId, amount)];
                        case 3:
                            error_9 = _a.sent();
                            this.logger.error("Error adding credits: ".concat(error_9.message), error_9.stack);
                            throw new Error("Failed to add credits: ".concat(error_9.message));
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get recent transactions for an organization
         * @param organizationId Organization ID
         * @param limit Maximum number of transactions to return
         * @returns Array of transactions
         */
        CreditSystemService_1.prototype.getRecentTransactions = function (organizationId_1) {
            return __awaiter(this, arguments, void 0, function (organizationId, limit) {
                if (limit === void 0) { limit = 50; }
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.transactionRepository.findByOrganization(organizationId, limit)];
                });
            });
        };
        /**
         * Get recent usage logs for an organization
         * @param organizationId Organization ID
         * @param limit Maximum number of logs to return
         * @returns Array of usage logs
         */
        CreditSystemService_1.prototype.getRecentUsageLogs = function (organizationId_1) {
            return __awaiter(this, arguments, void 0, function (organizationId, limit) {
                if (limit === void 0) { limit = 50; }
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.usageLogRepository.findByOrganization(organizationId, limit)];
                });
            });
        };
        /**
         * Get usage statistics for a period
         * @param organizationId Organization ID
         * @param startDate Start date for the period
         * @param endDate End date for the period
         * @returns Usage statistics
         */
        CreditSystemService_1.prototype.getUsageStatistics = function (organizationId, startDate, endDate) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.usageLogRepository.getUsageStats(organizationId, startDate, endDate)];
                });
            });
        };
        /**
         * Calculate token usage for request
         * @param modelId Model ID
         * @param messages Chat messages
         * @returns Token usage calculation
         */
        CreditSystemService_1.prototype.calculateTokenUsage = function (modelId, messages) {
            return __awaiter(this, void 0, void 0, function () {
                var allModels, model, tokenCounts, creditCost, error_10, estimatedInputTokens, estimatedOutputTokens, creditCost, modelInfo;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 4, , 7]);
                            return [4 /*yield*/, this.modelRegistryRepository.findAll()];
                        case 1:
                            allModels = _a.sent();
                            model = allModels.find(function (m) { return m.model === modelId; });
                            if (!model) {
                                throw new Error("Model not found: ".concat(modelId));
                            }
                            return [4 /*yield*/, this.agentFrameworkDeps.countTokensInMessages(model, messages)];
                        case 2:
                            tokenCounts = _a.sent();
                            return [4 /*yield*/, this.calculateCost(modelId, tokenCounts.inputTokens, tokenCounts.outputTokens)];
                        case 3:
                            creditCost = _a.sent();
                            return [2 /*return*/, {
                                    inputTokens: tokenCounts.inputTokens,
                                    outputTokens: tokenCounts.outputTokens,
                                    totalTokens: tokenCounts.inputTokens + tokenCounts.outputTokens,
                                    creditCost: creditCost,
                                    modelId: modelId,
                                    modelProvider: model.provider,
                                }];
                        case 4:
                            error_10 = _a.sent();
                            this.logger.error("Error calculating token usage: ".concat(error_10.message), error_10.stack);
                            estimatedInputTokens = this.estimateTokensFromMessages(messages);
                            estimatedOutputTokens = Math.ceil(estimatedInputTokens * 0.5);
                            return [4 /*yield*/, this.calculateCost(modelId, estimatedInputTokens, estimatedOutputTokens)];
                        case 5:
                            creditCost = _a.sent();
                            return [4 /*yield*/, this.getModelInfoForPricing(modelId)];
                        case 6:
                            modelInfo = _a.sent();
                            return [2 /*return*/, {
                                    inputTokens: estimatedInputTokens,
                                    outputTokens: estimatedOutputTokens,
                                    totalTokens: estimatedInputTokens + estimatedOutputTokens,
                                    creditCost: creditCost,
                                    modelId: modelId,
                                    modelProvider: (modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.provider) || "unknown",
                                }];
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Estimate tokens from messages (fallback method)
         * @param messages Chat messages
         * @returns Estimated token count
         */
        CreditSystemService_1.prototype.estimateTokensFromMessages = function (messages) {
            var totalChars = 0;
            for (var _i = 0, messages_1 = messages; _i < messages_1.length; _i++) {
                var message = messages_1[_i];
                if (typeof message.content === "string") {
                    totalChars += message.content.length;
                }
                else if (Array.isArray(message.content)) {
                    for (var _a = 0, _b = message.content; _a < _b.length; _a++) {
                        var part = _b[_a];
                        if (typeof part === "string") {
                            totalChars += part.length;
                        }
                        else if (part && typeof part.text === "string") {
                            totalChars += part.text.length;
                        }
                    }
                }
                // Add some overhead for message structure
                totalChars += 20;
            }
            // Average of 4 characters per token for English text
            return Math.ceil(totalChars / 4);
        };
        /**
         * Record response time for metrics
         * @param startTime Start time in milliseconds
         */
        CreditSystemService_1.prototype.recordResponseTime = function (startTime) {
            var responseTime = Date.now() - startTime;
            // Keep only the last 100 response times
            if (this.responseTimeMs.length >= 100) {
                this.responseTimeMs.shift();
            }
            this.responseTimeMs.push(responseTime);
        };
        /**
         * Get system status information
         * @returns Credit system status
         */
        CreditSystemService_1.prototype.getSystemStatus = function () {
            return __awaiter(this, void 0, void 0, function () {
                var transactions, latestTransaction, txCreatedAt, reservations, totalCacheRequests, cacheHitRate, averageLatency, error_11;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            return [4 /*yield*/, this.transactionRepository.findByOrganization("system", // Special organization ID for system-level operations
                                1)];
                        case 1:
                            transactions = _a.sent();
                            latestTransaction = undefined;
                            if (transactions.length > 0) {
                                txCreatedAt = transactions[0].createdAt;
                                if (txCreatedAt instanceof Date) {
                                    latestTransaction = txCreatedAt;
                                }
                                else if (typeof txCreatedAt === 'string' || typeof txCreatedAt === 'number') {
                                    latestTransaction = new Date(txCreatedAt);
                                }
                                else if (txCreatedAt && typeof txCreatedAt.toDate === 'function') {
                                    // Handle Firestore Timestamp
                                    latestTransaction = txCreatedAt.toDate();
                                }
                            }
                            return [4 /*yield*/, this.reservationRepository.find({
                                    filter: { status: "pending" },
                                })];
                        case 2:
                            reservations = _a.sent();
                            totalCacheRequests = this.cacheHitCount + this.cacheMissCount;
                            cacheHitRate = totalCacheRequests > 0
                                ? (this.cacheHitCount / totalCacheRequests) * 100
                                : 0;
                            averageLatency = this.responseTimeMs.length > 0
                                ? this.responseTimeMs.reduce(function (sum, time) { return sum + time; }, 0) / this.responseTimeMs.length
                                : 0;
                            return [2 /*return*/, {
                                    isOperational: this.isInitialized,
                                    latestTransaction: latestTransaction instanceof Date
                                        ? latestTransaction
                                        : latestTransaction ? new Date(latestTransaction) : undefined,
                                    reservationCount: reservations.length,
                                    cacheHitRate: cacheHitRate,
                                    averageLatency: averageLatency,
                                }];
                        case 3:
                            error_11 = _a.sent();
                            this.logger.error("Error getting system status: ".concat(error_11.message), error_11.stack);
                            return [2 /*return*/, {
                                    isOperational: false,
                                    reservationCount: 0,
                                    cacheHitRate: 0,
                                    averageLatency: 0,
                                }];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Release a credit reservation without using the credits
         * @param reservationId Reservation ID
         * @returns Success status
         */
        CreditSystemService_1.prototype.releaseReservation = function (reservationId) {
            return __awaiter(this, void 0, void 0, function () {
                var reservation, error_12;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            return [4 /*yield*/, this.reservationRepository.findById(reservationId)];
                        case 1:
                            reservation = _a.sent();
                            if (!reservation) {
                                throw new Error("Reservation not found: ".concat(reservationId));
                            }
                            if (reservation.status !== "pending") {
                                throw new Error("Reservation is not pending: ".concat(reservationId));
                            }
                            return [4 /*yield*/, this.reservationRepository.updateStatus(reservationId, "released")];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, true];
                        case 3:
                            error_12 = _a.sent();
                            this.logger.error("Error releasing reservation: ".concat(error_12.message), error_12.stack);
                            return [2 /*return*/, false];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        return CreditSystemService_1;
    }());
    __setFunctionName(_classThis, "CreditSystemService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CreditSystemService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CreditSystemService = _classThis;
}();
exports.CreditSystemService = CreditSystemService;
