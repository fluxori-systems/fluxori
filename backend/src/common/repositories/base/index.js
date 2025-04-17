"use strict";
/**
 * Repository Base Utilities Public API
 *
 * This file defines the internal public interface of the Repository base utilities.
 * These utilities should generally not be used directly by application code, but
 * rather through the main repository implementations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBatchItems = exports.validateEntityNotDeleted = exports.isEntityDeleted = exports.validateEntityId = exports.validateRequiredFields = exports.validateEntity = exports.RepositoryValidationError = exports.DEFAULT_TRANSACTION_OPTIONS = exports.executeMultiBatch = exports.executeBatch = exports.executeTransaction = exports.calculateCacheHitRatio = exports.resetStats = exports.getStatsSnapshot = exports.recordError = exports.incrementCacheMisses = exports.incrementCacheHits = exports.incrementWrites = exports.incrementReads = exports.createRepositoryStats = exports.applyClientTimestamps = exports.applyServerTimestamps = exports.sanitizeEntityForStorage = exports.createEntityConverter = exports.DEFAULT_CACHE_OPTIONS = exports.RepositoryCache = exports.EntityWithId = void 0;
// Re-export repository types (only the subset needed by internals)
var repository_types_1 = require("./repository-types");
Object.defineProperty(exports, "EntityWithId", { enumerable: true, get: function () { return repository_types_1.EntityWithId; } });
// Re-export cache utilities
var repository_cache_1 = require("./repository-cache");
Object.defineProperty(exports, "RepositoryCache", { enumerable: true, get: function () { return repository_cache_1.RepositoryCache; } });
Object.defineProperty(exports, "DEFAULT_CACHE_OPTIONS", { enumerable: true, get: function () { return repository_cache_1.DEFAULT_CACHE_OPTIONS; } });
// Re-export converter utilities
var repository_converter_1 = require("./repository-converter");
Object.defineProperty(exports, "createEntityConverter", { enumerable: true, get: function () { return repository_converter_1.createEntityConverter; } });
Object.defineProperty(exports, "sanitizeEntityForStorage", { enumerable: true, get: function () { return repository_converter_1.sanitizeEntityForStorage; } });
Object.defineProperty(exports, "applyServerTimestamps", { enumerable: true, get: function () { return repository_converter_1.applyServerTimestamps; } });
Object.defineProperty(exports, "applyClientTimestamps", { enumerable: true, get: function () { return repository_converter_1.applyClientTimestamps; } });
// Re-export stats utilities
var repository_stats_1 = require("./repository-stats");
Object.defineProperty(exports, "createRepositoryStats", { enumerable: true, get: function () { return repository_stats_1.createRepositoryStats; } });
Object.defineProperty(exports, "incrementReads", { enumerable: true, get: function () { return repository_stats_1.incrementReads; } });
Object.defineProperty(exports, "incrementWrites", { enumerable: true, get: function () { return repository_stats_1.incrementWrites; } });
Object.defineProperty(exports, "incrementCacheHits", { enumerable: true, get: function () { return repository_stats_1.incrementCacheHits; } });
Object.defineProperty(exports, "incrementCacheMisses", { enumerable: true, get: function () { return repository_stats_1.incrementCacheMisses; } });
Object.defineProperty(exports, "recordError", { enumerable: true, get: function () { return repository_stats_1.recordError; } });
Object.defineProperty(exports, "getStatsSnapshot", { enumerable: true, get: function () { return repository_stats_1.getStatsSnapshot; } });
Object.defineProperty(exports, "resetStats", { enumerable: true, get: function () { return repository_stats_1.resetStats; } });
Object.defineProperty(exports, "calculateCacheHitRatio", { enumerable: true, get: function () { return repository_stats_1.calculateCacheHitRatio; } });
// Re-export transaction utilities
var repository_transactions_1 = require("./repository-transactions");
Object.defineProperty(exports, "executeTransaction", { enumerable: true, get: function () { return repository_transactions_1.executeTransaction; } });
Object.defineProperty(exports, "executeBatch", { enumerable: true, get: function () { return repository_transactions_1.executeBatch; } });
Object.defineProperty(exports, "executeMultiBatch", { enumerable: true, get: function () { return repository_transactions_1.executeMultiBatch; } });
Object.defineProperty(exports, "DEFAULT_TRANSACTION_OPTIONS", { enumerable: true, get: function () { return repository_transactions_1.DEFAULT_TRANSACTION_OPTIONS; } });
// Re-export validation utilities
var repository_validation_1 = require("./repository-validation");
Object.defineProperty(exports, "RepositoryValidationError", { enumerable: true, get: function () { return repository_validation_1.RepositoryValidationError; } });
Object.defineProperty(exports, "validateEntity", { enumerable: true, get: function () { return repository_validation_1.validateEntity; } });
Object.defineProperty(exports, "validateRequiredFields", { enumerable: true, get: function () { return repository_validation_1.validateRequiredFields; } });
Object.defineProperty(exports, "validateEntityId", { enumerable: true, get: function () { return repository_validation_1.validateEntityId; } });
Object.defineProperty(exports, "isEntityDeleted", { enumerable: true, get: function () { return repository_validation_1.isEntityDeleted; } });
Object.defineProperty(exports, "validateEntityNotDeleted", { enumerable: true, get: function () { return repository_validation_1.validateEntityNotDeleted; } });
Object.defineProperty(exports, "validateBatchItems", { enumerable: true, get: function () { return repository_validation_1.validateBatchItems; } });
