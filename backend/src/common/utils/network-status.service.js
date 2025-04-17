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
exports.NetworkStatusService = void 0;
var common_1 = require("@nestjs/common");
/**
 * NetworkStatusService
 *
 * Service for detecting and tracking network conditions with South African optimizations
 * This service helps other components adapt to variable network conditions common in South Africa
 */
var NetworkStatusService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var NetworkStatusService = _classThis = /** @class */ (function () {
        function NetworkStatusService_1() {
            this.logger = new common_1.Logger(NetworkStatusService.name);
            // Default to a conservative estimate for South African connections
            this.currentStatus = {
                connectionType: '4g',
                isStable: true,
                isSufficientBandwidth: true,
                lastUpdated: new Date()
            };
            // Cache of recent test results (organizationId -> NetworkStatus)
            this.recentTests = new Map();
            // Global network status override (for maintenance or known issues)
            this.globalNetworkIssue = false;
            // Initialize with conservative defaults for South African market
            this.updateDefaultStatus();
        }
        /**
         * Get the current network status
         * If organization-specific status is available, that will be returned
         * Otherwise, a global default status will be returned
         *
         * @param organizationId Organization ID (optional)
         * @returns Current network status
         */
        NetworkStatusService_1.prototype.getNetworkStatus = function (organizationId) {
            return __awaiter(this, void 0, void 0, function () {
                var orgStatus, ageMs;
                return __generator(this, function (_a) {
                    // If organization-specific status is available and recent, use it
                    if (organizationId && this.recentTests.has(organizationId)) {
                        orgStatus = this.recentTests.get(organizationId);
                        if (orgStatus) {
                            ageMs = Date.now() - orgStatus.lastUpdated.getTime();
                            // Use cached status if less than 5 minutes old
                            if (ageMs < 5 * 60 * 1000) {
                                return [2 /*return*/, orgStatus];
                            }
                        }
                    }
                    // If there's a global network issue, return a constrained status
                    if (this.globalNetworkIssue) {
                        return [2 /*return*/, {
                                connectionType: '3g',
                                downloadSpeed: 1.5,
                                uploadSpeed: 0.5,
                                latency: 200,
                                isStable: false,
                                isSufficientBandwidth: false,
                                lastUpdated: new Date()
                            }];
                    }
                    return [2 /*return*/, this.currentStatus];
                });
            });
        };
        /**
         * Update network status for an organization based on client-reported metrics
         *
         * @param organizationId Organization ID
         * @param status Network status information
         */
        NetworkStatusService_1.prototype.updateOrganizationNetworkStatus = function (organizationId, status) {
            var currentOrgStatus = this.recentTests.get(organizationId) || __assign({}, this.currentStatus);
            var updatedStatus = __assign(__assign(__assign({}, currentOrgStatus), status), { lastUpdated: new Date() });
            // Update isSufficientBandwidth based on download speed
            if (updatedStatus.downloadSpeed !== undefined) {
                // South African threshold - 2 Mbps is sufficient for most operations
                updatedStatus.isSufficientBandwidth = updatedStatus.downloadSpeed >= 2;
            }
            // Update isStable based on connection type and latency
            if (updatedStatus.connectionType !== undefined || updatedStatus.latency !== undefined) {
                var isLowLatency = updatedStatus.latency === undefined || updatedStatus.latency < 200;
                var isGoodConnection = ['wifi', '4g'].includes(updatedStatus.connectionType);
                updatedStatus.isStable = isGoodConnection && isLowLatency;
            }
            this.recentTests.set(organizationId, updatedStatus);
            this.logger.debug("Updated network status for organization ".concat(organizationId, ": ").concat(JSON.stringify(updatedStatus)));
            // Update global default if needed
            this.updateDefaultStatus();
        };
        /**
         * Set a global network issue flag
         * This is useful during known service degradation periods
         *
         * @param isIssueActive Whether a global network issue is active
         */
        NetworkStatusService_1.prototype.setGlobalNetworkIssue = function (isIssueActive) {
            this.globalNetworkIssue = isIssueActive;
            this.logger.log("Global network issue flag set to: ".concat(isIssueActive));
        };
        /**
         * Update the default network status based on recent tests
         * This aggregates recent results to establish a baseline
         */
        NetworkStatusService_1.prototype.updateDefaultStatus = function () {
            if (this.recentTests.size === 0) {
                return;
            }
            // Calculate average speed from recent tests
            var totalDownloadSpeed = 0;
            var downloadSpeedCount = 0;
            var totalUploadSpeed = 0;
            var uploadSpeedCount = 0;
            var totalLatency = 0;
            var latencyCount = 0;
            var stableCount = 0;
            var sufficientBandwidthCount = 0;
            // Connection type counts
            var connectionCounts = {
                'wifi': 0,
                '4g': 0,
                '3g': 0,
                '2g': 0,
                'offline': 0
            };
            // Process recent tests
            for (var _i = 0, _a = this.recentTests.values(); _i < _a.length; _i++) {
                var status_1 = _a[_i];
                // Only consider recent results (less than 30 minutes old)
                var ageMs = Date.now() - status_1.lastUpdated.getTime();
                if (ageMs > 30 * 60 * 1000) {
                    continue;
                }
                if (status_1.downloadSpeed !== undefined) {
                    totalDownloadSpeed += status_1.downloadSpeed;
                    downloadSpeedCount++;
                }
                if (status_1.uploadSpeed !== undefined) {
                    totalUploadSpeed += status_1.uploadSpeed;
                    uploadSpeedCount++;
                }
                if (status_1.latency !== undefined) {
                    totalLatency += status_1.latency;
                    latencyCount++;
                }
                if (status_1.isStable) {
                    stableCount++;
                }
                if (status_1.isSufficientBandwidth) {
                    sufficientBandwidthCount++;
                }
                // Type guard to ensure connectionType is a valid key in connectionCounts
                var connType = status_1.connectionType;
                if (connType in connectionCounts) {
                    connectionCounts[connType]++;
                }
            }
            // Find most common connection type
            var mostCommonConnection = '4g'; // Default
            var maxCount = 0;
            for (var _b = 0, _c = Object.entries(connectionCounts); _b < _c.length; _b++) {
                var _d = _c[_b], type = _d[0], count = _d[1];
                if (count > maxCount) {
                    maxCount = count;
                    mostCommonConnection = type;
                }
            }
            // Update default status
            this.currentStatus = {
                connectionType: mostCommonConnection,
                downloadSpeed: downloadSpeedCount > 0 ? totalDownloadSpeed / downloadSpeedCount : undefined,
                uploadSpeed: uploadSpeedCount > 0 ? totalUploadSpeed / uploadSpeedCount : undefined,
                latency: latencyCount > 0 ? totalLatency / latencyCount : undefined,
                isStable: stableCount > this.recentTests.size / 2, // Majority rule
                isSufficientBandwidth: sufficientBandwidthCount > this.recentTests.size / 2, // Majority rule
                lastUpdated: new Date()
            };
            this.logger.debug("Updated default network status: ".concat(JSON.stringify(this.currentStatus)));
        };
        return NetworkStatusService_1;
    }());
    __setFunctionName(_classThis, "NetworkStatusService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        NetworkStatusService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return NetworkStatusService = _classThis;
}();
exports.NetworkStatusService = NetworkStatusService;
