"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.AgentConversationRepository = void 0;
var common_1 = require("@nestjs/common");
var repositories_1 = require("src/common/repositories");
/**
 * Repository for managing agent conversations
 */
var AgentConversationRepository = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _classSuper = repositories_1.FirestoreBaseRepository;
    var AgentConversationRepository = _classThis = /** @class */ (function (_super) {
        __extends(AgentConversationRepository_1, _super);
        function AgentConversationRepository_1(firestoreConfigService) {
            var _this = _super.call(this, firestoreConfigService, "agent_conversations") || this;
            _this.logger = new common_1.Logger(AgentConversationRepository.name);
            return _this;
        }
        /**
         * Initialize the repository when module loads
         */
        AgentConversationRepository_1.prototype.onModuleInit = function () {
            this.logger.log("AgentConversationRepository initialized");
        };
        /**
         * Find all conversations for a specific organization
         * @param organizationId Organization ID
         * @param limit Maximum number of conversations to return
         * @returns List of conversations
         */
        AgentConversationRepository_1.prototype.findByOrganization = function (organizationId_1) {
            return __awaiter(this, arguments, void 0, function (organizationId, limit) {
                if (limit === void 0) { limit = 100; }
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.find({
                            advancedFilters: [
                                { field: "organizationId", operator: "==", value: organizationId },
                                { field: "isActive", operator: "==", value: true },
                            ],
                            queryOptions: {
                                orderBy: "lastActivityAt",
                                direction: "desc",
                                limit: limit,
                            },
                        })];
                });
            });
        };
        /**
         * Find all conversations for a specific user
         * @param organizationId Organization ID
         * @param userId User ID
         * @param limit Maximum number of conversations to return
         * @returns List of conversations
         */
        AgentConversationRepository_1.prototype.findByUser = function (organizationId_1, userId_1) {
            return __awaiter(this, arguments, void 0, function (organizationId, userId, limit) {
                if (limit === void 0) { limit = 50; }
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.find({
                            advancedFilters: [
                                { field: "organizationId", operator: "==", value: organizationId },
                                { field: "userId", operator: "==", value: userId },
                                { field: "isActive", operator: "==", value: true },
                            ],
                            queryOptions: {
                                orderBy: "lastActivityAt",
                                direction: "desc",
                                limit: limit,
                            },
                        })];
                });
            });
        };
        /**
         * Find all conversations for a specific agent configuration
         * @param organizationId Organization ID
         * @param agentConfigId Agent configuration ID
         * @param limit Maximum number of conversations to return
         * @returns List of conversations
         */
        AgentConversationRepository_1.prototype.findByAgentConfig = function (organizationId_1, agentConfigId_1) {
            return __awaiter(this, arguments, void 0, function (organizationId, agentConfigId, limit) {
                if (limit === void 0) { limit = 50; }
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.find({
                            advancedFilters: [
                                { field: "organizationId", operator: "==", value: organizationId },
                                { field: "agentConfigId", operator: "==", value: agentConfigId },
                                { field: "isActive", operator: "==", value: true },
                            ],
                            queryOptions: {
                                orderBy: "lastActivityAt",
                                direction: "desc",
                                limit: limit,
                            },
                        })];
                });
            });
        };
        /**
         * Add a new message to a conversation
         * @param conversationId Conversation ID
         * @param message Message to add
         * @returns Updated conversation or null if not found
         */
        AgentConversationRepository_1.prototype.addMessage = function (conversationId, message) {
            return __awaiter(this, void 0, void 0, function () {
                var conversation, updatedMessages;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.findById(conversationId)];
                        case 1:
                            conversation = _c.sent();
                            if (!conversation)
                                return [2 /*return*/, null];
                            updatedMessages = __spreadArray(__spreadArray([], conversation.messages, true), [message], false);
                            // Update the conversation
                            return [2 /*return*/, this.update(conversationId, __assign(__assign({ messages: updatedMessages, lastActivityAt: new Date() }, (((_a = message.metadata) === null || _a === void 0 ? void 0 : _a.tokenCount)
                                    ? {
                                        tokensUsed: conversation.tokensUsed + message.metadata.tokenCount,
                                    }
                                    : {})), (((_b = message.metadata) === null || _b === void 0 ? void 0 : _b.cost)
                                    ? {
                                        cost: conversation.cost + message.metadata.cost,
                                    }
                                    : {})))];
                    }
                });
            });
        };
        /**
         * Set a conversation's active status
         * @param conversationId Conversation ID
         * @param isActive Whether the conversation is active
         * @returns Updated conversation or null if not found
         */
        AgentConversationRepository_1.prototype.setActive = function (conversationId, isActive) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.update(conversationId, { isActive: isActive })];
                });
            });
        };
        /**
         * Update conversation title
         * @param conversationId Conversation ID
         * @param title New title
         * @returns Updated conversation or null if not found
         */
        AgentConversationRepository_1.prototype.updateTitle = function (conversationId, title) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.update(conversationId, { title: title })];
                });
            });
        };
        /**
         * Archive older user conversations beyond a limit
         * @param organizationId Organization ID
         * @param userId User ID
         * @param keepActive Number of conversations to keep active
         * @returns Number of conversations archived
         */
        AgentConversationRepository_1.prototype.archiveOldUserConversations = function (organizationId_1, userId_1) {
            return __awaiter(this, arguments, void 0, function (organizationId, userId, keepActive) {
                var conversations, toArchive, archivedCount, _i, toArchive_1, conversation;
                if (keepActive === void 0) { keepActive = 10; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findByUser(organizationId, userId, 1000)];
                        case 1:
                            conversations = _a.sent();
                            // If we have fewer conversations than the limit, do nothing
                            if (conversations.length <= keepActive) {
                                return [2 /*return*/, 0];
                            }
                            // Sort by last activity date (newest first)
                            conversations.sort(function (a, b) {
                                var dateA = a.lastActivityAt instanceof Date
                                    ? a.lastActivityAt
                                    : new Date(a.lastActivityAt);
                                var dateB = b.lastActivityAt instanceof Date
                                    ? b.lastActivityAt
                                    : new Date(b.lastActivityAt);
                                return dateB.getTime() - dateA.getTime();
                            });
                            toArchive = conversations.slice(keepActive);
                            archivedCount = 0;
                            _i = 0, toArchive_1 = toArchive;
                            _a.label = 2;
                        case 2:
                            if (!(_i < toArchive_1.length)) return [3 /*break*/, 5];
                            conversation = toArchive_1[_i];
                            return [4 /*yield*/, this.update(conversation.id, {
                                    isActive: false,
                                })];
                        case 3:
                            _a.sent();
                            archivedCount++;
                            _a.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 2];
                        case 5: return [2 /*return*/, archivedCount];
                    }
                });
            });
        };
        return AgentConversationRepository_1;
    }(_classSuper));
    __setFunctionName(_classThis, "AgentConversationRepository");
    (function () {
        var _a;
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_a = _classSuper[Symbol.metadata]) !== null && _a !== void 0 ? _a : null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AgentConversationRepository = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AgentConversationRepository = _classThis;
}();
exports.AgentConversationRepository = AgentConversationRepository;
