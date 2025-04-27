"use strict";
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
      if (f !== void 0 && typeof f !== "function")
        throw new TypeError("Function expected");
      return f;
    }
    var kind = contextIn.kind,
      key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target =
      !descriptorIn && ctor
        ? contextIn["static"]
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
      for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
      for (var p in contextIn.access) context.access[p] = contextIn.access[p];
      context.addInitializer = function (f) {
        if (done)
          throw new TypeError(
            "Cannot add initializers after decoration has completed",
          );
        extraInitializers.push(accept(f || null));
      };
      var result = (0, decorators[i])(
        kind === "accessor"
          ? { get: descriptor.get, set: descriptor.set }
          : descriptor[key],
        context,
      );
      if (kind === "accessor") {
        if (result === void 0) continue;
        if (result === null || typeof result !== "object")
          throw new TypeError("Object expected");
        if ((_ = accept(result.get))) descriptor.get = _;
        if ((_ = accept(result.set))) descriptor.set = _;
        if ((_ = accept(result.init))) initializers.unshift(_);
      } else if ((_ = accept(result))) {
        if (kind === "field") initializers.unshift(_);
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
          step(generator["throw"](value));
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
        (typeof Iterator === "function" ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
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
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
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
    if (typeof name === "symbol")
      name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", {
      configurable: true,
      value: prefix ? "".concat(prefix, " ", name) : name,
    });
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.PimStorageService = void 0;
/**
 * PIM-specific storage service with South African optimizations
 */
var common_1 = require("@nestjs/common");
var uuid_1 = require("uuid");
var image_model_1 = require("../models/image.model");
/**
 * PIM-specific storage service with South African optimizations
 * Provides specialized storage operations for the PIM module
 */
var PimStorageService = (function () {
  var _classDecorators = [(0, common_1.Injectable)()];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var PimStorageService = (_classThis = /** @class */ (function () {
    function PimStorageService_1(
      storageService,
      configService,
      networkStatusService,
    ) {
      this.storageService = storageService;
      this.configService = configService;
      this.networkStatusService = networkStatusService;
      this.logger = new common_1.Logger(PimStorageService.name);
      this.bucketName =
        this.configService.get("GCS_BUCKET_NAME") || "fluxori-uploads";
    }
    /**
     * Get a network-aware signed URL for product image upload
     * Optimizes the upload process based on network conditions
     */
    PimStorageService_1.prototype.getSignedUploadUrl = function (options) {
      return __awaiter(this, void 0, void 0, function () {
        var fileName,
          contentType,
          expiresInMinutes,
          _a,
          metadata,
          organizationId,
          networkStatus,
          adaptedExpiresInMinutes,
          enhancedMetadata,
          result;
        return __generator(this, function (_b) {
          switch (_b.label) {
            case 0:
              (fileName = options.fileName),
                (contentType = options.contentType),
                (expiresInMinutes = options.expiresInMinutes),
                (_a = options.metadata),
                (metadata = _a === void 0 ? {} : _a),
                (organizationId = options.organizationId);
              return [
                4 /*yield*/,
                this.networkStatusService.getNetworkStatus(organizationId),
              ];
            case 1:
              networkStatus = _b.sent();
              adaptedExpiresInMinutes = expiresInMinutes;
              // If network is unstable or slow, extend the expiration time
              if (
                !networkStatus.isStable ||
                !networkStatus.isSufficientBandwidth
              ) {
                // Increase expiration time for unstable connections
                adaptedExpiresInMinutes = Math.max(expiresInMinutes || 15, 30);
                this.logger.log(
                  "Extended URL expiration to ".concat(
                    adaptedExpiresInMinutes,
                    " minutes due to network conditions",
                  ),
                );
              }
              enhancedMetadata = __assign(__assign({}, metadata), {
                connectionType: networkStatus.connectionType,
                networkQuality: networkStatus.isSufficientBandwidth
                  ? "good"
                  : "limited",
                timestamp: new Date().toISOString(),
              });
              return [
                4 /*yield*/,
                this.storageService.generateSignedUploadUrl({
                  fileName: fileName,
                  contentType: contentType,
                  expiresInMinutes: adaptedExpiresInMinutes,
                  metadata: enhancedMetadata,
                }),
              ];
            case 2:
              result = _b.sent();
              return [
                2 /*return*/,
                __assign(__assign({}, result), {
                  networkQuality: networkStatus.connectionType,
                }),
              ];
          }
        });
      });
    };
    /**
     * Get a network-aware signed URL for downloading a file
     * Optimizes the download process based on network conditions
     */
    PimStorageService_1.prototype.getSignedDownloadUrl = function (
      filePath,
      expiresInMinutes,
      organizationId,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var networkStatus, adaptedExpiresInMinutes, url, expiresAt;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                this.networkStatusService.getNetworkStatus(organizationId),
              ];
            case 1:
              networkStatus = _a.sent();
              adaptedExpiresInMinutes = expiresInMinutes;
              if (!networkStatus.isStable) {
                // Extend expiration for unstable networks
                adaptedExpiresInMinutes = Math.max(expiresInMinutes || 60, 120);
              }
              return [
                4 /*yield*/,
                this.storageService.getSignedDownloadUrl(
                  filePath,
                  adaptedExpiresInMinutes,
                ),
              ];
            case 2:
              url = _a.sent();
              expiresAt = new Date();
              expiresAt.setMinutes(
                expiresAt.getMinutes() + (adaptedExpiresInMinutes || 60),
              );
              return [
                2 /*return*/,
                {
                  url: url,
                  expiresAt: expiresAt,
                  networkQuality: networkStatus.connectionType,
                },
              ];
          }
        });
      });
    };
    /**
     * Add a file with network-aware optimizations
     * Handles partial uploads and resumable sessions
     */
    PimStorageService_1.prototype.storeFile = function (
      file,
      filePath,
      options,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var _a,
          contentType,
          metadata,
          isPublic,
          organizationId,
          networkStatus,
          enhancedMetadata,
          storedPath,
          url;
        return __generator(this, function (_b) {
          switch (_b.label) {
            case 0:
              (_a = options || {}),
                (contentType = _a.contentType),
                (metadata = _a.metadata),
                (isPublic = _a.isPublic),
                (organizationId = _a.organizationId);
              return [
                4 /*yield*/,
                this.networkStatusService.getNetworkStatus(organizationId),
              ];
            case 1:
              networkStatus = _b.sent();
              enhancedMetadata = __assign(__assign({}, metadata || {}), {
                connectionType: networkStatus.connectionType,
                uploadedAt: new Date().toISOString(),
              });
              return [
                4 /*yield*/,
                this.storageService.uploadFile(file, filePath, {
                  contentType: contentType,
                  metadata: enhancedMetadata,
                  isPublic: isPublic,
                }),
              ];
            case 2:
              storedPath = _b.sent();
              url = isPublic
                ? "https://storage.googleapis.com/"
                    .concat(this.bucketName, "/")
                    .concat(filePath)
                : storedPath;
              return [
                2 /*return*/,
                {
                  url: url,
                  isOptimized: networkStatus.isSufficientBandwidth,
                },
              ];
          }
        });
      });
    };
    /**
     * Get the current network quality
     * Used to adapt UI/UX for different network conditions
     */
    PimStorageService_1.prototype.getNetworkQuality = function (
      organizationId,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var networkStatus, quality, recommendedMaxFileSize;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                this.networkStatusService.getNetworkStatus(organizationId),
              ];
            case 1:
              networkStatus = _a.sent();
              switch (networkStatus.connectionType) {
                case "wifi":
                  quality = "high";
                  recommendedMaxFileSize = 10 * 1024 * 1024; // 10MB
                  break;
                case "4g":
                  quality =
                    networkStatus.downloadSpeed &&
                    networkStatus.downloadSpeed > 5
                      ? "high"
                      : "medium";
                  recommendedMaxFileSize = 5 * 1024 * 1024; // 5MB
                  break;
                case "3g":
                  quality = "medium";
                  recommendedMaxFileSize = 2 * 1024 * 1024; // 2MB
                  break;
                default:
                  quality = "low";
                  recommendedMaxFileSize = 500 * 1024; // 500KB
              }
              return [
                2 /*return*/,
                {
                  connectionType: networkStatus.connectionType,
                  connectionQuality: quality,
                  quality: quality, // For backward compatibility
                  isSufficient: networkStatus.isSufficientBandwidth,
                  recommendedMaxFileSize: recommendedMaxFileSize,
                },
              ];
          }
        });
      });
    };
    /**
     * Upload a product image
     *
     * @param file Image buffer
     * @param options Upload options
     * @returns Product image details
     */
    PimStorageService_1.prototype.uploadProductImage = function (
      file,
      options,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var productId,
          fileName,
          contentType,
          _a,
          imageType,
          _b,
          position,
          _c,
          isMain,
          _d,
          altText,
          _e,
          compressionQuality,
          _f,
          resizeOption,
          _g,
          generateThumbnails,
          _h,
          optimizeForLowBandwidth,
          _j,
          metadata,
          organizationId,
          imageId,
          networkStatus,
          fileExtension,
          storagePath,
          enhancedMetadata,
          result,
          publicUrl,
          cdnDomain,
          cdnUrl,
          thumbnails,
          fileNameWithoutExt,
          fileExt,
          networkOptimization,
          productImage;
        return __generator(this, function (_k) {
          switch (_k.label) {
            case 0:
              (productId = options.productId),
                (fileName = options.fileName),
                (contentType = options.contentType),
                (_a = options.imageType),
                (imageType = _a === void 0 ? "gallery" : _a),
                (_b = options.position),
                (position = _b === void 0 ? 0 : _b),
                (_c = options.isMain),
                (isMain = _c === void 0 ? false : _c),
                (_d = options.altText),
                (altText = _d === void 0 ? "" : _d),
                (_e = options.compressionQuality),
                (compressionQuality =
                  _e === void 0
                    ? image_model_1.CompressionQuality.ADAPTIVE
                    : _e),
                (_f = options.resizeOption),
                (resizeOption =
                  _f === void 0 ? image_model_1.ResizeOption.NONE : _f),
                (_g = options.generateThumbnails),
                (generateThumbnails = _g === void 0 ? true : _g),
                (_h = options.optimizeForLowBandwidth),
                (optimizeForLowBandwidth = _h === void 0 ? true : _h),
                (_j = options.metadata),
                (metadata = _j === void 0 ? {} : _j),
                (organizationId = options.organizationId);
              imageId = (0, uuid_1.v4)();
              return [
                4 /*yield*/,
                this.networkStatusService.getNetworkStatus(organizationId),
              ];
            case 1:
              networkStatus = _k.sent();
              fileExtension = this.getFileExtension(fileName);
              storagePath = "products/"
                .concat(productId, "/")
                .concat(imageType, "/")
                .concat(position, "_")
                .concat(imageId)
                .concat(fileExtension);
              enhancedMetadata = __assign(__assign({}, metadata), {
                imageId: imageId,
                productId: productId,
                imageType: imageType,
                position: position.toString(),
                isMain: isMain.toString(),
                compressionQuality: compressionQuality,
                generateThumbnails: generateThumbnails.toString(),
                resizeOption: resizeOption,
                optimizeForLowBandwidth: optimizeForLowBandwidth.toString(),
                uploadTimestamp: new Date().toISOString(),
                connectionType: networkStatus.connectionType,
              });
              return [
                4 /*yield*/,
                this.storeFile(file, storagePath, {
                  contentType: contentType,
                  metadata: enhancedMetadata,
                  isPublic: true,
                  organizationId: organizationId,
                }),
              ];
            case 2:
              result = _k.sent();
              publicUrl = result.url;
              cdnDomain =
                this.configService.get("CDN_DOMAIN") || "cdn.fluxori.com";
              cdnUrl = "https://".concat(cdnDomain, "/").concat(storagePath);
              thumbnails = {};
              if (generateThumbnails) {
                fileNameWithoutExt = storagePath.substring(
                  0,
                  storagePath.lastIndexOf("."),
                );
                fileExt = storagePath.substring(storagePath.lastIndexOf("."));
                thumbnails.thumbnail = "https://"
                  .concat(cdnDomain, "/")
                  .concat(fileNameWithoutExt, "_thumbnail")
                  .concat(fileExt);
                thumbnails.small = "https://"
                  .concat(cdnDomain, "/")
                  .concat(fileNameWithoutExt, "_small")
                  .concat(fileExt);
                thumbnails.medium = "https://"
                  .concat(cdnDomain, "/")
                  .concat(fileNameWithoutExt, "_medium")
                  .concat(fileExt);
                thumbnails.large = "https://"
                  .concat(cdnDomain, "/")
                  .concat(fileNameWithoutExt, "_large")
                  .concat(fileExt);
              }
              networkOptimization = {
                adaptiveCompression:
                  compressionQuality ===
                  image_model_1.CompressionQuality.ADAPTIVE,
                lowBandwidthOptimized: optimizeForLowBandwidth,
                estimatedSizeBytes: this.estimateImageSize(
                  contentType,
                  resizeOption,
                  compressionQuality,
                ),
                recommendedConnectionType: this.getRecommendedConnectionType(
                  compressionQuality,
                  resizeOption,
                  optimizeForLowBandwidth,
                ),
              };
              productImage = {
                id: imageId,
                productId: productId,
                fileName: fileName,
                storagePath: storagePath,
                publicUrl: publicUrl,
                cdnUrl: cdnUrl,
                imageType: imageType,
                position: position,
                contentType: contentType,
                size: file.length,
                thumbnails: generateThumbnails ? thumbnails : undefined,
                altText: altText,
                isMain: isMain,
                networkOptimization: networkOptimization,
                metadata: enhancedMetadata,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              return [2 /*return*/, productImage];
          }
        });
      });
    };
    /**
     * Get a product image by ID
     *
     * @param imageId Image ID
     * @param organizationId Organization ID
     * @returns Product image details
     */
    PimStorageService_1.prototype.getProductImage = function (
      imageId,
      organizationId,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var files,
          imageFile,
          metadata,
          productId,
          imageType,
          position,
          isMain,
          publicUrl,
          cdnDomain,
          cdnUrl,
          thumbnails,
          fileNameWithoutExt,
          fileExt,
          fileName,
          productImage,
          error_1,
          errorMessage,
          errorStack;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 2, , 3]);
              return [4 /*yield*/, this.storageService.listFiles("products")];
            case 1:
              files = _a.sent();
              imageFile = files.find(function (file) {
                var _a;
                return (
                  ((_a = file.metadata) === null || _a === void 0
                    ? void 0
                    : _a.imageId) === imageId
                );
              });
              if (!imageFile) {
                throw new common_1.NotFoundException(
                  "Image not found with ID: ".concat(imageId),
                );
              }
              metadata = imageFile.metadata || {};
              productId = metadata.productId || "";
              imageType = metadata.imageType || "gallery";
              position = parseInt(metadata.position || "0", 10);
              isMain = metadata.isMain === "true";
              publicUrl = "https://storage.googleapis.com/"
                .concat(this.bucketName, "/")
                .concat(imageFile.name);
              cdnDomain =
                this.configService.get("CDN_DOMAIN") || "cdn.fluxori.com";
              cdnUrl = "https://".concat(cdnDomain, "/").concat(imageFile.name);
              thumbnails = {};
              if (metadata.generateThumbnails === "true") {
                fileNameWithoutExt = imageFile.name.substring(
                  0,
                  imageFile.name.lastIndexOf("."),
                );
                fileExt = imageFile.name.substring(
                  imageFile.name.lastIndexOf("."),
                );
                thumbnails.thumbnail = "https://"
                  .concat(cdnDomain, "/")
                  .concat(fileNameWithoutExt, "_thumbnail")
                  .concat(fileExt);
                thumbnails.small = "https://"
                  .concat(cdnDomain, "/")
                  .concat(fileNameWithoutExt, "_small")
                  .concat(fileExt);
                thumbnails.medium = "https://"
                  .concat(cdnDomain, "/")
                  .concat(fileNameWithoutExt, "_medium")
                  .concat(fileExt);
                thumbnails.large = "https://"
                  .concat(cdnDomain, "/")
                  .concat(fileNameWithoutExt, "_large")
                  .concat(fileExt);
              }
              fileName = imageFile.name.split("/").pop() || imageFile.name;
              productImage = {
                id: imageId,
                productId: productId,
                fileName: fileName,
                storagePath: imageFile.name,
                publicUrl: publicUrl,
                cdnUrl: cdnUrl,
                imageType: imageType,
                position: position,
                contentType: imageFile.contentType,
                size: imageFile.size,
                thumbnails:
                  metadata.generateThumbnails === "true"
                    ? thumbnails
                    : undefined,
                altText: metadata.altText,
                isMain: isMain,
                metadata: metadata,
                createdAt: imageFile.timeCreated,
                updatedAt: imageFile.updated,
              };
              return [2 /*return*/, productImage];
            case 2:
              error_1 = _a.sent();
              if (error_1 instanceof common_1.NotFoundException) {
                throw error_1;
              }
              errorMessage =
                error_1 instanceof Error ? error_1.message : String(error_1);
              errorStack = error_1 instanceof Error ? error_1.stack : undefined;
              this.logger.error(
                "Failed to get product image: ".concat(errorMessage),
                errorStack,
              );
              throw new Error(
                "Failed to get product image: ".concat(errorMessage),
              );
            case 3:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Get all images for a product
     *
     * @param productId Product ID
     * @param organizationId Organization ID
     * @param imageType Optional image type filter
     * @returns Array of product images
     */
    PimStorageService_1.prototype.getProductImages = function (
      productId,
      organizationId,
      imageType,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var prefix,
          files,
          filteredFiles,
          productImages,
          error_2,
          errorMessage,
          errorStack;
        var _this = this;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 2, , 3]);
              prefix = "products/".concat(productId, "/");
              return [4 /*yield*/, this.storageService.listFiles(prefix)];
            case 1:
              files = _a.sent();
              filteredFiles = imageType
                ? files.filter(function (file) {
                    return file.name.includes("/".concat(imageType, "/"));
                  })
                : files;
              productImages = filteredFiles.map(function (file) {
                var metadata = file.metadata || {};
                var imageId = metadata.imageId || file.id;
                var productId = metadata.productId || "";
                var imageType = metadata.imageType || "gallery";
                var position = parseInt(metadata.position || "0", 10);
                var isMain = metadata.isMain === "true";
                // Generate public and CDN URLs
                var publicUrl = "https://storage.googleapis.com/"
                  .concat(_this.bucketName, "/")
                  .concat(file.name);
                var cdnDomain =
                  _this.configService.get("CDN_DOMAIN") || "cdn.fluxori.com";
                var cdnUrl = "https://"
                  .concat(cdnDomain, "/")
                  .concat(file.name);
                // Generate thumbnail URLs
                var thumbnails = {};
                if (metadata.generateThumbnails === "true") {
                  var fileNameWithoutExt = file.name.substring(
                    0,
                    file.name.lastIndexOf("."),
                  );
                  var fileExt = file.name.substring(file.name.lastIndexOf("."));
                  thumbnails.thumbnail = "https://"
                    .concat(cdnDomain, "/")
                    .concat(fileNameWithoutExt, "_thumbnail")
                    .concat(fileExt);
                  thumbnails.small = "https://"
                    .concat(cdnDomain, "/")
                    .concat(fileNameWithoutExt, "_small")
                    .concat(fileExt);
                  thumbnails.medium = "https://"
                    .concat(cdnDomain, "/")
                    .concat(fileNameWithoutExt, "_medium")
                    .concat(fileExt);
                  thumbnails.large = "https://"
                    .concat(cdnDomain, "/")
                    .concat(fileNameWithoutExt, "_large")
                    .concat(fileExt);
                }
                // Get file name from path
                var fileName = file.name.split("/").pop() || file.name;
                // Create the product image object
                return {
                  id: imageId,
                  productId: productId,
                  fileName: fileName,
                  storagePath: file.name,
                  publicUrl: publicUrl,
                  cdnUrl: cdnUrl,
                  imageType: imageType,
                  position: position,
                  contentType: file.contentType,
                  size: file.size,
                  thumbnails:
                    metadata.generateThumbnails === "true"
                      ? thumbnails
                      : undefined,
                  altText: metadata.altText,
                  isMain: isMain,
                  metadata: metadata,
                  createdAt: file.timeCreated,
                  updatedAt: file.updated,
                };
              });
              // Sort by position
              return [
                2 /*return*/,
                productImages.sort(function (a, b) {
                  return a.position - b.position;
                }),
              ];
            case 2:
              error_2 = _a.sent();
              errorMessage =
                error_2 instanceof Error ? error_2.message : String(error_2);
              errorStack = error_2 instanceof Error ? error_2.stack : undefined;
              this.logger.error(
                "Failed to get product images: ".concat(errorMessage),
                errorStack,
              );
              throw new Error(
                "Failed to get product images: ".concat(errorMessage),
              );
            case 3:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Update a product image
     *
     * @param imageId Image ID
     * @param updates Updates to apply
     * @param organizationId Organization ID
     * @returns Updated product image
     */
    PimStorageService_1.prototype.updateProductImage = function (
      imageId,
      updates,
      organizationId,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var image, file, newMetadata, error_3, errorMessage, errorStack;
        var _a, _b, _c;
        return __generator(this, function (_d) {
          switch (_d.label) {
            case 0:
              _d.trys.push([0, 5, , 6]);
              return [
                4 /*yield*/,
                this.getProductImage(imageId, organizationId),
              ];
            case 1:
              image = _d.sent();
              return [
                4 /*yield*/,
                this.storageService.getFile(image.storagePath),
              ];
            case 2:
              file = _d.sent();
              newMetadata = __assign(
                __assign({}, image.metadata),
                updates.metadata || {},
              );
              // Update position if provided
              if (updates.position !== undefined) {
                newMetadata.position = updates.position.toString();
              }
              // Update isMain if provided
              if (updates.isMain !== undefined) {
                newMetadata.isMain = updates.isMain.toString();
              }
              // Update altText if provided
              if (updates.altText !== undefined) {
                newMetadata.altText = updates.altText;
              }
              // Update the last modified timestamp
              newMetadata.updatedAt = new Date().toISOString();
              // Delete the old file
              return [
                4 /*yield*/,
                this.storageService.deleteFile(image.storagePath),
              ];
            case 3:
              // Delete the old file
              _d.sent();
              // Reupload with new metadata
              return [
                4 /*yield*/,
                this.storageService.uploadFile(file, image.storagePath, {
                  contentType: image.contentType,
                  metadata: newMetadata,
                  isPublic: true,
                }),
              ];
            case 4:
              // Reupload with new metadata
              _d.sent();
              // Return the updated image
              return [
                2 /*return*/,
                __assign(__assign({}, image), {
                  altText:
                    (_a = updates.altText) !== null && _a !== void 0
                      ? _a
                      : image.altText,
                  position:
                    (_b = updates.position) !== null && _b !== void 0
                      ? _b
                      : image.position,
                  isMain:
                    (_c = updates.isMain) !== null && _c !== void 0
                      ? _c
                      : image.isMain,
                  metadata: newMetadata,
                  updatedAt: new Date(),
                }),
              ];
            case 5:
              error_3 = _d.sent();
              errorMessage =
                error_3 instanceof Error ? error_3.message : String(error_3);
              errorStack = error_3 instanceof Error ? error_3.stack : undefined;
              this.logger.error(
                "Failed to update product image: ".concat(errorMessage),
                errorStack,
              );
              throw new Error(
                "Failed to update product image: ".concat(errorMessage),
              );
            case 6:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Delete a product image
     *
     * @param imageId Image ID
     * @param organizationId Organization ID
     */
    PimStorageService_1.prototype.deleteProductImage = function (
      imageId,
      organizationId,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var image,
          fileNameWithoutExt,
          fileExt,
          thumbnailError_1,
          errorMessage,
          error_4,
          errorMessage,
          errorStack;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 7, , 8]);
              return [
                4 /*yield*/,
                this.getProductImage(imageId, organizationId),
              ];
            case 1:
              image = _a.sent();
              // Delete the main file
              return [
                4 /*yield*/,
                this.storageService.deleteFile(image.storagePath),
              ];
            case 2:
              // Delete the main file
              _a.sent();
              if (!image.thumbnails) return [3 /*break*/, 6];
              fileNameWithoutExt = image.storagePath.substring(
                0,
                image.storagePath.lastIndexOf("."),
              );
              fileExt = image.storagePath.substring(
                image.storagePath.lastIndexOf("."),
              );
              _a.label = 3;
            case 3:
              _a.trys.push([3, 5, , 6]);
              return [
                4 /*yield*/,
                Promise.all([
                  this.storageService
                    .deleteFile(
                      ""
                        .concat(fileNameWithoutExt, "_thumbnail")
                        .concat(fileExt),
                    )
                    .catch(function () {}),
                  this.storageService
                    .deleteFile(
                      "".concat(fileNameWithoutExt, "_small").concat(fileExt),
                    )
                    .catch(function () {}),
                  this.storageService
                    .deleteFile(
                      "".concat(fileNameWithoutExt, "_medium").concat(fileExt),
                    )
                    .catch(function () {}),
                  this.storageService
                    .deleteFile(
                      "".concat(fileNameWithoutExt, "_large").concat(fileExt),
                    )
                    .catch(function () {}),
                ]),
              ];
            case 4:
              _a.sent();
              return [3 /*break*/, 6];
            case 5:
              thumbnailError_1 = _a.sent();
              errorMessage =
                thumbnailError_1 instanceof Error
                  ? thumbnailError_1.message
                  : String(thumbnailError_1);
              this.logger.warn(
                "Some thumbnails could not be deleted: ".concat(errorMessage),
              );
              return [3 /*break*/, 6];
            case 6:
              return [3 /*break*/, 8];
            case 7:
              error_4 = _a.sent();
              if (error_4 instanceof common_1.NotFoundException) {
                // Image doesn't exist, nothing to delete
                return [2 /*return*/];
              }
              errorMessage =
                error_4 instanceof Error ? error_4.message : String(error_4);
              errorStack = error_4 instanceof Error ? error_4.stack : undefined;
              this.logger.error(
                "Failed to delete product image: ".concat(errorMessage),
                errorStack,
              );
              throw new Error(
                "Failed to delete product image: ".concat(errorMessage),
              );
            case 8:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Helper method to get file extension
     */
    PimStorageService_1.prototype.getFileExtension = function (fileName) {
      var parts = fileName.split(".");
      return parts.length > 1 ? ".".concat(parts[parts.length - 1]) : "";
    };
    /**
     * Helper method to estimate the size of an image based on compression and resize options
     */
    PimStorageService_1.prototype.estimateImageSize = function (
      contentType,
      resizeOption,
      compressionQuality,
    ) {
      var _a, _b;
      // Base size estimates in bytes
      var baseSizes =
        ((_a = {}),
        (_a[image_model_1.ResizeOption.NONE] = 2 * 1024 * 1024),
        (_a[image_model_1.ResizeOption.THUMBNAIL] = 20 * 1024),
        (_a[image_model_1.ResizeOption.SMALL] = 100 * 1024),
        (_a[image_model_1.ResizeOption.MEDIUM] = 500 * 1024),
        (_a[image_model_1.ResizeOption.LARGE] = 1.5 * 1024 * 1024),
        (_a[image_model_1.ResizeOption.CUSTOM] = 1 * 1024 * 1024),
        _a);
      // Quality multipliers
      var qualityMultipliers =
        ((_b = {}),
        (_b[image_model_1.CompressionQuality.LOW] = 0.5),
        (_b[image_model_1.CompressionQuality.MEDIUM] = 1.0),
        (_b[image_model_1.CompressionQuality.HIGH] = 1.5),
        (_b[image_model_1.CompressionQuality.ADAPTIVE] = 0.8),
        _b);
      // Content type multipliers (WebP is more efficient)
      var contentTypeMultipliers = {
        "image/jpeg": 1.0,
        "image/png": 1.2,
        "image/webp": 0.7,
        "image/gif": 1.1,
      };
      var baseSize = baseSizes[resizeOption];
      var qualityMultiplier = qualityMultipliers[compressionQuality];
      var contentTypeMultiplier = contentTypeMultipliers[contentType] || 1.0;
      return Math.round(baseSize * qualityMultiplier * contentTypeMultiplier);
    };
    /**
     * Helper method to get recommended connection type
     */
    PimStorageService_1.prototype.getRecommendedConnectionType = function (
      compressionQuality,
      resizeOption,
      optimizeForLowBandwidth,
    ) {
      // For small thumbnails or highly compressed images with low bandwidth optimization
      if (
        resizeOption === image_model_1.ResizeOption.THUMBNAIL ||
        (compressionQuality === image_model_1.CompressionQuality.LOW &&
          optimizeForLowBandwidth)
      ) {
        return "Works on 2G+";
      }
      // For small images or medium compression with low bandwidth
      if (
        resizeOption === image_model_1.ResizeOption.SMALL ||
        (compressionQuality === image_model_1.CompressionQuality.MEDIUM &&
          optimizeForLowBandwidth)
      ) {
        return "3G or better";
      }
      // For medium images or adaptive compression
      if (
        resizeOption === image_model_1.ResizeOption.MEDIUM ||
        compressionQuality === image_model_1.CompressionQuality.ADAPTIVE
      ) {
        return "3G+ or better";
      }
      // For large or high quality images
      if (
        resizeOption === image_model_1.ResizeOption.LARGE ||
        compressionQuality === image_model_1.CompressionQuality.HIGH
      ) {
        return "4G or WiFi recommended";
      }
      // Default
      return "3G+ or better";
    };
    return PimStorageService_1;
  })());
  __setFunctionName(_classThis, "PimStorageService");
  (function () {
    var _metadata =
      typeof Symbol === "function" && Symbol.metadata
        ? Object.create(null)
        : void 0;
    __esDecorate(
      null,
      (_classDescriptor = { value: _classThis }),
      _classDecorators,
      { kind: "class", name: _classThis.name, metadata: _metadata },
      null,
      _classExtraInitializers,
    );
    PimStorageService = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (PimStorageService = _classThis);
})();
exports.PimStorageService = PimStorageService;
