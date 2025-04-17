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
exports.FeatureFlagRepository = void 0;
var common_1 = require("@nestjs/common");
var repositories_1 = require("src/common/repositories");
var types_1 = require("../interfaces/types");
/**
 * Repository for managing feature flags
 */
var FeatureFlagRepository = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _classSuper = repositories_1.FirestoreBaseRepository;
    var FeatureFlagRepository = _classThis = /** @class */ (function (_super) {
        __extends(FeatureFlagRepository_1, _super);
        function FeatureFlagRepository_1(firestoreConfigService) {
            var _this = _super.call(this, firestoreConfigService, "feature_flags", {
                enableCache: true,
                cacheTTLMs: 60000, // 1 minute cache TTL for feature flags
                useSoftDeletes: true,
            }) || this;
            _this.logger = new common_1.Logger(FeatureFlagRepository.name);
            return _this;
        }
        /**
         * Initialize the repository when the module loads
         */
        FeatureFlagRepository_1.prototype.onModuleInit = function () {
            this.logger.log("FeatureFlagRepository initialized");
        };
        /**
         * Find a feature flag by its key
         * @param key The unique feature flag key
         * @returns The feature flag or null if not found
         */
        FeatureFlagRepository_1.prototype.findByKey = function (key) {
            return __awaiter(this, void 0, void 0, function () {
                var results;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.find({
                                advancedFilters: [{ field: "key", operator: "==", value: key }],
                            })];
                        case 1:
                            results = _a.sent();
                            return [2 /*return*/, results.length > 0 ? results[0] : null];
                    }
                });
            });
        };
        /**
         * Find all feature flags for a specific environment
         * @param environment The target environment
         * @returns List of feature flags for the environment
         */
        FeatureFlagRepository_1.prototype.findByEnvironment = function (environment) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    // Find flags specific to this environment or marked as 'all'
                    return [2 /*return*/, this.find({
                            advancedFilters: [
                                {
                                    field: "environments",
                                    operator: "array-contains-any",
                                    value: [environment, types_1.Environment.ALL],
                                },
                            ],
                        })];
                });
            });
        };
        /**
         * Find all feature flags by type
         * @param type The feature flag type
         * @returns List of feature flags of the specified type
         */
        FeatureFlagRepository_1.prototype.findByType = function (type) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.find({
                            advancedFilters: [{ field: "type", operator: "==", value: type }],
                        })];
                });
            });
        };
        /**
         * Find all feature flags by tag
         * @param tag The tag to search for
         * @returns List of feature flags with the specified tag
         */
        FeatureFlagRepository_1.prototype.findByTag = function (tag) {
            return __awaiter(this, void 0, void 0, function () {
                var allFlags;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findAll()];
                        case 1:
                            allFlags = _a.sent();
                            return [2 /*return*/, allFlags.filter(function (flag) { return flag.tags && flag.tags.includes(tag); })];
                    }
                });
            });
        };
        /**
         * Find feature flags for a specific organization
         * @param organizationId The organization ID
         * @returns List of feature flags targeted to this organization
         */
        FeatureFlagRepository_1.prototype.findByOrganization = function (organizationId) {
            return __awaiter(this, void 0, void 0, function () {
                var orgTargetedFlags;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.find({
                                advancedFilters: [
                                    {
                                        field: "type",
                                        operator: "==",
                                        value: types_1.FeatureFlagType.ORGANIZATION_TARGETED,
                                    },
                                ],
                            })];
                        case 1:
                            orgTargetedFlags = _a.sent();
                            // Filter to include only those targeting this organization
                            return [2 /*return*/, orgTargetedFlags.filter(function (flag) {
                                    if (!flag.organizationTargeting)
                                        return false;
                                    var organizationIds = flag.organizationTargeting.organizationIds;
                                    return organizationIds && organizationIds.includes(organizationId);
                                })];
                    }
                });
            });
        };
        /**
         * Find feature flags for a specific user
         * @param userId The user ID
         * @param userRole The user's role
         * @param userEmail The user's email
         * @returns List of feature flags targeted to this user
         */
        FeatureFlagRepository_1.prototype.findByUser = function (userId, userRole, userEmail) {
            return __awaiter(this, void 0, void 0, function () {
                var userTargetedFlags;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.find({
                                advancedFilters: [
                                    { field: "type", operator: "==", value: types_1.FeatureFlagType.USER_TARGETED },
                                ],
                            })];
                        case 1:
                            userTargetedFlags = _a.sent();
                            // Filter to include only those targeting this user
                            return [2 /*return*/, userTargetedFlags.filter(function (flag) {
                                    if (!flag.userTargeting)
                                        return false;
                                    var _a = flag.userTargeting, userIds = _a.userIds, userRoles = _a.userRoles, userEmails = _a.userEmails;
                                    var isTargeted = false;
                                    // Check user ID targeting
                                    if (userIds && userIds.includes(userId)) {
                                        isTargeted = true;
                                    }
                                    // Check role targeting
                                    if (userRole && userRoles && userRoles.includes(userRole)) {
                                        isTargeted = true;
                                    }
                                    // Check email targeting
                                    if (userEmail && userEmails && userEmails.includes(userEmail)) {
                                        isTargeted = true;
                                    }
                                    return isTargeted;
                                })];
                    }
                });
            });
        };
        /**
         * Toggle a feature flag's enabled status
         * @param id The feature flag ID
         * @param enabled The new enabled state
         * @returns The updated feature flag
         */
        FeatureFlagRepository_1.prototype.toggleFlag = function (id, enabled) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.update(id, { enabled: enabled })];
                });
            });
        };
        return FeatureFlagRepository_1;
    }(_classSuper));
    __setFunctionName(_classThis, "FeatureFlagRepository");
    (function () {
        var _a;
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_a = _classSuper[Symbol.metadata]) !== null && _a !== void 0 ? _a : null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FeatureFlagRepository = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FeatureFlagRepository = _classThis;
}();
exports.FeatureFlagRepository = FeatureFlagRepository;
