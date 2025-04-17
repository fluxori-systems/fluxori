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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenTrackingService = void 0;
var common_1 = require("@nestjs/common");
var types_1 = require("../interfaces/types");
/**
 * Service for tracking token usage and integrating with the Agent Framework
 */
var TokenTrackingService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var TokenTrackingService = _classThis = /** @class */ (function () {
        function TokenTrackingService_1(creditSystemService, modelRegistryRepository, tokenEstimator) {
            this.creditSystemService = creditSystemService;
            this.modelRegistryRepository = modelRegistryRepository;
            this.tokenEstimator = tokenEstimator;
            this.logger = new common_1.Logger(TokenTrackingService.name);
        }
        /**
         * Checks if an organization has sufficient credits for a model request
         * @param organizationId Organization ID
         * @param userId User ID
         * @param modelId Model ID
         * @param messages Chat messages
         * @returns Whether operation can proceed and reservation ID if applicable
         */
        TokenTrackingService_1.prototype.checkCreditsForModelRequest = function (organizationId, userId, modelId, messages) {
            return __awaiter(this, void 0, void 0, function () {
                var allModels, model, inputTokens, outputTokens, operationId, creditCheck, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            return [4 /*yield*/, this.modelRegistryRepository.findAll()];
                        case 1:
                            allModels = _a.sent();
                            model = allModels.find(function (m) { return m.model === modelId; });
                            if (!model) {
                                return [2 /*return*/, {
                                        canProceed: false,
                                        reason: "Model not found: ".concat(modelId),
                                    }];
                            }
                            inputTokens = this.tokenEstimator.estimateTokensForConversation(messages);
                            outputTokens = Math.min(model.maxOutputTokens, Math.ceil(inputTokens * 0.7));
                            operationId = "agt_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 10));
                            return [4 /*yield*/, this.creditSystemService.checkCredits({
                                    organizationId: organizationId,
                                    userId: userId,
                                    expectedInputTokens: inputTokens,
                                    expectedOutputTokens: outputTokens,
                                    modelId: modelId,
                                    usageType: types_1.CreditUsageType.MODEL_CALL,
                                    operationId: operationId,
                                })];
                        case 2:
                            creditCheck = _a.sent();
                            if (!creditCheck.hasCredits) {
                                return [2 /*return*/, {
                                        canProceed: false,
                                        reason: creditCheck.reason || "Insufficient credits",
                                    }];
                            }
                            return [2 /*return*/, {
                                    canProceed: true,
                                    reservationId: creditCheck.reservationId,
                                }];
                        case 3:
                            error_1 = _a.sent();
                            this.logger.error("Error checking credits for model request: ".concat(error_1.message), error_1.stack);
                            return [2 /*return*/, {
                                    canProceed: false,
                                    reason: "Error checking credits: ".concat(error_1.message),
                                }];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Records token usage from an agent response
         * @param organizationId Organization ID
         * @param userId User ID
         * @param response Agent response
         * @param reservationId Optional reservation ID
         * @param metadata Optional metadata
         * @returns Whether recording was successful
         */
        TokenTrackingService_1.prototype.recordAgentResponseUsage = function (organizationId, userId, response, reservationId, metadata) {
            return __awaiter(this, void 0, void 0, function () {
                var tokenUsage, modelInfo, processingTime, responseMetadata, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            tokenUsage = response.tokenUsage, modelInfo = response.modelInfo, processingTime = response.processingTime, responseMetadata = response.metadata;
                            // Record usage
                            return [4 /*yield*/, this.creditSystemService.recordUsage({
                                    organizationId: organizationId,
                                    userId: userId,
                                    usageType: types_1.CreditUsageType.MODEL_CALL,
                                    modelId: modelInfo.model,
                                    modelProvider: modelInfo.provider,
                                    inputTokens: tokenUsage.input,
                                    outputTokens: tokenUsage.output,
                                    processingTime: processingTime,
                                    operationId: responseMetadata === null || responseMetadata === void 0 ? void 0 : responseMetadata.operationId,
                                    reservationId: reservationId,
                                    success: true,
                                    metadata: __assign(__assign({}, metadata), { responseMetadata: responseMetadata }),
                                })];
                        case 1:
                            // Record usage
                            _a.sent();
                            return [2 /*return*/, true];
                        case 2:
                            error_2 = _a.sent();
                            this.logger.error("Error recording agent response usage: ".concat(error_2.message), error_2.stack);
                            return [2 /*return*/, false];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Check and record token usage for embedding operations
         * @param organizationId Organization ID
         * @param userId User ID
         * @param modelId Model ID
         * @param textLength Total length of text to embed
         * @returns Whether operation can proceed and reservation ID if applicable
         */
        TokenTrackingService_1.prototype.checkCreditsForEmbedding = function (organizationId, userId, modelId, textLength) {
            return __awaiter(this, void 0, void 0, function () {
                var estimatedTokens, operationId, creditCheck, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            estimatedTokens = Math.ceil(textLength / 4);
                            operationId = "emb_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 10));
                            return [4 /*yield*/, this.creditSystemService.checkCredits({
                                    organizationId: organizationId,
                                    userId: userId,
                                    expectedInputTokens: estimatedTokens,
                                    expectedOutputTokens: 0, // No output tokens for embeddings
                                    modelId: modelId,
                                    usageType: types_1.CreditUsageType.EMBEDDING,
                                    operationId: operationId,
                                })];
                        case 1:
                            creditCheck = _a.sent();
                            if (!creditCheck.hasCredits) {
                                return [2 /*return*/, {
                                        canProceed: false,
                                        reason: creditCheck.reason || "Insufficient credits",
                                    }];
                            }
                            return [2 /*return*/, {
                                    canProceed: true,
                                    reservationId: creditCheck.reservationId,
                                }];
                        case 2:
                            error_3 = _a.sent();
                            this.logger.error("Error checking credits for embedding: ".concat(error_3.message), error_3.stack);
                            return [2 /*return*/, {
                                    canProceed: false,
                                    reason: "Error checking credits: ".concat(error_3.message),
                                }];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Check and record token usage for RAG operations
         * @param organizationId Organization ID
         * @param userId User ID
         * @param queryLength Length of the query text
         * @param documentCount Number of documents retrieved
         * @param averageDocumentLength Average length of retrieved documents
         * @returns Whether operation can proceed and reservation ID if applicable
         */
        TokenTrackingService_1.prototype.checkCreditsForRagQuery = function (organizationId, userId, queryLength, documentCount, averageDocumentLength) {
            return __awaiter(this, void 0, void 0, function () {
                var queryTokens, documentTokens, operationId, creditCheck, error_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            queryTokens = Math.ceil(queryLength / 4);
                            documentTokens = Math.ceil(documentCount * averageDocumentLength / 4);
                            operationId = "rag_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 10));
                            return [4 /*yield*/, this.creditSystemService.checkCredits({
                                    organizationId: organizationId,
                                    userId: userId,
                                    expectedInputTokens: queryTokens,
                                    expectedOutputTokens: documentTokens,
                                    modelId: "rag-query", // Special model ID for RAG operations
                                    usageType: types_1.CreditUsageType.RAG_QUERY,
                                    operationId: operationId,
                                })];
                        case 1:
                            creditCheck = _a.sent();
                            if (!creditCheck.hasCredits) {
                                return [2 /*return*/, {
                                        canProceed: false,
                                        reason: creditCheck.reason || "Insufficient credits",
                                    }];
                            }
                            return [2 /*return*/, {
                                    canProceed: true,
                                    reservationId: creditCheck.reservationId,
                                }];
                        case 2:
                            error_4 = _a.sent();
                            this.logger.error("Error checking credits for RAG query: ".concat(error_4.message), error_4.stack);
                            return [2 /*return*/, {
                                    canProceed: false,
                                    reason: "Error checking credits: ".concat(error_4.message),
                                }];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Optimizes model selection based on cost and complexity requirements
         * @param organizationId Organization ID
         * @param userPrompt User prompt
         * @param taskComplexity Complexity level required
         * @param preferredModel Optional preferred model
         * @returns Optimal model to use
         */
        TokenTrackingService_1.prototype.optimizeModelSelection = function (organizationId, userPrompt, taskComplexity, preferredModel) {
            return __awaiter(this, void 0, void 0, function () {
                var allModels, activeModels, model, eligibleModels, estimatedTokens_1, sortedModels, error_5, allModels, defaultModel;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 4]);
                            return [4 /*yield*/, this.modelRegistryRepository.findAll()];
                        case 1:
                            allModels = _a.sent();
                            activeModels = allModels.filter(function (model) { return model.isEnabled; });
                            // If preferred model is specified, try to use it
                            if (preferredModel) {
                                model = activeModels.find(function (m) { return m.model === preferredModel; });
                                if (model && model.isEnabled) {
                                    return [2 /*return*/, {
                                            model: model,
                                            reason: "Using preferred model",
                                        }];
                                }
                            }
                            eligibleModels = activeModels;
                            if (taskComplexity === "simple") {
                                eligibleModels = activeModels.filter(function (m) {
                                    return m.complexity === "simple" || m.complexity === "standard" || m.complexity === "complex";
                                });
                            }
                            else if (taskComplexity === "standard") {
                                eligibleModels = activeModels.filter(function (m) {
                                    return m.complexity === "standard" || m.complexity === "complex";
                                });
                            }
                            else {
                                eligibleModels = activeModels.filter(function (m) {
                                    return m.complexity === "complex";
                                });
                            }
                            if (eligibleModels.length === 0) {
                                return [2 /*return*/, {
                                        model: null,
                                        reason: "No models available for the required complexity",
                                    }];
                            }
                            estimatedTokens_1 = this.tokenEstimator.estimateTokensForString(userPrompt);
                            sortedModels = __spreadArray([], eligibleModels, true).sort(function (a, b) {
                                // Calculate total cost
                                var costA = (estimatedTokens_1 * a.costPer1kInputTokens / 1000) +
                                    (estimatedTokens_1 * 0.7 * a.costPer1kOutputTokens / 1000);
                                var costB = (estimatedTokens_1 * b.costPer1kInputTokens / 1000) +
                                    (estimatedTokens_1 * 0.7 * b.costPer1kOutputTokens / 1000);
                                return costA - costB;
                            });
                            // Return the most cost-efficient model
                            return [2 /*return*/, {
                                    model: sortedModels[0],
                                    reason: "Selected most cost-efficient model for the required complexity",
                                }];
                        case 2:
                            error_5 = _a.sent();
                            this.logger.error("Error optimizing model selection: ".concat(error_5.message), error_5.stack);
                            return [4 /*yield*/, this.modelRegistryRepository.findAll()];
                        case 3:
                            allModels = _a.sent();
                            defaultModel = allModels.length > 0 ? allModels[0] : null;
                            return [2 /*return*/, {
                                    model: defaultModel,
                                    reason: "Error optimizing model selection, using fallback model: ".concat(error_5.message),
                                }];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        return TokenTrackingService_1;
    }());
    __setFunctionName(_classThis, "TokenTrackingService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TokenTrackingService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TokenTrackingService = _classThis;
}();
exports.TokenTrackingService = TokenTrackingService;
