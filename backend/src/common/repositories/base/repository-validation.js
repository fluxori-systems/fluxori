"use strict";
/**
 * Validation utilities for repository operations
 * Provides entity validation for the Firestore repositories
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryValidationError = void 0;
exports.validateEntity = validateEntity;
exports.validateRequiredFields = validateRequiredFields;
exports.validateEntityId = validateEntityId;
exports.isEntityDeleted = isEntityDeleted;
exports.validateEntityNotDeleted = validateEntityNotDeleted;
exports.validateBatchItems = validateBatchItems;
var common_1 = require("@nestjs/common");
/**
 * Custom error class for repository validation errors
 */
var RepositoryValidationError = /** @class */ (function (_super) {
    __extends(RepositoryValidationError, _super);
    function RepositoryValidationError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = "RepositoryValidationError";
        return _this;
    }
    return RepositoryValidationError;
}(common_1.BadRequestException));
exports.RepositoryValidationError = RepositoryValidationError;
/**
 * Validate an entity against a schema or rules
 */
function validateEntity(entity, rules) {
    if (rules === void 0) { rules = {}; }
    // Simple validation - can be expanded with more complex validation logic
    for (var _i = 0, _a = Object.entries(rules); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], rule = _b[1];
        if (rule.required && (entity[key] === undefined || entity[key] === null)) {
            throw new RepositoryValidationError("Missing required field: ".concat(key));
        }
    }
    return true;
}
/**
 * Validate that required fields are present in an entity
 * @throws BadRequestException if required fields are missing
 */
function validateRequiredFields(entity, requiredFields) {
    var missingFields = [];
    // Check for each required field
    for (var _i = 0, requiredFields_1 = requiredFields; _i < requiredFields_1.length; _i++) {
        var field = requiredFields_1[_i];
        if (entity[field] === undefined || entity[field] === null) {
            missingFields.push(field);
        }
    }
    // Throw error if any required fields are missing
    if (missingFields.length > 0) {
        throw new common_1.BadRequestException("Missing required fields: ".concat(missingFields.join(", ")));
    }
}
/**
 * Validate that an entity ID exists and has the correct format
 * @throws BadRequestException if ID is invalid
 */
function validateEntityId(id) {
    if (!id) {
        throw new common_1.BadRequestException("Entity ID is required");
    }
    if (typeof id !== "string") {
        throw new common_1.BadRequestException("Entity ID must be a string");
    }
    if (id.trim() === "") {
        throw new common_1.BadRequestException("Entity ID cannot be empty");
    }
    // Check for invalid characters in ID
    var invalidChars = /[.\/\[\]#$]/;
    if (invalidChars.test(id)) {
        throw new common_1.BadRequestException("Entity ID contains invalid characters");
    }
}
/**
 * Check if entity is marked as deleted
 */
function isEntityDeleted(entity) {
    return Boolean(entity.isDeleted);
}
/**
 * Validate that an entity is not deleted
 * @throws BadRequestException if entity is deleted
 */
function validateEntityNotDeleted(entity, errorMessage) {
    if (errorMessage === void 0) { errorMessage = "Entity is deleted"; }
    if (isEntityDeleted(entity)) {
        throw new common_1.BadRequestException(errorMessage);
    }
}
/**
 * Validate batch items for a batch operation
 */
function validateBatchItems(items, minItems, maxItems) {
    if (minItems === void 0) { minItems = 1; }
    if (maxItems === void 0) { maxItems = 500; }
    if (!Array.isArray(items)) {
        throw new common_1.BadRequestException("Items must be an array");
    }
    if (items.length < minItems) {
        throw new common_1.BadRequestException("Batch operation requires at least ".concat(minItems, " item(s)"));
    }
    if (items.length > maxItems) {
        throw new common_1.BadRequestException("Batch operation cannot exceed ".concat(maxItems, " items"));
    }
}
