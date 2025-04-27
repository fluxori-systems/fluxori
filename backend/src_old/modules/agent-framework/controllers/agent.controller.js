"use strict";
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
exports.AgentController = void 0;
var common_1 = require("@nestjs/common");
var auth_1 = require("src/common/auth");
// We're using the DecodedFirebaseToken interface from common/auth
/**
 * Controller for agent framework endpoints
 */
var AgentController = (function () {
  var _classDecorators = [
    (0, common_1.Controller)("api/agent-framework"),
    (0, common_1.UseGuards)(auth_1.FirebaseAuthGuard),
  ];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var _instanceExtraInitializers = [];
  var _createConversation_decorators;
  var _sendMessage_decorators;
  var _getConversation_decorators;
  var _listConversations_decorators;
  var _getAgentConfigurations_decorators;
  var _getBestModel_decorators;
  var _archiveOldConversations_decorators;
  var AgentController = (_classThis = /** @class */ (function () {
    function AgentController_1(agentService) {
      this.agentService =
        (__runInitializers(this, _instanceExtraInitializers), agentService);
      this.logger = new common_1.Logger(AgentController.name);
    }
    /**
     * Create a new conversation
     * @param createRequest Conversation creation request
     * @param user Authenticated user
     * @returns New conversation
     */
    AgentController_1.prototype.createConversation = function (
      createRequest,
      user,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var conversation, error_1;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 2, , 3]);
              // Ensure the user is working with their own data using our auth utilities
              if (!auth_1.AuthUtils.isOwner(user, createRequest.userId)) {
                throw new common_1.HttpException(
                  "Unauthorized",
                  common_1.HttpStatus.UNAUTHORIZED,
                );
              }
              return [
                4 /*yield*/,
                this.agentService.createConversation(createRequest),
              ];
            case 1:
              conversation = _a.sent();
              return [
                2 /*return*/,
                {
                  id: conversation.id,
                  title: conversation.title,
                  agentConfigId: conversation.agentConfigId,
                  created: conversation.createdAt,
                },
              ];
            case 2:
              error_1 = _a.sent();
              this.logger.error(
                "Error creating conversation: ".concat(error_1.message),
                error_1.stack,
              );
              throw new common_1.HttpException(
                "Failed to create conversation: ".concat(error_1.message),
                common_1.HttpStatus.INTERNAL_SERVER_ERROR,
              );
            case 3:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Send a message to an agent
     * @param messageRequest Message request
     * @param user Authenticated user
     * @returns Agent response
     */
    AgentController_1.prototype.sendMessage = function (messageRequest, user) {
      return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          try {
            // Ensure the user is working with their own data
            if (user.uid !== messageRequest.userId) {
              throw new common_1.HttpException(
                "Unauthorized",
                common_1.HttpStatus.UNAUTHORIZED,
              );
            }
            return [
              2 /*return*/,
              this.agentService.sendMessage(messageRequest),
            ];
          } catch (error) {
            this.logger.error(
              "Error sending message: ".concat(error.message),
              error.stack,
            );
            throw new common_1.HttpException(
              "Failed to send message: ".concat(error.message),
              common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
          return [2 /*return*/];
        });
      });
    };
    /**
     * Get a conversation by ID
     * @param id Conversation ID
     * @param user Authenticated user
     * @returns Conversation
     */
    AgentController_1.prototype.getConversation = function (id, user) {
      return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          try {
            return [
              2 /*return*/,
              this.agentService.getConversation(id, user.uid),
            ];
          } catch (error) {
            this.logger.error(
              "Error fetching conversation: ".concat(error.message),
              error.stack,
            );
            throw new common_1.HttpException(
              "Failed to fetch conversation: ".concat(error.message),
              common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
          return [2 /*return*/];
        });
      });
    };
    /**
     * List conversations for a user
     * @param organizationId Organization ID
     * @param limit Maximum number of conversations
     * @param user Authenticated user
     * @returns List of conversations
     */
    AgentController_1.prototype.listConversations = function (
      organizationId_1,
    ) {
      return __awaiter(
        this,
        arguments,
        void 0,
        function (organizationId, limit, user) {
          if (limit === void 0) {
            limit = 20;
          }
          return __generator(this, function (_a) {
            try {
              return [
                2 /*return*/,
                this.agentService.listUserConversations(
                  organizationId,
                  user.uid,
                  Number(limit),
                ),
              ];
            } catch (error) {
              this.logger.error(
                "Error listing conversations: ".concat(error.message),
                error.stack,
              );
              throw new common_1.HttpException(
                "Failed to list conversations: ".concat(error.message),
                common_1.HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }
            return [2 /*return*/];
          });
        },
      );
    };
    /**
     * Get agent configurations for an organization
     * @param organizationId Organization ID
     * @returns List of agent configurations
     */
    AgentController_1.prototype.getAgentConfigurations = function (
      organizationId,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          try {
            return [
              2 /*return*/,
              this.agentService.getAgentConfigurations(organizationId),
            ];
          } catch (error) {
            this.logger.error(
              "Error fetching configurations: ".concat(error.message),
              error.stack,
            );
            throw new common_1.HttpException(
              "Failed to fetch configurations: ".concat(error.message),
              common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
          return [2 /*return*/];
        });
      });
    };
    /**
     * Get the best model for a task
     * @param organizationId Organization ID
     * @param complexity Task complexity
     * @param provider Optional preferred provider
     * @param capabilities Optional comma-separated required capabilities
     * @returns Best model or 404 if none found
     */
    AgentController_1.prototype.getBestModel = function (
      organizationId,
      complexity,
      provider,
      capabilities,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var requiredCapabilities, model, error_2;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 2, , 3]);
              requiredCapabilities = capabilities
                ? capabilities.split(",")
                : undefined;
              return [
                4 /*yield*/,
                this.agentService.getBestModelForTask(
                  organizationId,
                  complexity,
                  provider,
                  requiredCapabilities,
                ),
              ];
            case 1:
              model = _a.sent();
              if (!model) {
                throw new common_1.HttpException(
                  "No suitable model found",
                  common_1.HttpStatus.NOT_FOUND,
                );
              }
              return [2 /*return*/, model];
            case 2:
              error_2 = _a.sent();
              this.logger.error(
                "Error finding best model: ".concat(error_2.message),
                error_2.stack,
              );
              throw new common_1.HttpException(
                "Failed to find best model: ".concat(error_2.message),
                error_2 instanceof common_1.HttpException
                  ? error_2.getStatus()
                  : common_1.HttpStatus.INTERNAL_SERVER_ERROR,
              );
            case 3:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Archive old user conversations
     * @param organizationId Organization ID
     * @param keepActive Number of conversations to keep active
     * @param user Authenticated user
     * @returns Number of archived conversations
     */
    AgentController_1.prototype.archiveOldConversations = function (
      organizationId_1,
    ) {
      return __awaiter(
        this,
        arguments,
        void 0,
        function (organizationId, keepActive, user) {
          var archivedCount, error_3;
          if (keepActive === void 0) {
            keepActive = 10;
          }
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                _a.trys.push([0, 2, , 3]);
                return [
                  4 /*yield*/,
                  this.agentService.archiveOldConversations(
                    organizationId,
                    user.uid,
                    Number(keepActive),
                  ),
                ];
              case 1:
                archivedCount = _a.sent();
                return [2 /*return*/, { archivedCount: archivedCount }];
              case 2:
                error_3 = _a.sent();
                this.logger.error(
                  "Error archiving conversations: ".concat(error_3.message),
                  error_3.stack,
                );
                throw new common_1.HttpException(
                  "Failed to archive conversations: ".concat(error_3.message),
                  common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                );
              case 3:
                return [2 /*return*/];
            }
          });
        },
      );
    };
    return AgentController_1;
  })());
  __setFunctionName(_classThis, "AgentController");
  (function () {
    var _metadata =
      typeof Symbol === "function" && Symbol.metadata
        ? Object.create(null)
        : void 0;
    _createConversation_decorators = [(0, common_1.Post)("conversations")];
    _sendMessage_decorators = [(0, common_1.Post)("messages")];
    _getConversation_decorators = [(0, common_1.Get)("conversations/:id")];
    _listConversations_decorators = [(0, common_1.Get)("conversations")];
    _getAgentConfigurations_decorators = [(0, common_1.Get)("configs")];
    _getBestModel_decorators = [(0, common_1.Get)("models/best")];
    _archiveOldConversations_decorators = [
      (0, common_1.Post)("conversations/archive"),
    ];
    __esDecorate(
      _classThis,
      null,
      _createConversation_decorators,
      {
        kind: "method",
        name: "createConversation",
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return "createConversation" in obj;
          },
          get: function (obj) {
            return obj.createConversation;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      _classThis,
      null,
      _sendMessage_decorators,
      {
        kind: "method",
        name: "sendMessage",
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return "sendMessage" in obj;
          },
          get: function (obj) {
            return obj.sendMessage;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      _classThis,
      null,
      _getConversation_decorators,
      {
        kind: "method",
        name: "getConversation",
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return "getConversation" in obj;
          },
          get: function (obj) {
            return obj.getConversation;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      _classThis,
      null,
      _listConversations_decorators,
      {
        kind: "method",
        name: "listConversations",
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return "listConversations" in obj;
          },
          get: function (obj) {
            return obj.listConversations;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      _classThis,
      null,
      _getAgentConfigurations_decorators,
      {
        kind: "method",
        name: "getAgentConfigurations",
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return "getAgentConfigurations" in obj;
          },
          get: function (obj) {
            return obj.getAgentConfigurations;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      _classThis,
      null,
      _getBestModel_decorators,
      {
        kind: "method",
        name: "getBestModel",
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return "getBestModel" in obj;
          },
          get: function (obj) {
            return obj.getBestModel;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      _classThis,
      null,
      _archiveOldConversations_decorators,
      {
        kind: "method",
        name: "archiveOldConversations",
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return "archiveOldConversations" in obj;
          },
          get: function (obj) {
            return obj.archiveOldConversations;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      null,
      (_classDescriptor = { value: _classThis }),
      _classDecorators,
      { kind: "class", name: _classThis.name, metadata: _metadata },
      null,
      _classExtraInitializers,
    );
    AgentController = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (AgentController = _classThis);
})();
exports.AgentController = AgentController;
