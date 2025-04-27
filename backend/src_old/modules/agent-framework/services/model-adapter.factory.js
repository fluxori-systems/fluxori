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
exports.ModelAdapterFactory = void 0;
var common_1 = require("@nestjs/common");
/**
 * Factory for creating and managing model adapters
 */
var ModelAdapterFactory = (function () {
  var _classDecorators = [(0, common_1.Injectable)()];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var ModelAdapterFactory = (_classThis = /** @class */ (function () {
    function ModelAdapterFactory_1(vertexAdapter) {
      this.vertexAdapter = vertexAdapter;
      this.logger = new common_1.Logger(ModelAdapterFactory.name);
      this.adapters = new Map();
      // Register the built-in adapters
      this.registerAdapter("vertex-ai", vertexAdapter);
    }
    /**
     * Register a model adapter
     * @param providerName Provider name
     * @param adapter Model adapter implementation
     */
    ModelAdapterFactory_1.prototype.registerAdapter = function (
      providerName,
      adapter,
    ) {
      this.adapters.set(providerName, adapter);
      this.logger.log(
        "Registered model adapter for provider: ".concat(providerName),
      );
    };
    /**
     * Get an adapter for a specific model
     * @param model Model registry entry
     * @returns The appropriate adapter for the model
     * @throws Error if no adapter is found
     */
    ModelAdapterFactory_1.prototype.getAdapter = function (model) {
      // Try to find adapter by provider
      var adapter = this.adapters.get(model.provider);
      if (!adapter) {
        throw new Error(
          "No adapter found for provider: ".concat(model.provider),
        );
      }
      // Verify that the adapter supports this model
      if (!adapter.supportsModel(model.model)) {
        throw new Error(
          "Adapter for provider "
            .concat(model.provider, " does not support model: ")
            .concat(model.model),
        );
      }
      return adapter;
    };
    /**
     * Initialize all registered adapters
     * @param config Configuration for adapters
     */
    ModelAdapterFactory_1.prototype.initializeAdapters = function (config) {
      return __awaiter(this, void 0, void 0, function () {
        var initPromises, _loop_1, _i, _a, _b, provider, adapter;
        var _this = this;
        return __generator(this, function (_c) {
          switch (_c.label) {
            case 0:
              initPromises = [];
              // Initialize the Vertex AI adapter
              if (config["vertex-ai"]) {
                initPromises.push(
                  this.vertexAdapter
                    .initialize(config["vertex-ai"])
                    .catch(function (error) {
                      _this.logger.error(
                        "Failed to initialize Vertex AI adapter: ".concat(
                          error.message,
                        ),
                        error.stack,
                      );
                      // Don't throw - we want to continue initializing other adapters
                    }),
                );
              }
              _loop_1 = function (provider, adapter) {
                // Skip Vertex AI as we already handled it
                if (provider === "vertex-ai") return "continue";
                // Only initialize if config is provided
                if (config[provider]) {
                  initPromises.push(
                    adapter
                      .initialize(config[provider])
                      .catch(function (error) {
                        _this.logger.error(
                          "Failed to initialize "
                            .concat(provider, " adapter: ")
                            .concat(error.message),
                          error.stack,
                        );
                        // Don't throw - we want to continue initializing other adapters
                      }),
                  );
                }
              };
              // Initialize any other registered adapters
              for (_i = 0, _a = this.adapters.entries(); _i < _a.length; _i++) {
                (_b = _a[_i]), (provider = _b[0]), (adapter = _b[1]);
                _loop_1(provider, adapter);
              }
              // Wait for all adapters to initialize
              return [4 /*yield*/, Promise.all(initPromises)];
            case 1:
              // Wait for all adapters to initialize
              _c.sent();
              this.logger.log("All model adapters initialized");
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Get all registered adapter providers
     * @returns List of provider names
     */
    ModelAdapterFactory_1.prototype.getRegisteredProviders = function () {
      return Array.from(this.adapters.keys());
    };
    /**
     * Check if a provider is registered
     * @param providerName Provider name
     * @returns Whether the provider is registered
     */
    ModelAdapterFactory_1.prototype.hasProvider = function (providerName) {
      return this.adapters.has(providerName);
    };
    /**
     * Get an adapter by provider name
     * @param providerName Provider name
     * @returns The adapter for the provider
     * @throws Error if no adapter is found
     */
    ModelAdapterFactory_1.prototype.getAdapterByProvider = function (
      providerName,
    ) {
      var adapter = this.adapters.get(providerName);
      if (!adapter) {
        throw new Error("No adapter found for provider: ".concat(providerName));
      }
      return adapter;
    };
    return ModelAdapterFactory_1;
  })());
  __setFunctionName(_classThis, "ModelAdapterFactory");
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
    ModelAdapterFactory = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (ModelAdapterFactory = _classThis);
})();
exports.ModelAdapterFactory = ModelAdapterFactory;
