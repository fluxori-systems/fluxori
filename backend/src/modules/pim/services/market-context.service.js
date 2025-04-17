"use strict";
/**
 * Market Context Service
 *
 * Provides market-specific context information for the PIM module
 * including region detection, VAT rates, and feature availability
 */
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
exports.MarketContextService = void 0;
var common_1 = require("@nestjs/common");
var south_african_vat_1 = require("../utils/south-african-vat");
/**
 * Market Context Service
 *
 * This service determines the market context for a given organization
 * and provides access to market-specific features and configuration
 */
var MarketContextService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var MarketContextService = _classThis = /** @class */ (function () {
        /**
         * Constructor
         *
         * @param featureFlagService The feature flag service
         * @param options Market context provider options
         */
        function MarketContextService_1(featureFlagService, 
        // Use type assertion instead of decorator
        options) {
            if (options === void 0) { options = {}; }
            this.featureFlagService = featureFlagService;
            this.options = options;
        }
        /**
         * Get market context for an organization
         *
         * @param organizationId The organization ID
         * @returns The market context
         */
        MarketContextService_1.prototype.getMarketContext = function (organizationId) {
            return __awaiter(this, void 0, void 0, function () {
                var region, country;
                return __generator(this, function (_a) {
                    region = this.options.defaultRegion;
                    country = this.getDefaultCountryForRegion(region);
                    return [2 /*return*/, this.getMarketContextByRegion(region, country)];
                });
            });
        };
        /**
         * Get market context by explicit region and country
         *
         * @param region The region code
         * @param country The country code
         * @returns The market context
         */
        MarketContextService_1.prototype.getMarketContextByRegion = function (region, country) {
            return __awaiter(this, void 0, void 0, function () {
                var regionalFeatures, vatRate, context;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            // Ensure this is a supported region
                            if (!this.options.enabledRegions.includes(region)) {
                                region = this.options.defaultRegion;
                                country = this.getDefaultCountryForRegion(region);
                            }
                            regionalFeatures = ((_a = this.options.regionalFeatures) === null || _a === void 0 ? void 0 : _a[region]) || {};
                            return [4 /*yield*/, this.getVatRate(region)];
                        case 1:
                            vatRate = _b.sent();
                            context = {
                                region: region,
                                country: country,
                                vatRate: vatRate,
                                defaultCurrency: this.options.regionCurrencies[region] || 'USD',
                                features: {
                                    loadSheddingResilience: !!regionalFeatures.loadSheddingResilience,
                                    networkAwareComponents: !!regionalFeatures.networkAwareComponents,
                                    multiWarehouseSupport: !!regionalFeatures.multiWarehouseSupport,
                                    euVatCompliance: !!regionalFeatures.euVatCompliance,
                                    marketplaceIntegration: !!regionalFeatures.marketplaceIntegration
                                }
                            };
                            return [2 /*return*/, context];
                    }
                });
            });
        };
        /**
         * Check if a feature is available in a given market context
         *
         * @param feature The feature name
         * @param context The market context
         * @returns Whether the feature is available
         */
        MarketContextService_1.prototype.isFeatureAvailable = function (feature, context) {
            return __awaiter(this, void 0, void 0, function () {
                var featureEnabled, featureFlagKey;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // First check if the feature is configured for this region
                            if (feature in context.features) {
                                featureEnabled = context.features[feature];
                                if (featureEnabled === false) {
                                    return [2 /*return*/, false];
                                }
                            }
                            featureFlagKey = "pim.".concat(context.region, ".").concat(feature);
                            return [4 /*yield*/, this.featureFlagService.isEnabled(featureFlagKey, {
                                    attributes: { defaultValue: true }
                                })];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        /**
         * Get VAT rate for a region
         *
         * @param region The region code
         * @param date The date to check (defaults to current date)
         * @returns The VAT rate as a decimal
         */
        MarketContextService_1.prototype.getVatRate = function (region_1) {
            return __awaiter(this, arguments, void 0, function (region, date) {
                var vatSchedule;
                if (date === void 0) { date = new Date(); }
                return __generator(this, function (_a) {
                    switch (region) {
                        case 'south-africa':
                            vatSchedule = south_african_vat_1.SouthAfricanVat.getVatRateForDate(date);
                            return [2 /*return*/, vatSchedule.rate];
                        case 'europe':
                            // European VAT rates vary by country - would need a more complex implementation
                            // This is a placeholder
                            return [2 /*return*/, 0.20]; // 20% as a common EU VAT rate
                        default:
                            // Default VAT rate
                            return [2 /*return*/, 0.15]; // 15% as a reasonable default
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Get all available regions
         *
         * @returns List of available regions
         */
        MarketContextService_1.prototype.getAvailableRegions = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, __spreadArray([], this.options.enabledRegions, true)];
                });
            });
        };
        /**
         * Get default country code for a region
         *
         * @param region The region code
         * @returns The default country code
         */
        MarketContextService_1.prototype.getDefaultCountryForRegion = function (region) {
            var countryMap = {
                'south-africa': 'za',
                'africa': 'za', // Default to South Africa for general Africa region
                'europe': 'gb', // Default to UK for Europe region
                'global': 'us' // Default to US for global region
            };
            return countryMap[region] || 'us';
        };
        return MarketContextService_1;
    }());
    __setFunctionName(_classThis, "MarketContextService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MarketContextService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MarketContextService = _classThis;
}();
exports.MarketContextService = MarketContextService;
