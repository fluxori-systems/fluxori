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
exports.AdvancedImageController = void 0;
var common_1 = require("@nestjs/common");
var firebase_auth_guard_1 = require("../../auth/guards/firebase-auth.guard");
var image_model_1 = require("../models/image.model");
/**
 * Advanced Image Controller
 * Provides endpoints for AI-powered image analysis and advanced image operations
 * Optimized for South African market with network-aware and load shedding resilient processing
 */
var AdvancedImageController = function () {
    var _classDecorators = [(0, common_1.Controller)('pim/advanced-image'), (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _uploadImageWithAnalysis_decorators;
    var _analyzeExistingImage_decorators;
    var _generateAltText_decorators;
    var _checkMarketplaceCompliance_decorators;
    var _assessImageQuality_decorators;
    var _selectMainProductImage_decorators;
    var _getAdaptiveCompressionSettings_decorators;
    var AdvancedImageController = _classThis = /** @class */ (function () {
        function AdvancedImageController_1(imageAnalysisService, pimStorageService, networkAwareStorageService) {
            this.imageAnalysisService = (__runInitializers(this, _instanceExtraInitializers), imageAnalysisService);
            this.pimStorageService = pimStorageService;
            this.networkAwareStorageService = networkAwareStorageService;
        }
        /**
         * Upload an image with AI-powered metadata generation
         *
         * @param data Upload data including file and options
         * @param user Authenticated user
         * @returns Product image with AI-enhanced metadata
         */
        AdvancedImageController_1.prototype.uploadImageWithAnalysis = function (data, user) {
            return __awaiter(this, void 0, void 0, function () {
                var file, options, organizationId, networkQuality, adaptiveCompression, effectiveCompressionQuality, uploadedImage, analysisOptions, optimizationResult, error_1, errorMessage;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 4, , 5]);
                            file = data.file, options = data.options;
                            organizationId = user.organizationId || '';
                            networkQuality = this.networkAwareStorageService.getNetworkQuality();
                            adaptiveCompression = options.compressionQuality === image_model_1.CompressionQuality.ADAPTIVE;
                            effectiveCompressionQuality = options.compressionQuality || image_model_1.CompressionQuality.MEDIUM;
                            // Override compression based on network conditions if adaptive
                            if (adaptiveCompression) {
                                if (networkQuality.quality === 'low') {
                                    effectiveCompressionQuality = image_model_1.CompressionQuality.LOW;
                                }
                                else if (networkQuality.quality === 'medium') {
                                    effectiveCompressionQuality = image_model_1.CompressionQuality.MEDIUM;
                                }
                                else {
                                    effectiveCompressionQuality = image_model_1.CompressionQuality.HIGH;
                                }
                            }
                            return [4 /*yield*/, this.pimStorageService.uploadProductImage(file, __assign(__assign({}, options), { compressionQuality: effectiveCompressionQuality, networkQuality: networkQuality }))];
                        case 1:
                            uploadedImage = _a.sent();
                            if (!(options.analyzeImage && options.productContext)) return [3 /*break*/, 3];
                            analysisOptions = {
                                generateAltText: options.generateAltText !== false,
                                includeColorAnalysis: true,
                                checkMarketplaceCompliance: options.checkMarketplaceCompliance,
                                targetMarketplace: options.targetMarketplace,
                                includeQualityAssessment: true,
                            };
                            return [4 /*yield*/, this.imageAnalysisService.optimizeImageMetadata(uploadedImage, options.productContext, organizationId, user.uid)];
                        case 2:
                            optimizationResult = _a.sent();
                            if (optimizationResult.success && optimizationResult.updatedImage) {
                                // Return the enhanced image with AI-generated metadata
                                return [2 /*return*/, optimizationResult.updatedImage];
                            }
                            _a.label = 3;
                        case 3: 
                        // Return the original image if no analysis was performed or analysis failed
                        return [2 /*return*/, uploadedImage];
                        case 4:
                            error_1 = _a.sent();
                            errorMessage = error_1 instanceof Error ? error_1.message : String(error_1);
                            throw new common_1.HttpException("Failed to upload and analyze image: ".concat(errorMessage), common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Analyze an existing product image
         *
         * @param imageId Image ID to analyze
         * @param options Analysis options
         * @param user Authenticated user
         * @returns Image analysis result
         */
        AdvancedImageController_1.prototype.analyzeExistingImage = function (imageId, options, user) {
            return __awaiter(this, void 0, void 0, function () {
                var organizationId, image, analysisOptions, error_2, errorMessage;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            organizationId = user.organizationId || '';
                            return [4 /*yield*/, this.pimStorageService.getProductImage(imageId, organizationId)];
                        case 1:
                            image = _a.sent();
                            if (!image) {
                                throw new common_1.HttpException('Image not found', common_1.HttpStatus.NOT_FOUND);
                            }
                            analysisOptions = {
                                generateAltText: options.generateAltText !== false,
                                attributes: options.detectAttributes,
                                checkMarketplaceCompliance: options.checkMarketplaceCompliance,
                                targetMarketplace: options.targetMarketplace,
                                includeColorAnalysis: options.includeColorAnalysis !== false,
                                includeQualityAssessment: options.includeQualityAssessment !== false,
                            };
                            return [4 /*yield*/, this.imageAnalysisService.analyzeImage(image.publicUrl, options.productContext, organizationId, user.uid, analysisOptions)];
                        case 2: 
                        // Analyze image
                        return [2 /*return*/, _a.sent()];
                        case 3:
                            error_2 = _a.sent();
                            errorMessage = error_2 instanceof Error ? error_2.message : String(error_2);
                            throw new common_1.HttpException("Failed to analyze image: ".concat(errorMessage), common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Generate SEO-friendly alt text for an image
         *
         * @param imageId Image ID
         * @param data Request data containing product context
         * @param user Authenticated user
         * @returns Generated alt text result
         */
        AdvancedImageController_1.prototype.generateAltText = function (imageId, data, user) {
            return __awaiter(this, void 0, void 0, function () {
                var organizationId, image, result, updatedImage, error_3, errorMessage;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 5, , 6]);
                            organizationId = user.organizationId || '';
                            return [4 /*yield*/, this.pimStorageService.getProductImage(imageId, organizationId)];
                        case 1:
                            image = _a.sent();
                            if (!image) {
                                throw new common_1.HttpException('Image not found', common_1.HttpStatus.NOT_FOUND);
                            }
                            return [4 /*yield*/, this.imageAnalysisService.generateAltText(image.publicUrl, data.productContext, organizationId, user.uid)];
                        case 2:
                            result = _a.sent();
                            if (!(result.success && result.altText)) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.pimStorageService.updateProductImage(imageId, { altText: result.altText }, organizationId)];
                        case 3:
                            updatedImage = _a.sent();
                            return [2 /*return*/, {
                                    altText: result.altText,
                                    success: true,
                                    image: updatedImage,
                                    tokenUsage: result.tokenUsage,
                                }];
                        case 4: return [2 /*return*/, result];
                        case 5:
                            error_3 = _a.sent();
                            errorMessage = error_3 instanceof Error ? error_3.message : String(error_3);
                            throw new common_1.HttpException("Failed to generate alt text: ".concat(errorMessage), common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Check if an image complies with marketplace requirements
         *
         * @param imageId Image ID
         * @param marketplace Marketplace to check compliance for
         * @param user Authenticated user
         * @returns Marketplace compliance result
         */
        AdvancedImageController_1.prototype.checkMarketplaceCompliance = function (imageId, marketplace, user) {
            return __awaiter(this, void 0, void 0, function () {
                var organizationId, image, analysisResult, error_4, errorMessage;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _c.trys.push([0, 3, , 4]);
                            organizationId = user.organizationId || '';
                            return [4 /*yield*/, this.pimStorageService.getProductImage(imageId, organizationId)];
                        case 1:
                            image = _c.sent();
                            if (!image) {
                                throw new common_1.HttpException('Image not found', common_1.HttpStatus.NOT_FOUND);
                            }
                            return [4 /*yield*/, this.imageAnalysisService.analyzeImage(image.publicUrl, { name: 'Product' }, // Minimal context
                                organizationId, user.uid, {
                                    checkMarketplaceCompliance: true,
                                    targetMarketplace: marketplace || 'takealot', // Default to Takealot for South African market
                                })];
                        case 2:
                            analysisResult = _c.sent();
                            return [2 /*return*/, {
                                    compliant: ((_a = analysisResult.marketplaceCompliance) === null || _a === void 0 ? void 0 : _a.compliant) || false,
                                    issues: (_b = analysisResult.marketplaceCompliance) === null || _b === void 0 ? void 0 : _b.issues,
                                    success: analysisResult.success,
                                    error: analysisResult.error,
                                    tokenUsage: analysisResult.tokenUsage
                                }];
                        case 3:
                            error_4 = _c.sent();
                            errorMessage = error_4 instanceof Error ? error_4.message : String(error_4);
                            throw new common_1.HttpException("Failed to check marketplace compliance: ".concat(errorMessage), common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Assess image quality for e-commerce
         *
         * @param imageId Image ID
         * @param user Authenticated user
         * @returns Image quality assessment result
         */
        AdvancedImageController_1.prototype.assessImageQuality = function (imageId, user) {
            return __awaiter(this, void 0, void 0, function () {
                var organizationId, image, error_5, errorMessage;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            organizationId = user.organizationId || '';
                            return [4 /*yield*/, this.pimStorageService.getProductImage(imageId, organizationId)];
                        case 1:
                            image = _a.sent();
                            if (!image) {
                                throw new common_1.HttpException('Image not found', common_1.HttpStatus.NOT_FOUND);
                            }
                            return [4 /*yield*/, this.imageAnalysisService.assessImageQuality(image.publicUrl, organizationId, user.uid)];
                        case 2: 
                        // Assess image quality
                        return [2 /*return*/, _a.sent()];
                        case 3:
                            error_5 = _a.sent();
                            errorMessage = error_5 instanceof Error ? error_5.message : String(error_5);
                            throw new common_1.HttpException("Failed to assess image quality: ".concat(errorMessage), common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Select main product image from a set of product images
         *
         * @param productId Product ID
         * @param data Request data containing product context
         * @param user Authenticated user
         * @returns Main image selection result
         */
        AdvancedImageController_1.prototype.selectMainProductImage = function (productId, data, user) {
            return __awaiter(this, void 0, void 0, function () {
                var organizationId_1, images, result_1, mainImage, error_6, errorMessage;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 5, , 6]);
                            organizationId_1 = user.organizationId || '';
                            return [4 /*yield*/, this.pimStorageService.getProductImages(productId, organizationId_1)];
                        case 1:
                            images = _a.sent();
                            if (!images || images.length === 0) {
                                throw new common_1.HttpException('No images found for this product', common_1.HttpStatus.NOT_FOUND);
                            }
                            return [4 /*yield*/, this.imageAnalysisService.identifyMainProductImage(images, data.productContext, organizationId_1, user.uid)];
                        case 2:
                            result_1 = _a.sent();
                            if (!(result_1.success && result_1.mainImageIndex !== undefined && result_1.mainImageIndex >= 0)) return [3 /*break*/, 4];
                            mainImage = images[result_1.mainImageIndex];
                            // Update all images to ensure only one is marked as main
                            return [4 /*yield*/, Promise.all(images.map(function (image, index) {
                                    return _this.pimStorageService.updateProductImage(image.id, { isMain: index === result_1.mainImageIndex }, organizationId_1);
                                }))];
                        case 3:
                            // Update all images to ensure only one is marked as main
                            _a.sent();
                            return [2 /*return*/, __assign(__assign({}, result_1), { mainImage: mainImage })];
                        case 4: return [2 /*return*/, result_1];
                        case 5:
                            error_6 = _a.sent();
                            errorMessage = error_6 instanceof Error ? error_6.message : String(error_6);
                            throw new common_1.HttpException("Failed to select main product image: ".concat(errorMessage), common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get adaptive compression settings based on network conditions
         *
         * @returns Recommended compression settings based on current network quality
         */
        AdvancedImageController_1.prototype.getAdaptiveCompressionSettings = function () {
            return __awaiter(this, void 0, void 0, function () {
                var networkQuality, recommendedSettings;
                return __generator(this, function (_a) {
                    networkQuality = this.networkAwareStorageService.getNetworkQuality();
                    recommendedSettings = {
                        compressionQuality: image_model_1.CompressionQuality.MEDIUM,
                        generateThumbnails: true,
                        optimizeForLowBandwidth: false,
                        networkQuality: networkQuality,
                    };
                    // Adjust settings based on network conditions
                    if (networkQuality.quality === 'low') {
                        recommendedSettings = __assign(__assign({}, recommendedSettings), { compressionQuality: image_model_1.CompressionQuality.LOW, optimizeForLowBandwidth: true });
                    }
                    else if (networkQuality.quality === 'medium') {
                        recommendedSettings = __assign(__assign({}, recommendedSettings), { compressionQuality: image_model_1.CompressionQuality.MEDIUM, optimizeForLowBandwidth: true });
                    }
                    else {
                        recommendedSettings = __assign(__assign({}, recommendedSettings), { compressionQuality: image_model_1.CompressionQuality.HIGH, optimizeForLowBandwidth: false });
                    }
                    return [2 /*return*/, recommendedSettings];
                });
            });
        };
        return AdvancedImageController_1;
    }());
    __setFunctionName(_classThis, "AdvancedImageController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _uploadImageWithAnalysis_decorators = [(0, common_1.Post)('upload')];
        _analyzeExistingImage_decorators = [(0, common_1.Post)('analyze/:imageId')];
        _generateAltText_decorators = [(0, common_1.Post)('generate-alt-text/:imageId')];
        _checkMarketplaceCompliance_decorators = [(0, common_1.Get)('marketplace-compliance/:imageId')];
        _assessImageQuality_decorators = [(0, common_1.Get)('quality-assessment/:imageId')];
        _selectMainProductImage_decorators = [(0, common_1.Post)('select-main-image/:productId')];
        _getAdaptiveCompressionSettings_decorators = [(0, common_1.Get)('adaptive-compression-settings')];
        __esDecorate(_classThis, null, _uploadImageWithAnalysis_decorators, { kind: "method", name: "uploadImageWithAnalysis", static: false, private: false, access: { has: function (obj) { return "uploadImageWithAnalysis" in obj; }, get: function (obj) { return obj.uploadImageWithAnalysis; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _analyzeExistingImage_decorators, { kind: "method", name: "analyzeExistingImage", static: false, private: false, access: { has: function (obj) { return "analyzeExistingImage" in obj; }, get: function (obj) { return obj.analyzeExistingImage; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateAltText_decorators, { kind: "method", name: "generateAltText", static: false, private: false, access: { has: function (obj) { return "generateAltText" in obj; }, get: function (obj) { return obj.generateAltText; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _checkMarketplaceCompliance_decorators, { kind: "method", name: "checkMarketplaceCompliance", static: false, private: false, access: { has: function (obj) { return "checkMarketplaceCompliance" in obj; }, get: function (obj) { return obj.checkMarketplaceCompliance; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _assessImageQuality_decorators, { kind: "method", name: "assessImageQuality", static: false, private: false, access: { has: function (obj) { return "assessImageQuality" in obj; }, get: function (obj) { return obj.assessImageQuality; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _selectMainProductImage_decorators, { kind: "method", name: "selectMainProductImage", static: false, private: false, access: { has: function (obj) { return "selectMainProductImage" in obj; }, get: function (obj) { return obj.selectMainProductImage; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAdaptiveCompressionSettings_decorators, { kind: "method", name: "getAdaptiveCompressionSettings", static: false, private: false, access: { has: function (obj) { return "getAdaptiveCompressionSettings" in obj; }, get: function (obj) { return obj.getAdaptiveCompressionSettings; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AdvancedImageController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AdvancedImageController = _classThis;
}();
exports.AdvancedImageController = AdvancedImageController;
