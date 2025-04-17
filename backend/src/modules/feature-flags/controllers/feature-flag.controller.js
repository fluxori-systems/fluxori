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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
exports.FeatureFlagController = void 0;
var common_1 = require("@nestjs/common");
var auth_1 = require("src/common/auth");
var FeatureFlagController = function () {
    var _classDecorators = [(0, common_1.Controller)("feature-flags"), (0, common_1.UseGuards)(auth_1.FirebaseAuthGuard)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _createFlag_decorators;
    var _getAllFlags_decorators;
    var _getFlagById_decorators;
    var _getFlagByKey_decorators;
    var _updateFlag_decorators;
    var _toggleFlag_decorators;
    var _deleteFlag_decorators;
    var _getAuditLogs_decorators;
    var _evaluateFlag_decorators;
    var _isEnabled_decorators;
    var _evaluateBatchFlags_decorators;
    var FeatureFlagController = _classThis = /** @class */ (function () {
        function FeatureFlagController_1(featureFlagService) {
            this.featureFlagService = (__runInitializers(this, _instanceExtraInitializers), featureFlagService);
            this.logger = new common_1.Logger(FeatureFlagController.name);
        }
        /**
         * Create a new feature flag
         */
        FeatureFlagController_1.prototype.createFlag = function (flagDTO, user) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    this.logger.log("Creating feature flag: ".concat(flagDTO.key));
                    return [2 /*return*/, this.featureFlagService.createFlag(flagDTO, user.id)];
                });
            });
        };
        /**
         * Get all feature flags
         */
        FeatureFlagController_1.prototype.getAllFlags = function (environment) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    this.logger.log("Getting all feature flags".concat(environment ? " for environment: ".concat(environment) : ""));
                    return [2 /*return*/, this.featureFlagService.getAllFlags(environment)];
                });
            });
        };
        /**
         * Get a feature flag by ID
         */
        FeatureFlagController_1.prototype.getFlagById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    this.logger.log("Getting feature flag by ID: ".concat(id));
                    return [2 /*return*/, this.featureFlagService.getFlagById(id)];
                });
            });
        };
        /**
         * Get a feature flag by key
         */
        FeatureFlagController_1.prototype.getFlagByKey = function (key) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    this.logger.log("Getting feature flag by key: ".concat(key));
                    return [2 /*return*/, this.featureFlagService.getFlagByKey(key)];
                });
            });
        };
        /**
         * Update a feature flag
         */
        FeatureFlagController_1.prototype.updateFlag = function (id, flagDTO, user) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    this.logger.log("Updating feature flag: ".concat(id));
                    return [2 /*return*/, this.featureFlagService.updateFlag(id, flagDTO, user.id)];
                });
            });
        };
        /**
         * Toggle a feature flag's enabled status
         */
        FeatureFlagController_1.prototype.toggleFlag = function (id, toggleDTO, user) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    this.logger.log("Toggling feature flag: ".concat(id, " to ").concat(toggleDTO.enabled));
                    return [2 /*return*/, this.featureFlagService.toggleFlag(id, toggleDTO, user.id)];
                });
            });
        };
        /**
         * Delete a feature flag
         */
        FeatureFlagController_1.prototype.deleteFlag = function (id, user) {
            return __awaiter(this, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log("Deleting feature flag: ".concat(id));
                            return [4 /*yield*/, this.featureFlagService.deleteFlag(id, user.id)];
                        case 1:
                            result = _a.sent();
                            return [2 /*return*/, { success: result }];
                    }
                });
            });
        };
        /**
         * Get audit logs for a feature flag
         */
        FeatureFlagController_1.prototype.getAuditLogs = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    this.logger.log("Getting audit logs for feature flag: ".concat(id));
                    return [2 /*return*/, this.featureFlagService.getAuditLogs(id)];
                });
            });
        };
        /**
         * Evaluate a feature flag for the current context
         */
        FeatureFlagController_1.prototype.evaluateFlag = function (key, context, user) {
            return __awaiter(this, void 0, void 0, function () {
                var mergedContext;
                return __generator(this, function (_a) {
                    this.logger.debug("Evaluating feature flag: ".concat(key));
                    mergedContext = __assign(__assign({}, context), { userId: context.userId || user.id, userRole: context.userRole || user.role, organizationId: context.organizationId || user.organizationId });
                    return [2 /*return*/, this.featureFlagService.evaluateFlag(key, mergedContext)];
                });
            });
        };
        /**
         * Check if a feature flag is enabled for the current context
         */
        FeatureFlagController_1.prototype.isEnabled = function (key, context, user) {
            return __awaiter(this, void 0, void 0, function () {
                var mergedContext, isEnabled;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.debug("Checking if feature flag is enabled: ".concat(key));
                            mergedContext = __assign(__assign({}, context), { userId: context.userId || user.uid, userRole: context.userRole || user.role, organizationId: context.organizationId || user.organizationId });
                            // Log additional context if the user is in an organization
                            if (mergedContext.organizationId &&
                                auth_1.AuthUtils.isInOrganization(user, mergedContext.organizationId)) {
                                this.logger.debug("User belongs to evaluated organization: ".concat(mergedContext.organizationId));
                            }
                            return [4 /*yield*/, this.featureFlagService.isEnabled(key, mergedContext)];
                        case 1:
                            isEnabled = _a.sent();
                            return [2 /*return*/, { enabled: isEnabled }];
                    }
                });
            });
        };
        /**
         * Evaluate multiple feature flags at once
         */
        FeatureFlagController_1.prototype.evaluateBatchFlags = function (data, user) {
            return __awaiter(this, void 0, void 0, function () {
                var mergedContext, results, _i, _a, key, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            this.logger.debug("Evaluating batch of feature flags: ".concat(data.keys.join(", ")));
                            mergedContext = __assign(__assign({}, data.context), { userId: data.context.userId || user.id, userRole: data.context.userRole || user.role, organizationId: data.context.organizationId || user.organizationId });
                            results = {};
                            _i = 0, _a = data.keys;
                            _d.label = 1;
                        case 1:
                            if (!(_i < _a.length)) return [3 /*break*/, 4];
                            key = _a[_i];
                            _b = results;
                            _c = key;
                            return [4 /*yield*/, this.featureFlagService.evaluateFlag(key, mergedContext)];
                        case 2:
                            _b[_c] = _d.sent();
                            _d.label = 3;
                        case 3:
                            _i++;
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/, results];
                    }
                });
            });
        };
        return FeatureFlagController_1;
    }());
    __setFunctionName(_classThis, "FeatureFlagController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createFlag_decorators = [(0, common_1.Post)()];
        _getAllFlags_decorators = [(0, common_1.Get)()];
        _getFlagById_decorators = [(0, common_1.Get)(":id")];
        _getFlagByKey_decorators = [(0, common_1.Get)("key/:key")];
        _updateFlag_decorators = [(0, common_1.Patch)(":id")];
        _toggleFlag_decorators = [(0, common_1.Patch)(":id/toggle")];
        _deleteFlag_decorators = [(0, common_1.Delete)(":id")];
        _getAuditLogs_decorators = [(0, common_1.Get)(":id/audit-logs")];
        _evaluateFlag_decorators = [(0, common_1.Post)("evaluate/:key")];
        _isEnabled_decorators = [(0, common_1.Post)("is-enabled/:key")];
        _evaluateBatchFlags_decorators = [(0, common_1.Post)("evaluate-batch")];
        __esDecorate(_classThis, null, _createFlag_decorators, { kind: "method", name: "createFlag", static: false, private: false, access: { has: function (obj) { return "createFlag" in obj; }, get: function (obj) { return obj.createFlag; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllFlags_decorators, { kind: "method", name: "getAllFlags", static: false, private: false, access: { has: function (obj) { return "getAllFlags" in obj; }, get: function (obj) { return obj.getAllFlags; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getFlagById_decorators, { kind: "method", name: "getFlagById", static: false, private: false, access: { has: function (obj) { return "getFlagById" in obj; }, get: function (obj) { return obj.getFlagById; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getFlagByKey_decorators, { kind: "method", name: "getFlagByKey", static: false, private: false, access: { has: function (obj) { return "getFlagByKey" in obj; }, get: function (obj) { return obj.getFlagByKey; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateFlag_decorators, { kind: "method", name: "updateFlag", static: false, private: false, access: { has: function (obj) { return "updateFlag" in obj; }, get: function (obj) { return obj.updateFlag; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _toggleFlag_decorators, { kind: "method", name: "toggleFlag", static: false, private: false, access: { has: function (obj) { return "toggleFlag" in obj; }, get: function (obj) { return obj.toggleFlag; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteFlag_decorators, { kind: "method", name: "deleteFlag", static: false, private: false, access: { has: function (obj) { return "deleteFlag" in obj; }, get: function (obj) { return obj.deleteFlag; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAuditLogs_decorators, { kind: "method", name: "getAuditLogs", static: false, private: false, access: { has: function (obj) { return "getAuditLogs" in obj; }, get: function (obj) { return obj.getAuditLogs; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _evaluateFlag_decorators, { kind: "method", name: "evaluateFlag", static: false, private: false, access: { has: function (obj) { return "evaluateFlag" in obj; }, get: function (obj) { return obj.evaluateFlag; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _isEnabled_decorators, { kind: "method", name: "isEnabled", static: false, private: false, access: { has: function (obj) { return "isEnabled" in obj; }, get: function (obj) { return obj.isEnabled; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _evaluateBatchFlags_decorators, { kind: "method", name: "evaluateBatchFlags", static: false, private: false, access: { has: function (obj) { return "evaluateBatchFlags" in obj; }, get: function (obj) { return obj.evaluateBatchFlags; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FeatureFlagController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FeatureFlagController = _classThis;
}();
exports.FeatureFlagController = FeatureFlagController;
