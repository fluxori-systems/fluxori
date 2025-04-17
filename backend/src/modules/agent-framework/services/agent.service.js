"use strict";
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
exports.AgentService = void 0;
var common_1 = require("@nestjs/common");
var uuid_1 = require("uuid");
var types_1 = require("../interfaces/types");
/**
 * Service for agent operations
 */
var AgentService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AgentService = _classThis = /** @class */ (function () {
        function AgentService_1(modelRegistryRepository, agentConfigRepository, conversationRepository, adapterFactory, featureFlagService) {
            this.modelRegistryRepository = modelRegistryRepository;
            this.agentConfigRepository = agentConfigRepository;
            this.conversationRepository = conversationRepository;
            this.adapterFactory = adapterFactory;
            this.featureFlagService = featureFlagService;
            this.logger = new common_1.Logger(AgentService.name);
        }
        /**
         * Create a new conversation with an agent
         * @param request Conversation creation request
         * @returns New conversation
         */
        AgentService_1.prototype.createConversation = function (request) {
            return __awaiter(this, void 0, void 0, function () {
                var agentConfig, agentEnabled, messages, conversation, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 6, , 7]);
                            return [4 /*yield*/, this.agentConfigRepository.findById(request.agentConfigId)];
                        case 1:
                            agentConfig = _a.sent();
                            if (!agentConfig) {
                                throw new Error("Agent configuration not found: ".concat(request.agentConfigId));
                            }
                            return [4 /*yield*/, this.checkAgentFeatureFlag(agentConfig.name, request.organizationId)];
                        case 2:
                            agentEnabled = _a.sent();
                            if (!agentEnabled) {
                                throw new Error("Agent '".concat(agentConfig.name, "' is not available for your organization."));
                            }
                            messages = [
                                {
                                    id: (0, uuid_1.v4)(),
                                    role: "system",
                                    content: agentConfig.systemPrompt,
                                    timestamp: new Date(),
                                },
                            ];
                            // Add initial user message if provided
                            if (request.initialMessage) {
                                messages.push({
                                    id: (0, uuid_1.v4)(),
                                    role: "user",
                                    content: request.initialMessage,
                                    timestamp: new Date(),
                                });
                            }
                            return [4 /*yield*/, this.conversationRepository.create({
                                    organizationId: request.organizationId,
                                    userId: request.userId,
                                    title: request.title || "New Conversation",
                                    messages: messages,
                                    agentConfigId: request.agentConfigId,
                                    tokensUsed: 0,
                                    cost: 0,
                                    lastActivityAt: new Date(),
                                    metadata: request.metadata || {},
                                    isActive: true,
                                    tags: [],
                                })];
                        case 3:
                            conversation = _a.sent();
                            if (!request.initialMessage) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.processAgentResponse(conversation.id)];
                        case 4:
                            _a.sent();
                            _a.label = 5;
                        case 5: return [2 /*return*/, conversation];
                        case 6:
                            error_1 = _a.sent();
                            this.logger.error("Error creating conversation: ".concat(error_1.message), error_1.stack);
                            throw new Error("Failed to create conversation: ".concat(error_1.message));
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Send a message to an agent
         * @param request Message request
         * @returns Updated conversation
         */
        AgentService_1.prototype.sendMessage = function (request) {
            return __awaiter(this, void 0, void 0, function () {
                var conversation, agentConfig, agentEnabled, userMessage, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 5, , 6]);
                            return [4 /*yield*/, this.conversationRepository.findById(request.conversationId)];
                        case 1:
                            conversation = _a.sent();
                            if (!conversation) {
                                throw new Error("Conversation not found: ".concat(request.conversationId));
                            }
                            // Verify user has access to the conversation
                            if (conversation.userId !== request.userId) {
                                throw new Error("User does not have access to this conversation");
                            }
                            return [4 /*yield*/, this.agentConfigRepository.findById(conversation.agentConfigId)];
                        case 2:
                            agentConfig = _a.sent();
                            if (!agentConfig) {
                                throw new Error("Agent configuration not found: ".concat(conversation.agentConfigId));
                            }
                            return [4 /*yield*/, this.checkAgentFeatureFlag(agentConfig.name, conversation.organizationId)];
                        case 3:
                            agentEnabled = _a.sent();
                            if (!agentEnabled) {
                                return [2 /*return*/, {
                                        type: types_1.AgentResponseType.ERROR,
                                        content: "Agent '".concat(agentConfig.name, "' is no longer available for your organization."),
                                        tokenUsage: { input: 0, output: 0, total: 0 },
                                        modelInfo: {
                                            provider: "none",
                                            model: "none",
                                            complexity: types_1.ModelComplexity.SIMPLE,
                                        },
                                        processingTime: 0,
                                        cost: 0,
                                    }];
                            }
                            userMessage = {
                                id: (0, uuid_1.v4)(),
                                role: "user",
                                content: request.message,
                                timestamp: new Date(),
                                metadata: request.attachments
                                    ? { attachments: request.attachments }
                                    : undefined,
                            };
                            return [4 /*yield*/, this.conversationRepository.addMessage(conversation.id, userMessage)];
                        case 4:
                            _a.sent();
                            // Process the message and generate agent response
                            return [2 /*return*/, this.processAgentResponse(conversation.id, request.overrideModel)];
                        case 5:
                            error_2 = _a.sent();
                            this.logger.error("Error sending message: ".concat(error_2.message), error_2.stack);
                            throw new Error("Failed to send message: ".concat(error_2.message));
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get a conversation by ID
         * @param conversationId Conversation ID
         * @param userId User ID requesting the conversation
         * @returns Conversation details
         */
        AgentService_1.prototype.getConversation = function (conversationId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var conversation, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.conversationRepository.findById(conversationId)];
                        case 1:
                            conversation = _a.sent();
                            if (!conversation) {
                                throw new Error("Conversation not found: ".concat(conversationId));
                            }
                            // Verify user has access to the conversation
                            if (conversation.userId !== userId) {
                                throw new Error("User does not have access to this conversation");
                            }
                            return [2 /*return*/, {
                                    id: conversation.id,
                                    title: conversation.title,
                                    messages: conversation.messages,
                                    lastUpdated: conversation.lastActivityAt instanceof Date
                                        ? conversation.lastActivityAt
                                        : new Date(conversation.lastActivityAt),
                                    metadata: conversation.metadata,
                                }];
                        case 2:
                            error_3 = _a.sent();
                            this.logger.error("Error fetching conversation: ".concat(error_3.message), error_3.stack);
                            throw new Error("Failed to fetch conversation: ".concat(error_3.message));
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * List user conversations
         * @param organizationId Organization ID
         * @param userId User ID
         * @param limit Maximum number of conversations to return
         * @returns List of conversations
         */
        AgentService_1.prototype.listUserConversations = function (organizationId_1, userId_1) {
            return __awaiter(this, arguments, void 0, function (organizationId, userId, limit) {
                var conversations, error_4;
                if (limit === void 0) { limit = 20; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.conversationRepository.findByUser(organizationId, userId, limit)];
                        case 1:
                            conversations = _a.sent();
                            return [2 /*return*/, conversations.map(function (conversation) { return ({
                                    id: conversation.id,
                                    title: conversation.title,
                                    messages: conversation.messages,
                                    lastUpdated: conversation.lastActivityAt instanceof Date
                                        ? conversation.lastActivityAt
                                        : new Date(conversation.lastActivityAt),
                                    metadata: conversation.metadata,
                                }); })];
                        case 2:
                            error_4 = _a.sent();
                            this.logger.error("Error listing conversations: ".concat(error_4.message), error_4.stack);
                            throw new Error("Failed to list conversations: ".concat(error_4.message));
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get active agent configurations
         * @param organizationId Organization ID
         * @returns List of agent configurations
         */
        AgentService_1.prototype.getAgentConfigurations = function (organizationId) {
            return __awaiter(this, void 0, void 0, function () {
                var configs, filteredConfigs, _i, configs_1, config, isEnabled, error_5;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 6, , 7]);
                            return [4 /*yield*/, this.agentConfigRepository.findByOrganization(organizationId)];
                        case 1:
                            configs = _a.sent();
                            filteredConfigs = [];
                            _i = 0, configs_1 = configs;
                            _a.label = 2;
                        case 2:
                            if (!(_i < configs_1.length)) return [3 /*break*/, 5];
                            config = configs_1[_i];
                            return [4 /*yield*/, this.checkAgentFeatureFlag(config.name, organizationId)];
                        case 3:
                            isEnabled = _a.sent();
                            if (isEnabled) {
                                filteredConfigs.push(config);
                            }
                            _a.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 2];
                        case 5: return [2 /*return*/, filteredConfigs];
                        case 6:
                            error_5 = _a.sent();
                            this.logger.error("Error fetching agent configurations: ".concat(error_5.message), error_5.stack);
                            throw new Error("Failed to fetch agent configurations: ".concat(error_5.message));
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Process an agent response for a conversation
         * @param conversationId Conversation ID
         * @param overrideModel Optional model to use instead of the default
         * @returns Agent response
         * @private
         */
        AgentService_1.prototype.processAgentResponse = function (conversationId, overrideModel) {
            return __awaiter(this, void 0, void 0, function () {
                var conversation, agentConfig, modelName_1, allModels, model, adapter, messages, modelParameters, chatRequest, startTime, response, processingTime, assistantMessage, error_6;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 7, , 8]);
                            return [4 /*yield*/, this.conversationRepository.findById(conversationId)];
                        case 1:
                            conversation = _a.sent();
                            if (!conversation) {
                                throw new Error("Conversation not found: ".concat(conversationId));
                            }
                            return [4 /*yield*/, this.agentConfigRepository.findById(conversation.agentConfigId)];
                        case 2:
                            agentConfig = _a.sent();
                            if (!agentConfig) {
                                throw new Error("Agent configuration not found: ".concat(conversation.agentConfigId));
                            }
                            modelName_1 = overrideModel || agentConfig.defaultModel;
                            return [4 /*yield*/, this.modelRegistryRepository.findAll()];
                        case 3:
                            allModels = _a.sent();
                            model = allModels.find(function (m) { return m.model === modelName_1 && m.isEnabled; });
                            if (!model) {
                                throw new Error("Model not found: ".concat(modelName_1));
                            }
                            adapter = this.adapterFactory.getAdapter(model);
                            messages = conversation.messages.map(function (msg) { return ({
                                role: msg.role,
                                content: msg.content,
                                name: msg.role === "function" ? msg.id : undefined,
                                functionCall: msg.functionCall,
                            }); });
                            modelParameters = {
                                temperature: agentConfig.parameters.temperature,
                                topP: agentConfig.parameters.topP,
                                maxOutputTokens: Math.min(agentConfig.parameters.maxOutputTokens, model.maxOutputTokens),
                                presencePenalty: agentConfig.parameters.presencePenalty,
                                frequencyPenalty: agentConfig.parameters.frequencyPenalty,
                                functions: agentConfig.functions,
                            };
                            chatRequest = {
                                messages: messages,
                                options: modelParameters,
                            };
                            startTime = Date.now();
                            return [4 /*yield*/, adapter.generateChatCompletion(model, chatRequest)];
                        case 4:
                            response = _a.sent();
                            processingTime = Date.now() - startTime;
                            assistantMessage = {
                                id: (0, uuid_1.v4)(),
                                role: "assistant",
                                content: response.content,
                                timestamp: new Date(),
                                functionCall: response.functionCall,
                                metadata: {
                                    model: model.model,
                                    provider: model.provider,
                                    tokenCount: response.usage.outputTokens,
                                    cost: response.usage.cost,
                                },
                            };
                            // Add the assistant message to the conversation
                            return [4 /*yield*/, this.conversationRepository.addMessage(conversation.id, assistantMessage)];
                        case 5:
                            // Add the assistant message to the conversation
                            _a.sent();
                            // Update the conversation's token usage and cost
                            return [4 /*yield*/, this.conversationRepository.update(conversation.id, {
                                    tokensUsed: conversation.tokensUsed + response.usage.totalTokens,
                                    cost: conversation.cost + response.usage.cost,
                                    lastActivityAt: new Date(),
                                })];
                        case 6:
                            // Update the conversation's token usage and cost
                            _a.sent();
                            // Return the agent response
                            return [2 /*return*/, {
                                    type: response.functionCall
                                        ? types_1.AgentResponseType.ACTION
                                        : types_1.AgentResponseType.TEXT,
                                    content: response.functionCall
                                        ? response.functionCall
                                        : response.content,
                                    tokenUsage: {
                                        input: response.usage.inputTokens,
                                        output: response.usage.outputTokens,
                                        total: response.usage.totalTokens,
                                    },
                                    modelInfo: {
                                        provider: model.provider,
                                        model: model.model,
                                        complexity: model.complexity,
                                    },
                                    processingTime: processingTime,
                                    cost: response.usage.cost,
                                    metadata: {
                                        conversationId: conversationId,
                                        messageId: assistantMessage.id,
                                    },
                                }];
                        case 7:
                            error_6 = _a.sent();
                            this.logger.error("Error processing agent response: ".concat(error_6.message), error_6.stack);
                            throw new Error("Failed to process agent response: ".concat(error_6.message));
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get the best model for a task based on complexity
         * @param organizationId Organization ID
         * @param complexity Task complexity
         * @param preferredProvider Optional preferred provider
         * @param requiredCapabilities Optional required capabilities
         * @returns Best matching model or null if none found
         */
        AgentService_1.prototype.getBestModelForTask = function (organizationId, complexity, preferredProvider, requiredCapabilities) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        return [2 /*return*/, this.modelRegistryRepository.findBestModelForTask({
                                complexity: complexity,
                                preferredProvider: preferredProvider,
                                requiredCapabilities: requiredCapabilities,
                            })];
                    }
                    catch (error) {
                        this.logger.error("Error finding model for task: ".concat(error.message), error.stack);
                        throw new Error("Failed to find model for task: ".concat(error.message));
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Archive old conversations for a user
         * @param organizationId Organization ID
         * @param userId User ID
         * @param keepActive Number of conversations to keep active
         * @returns Number of archived conversations
         */
        AgentService_1.prototype.archiveOldConversations = function (organizationId_1, userId_1) {
            return __awaiter(this, arguments, void 0, function (organizationId, userId, keepActive) {
                if (keepActive === void 0) { keepActive = 10; }
                return __generator(this, function (_a) {
                    try {
                        return [2 /*return*/, this.conversationRepository.archiveOldUserConversations(organizationId, userId, keepActive)];
                    }
                    catch (error) {
                        this.logger.error("Error archiving conversations: ".concat(error.message), error.stack);
                        throw new Error("Failed to archive conversations: ".concat(error.message));
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Check if an agent is enabled via feature flags
         * @param agentName Agent name
         * @param organizationId Organization ID
         * @returns Whether the agent is enabled
         * @private
         */
        AgentService_1.prototype.checkAgentFeatureFlag = function (agentName, organizationId) {
            return __awaiter(this, void 0, void 0, function () {
                var flagKey, error_7;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            flagKey = "agent-".concat(agentName.toLowerCase().replace(/\s+/g, "-"));
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.featureFlagService.isEnabled(flagKey, {
                                    organizationId: organizationId,
                                })];
                        case 2: 
                        // Check if the feature flag exists and is enabled for this organization
                        return [2 /*return*/, _a.sent()];
                        case 3:
                            error_7 = _a.sent();
                            // If the flag doesn't exist or there's an error, default to enabled
                            // This prevents blocking existing agents if feature flags haven't been set up yet
                            this.logger.warn("Error checking feature flag for agent ".concat(agentName, ": ").concat(error_7.message));
                            return [2 /*return*/, true];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        return AgentService_1;
    }());
    __setFunctionName(_classThis, "AgentService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AgentService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AgentService = _classThis;
}();
exports.AgentService = AgentService;
