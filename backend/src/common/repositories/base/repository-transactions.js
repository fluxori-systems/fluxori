"use strict";
/**
 * Transaction utilities for Firestore repositories
 * Provides utilities for managing transactions in repositories
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TRANSACTION_OPTIONS = void 0;
exports.executeTransaction = executeTransaction;
exports.executeBatch = executeBatch;
exports.executeMultiBatch = executeMultiBatch;
var common_1 = require("@nestjs/common");
/**
 * Default transaction execution options
 */
exports.DEFAULT_TRANSACTION_OPTIONS = {
    maxAttempts: 5,
    readOnly: false,
    retryDelayMs: 200,
    timeoutMs: 30000,
};
/**
 * Execute a function within a transaction
 * @param firestore Firestore instance
 * @param executionFunction Function to execute in transaction
 * @param options Transaction options
 * @returns Result of the transaction execution
 */
function executeTransaction(firestore_1, executionFunction_1) {
    return __awaiter(this, arguments, void 0, function (firestore, executionFunction, options) {
        var mergedOptions, logger, attempts, lastError, delay, calculateBackoff, result, error_1, backoff;
        var _this = this;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mergedOptions = __assign(__assign({}, exports.DEFAULT_TRANSACTION_OPTIONS), options);
                    logger = new common_1.Logger("Transaction");
                    attempts = 0;
                    lastError = null;
                    delay = function (ms) {
                        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
                    };
                    calculateBackoff = function (attempt) {
                        return mergedOptions.retryDelayMs * Math.pow(2, attempt);
                    };
                    _a.label = 1;
                case 1:
                    if (!(attempts < mergedOptions.maxAttempts)) return [3 /*break*/, 10];
                    attempts++;
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 7, , 9]);
                    result = void 0;
                    if (!mergedOptions.readOnly) return [3 /*break*/, 4];
                    return [4 /*yield*/, firestore.runTransaction(function (transaction) { return __awaiter(_this, void 0, void 0, function () {
                            var txContext;
                            return __generator(this, function (_a) {
                                txContext = {
                                    transaction: transaction,
                                    options: mergedOptions,
                                };
                                return [2 /*return*/, executionFunction(txContext)];
                            });
                        }); }, { readOnly: true })];
                case 3:
                    // Read-only transaction
                    result = _a.sent();
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, firestore.runTransaction(function (transaction) { return __awaiter(_this, void 0, void 0, function () {
                        var txContext;
                        return __generator(this, function (_a) {
                            txContext = {
                                transaction: transaction,
                                options: mergedOptions,
                            };
                            return [2 /*return*/, executionFunction(txContext)];
                        });
                    }); })];
                case 5:
                    // Read-write transaction
                    result = _a.sent();
                    _a.label = 6;
                case 6: 
                // If we got here, the transaction succeeded
                return [2 /*return*/, result];
                case 7:
                    error_1 = _a.sent();
                    lastError = error_1;
                    // Log the error
                    logger.debug("Transaction attempt ".concat(attempts, "/").concat(mergedOptions.maxAttempts, " failed: ").concat(error_1.message));
                    // Exit early if we've reached max attempts
                    if (attempts >= mergedOptions.maxAttempts) {
                        return [3 /*break*/, 10];
                    }
                    backoff = calculateBackoff(attempts) * (0.5 + Math.random() * 0.5);
                    // Wait before trying again
                    return [4 /*yield*/, delay(backoff)];
                case 8:
                    // Wait before trying again
                    _a.sent();
                    return [3 /*break*/, 9];
                case 9: return [3 /*break*/, 1];
                case 10:
                    // If we got here, all transaction attempts failed
                    logger.error("Transaction failed after ".concat(attempts, " attempts: ").concat(lastError === null || lastError === void 0 ? void 0 : lastError.message), lastError === null || lastError === void 0 ? void 0 : lastError.stack);
                    throw lastError || new Error("Transaction failed");
            }
        });
    });
}
/**
 * Execute a batch write operation with automatic chunking
 * @param firestore Firestore instance
 * @param operations Function that populates a batch with operations
 * @param options Batch options
 * @returns Result of the batch operation
 */
function executeBatch(firestore_1, operations_1) {
    return __awaiter(this, arguments, void 0, function (firestore, operations, batchSize) {
        var batch, error_2;
        if (batchSize === void 0) { batchSize = 500; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    batch = firestore.batch();
                    // Execute the operations to populate the batch
                    operations(batch);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    // Commit the batch
                    return [4 /*yield*/, batch.commit()];
                case 2:
                    // Commit the batch
                    _a.sent();
                    return [2 /*return*/, {
                            status: "success",
                            successCount: 1,
                            errorCount: 0,
                            writtenCount: 1,
                        }];
                case 3:
                    error_2 = _a.sent();
                    return [2 /*return*/, {
                            status: "error",
                            successCount: 0,
                            errorCount: 1,
                            errors: [{ index: 0, error: error_2 }],
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Execute multiple batch operations
 * @param firestore Firestore instance
 * @param batches Array of functions that populate batches
 * @returns Result of the batch operations
 */
function executeMultiBatch(firestore_1, batches_1) {
    return __awaiter(this, arguments, void 0, function (firestore, batches, batchSize) {
        var results, i, batchOperation, result, successCount, errorCount, writtenCount, errors, status;
        if (batchSize === void 0) { batchSize = 500; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    results = [];
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < batches.length)) return [3 /*break*/, 4];
                    batchOperation = batches[i];
                    return [4 /*yield*/, executeBatch(firestore, batchOperation, batchSize)];
                case 2:
                    result = _a.sent();
                    results.push(result);
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4:
                    successCount = 0;
                    errorCount = 0;
                    writtenCount = 0;
                    errors = [];
                    results.forEach(function (result, index) {
                        successCount += result.successCount;
                        errorCount += result.errorCount;
                        writtenCount += result.writtenCount || 0;
                        if (result.errors && result.errors.length > 0) {
                            result.errors.forEach(function (error) {
                                errors.push({
                                    index: index * batchSize + error.index,
                                    id: error.id,
                                    error: error.error,
                                });
                            });
                        }
                    });
                    status = "success";
                    if (errorCount > 0) {
                        status = successCount > 0 ? "partial" : "error";
                    }
                    return [2 /*return*/, {
                            status: status,
                            successCount: successCount,
                            errorCount: errorCount,
                            writtenCount: writtenCount,
                            errors: errors.length > 0 ? errors : undefined,
                        }];
            }
        });
    });
}
