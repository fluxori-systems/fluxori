'use strict';
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
      if (f !== void 0 && typeof f !== 'function')
        throw new TypeError('Function expected');
      return f;
    }
    var kind = contextIn.kind,
      key = kind === 'getter' ? 'get' : kind === 'setter' ? 'set' : 'value';
    var target =
      !descriptorIn && ctor
        ? contextIn['static']
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
      for (var p in contextIn) context[p] = p === 'access' ? {} : contextIn[p];
      for (var p in contextIn.access) context.access[p] = contextIn.access[p];
      context.addInitializer = function (f) {
        if (done)
          throw new TypeError(
            'Cannot add initializers after decoration has completed',
          );
        extraInitializers.push(accept(f || null));
      };
      var result = (0, decorators[i])(
        kind === 'accessor'
          ? { get: descriptor.get, set: descriptor.set }
          : descriptor[key],
        context,
      );
      if (kind === 'accessor') {
        if (result === void 0) continue;
        if (result === null || typeof result !== 'object')
          throw new TypeError('Object expected');
        if ((_ = accept(result.get))) descriptor.get = _;
        if ((_ = accept(result.set))) descriptor.set = _;
        if ((_ = accept(result.init))) initializers.unshift(_);
      } else if ((_ = accept(result))) {
        if (kind === 'field') initializers.unshift(_);
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
          step(generator['throw'](value));
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
        (typeof Iterator === 'function' ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g['throw'] = verb(1)),
      (g['return'] = verb(2)),
      typeof Symbol === 'function' &&
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
      if (f) throw new TypeError('Generator is already executing.');
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                    ? y['throw'] || ((t = y['return']) && t.call(y), 0)
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
    if (typeof name === 'symbol')
      name = name.description ? '['.concat(name.description, ']') : '';
    return Object.defineProperty(f, 'name', {
      configurable: true,
      value: prefix ? ''.concat(prefix, ' ', name) : name,
    });
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.ImageAnalysisService = void 0;
/**
 * Image Analysis Service
 *
 * AI-powered image analysis service for the PIM module with
 * South African market optimization for low-bandwidth scenarios.
 *
 * Complete TypeScript-compliant implementation with proper interfaces and typing.
 */
var common_1 = require('@nestjs/common');
/**
 * AI-powered image analysis service
 */
var ImageAnalysisService = (function () {
  var _classDecorators = [(0, common_1.Injectable)()];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var ImageAnalysisService = (_classThis = /** @class */ (function () {
    function ImageAnalysisService_1(
      agentService,
      creditSystemService,
      featureFlagService,
      modelRegistryRepository,
      configService,
      tokenEstimator,
      networkAwareStorageService,
      loadSheddingService,
    ) {
      this.agentService = agentService;
      this.creditSystemService = creditSystemService;
      this.featureFlagService = featureFlagService;
      this.modelRegistryRepository = modelRegistryRepository;
      this.configService = configService;
      this.tokenEstimator = tokenEstimator;
      this.networkAwareStorageService = networkAwareStorageService;
      this.loadSheddingService = loadSheddingService;
      this.logger = new common_1.Logger(ImageAnalysisService.name);
      this.defaultModelId =
        this.configService.get('DEFAULT_VISION_MODEL_ID') || 'gpt-4-vision';
    }
    /**
     * Analyze an image to extract attributes, alt text, and other metadata
     *
     * @param imageUrl URL of the image to analyze
     * @param productContext Context information about the product
     * @param organizationId Organization ID for credit tracking
     * @param userId User ID for credit tracking
     * @param options Analysis options
     * @returns Analysis result
     */
    ImageAnalysisService_1.prototype.analyzeImage = function (
      imageUrl_1,
      productContext_1,
      organizationId_1,
      userId_1,
    ) {
      return __awaiter(
        this,
        arguments,
        void 0,
        function (imageUrl, productContext, organizationId, userId, options) {
          var featureEnabled,
            networkQuality,
            useLightweightModel,
            modelId_1,
            prompt_1,
            error_1;
          var _this = this;
          if (options === void 0) {
            options = {};
          }
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                _a.trys.push([0, 2, , 3]);
                return [
                  4 /*yield*/,
                  this.featureFlagService.isEnabled('pim.ai.image-analysis', {
                    userId: userId,
                    organizationId: organizationId,
                    defaultValue: true,
                  }),
                ];
              case 1:
                featureEnabled = _a.sent();
                if (!featureEnabled) {
                  this.logger.warn('Image analysis feature is disabled');
                  return [
                    2 /*return*/,
                    {
                      success: false,
                      error: 'Image analysis feature is disabled',
                    },
                  ];
                }
                networkQuality = options.networkQuality;
                useLightweightModel =
                  networkQuality &&
                  ((networkQuality.downlink && networkQuality.downlink < 1.5) ||
                    networkQuality.effectiveType === '2g' ||
                    networkQuality.effectiveType === 'slow-2g');
                modelId_1 = useLightweightModel
                  ? this.configService.get('LIGHTWEIGHT_VISION_MODEL_ID') ||
                    'gpt-4-vision'
                  : this.defaultModelId;
                prompt_1 = this.prepareImageAnalysisPrompt(
                  productContext,
                  options,
                  networkQuality,
                );
                // Execute with load shedding resilience if available
                if (this.loadSheddingService) {
                  return [
                    2 /*return*/,
                    this.loadSheddingService.executeWithResilience(function () {
                      return _this.executeImageAnalysis(
                        imageUrl,
                        prompt_1,
                        modelId_1,
                        organizationId,
                        userId,
                      );
                    }),
                  ];
                }
                // Standard execution
                return [
                  2 /*return*/,
                  this.executeImageAnalysis(
                    imageUrl,
                    prompt_1,
                    modelId_1,
                    organizationId,
                    userId,
                  ),
                ];
              case 2:
                error_1 = _a.sent();
                this.logger.error(
                  'Error analyzing image: '.concat(error_1.message),
                  error_1.stack,
                );
                return [
                  2 /*return*/,
                  {
                    success: false,
                    error: 'Error analyzing image: '.concat(error_1.message),
                  },
                ];
              case 3:
                return [2 /*return*/];
            }
          });
        },
      );
    };
    /**
     * Execute image analysis with AI model
     *
     * @param imageUrl URL of the image
     * @param prompt Analysis prompt
     * @param modelId AI model ID
     * @param organizationId Organization ID
     * @param userId User ID
     * @returns Analysis result
     */
    ImageAnalysisService_1.prototype.executeImageAnalysis = function (
      imageUrl,
      prompt,
      modelId,
      organizationId,
      userId,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var reserveResult, result, analysisResult, tokenUsage, error_2;
        var _a, _b, _c;
        return __generator(this, function (_d) {
          switch (_d.label) {
            case 0:
              return [
                4 /*yield*/,
                this.creditSystemService.reserveTokens({
                  organizationId: organizationId,
                  feature: 'ai.image-analysis',
                  estimatedTokens: 1000, // Estimate, will be adjusted later
                  userId: userId,
                }),
              ];
            case 1:
              reserveResult = _d.sent();
              if (!reserveResult.success) {
                return [
                  2 /*return*/,
                  {
                    success: false,
                    error:
                      reserveResult.error ||
                      'Failed to reserve credits for image analysis',
                  },
                ];
              }
              _d.label = 2;
            case 2:
              _d.trys.push([2, 5, , 7]);
              return [
                4 /*yield*/,
                this.agentService.processImage(imageUrl, {
                  prompt: prompt,
                  modelId: modelId,
                  responseFormat: { type: 'json_object' },
                  temperature: 0.2,
                }),
              ];
            case 3:
              result = _d.sent();
              if (!result || !result.content) {
                throw new Error('No result returned from AI model');
              }
              analysisResult = this.parseAnalysisResult(result.content);
              tokenUsage = {
                input:
                  ((_a = result.usage) === null || _a === void 0
                    ? void 0
                    : _a.promptTokens) || prompt.length / 4 + 1000, // 1000 tokens for image
                output:
                  ((_b = result.usage) === null || _b === void 0
                    ? void 0
                    : _b.completionTokens) ||
                  JSON.stringify(analysisResult).length / 4,
                total:
                  ((_c = result.usage) === null || _c === void 0
                    ? void 0
                    : _c.totalTokens) ||
                  prompt.length / 4 +
                    JSON.stringify(analysisResult).length / 4 +
                    1000,
              };
              // Update token usage in result
              analysisResult.tokenUsage = tokenUsage;
              // Commit token usage
              return [
                4 /*yield*/,
                this.creditSystemService.commitReservedTokens({
                  reservationId: reserveResult.reservationId,
                  actualTokens: tokenUsage.total,
                }),
              ];
            case 4:
              // Commit token usage
              _d.sent();
              return [
                2 /*return*/,
                __assign(__assign({}, analysisResult), { success: true }),
              ];
            case 5:
              error_2 = _d.sent();
              // Release the reserved credits
              return [
                4 /*yield*/,
                this.creditSystemService.releaseReservedTokens({
                  reservationId: reserveResult.reservationId,
                }),
              ];
            case 6:
              // Release the reserved credits
              _d.sent();
              this.logger.error(
                'Error in AI image analysis: '.concat(error_2.message),
                error_2.stack,
              );
              return [
                2 /*return*/,
                {
                  success: false,
                  error: 'AI analysis failed: '.concat(error_2.message),
                },
              ];
            case 7:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Prepare prompt for image analysis based on context and options
     *
     * @param productContext Product context
     * @param options Analysis options
     * @param networkQuality Network quality info for adaptive processing
     * @returns Formatted prompt
     */
    ImageAnalysisService_1.prototype.prepareImageAnalysisPrompt = function (
      productContext,
      options,
      networkQuality,
    ) {
      // Adapt detail level based on network quality
      var detailLevel =
        networkQuality && networkQuality.downlink
          ? networkQuality.downlink < 1
            ? 'basic'
            : networkQuality.downlink < 3
              ? 'standard'
              : 'detailed'
          : 'standard';
      // Base task definition
      var prompt =
        'Analyze this product image considering the following context:\n\nProduct Name: '
          .concat(productContext.name, '\n')
          .concat(
            productContext.category
              ? 'Category: '.concat(productContext.category)
              : '',
            '\n',
          )
          .concat(
            productContext.description
              ? 'Description: '.concat(productContext.description)
              : '',
            '\n',
          );
      // Add attributes if available
      if (
        productContext.attributes &&
        Object.keys(productContext.attributes).length > 0
      ) {
        prompt += '\nProduct Attributes:\n';
        Object.entries(productContext.attributes).forEach(function (_a) {
          var key = _a[0],
            value = _a[1];
          prompt += '- '.concat(key, ': ').concat(value, '\n');
        });
      }
      // Build tasks based on options
      var tasks = [];
      if (options.generateAltText !== false) {
        tasks.push(
          'Generate a '.concat(
            detailLevel === 'detailed' ? 'comprehensive' : 'concise',
            ' alt text description for the image that would be useful for SEO and accessibility.',
          ),
        );
      }
      if (options.includeColorAnalysis) {
        tasks.push(
          'Identify the dominant colors in the image with their approximate hex codes and percentages. '.concat(
            detailLevel === 'detailed'
              ? 'Also determine background and foreground colors.'
              : '',
          ),
        );
      }
      if (options.detectObjects) {
        tasks.push(
          'Detect main objects in the image'.concat(
            detailLevel === 'detailed'
              ? ' with their approximate positions and confidence scores'
              : '',
            '.',
          ),
        );
      }
      if (options.extractAttributes) {
        tasks.push(
          'Extract visual product attributes from the image that might not be in the provided attributes (e.g., color, pattern, style, materials, shape).',
        );
      }
      if (options.includeQualityAssessment) {
        tasks.push(
          'Assess the image quality in terms of sharpness, brightness, contrast, and noise. Provide scores from 0-100.',
        );
      }
      if (options.checkMarketplaceCompliance && options.targetMarketplace) {
        tasks.push(
          'Evaluate if this image is compliant with '.concat(
            options.targetMarketplace,
            ' marketplace requirements for product listings. Identify any issues that should be fixed.',
          ),
        );
      }
      // Add tasks to prompt
      prompt += '\n\nTasks:\n';
      tasks.forEach(function (task, index) {
        prompt += ''.concat(index + 1, '. ').concat(task, '\n');
      });
      // Add response format instruction
      prompt +=
        '\nRespond in JSON format with the following structure (include only the requested elements):\n{\n  "altText": "string, descriptive alt text for the image",\n  "tags": ["array of keywords relevant to the image"],\n  '
          .concat(
            options.includeColorAnalysis
              ? '"colors": {\n    "dominant": [{"color": "color name", "hex": "#hexcode", "percentage": number}],\n    "background": "background color name and hex",\n    "foreground": "foreground color name and hex"\n  },'
              : '',
            '\n  ',
          )
          .concat(
            options.detectObjects
              ? '"objects": [{"name": "object name", "confidence": number, "boundingBox": {"x": number, "y": number, "width": number, "height": number}}],'
              : '',
            '\n  ',
          )
          .concat(
            options.includeQualityAssessment
              ? '"quality": {"overallScore": number, "sharpness": number, "brightness": number, "contrast": number, "noise": number},'
              : '',
            '\n  ',
          )
          .concat(
            options.checkMarketplaceCompliance
              ? '"marketplaceCompliance": {"compliant": boolean, "issues": ["array of issues if any"]},'
              : '',
            '\n  ',
          )
          .concat(
            options.extractAttributes
              ? '"attributes": {"attribute name": "attribute value"},'
              : '',
            '\n}\n\nThe level of detail should be ',
          )
          .concat(detailLevel, " based on the user's network conditions.");
      if (options.language && options.language !== 'en') {
        prompt += '\n\nRespond in '.concat(options.language, ' language.');
      }
      return prompt;
    };
    /**
     * Parse AI model response to structured analysis result
     *
     * @param content AI model response content
     * @returns Structured analysis result
     */
    ImageAnalysisService_1.prototype.parseAnalysisResult = function (content) {
      try {
        // If content is already an object, use it directly
        if (typeof content === 'object') {
          return content;
        }
        // Otherwise parse JSON
        return JSON.parse(content);
      } catch (error) {
        this.logger.error(
          'Error parsing analysis result: '.concat(error.message),
          error.stack,
        );
        // Attempt to extract structured data from unstructured response
        var altTextMatch = content.match(/altText["']?:\s*["']([^"']+)["']/);
        var result = {
          success: true,
        };
        if (altTextMatch && altTextMatch[1]) {
          result.altText = altTextMatch[1];
        }
        return result;
      }
    };
    /**
     * Optimize product image metadata based on AI analysis
     *
     * @param image Product image to optimize
     * @param productContext Product context for analysis
     * @param organizationId Organization ID for credit tracking
     * @param userId User ID for credit tracking
     * @param options Analysis options
     * @returns Optimization result with updated image
     */
    ImageAnalysisService_1.prototype.optimizeImageMetadata = function (
      image_1,
      productContext_1,
      organizationId_1,
      userId_1,
    ) {
      return __awaiter(
        this,
        arguments,
        void 0,
        function (image, productContext, organizationId, userId, options) {
          var analysisResult, updatedImage, error_3;
          var _a, _b, _c, _d;
          if (options === void 0) {
            options = {};
          }
          return __generator(this, function (_e) {
            switch (_e.label) {
              case 0:
                _e.trys.push([0, 2, , 3]);
                if (!image || !image.url) {
                  return [
                    2 /*return*/,
                    {
                      success: false,
                      error: 'Invalid image provided',
                    },
                  ];
                }
                return [
                  4 /*yield*/,
                  this.analyzeImage(
                    image.url,
                    productContext,
                    organizationId,
                    userId,
                    options,
                  ),
                ];
              case 1:
                analysisResult = _e.sent();
                if (!analysisResult.success) {
                  return [
                    2 /*return*/,
                    {
                      success: false,
                      error: analysisResult.error || 'Image analysis failed',
                      tokenUsage: analysisResult.tokenUsage,
                    },
                  ];
                }
                updatedImage = __assign(__assign({}, image), {
                  altText: analysisResult.altText || image.altText,
                  tags: analysisResult.tags || image.tags,
                  metadata: __assign(
                    __assign(
                      __assign({}, image.metadata),
                      analysisResult.attributes,
                    ),
                    {
                      colors:
                        (_b =
                          (_a = analysisResult.colors) === null || _a === void 0
                            ? void 0
                            : _a.dominant) === null || _b === void 0
                          ? void 0
                          : _b
                              .map(function (c) {
                                return c.color;
                              })
                              .join(', '),
                      quality:
                        (_c = analysisResult.quality) === null || _c === void 0
                          ? void 0
                          : _c.overallScore,
                    },
                  ),
                });
                // Apply optimizations based on analysis
                if (
                  analysisResult.marketplaceCompliance &&
                  !analysisResult.marketplaceCompliance.compliant
                ) {
                  updatedImage.metadata = __assign(
                    __assign({}, updatedImage.metadata),
                    {
                      marketplaceIssues:
                        (_d = analysisResult.marketplaceCompliance.issues) ===
                          null || _d === void 0
                          ? void 0
                          : _d.join(', '),
                      needsOptimization: 'true',
                    },
                  );
                }
                return [
                  2 /*return*/,
                  {
                    success: true,
                    updatedImage: updatedImage,
                    tokenUsage: analysisResult.tokenUsage,
                  },
                ];
              case 2:
                error_3 = _e.sent();
                this.logger.error(
                  'Error optimizing image metadata: '.concat(error_3.message),
                  error_3.stack,
                );
                return [
                  2 /*return*/,
                  {
                    success: false,
                    error: 'Optimization failed: '.concat(error_3.message),
                  },
                ];
              case 3:
                return [2 /*return*/];
            }
          });
        },
      );
    };
    /**
     * Generate alt text for a product image
     *
     * @param imageUrl URL of the image
     * @param productContext Product context for better alt text generation
     * @param organizationId Organization ID for credit tracking
     * @param userId User ID for credit tracking
     * @param language Target language for alt text
     * @returns Generated alt text
     */
    ImageAnalysisService_1.prototype.generateAltText = function (
      imageUrl_1,
      productContext_1,
      organizationId_1,
      userId_1,
    ) {
      return __awaiter(
        this,
        arguments,
        void 0,
        function (imageUrl, productContext, organizationId, userId, language) {
          var analysisResult, error_4;
          if (language === void 0) {
            language = 'en';
          }
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                _a.trys.push([0, 2, , 3]);
                return [
                  4 /*yield*/,
                  this.analyzeImage(
                    imageUrl,
                    productContext,
                    organizationId,
                    userId,
                    {
                      generateAltText: true,
                      language: language,
                    },
                  ),
                ];
              case 1:
                analysisResult = _a.sent();
                if (!analysisResult.success || !analysisResult.altText) {
                  return [
                    2 /*return*/,
                    {
                      altText: '',
                      success: false,
                      error:
                        analysisResult.error || 'Failed to generate alt text',
                      tokenUsage: analysisResult.tokenUsage,
                    },
                  ];
                }
                return [
                  2 /*return*/,
                  {
                    altText: analysisResult.altText,
                    success: true,
                    tokenUsage: analysisResult.tokenUsage,
                  },
                ];
              case 2:
                error_4 = _a.sent();
                this.logger.error(
                  'Error generating alt text: '.concat(error_4.message),
                  error_4.stack,
                );
                return [
                  2 /*return*/,
                  {
                    altText: '',
                    success: false,
                    error: 'Alt text generation failed: '.concat(
                      error_4.message,
                    ),
                  },
                ];
              case 3:
                return [2 /*return*/];
            }
          });
        },
      );
    };
    /**
     * Check if an image meets marketplace compliance requirements
     *
     * @param imageUrl URL of the image
     * @param productContext Product context for compliance checking
     * @param marketplace Target marketplace to check compliance for
     * @param organizationId Organization ID for credit tracking
     * @param userId User ID for credit tracking
     * @returns Compliance check result
     */
    ImageAnalysisService_1.prototype.checkMarketplaceCompliance = function (
      imageUrl,
      productContext,
      marketplace,
      organizationId,
      userId,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var analysisResult, error_5;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 2, , 3]);
              return [
                4 /*yield*/,
                this.analyzeImage(
                  imageUrl,
                  productContext,
                  organizationId,
                  userId,
                  {
                    checkMarketplaceCompliance: true,
                    targetMarketplace: marketplace,
                  },
                ),
              ];
            case 1:
              analysisResult = _a.sent();
              if (!analysisResult.success) {
                return [
                  2 /*return*/,
                  {
                    compliant: false,
                    success: false,
                    error:
                      analysisResult.error ||
                      'Failed to check marketplace compliance',
                    tokenUsage: analysisResult.tokenUsage,
                  },
                ];
              }
              if (!analysisResult.marketplaceCompliance) {
                return [
                  2 /*return*/,
                  {
                    compliant: true, // Assume compliant if not explicitly checked
                    success: true,
                    tokenUsage: analysisResult.tokenUsage,
                  },
                ];
              }
              return [
                2 /*return*/,
                {
                  compliant: analysisResult.marketplaceCompliance.compliant,
                  issues: analysisResult.marketplaceCompliance.issues,
                  success: true,
                  tokenUsage: analysisResult.tokenUsage,
                },
              ];
            case 2:
              error_5 = _a.sent();
              this.logger.error(
                'Error checking marketplace compliance: '.concat(
                  error_5.message,
                ),
                error_5.stack,
              );
              return [
                2 /*return*/,
                {
                  compliant: false,
                  success: false,
                  error: 'Compliance check failed: '.concat(error_5.message),
                },
              ];
            case 3:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Assess image quality (sharpness, brightness, etc.)
     *
     * @param imageUrl URL of the image
     * @param organizationId Organization ID for credit tracking
     * @param userId User ID for credit tracking
     * @returns Quality assessment result
     */
    ImageAnalysisService_1.prototype.assessImageQuality = function (
      imageUrl,
      organizationId,
      userId,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var analysisResult, error_6;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 2, , 3]);
              return [
                4 /*yield*/,
                this.analyzeImage(
                  imageUrl,
                  { name: 'Product' }, // Minimal context for quality assessment
                  organizationId,
                  userId,
                  {
                    includeQualityAssessment: true,
                  },
                ),
              ];
            case 1:
              analysisResult = _a.sent();
              if (!analysisResult.success) {
                return [
                  2 /*return*/,
                  {
                    quality: null,
                    success: false,
                    error:
                      analysisResult.error || 'Failed to assess image quality',
                    tokenUsage: analysisResult.tokenUsage,
                  },
                ];
              }
              return [
                2 /*return*/,
                {
                  quality: analysisResult.quality || { overallScore: 0 },
                  success: true,
                  tokenUsage: analysisResult.tokenUsage,
                },
              ];
            case 2:
              error_6 = _a.sent();
              this.logger.error(
                'Error assessing image quality: '.concat(error_6.message),
                error_6.stack,
              );
              return [
                2 /*return*/,
                {
                  quality: null,
                  success: false,
                  error: 'Quality assessment failed: '.concat(error_6.message),
                },
              ];
            case 3:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Identify the best image to use as main product image from a set of images
     *
     * @param images Array of product images to choose from
     * @param productContext Product context information to make relevant selection
     * @param organizationId Organization ID for credit tracking
     * @param userId User ID for credit tracking
     * @returns Result with the index of the main image
     */
    ImageAnalysisService_1.prototype.identifyMainProductImage = function (
      images,
      productContext,
      organizationId,
      userId,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var featureEnabled,
          reserveResult,
          prompt_2,
          imageUrls_1,
          result,
          content,
          tokenUsage,
          mainImageIndex,
          error_7,
          error_8;
        var _this = this;
        var _a, _b, _c;
        return __generator(this, function (_d) {
          switch (_d.label) {
            case 0:
              _d.trys.push([0, 12, , 13]);
              return [
                4 /*yield*/,
                this.featureFlagService.isEnabled(
                  'pim.ai.main-image-selection',
                  {
                    userId: userId,
                    organizationId: organizationId,
                    defaultValue: true,
                  },
                ),
              ];
            case 1:
              featureEnabled = _d.sent();
              if (!featureEnabled) {
                this.logger.warn('Main image selection feature is disabled');
                // Return first image as main if feature is disabled
                return [
                  2 /*return*/,
                  {
                    success: true,
                    mainImageIndex: 0,
                    reason: 'Feature disabled, returned first image as main',
                  },
                ];
              }
              // If there's only one image, return it as main
              if (images.length === 1) {
                return [
                  2 /*return*/,
                  {
                    success: true,
                    mainImageIndex: 0,
                    reason: 'Only one image available',
                  },
                ];
              }
              return [
                4 /*yield*/,
                this.creditSystemService.reserveTokens({
                  organizationId: organizationId,
                  feature: 'ai.image-analysis',
                  estimatedTokens: 1500, // Estimate, will be adjusted later
                  userId: userId,
                }),
              ];
            case 2:
              reserveResult = _d.sent();
              if (!reserveResult.success) {
                return [
                  2 /*return*/,
                  {
                    success: false,
                    error:
                      reserveResult.error ||
                      'Failed to reserve credits for image analysis',
                  },
                ];
              }
              _d.label = 3;
            case 3:
              _d.trys.push([3, 9, , 11]);
              prompt_2 = this.prepareMainImageSelectionPrompt(
                images,
                productContext,
              );
              imageUrls_1 = images.map(function (img) {
                return img.publicUrl;
              });
              result = void 0;
              if (!this.loadSheddingService) return [3 /*break*/, 5];
              return [
                4 /*yield*/,
                this.loadSheddingService.executeWithResilience(function () {
                  return _this.agentService.processImage(imageUrls_1[0], {
                    prompt: prompt_2,
                    modelId: _this.defaultModelId,
                    responseFormat: { type: 'json_object' },
                    temperature: 0.1,
                  });
                }),
              ];
            case 4:
              result = _d.sent();
              return [3 /*break*/, 7];
            case 5:
              return [
                4 /*yield*/,
                this.agentService.processImage(imageUrls_1[0], {
                  prompt: prompt_2,
                  modelId: this.defaultModelId,
                  responseFormat: { type: 'json_object' },
                  temperature: 0.1,
                }),
              ];
            case 6:
              // Process the first image only - using common main image selection
              result = _d.sent();
              _d.label = 7;
            case 7:
              if (!result || !result.content) {
                throw new Error('No result returned from AI model');
              }
              content =
                typeof result.content === 'string'
                  ? JSON.parse(result.content)
                  : result.content;
              tokenUsage = {
                input:
                  ((_a = result.usage) === null || _a === void 0
                    ? void 0
                    : _a.promptTokens) ||
                  prompt_2.length / 4 + imageUrls_1.length * 1000,
                output:
                  ((_b = result.usage) === null || _b === void 0
                    ? void 0
                    : _b.completionTokens) ||
                  JSON.stringify(content).length / 4,
                total:
                  ((_c = result.usage) === null || _c === void 0
                    ? void 0
                    : _c.totalTokens) ||
                  prompt_2.length / 4 +
                    JSON.stringify(content).length / 4 +
                    imageUrls_1.length * 1000,
              };
              // Commit token usage
              return [
                4 /*yield*/,
                this.creditSystemService.commitReservedTokens({
                  reservationId: reserveResult.reservationId,
                  actualTokens: tokenUsage.total,
                }),
              ];
            case 8:
              // Commit token usage
              _d.sent();
              mainImageIndex =
                typeof content.mainImageIndex === 'number'
                  ? content.mainImageIndex
                  : typeof content.bestImageIndex === 'number'
                    ? content.bestImageIndex
                    : 0;
              if (
                mainImageIndex === undefined ||
                mainImageIndex < 0 ||
                mainImageIndex >= images.length
              ) {
                return [
                  2 /*return*/,
                  {
                    success: false,
                    error: 'Invalid main image index returned by AI model',
                    tokenUsage: tokenUsage,
                  },
                ];
              }
              return [
                2 /*return*/,
                {
                  success: true,
                  mainImageIndex: mainImageIndex,
                  reason: content.reason || content.rationale,
                  tokenUsage: tokenUsage,
                },
              ];
            case 9:
              error_7 = _d.sent();
              // Release the reserved credits
              return [
                4 /*yield*/,
                this.creditSystemService.releaseReservedTokens({
                  reservationId: reserveResult.reservationId,
                }),
              ];
            case 10:
              // Release the reserved credits
              _d.sent();
              throw error_7;
            case 11:
              return [3 /*break*/, 13];
            case 12:
              error_8 = _d.sent();
              this.logger.error(
                'Error identifying main product image: '.concat(
                  error_8.message,
                ),
                error_8.stack,
              );
              return [
                2 /*return*/,
                {
                  success: false,
                  error: 'Main image selection failed: '.concat(
                    error_8.message,
                  ),
                },
              ];
            case 13:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Prepare prompt for main image selection
     *
     * @param images Product images to analyze
     * @param productContext Product context information
     * @returns Formatted prompt
     */
    ImageAnalysisService_1.prototype.prepareMainImageSelectionPrompt =
      function (images, productContext) {
        // Prepare product information
        var productInfo = '\nProduct Name: '
          .concat(productContext.name, '\n')
          .concat(
            productContext.category
              ? 'Category: '.concat(productContext.category)
              : '',
            '\n',
          )
          .concat(
            productContext.description
              ? 'Description: '.concat(productContext.description)
              : '',
            '\n',
          );
        // Prepare image information
        var imageInfo = images
          .map(function (image, index) {
            return 'Image '
              .concat(index, ': ')
              .concat(image.fileName)
              .concat(image.altText ? ' - '.concat(image.altText) : '');
          })
          .join('\n');
        // Create prompt
        var prompt =
          'You are tasked with selecting the best main product image from a set of '
            .concat(images.length, ' product images.\n\nPRODUCT INFORMATION:\n')
            .concat(productInfo, '\n\nIMAGE INFORMATION:\n')
            .concat(
              imageInfo,
              '\n\nPlease analyze all images and select the most suitable main product image based on the following criteria:\n1. Image quality (sharpness, lighting, composition)\n2. Shows the product clearly and completely\n3. Represents the product accurately based on the product description\n4. Has a clean, professional appearance\n5. Would be most appealing to customers\n6. Works well as a thumbnail\n\nReply in the following JSON format only:\n{\n  "mainImageIndex": <number - the index (0-based) of the best image>,\n  "rationale": "<string - brief explanation of why this image was selected>"\n}',
            );
        return prompt;
      };
    return ImageAnalysisService_1;
  })());
  __setFunctionName(_classThis, 'ImageAnalysisService');
  (function () {
    var _metadata =
      typeof Symbol === 'function' && Symbol.metadata
        ? Object.create(null)
        : void 0;
    __esDecorate(
      null,
      (_classDescriptor = { value: _classThis }),
      _classDecorators,
      { kind: 'class', name: _classThis.name, metadata: _metadata },
      null,
      _classExtraInitializers,
    );
    ImageAnalysisService = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (ImageAnalysisService = _classThis);
})();
exports.ImageAnalysisService = ImageAnalysisService;
