"use strict";
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
exports.VertexAIModelAdapter = void 0;
var common_1 = require("@nestjs/common");
var types_1 = require("../interfaces/types");
// Note: This is a partial implementation. In real code, you would import and use the actual Vertex AI client
// For reference, this is how the import would look
// import { VertexAI, PredictionServiceClient } from '@google-cloud/vertexai';
/**
 * Adapter for Google Vertex AI models
 */
var VertexAIModelAdapter = (function () {
  var _classDecorators = [(0, common_1.Injectable)()];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var VertexAIModelAdapter = (_classThis = /** @class */ (function () {
    function VertexAIModelAdapter_1() {
      this.logger = new common_1.Logger(VertexAIModelAdapter.name);
      this.initialized = false;
    }
    /**
     * Initialize the adapter with configuration
     * @param config Configuration for Vertex AI
     */
    VertexAIModelAdapter_1.prototype.initialize = function (config) {
      return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          try {
            this.projectId = config.projectId;
            this.location = config.location || "europe-west4"; // Default to European region
            // Note: This is a placeholder. In real code, initialize the actual Vertex AI client
            // this.vertexClient = new VertexAI({
            //   project: this.projectId,
            //   location: this.location,
            //   apiEndpoint: config.apiEndpoint,
            //   credentials: config.credentials
            // });
            // Mock initialization for now
            this.vertexClient = {
              /* mock implementation */
              project: this.projectId,
              location: this.location,
            };
            this.initialized = true;
            this.logger.log(
              "Vertex AI Adapter initialized for project "
                .concat(this.projectId, " in ")
                .concat(this.location),
            );
          } catch (error) {
            this.logger.error(
              "Failed to initialize Vertex AI adapter: ".concat(error.message),
              error.stack,
            );
            throw new Error(
              "Failed to initialize Vertex AI adapter: ".concat(error.message),
            );
          }
          return [2 /*return*/];
        });
      });
    };
    /**
     * Check if the adapter supports a specific model
     * @param modelName Model name to check
     * @returns Whether this adapter supports the model
     */
    VertexAIModelAdapter_1.prototype.supportsModel = function (modelName) {
      // List of supported models - would be more sophisticated in a real implementation
      var supportedModels = [
        "gemini-pro",
        "gemini-pro-vision",
        "gemini-ultra",
        "text-bison",
        "text-unicorn",
        "chat-bison",
        "claude-3-sonnet",
        "claude-3-opus",
        "claude-3-haiku",
      ];
      return supportedModels.some(function (model) {
        return modelName.includes(model) || modelName.startsWith("vertex-");
      });
    };
    /**
     * Generate text completion
     * @param model Model registry entry to use
     * @param request Completion request
     * @returns Model response
     */
    VertexAIModelAdapter_1.prototype.generateCompletion = function (
      model,
      request,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var startTime,
          options,
          mockResult,
          tokenCount,
          outputTokens,
          cost,
          processingTime,
          error_1;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              this.ensureInitialized();
              startTime = Date.now();
              _a.label = 1;
            case 1:
              _a.trys.push([1, 3, , 4]);
              options = this.mapRequestOptions(request.options);
              mockResult = this.mockGenerateContent(
                request.prompt,
                model.model,
              );
              return [4 /*yield*/, this.countCompletionTokens(model, request)];
            case 2:
              tokenCount = _a.sent();
              outputTokens = this.countTokens(mockResult.content);
              cost = this.calculateTokenCost(
                model,
                tokenCount.inputTokens,
                outputTokens,
              );
              processingTime = Date.now() - startTime;
              return [
                2 /*return*/,
                {
                  content: mockResult.content,
                  usage: {
                    inputTokens: tokenCount.inputTokens,
                    outputTokens: outputTokens,
                    totalTokens: tokenCount.inputTokens + outputTokens,
                    processingTime: processingTime,
                    cost: cost,
                  },
                  finishReason: mockResult.finishReason,
                  metadata: {
                    model: model.model,
                    provider: "vertex-ai",
                  },
                },
              ];
            case 3:
              error_1 = _a.sent();
              this.logger.error(
                "Vertex AI completion error: ".concat(error_1.message),
                error_1.stack,
              );
              throw this.formatError(error_1);
            case 4:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Generate chat completion
     * @param model Model registry entry to use
     * @param request Chat completion request
     * @returns Model response
     */
    VertexAIModelAdapter_1.prototype.generateChatCompletion = function (
      model,
      request,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var startTime,
          options,
          lastMessage,
          mockResult,
          tokenCount,
          outputTokens,
          cost,
          processingTime,
          error_2;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              this.ensureInitialized();
              startTime = Date.now();
              _a.label = 1;
            case 1:
              _a.trys.push([1, 3, , 4]);
              options = this.mapRequestOptions(request.options);
              lastMessage = request.messages[request.messages.length - 1];
              mockResult = this.mockGenerateContent(
                lastMessage.content,
                model.model,
              );
              return [4 /*yield*/, this.countChatTokens(model, request)];
            case 2:
              tokenCount = _a.sent();
              outputTokens = this.countTokens(mockResult.content);
              cost = this.calculateTokenCost(
                model,
                tokenCount.inputTokens,
                outputTokens,
              );
              processingTime = Date.now() - startTime;
              return [
                2 /*return*/,
                {
                  content: mockResult.content,
                  usage: {
                    inputTokens: tokenCount.inputTokens,
                    outputTokens: outputTokens,
                    totalTokens: tokenCount.inputTokens + outputTokens,
                    processingTime: processingTime,
                    cost: cost,
                  },
                  finishReason: mockResult.finishReason,
                  functionCall: mockResult.functionCall,
                  metadata: {
                    model: model.model,
                    provider: "vertex-ai",
                  },
                },
              ];
            case 3:
              error_2 = _a.sent();
              this.logger.error(
                "Vertex AI chat completion error: ".concat(error_2.message),
                error_2.stack,
              );
              throw this.formatError(error_2);
            case 4:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Count tokens in a completion request
     * @param model Model registry entry
     * @param request Completion request
     * @returns Token count result
     */
    VertexAIModelAdapter_1.prototype.countCompletionTokens = function (
      model,
      request,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var inputTokens;
        var _a;
        return __generator(this, function (_b) {
          this.ensureInitialized();
          try {
            inputTokens = this.countTokens(request.prompt);
            return [
              2 /*return*/,
              {
                inputTokens: inputTokens,
                estimatedOutputTokens: Math.min(
                  model.maxOutputTokens,
                  ((_a = request.options) === null || _a === void 0
                    ? void 0
                    : _a.maxOutputTokens) || model.maxOutputTokens,
                ),
                totalTokens: inputTokens + model.maxOutputTokens,
              },
            ];
          } catch (error) {
            this.logger.error(
              "Vertex AI token counting error: ".concat(error.message),
              error.stack,
            );
            throw this.formatError(error);
          }
          return [2 /*return*/];
        });
      });
    };
    /**
     * Count tokens in a chat completion request
     * @param model Model registry entry
     * @param request Chat completion request
     * @returns Token count result
     */
    VertexAIModelAdapter_1.prototype.countChatTokens = function (
      model,
      request,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var inputTokens, _i, _a, message;
        var _this = this;
        var _b, _c;
        return __generator(this, function (_d) {
          this.ensureInitialized();
          try {
            inputTokens = 0;
            for (_i = 0, _a = request.messages; _i < _a.length; _i++) {
              message = _a[_i];
              inputTokens += this.countTokens(message.content);
              // Add overhead for role prefixes
              inputTokens += 4;
            }
            // Add overhead for system message formatting, include function definitions tokens if present
            if (
              (_b = request.options) === null || _b === void 0
                ? void 0
                : _b.functions
            ) {
              inputTokens += request.options.functions.reduce(function (
                total,
                fn,
              ) {
                return total + _this.countTokens(JSON.stringify(fn));
              }, 0);
            }
            return [
              2 /*return*/,
              {
                inputTokens: inputTokens,
                estimatedOutputTokens: Math.min(
                  model.maxOutputTokens,
                  ((_c = request.options) === null || _c === void 0
                    ? void 0
                    : _c.maxOutputTokens) || model.maxOutputTokens,
                ),
                totalTokens: inputTokens + model.maxOutputTokens,
              },
            ];
          } catch (error) {
            this.logger.error(
              "Vertex AI chat token counting error: ".concat(error.message),
              error.stack,
            );
            throw this.formatError(error);
          }
          return [2 /*return*/];
        });
      });
    };
    /**
     * Validate credentials for Vertex AI
     * @param credentials Credentials to validate
     * @returns Whether the credentials are valid
     */
    VertexAIModelAdapter_1.prototype.validateCredentials = function (
      credentials,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          try {
            // Note: This is a placeholder. In a real implementation, try to initialize
            // a client with the provided credentials and check if it works
            return [
              2 /*return*/,
              credentials && credentials.type === "service_account",
            ];
          } catch (error) {
            this.logger.error(
              "Vertex AI credential validation error: ".concat(error.message),
              error.stack,
            );
            return [2 /*return*/, false];
          }
          return [2 /*return*/];
        });
      });
    };
    /**
     * Calculate token cost for the given model and token counts
     * @param model Model registry entry
     * @param inputTokens Number of input tokens
     * @param outputTokens Number of output tokens
     * @returns Cost in credits/currency units
     */
    VertexAIModelAdapter_1.prototype.calculateTokenCost = function (
      model,
      inputTokens,
      outputTokens,
    ) {
      // Use the cost rates from the model registry entry
      var inputCost = (inputTokens / 1000) * model.costPer1kInputTokens;
      var outputCost = (outputTokens / 1000) * model.costPer1kOutputTokens;
      return inputCost + outputCost;
    };
    /**
     * List available models from Vertex AI
     * @returns List of model registry entries
     */
    VertexAIModelAdapter_1.prototype.listAvailableModels = function () {
      return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          this.ensureInitialized();
          try {
            // Note: This is a placeholder. In a real implementation, call the Vertex AI API
            // to get the list of available models
            // Mock implementation for demonstration
            return [
              2 /*return*/,
              [
                {
                  model: "gemini-pro",
                  displayName: "Gemini Pro",
                  provider: "vertex-ai",
                  description:
                    "Advanced large language model for text generation",
                },
                {
                  model: "gemini-pro-vision",
                  displayName: "Gemini Pro Vision",
                  provider: "vertex-ai",
                  description:
                    "Multimodal model for text and image understanding",
                },
                {
                  model: "claude-3-sonnet",
                  displayName: "Claude 3 Sonnet",
                  provider: "vertex-ai",
                  description:
                    "Anthropic Claude 3 Sonnet available through Vertex AI",
                },
              ],
            ];
          } catch (error) {
            this.logger.error(
              "Vertex AI model listing error: ".concat(error.message),
              error.stack,
            );
            throw this.formatError(error);
          }
          return [2 /*return*/];
        });
      });
    };
    /**
     * Get the provider name
     * @returns Provider name
     */
    VertexAIModelAdapter_1.prototype.getProviderName = function () {
      return "vertex-ai";
    };
    /* Helper methods */
    /**
     * Ensure the adapter is initialized
     * @throws Error if not initialized
     */
    VertexAIModelAdapter_1.prototype.ensureInitialized = function () {
      if (!this.initialized) {
        throw new Error(
          "Vertex AI adapter is not initialized. Call initialize() first.",
        );
      }
    };
    /**
     * Map request options to Vertex AI options
     * @param options Request options
     * @returns Vertex AI options
     */
    VertexAIModelAdapter_1.prototype.mapRequestOptions = function (options) {
      if (!options) return {};
      return {
        temperature: options.temperature,
        topP: options.topP,
        maxOutputTokens: options.maxOutputTokens,
        stopSequences: options.stopSequences,
        presencePenalty: options.presencePenalty,
        frequencyPenalty: options.frequencyPenalty,
        // Handle functions if present
        tools: options.functions
          ? [
              {
                functionDeclarations: options.functions.map(function (fn) {
                  return {
                    name: fn.name,
                    description: fn.description,
                    parameters: fn.parameters,
                  };
                }),
              },
            ]
          : undefined,
        toolConfig: options.functionCall
          ? {
              functionCallingConfig: {
                mode:
                  options.functionCall === "auto"
                    ? "AUTO"
                    : options.functionCall === "none"
                      ? "NONE"
                      : "ANY",
                allowedFunctionNames:
                  typeof options.functionCall === "string"
                    ? undefined
                    : [options.functionCall],
              },
            }
          : undefined,
      };
    };
    /**
     * Format error from Vertex AI
     * @param error Original error
     * @returns Formatted error
     */
    VertexAIModelAdapter_1.prototype.formatError = function (error) {
      var _a, _b, _c, _d, _e, _f, _g;
      // Determine error type based on error message or status
      var errorType = types_1.AgentErrorType.EXECUTION_ERROR;
      if (
        ((_a = error.message) === null || _a === void 0
          ? void 0
          : _a.includes("Authentication failed")) ||
        ((_b = error.message) === null || _b === void 0
          ? void 0
          : _b.includes("Permission denied")) ||
        error.code === 403
      ) {
        errorType = types_1.AgentErrorType.AUTHORIZATION_ERROR;
      } else if (
        ((_c = error.message) === null || _c === void 0
          ? void 0
          : _c.includes("model not found")) ||
        ((_d = error.message) === null || _d === void 0
          ? void 0
          : _d.includes("model is not available")) ||
        error.code === 404
      ) {
        errorType = types_1.AgentErrorType.MODEL_UNAVAILABLE;
      } else if (
        ((_e = error.message) === null || _e === void 0
          ? void 0
          : _e.includes("exceeded quota")) ||
        ((_f = error.message) === null || _f === void 0
          ? void 0
          : _f.includes("rate limit")) ||
        error.code === 429
      ) {
        errorType = types_1.AgentErrorType.RATE_LIMIT_EXCEEDED;
      } else if (
        (_g = error.message) === null || _g === void 0
          ? void 0
          : _g.includes("token limit")
      ) {
        errorType = types_1.AgentErrorType.TOKEN_LIMIT_EXCEEDED;
      }
      var formattedError = new Error(
        "Vertex AI error ("
          .concat(errorType, "): ")
          .concat(error.message || "Unknown error"),
      );
      formattedError.type = errorType;
      formattedError.originalError = error;
      return formattedError;
    };
    /**
     * Count tokens in a string
     * @param text Text to count tokens for
     * @returns Estimated token count
     */
    VertexAIModelAdapter_1.prototype.countTokens = function (text) {
      // Note: This is a simple approximation. In a real implementation,
      // use a proper tokenizer for the specific model
      return Math.ceil(text.length / 4);
    };
    /**
     * Mock generate content for demonstration
     * @param prompt Prompt text
     * @param modelName Model name
     * @returns Mock response
     */
    VertexAIModelAdapter_1.prototype.mockGenerateContent = function (
      prompt,
      modelName,
    ) {
      // Check if prompt seems to be requesting a function call
      if (
        prompt.toLowerCase().includes("weather") &&
        prompt.toLowerCase().includes("get") &&
        modelName.includes("gemini")
      ) {
        return {
          content: "I'll get the weather information for you.",
          finishReason: "function_call",
          functionCall: {
            name: "getWeather",
            arguments: {
              location: prompt.includes("johannesburg")
                ? "Johannesburg"
                : "Cape Town",
              unit: "celsius",
            },
          },
        };
      }
      // Generate a simple response based on the prompt
      var response = "";
      if (
        prompt.toLowerCase().includes("hello") ||
        prompt.toLowerCase().includes("hi")
      ) {
        response = "Hello! I'm an AI assistant powered by ".concat(
          modelName,
          ". How can I help you today?",
        );
      } else if (prompt.toLowerCase().includes("help")) {
        response =
          "I can help you with various tasks like answering questions, providing information, or assisting with specific requests. What do you need help with?";
      } else {
        response = "I've processed your request using ".concat(
          modelName,
          ". Here's a simulated response for development purposes. In production, this would be generated by the actual Vertex AI model.",
        );
      }
      return {
        content: response,
        finishReason: "stop",
      };
    };
    return VertexAIModelAdapter_1;
  })());
  __setFunctionName(_classThis, "VertexAIModelAdapter");
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
    VertexAIModelAdapter = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (VertexAIModelAdapter = _classThis);
})();
exports.VertexAIModelAdapter = VertexAIModelAdapter;
