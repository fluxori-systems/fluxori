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
exports.FirebaseAuthService = void 0;
var common_1 = require("@nestjs/common");
var admin = require("firebase-admin");
/**
 * Firebase Authentication service
 * Provides integration with Firebase Auth for authentication and authorization
 */
var FirebaseAuthService = (function () {
  var _classDecorators = [(0, common_1.Injectable)()];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var FirebaseAuthService = (_classThis = /** @class */ (function () {
    function FirebaseAuthService_1(configService) {
      this.configService = configService;
      this.logger = new common_1.Logger(FirebaseAuthService.name);
      // Initialize Firebase Admin SDK
      var projectId = this.configService.get("GCP_PROJECT_ID");
      if (!admin.apps.length) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: projectId,
        });
      } else {
        this.firebaseApp = admin.app();
      }
    }
    /**
     * Verify a Firebase ID token
     * @param idToken The Firebase ID token to verify
     * @returns The decoded token claims
     */
    FirebaseAuthService_1.prototype.verifyIdToken = function (idToken) {
      return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 2, , 3]);
              return [
                4 /*yield*/,
                this.firebaseApp.auth().verifyIdToken(idToken),
              ];
            case 1:
              return [2 /*return*/, _a.sent()];
            case 2:
              error_1 = _a.sent();
              this.logger.error(
                "Invalid Firebase ID token: ".concat(error_1.message),
              );
              throw new common_1.UnauthorizedException(
                "Invalid authentication token",
              );
            case 3:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Create a new user in Firebase Auth
     * @param email User's email address
     * @param password User's password
     * @param displayName User's display name
     * @returns The newly created user
     */
    FirebaseAuthService_1.prototype.createUser = function (
      email,
      password,
      displayName,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 2, , 3]);
              return [
                4 /*yield*/,
                this.firebaseApp.auth().createUser({
                  email: email,
                  password: password,
                  displayName: displayName,
                  emailVerified: false,
                }),
              ];
            case 1:
              return [2 /*return*/, _a.sent()];
            case 2:
              error_2 = _a.sent();
              this.logger.error(
                "Failed to create user: ".concat(error_2.message),
              );
              throw error_2;
            case 3:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Get a user by their UID
     * @param uid User's Firebase UID
     * @returns The user record
     */
    FirebaseAuthService_1.prototype.getUserByUid = function (uid) {
      return __awaiter(this, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 2, , 3]);
              return [4 /*yield*/, this.firebaseApp.auth().getUser(uid)];
            case 1:
              return [2 /*return*/, _a.sent()];
            case 2:
              error_3 = _a.sent();
              this.logger.error(
                "Failed to get user by UID: ".concat(error_3.message),
              );
              throw error_3;
            case 3:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Get a user by their email address
     * @param email User's email address
     * @returns The user record
     */
    FirebaseAuthService_1.prototype.getUserByEmail = function (email) {
      return __awaiter(this, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 2, , 3]);
              return [
                4 /*yield*/,
                this.firebaseApp.auth().getUserByEmail(email),
              ];
            case 1:
              return [2 /*return*/, _a.sent()];
            case 2:
              error_4 = _a.sent();
              this.logger.error(
                "Failed to get user by email: ".concat(error_4.message),
              );
              throw error_4;
            case 3:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Update a user's information
     * @param uid User's Firebase UID
     * @param updateData Data to update
     * @returns The updated user record
     */
    FirebaseAuthService_1.prototype.updateUser = function (uid, updateData) {
      return __awaiter(this, void 0, void 0, function () {
        var error_5;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 2, , 3]);
              return [
                4 /*yield*/,
                this.firebaseApp.auth().updateUser(uid, updateData),
              ];
            case 1:
              return [2 /*return*/, _a.sent()];
            case 2:
              error_5 = _a.sent();
              this.logger.error(
                "Failed to update user: ".concat(error_5.message),
              );
              throw error_5;
            case 3:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Delete a user
     * @param uid User's Firebase UID
     */
    FirebaseAuthService_1.prototype.deleteUser = function (uid) {
      return __awaiter(this, void 0, void 0, function () {
        var error_6;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 2, , 3]);
              return [4 /*yield*/, this.firebaseApp.auth().deleteUser(uid)];
            case 1:
              _a.sent();
              return [3 /*break*/, 3];
            case 2:
              error_6 = _a.sent();
              this.logger.error(
                "Failed to delete user: ".concat(error_6.message),
              );
              throw error_6;
            case 3:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Set custom claims for a user (used for roles, permissions, etc.)
     * @param uid User's Firebase UID
     * @param claims Custom claims to set
     */
    FirebaseAuthService_1.prototype.setCustomUserClaims = function (
      uid,
      claims,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var error_7;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 2, , 3]);
              return [
                4 /*yield*/,
                this.firebaseApp.auth().setCustomUserClaims(uid, claims),
              ];
            case 1:
              _a.sent();
              return [3 /*break*/, 3];
            case 2:
              error_7 = _a.sent();
              this.logger.error(
                "Failed to set custom claims: ".concat(error_7.message),
              );
              throw error_7;
            case 3:
              return [2 /*return*/];
          }
        });
      });
    };
    /**
     * Generate a custom JWT token with claims
     * @param uid User's Firebase UID
     * @param additionalClaims Additional claims to include in the token
     * @returns The custom token
     */
    FirebaseAuthService_1.prototype.createCustomToken = function (
      uid,
      additionalClaims,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var error_8;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 2, , 3]);
              return [
                4 /*yield*/,
                this.firebaseApp
                  .auth()
                  .createCustomToken(uid, additionalClaims),
              ];
            case 1:
              return [2 /*return*/, _a.sent()];
            case 2:
              error_8 = _a.sent();
              this.logger.error(
                "Failed to create custom token: ".concat(error_8.message),
              );
              throw error_8;
            case 3:
              return [2 /*return*/];
          }
        });
      });
    };
    return FirebaseAuthService_1;
  })());
  __setFunctionName(_classThis, "FirebaseAuthService");
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
    FirebaseAuthService = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (FirebaseAuthService = _classThis);
})();
exports.FirebaseAuthService = FirebaseAuthService;
