"use strict";
/**
 * Data converter utilities for Firestore entities
 * Provides conversion between Firestore document data and entity objects
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEntityConverter = createEntityConverter;
exports.sanitizeEntityForStorage = sanitizeEntityForStorage;
exports.applyServerTimestamps = applyServerTimestamps;
exports.applyClientTimestamps = applyClientTimestamps;
var firestore_1 = require("@google-cloud/firestore");
var google_cloud_types_1 = require("../../../types/google-cloud.types");
/**
 * Create a converter for a Firestore entity
 * This handles converting between our entity model and Firestore's data model
 */
function createEntityConverter() {
    return {
        /**
         * Convert entity to Firestore data
         */
        toFirestore: function (entity) {
            var documentData = __assign({}, entity);
            // Convert dates to Firestore Timestamps
            for (var _i = 0, _a = Object.entries(entity); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], value = _b[1];
                if (value instanceof Date) {
                    documentData[key] = firestore_1.Timestamp.fromDate(value);
                }
            }
            return documentData;
        },
        /**
         * Convert Firestore document to entity
         */
        fromFirestore: function (snapshot) {
            var documentData = snapshot.data();
            var entity = __assign(__assign({}, documentData), { id: snapshot.id });
            // Convert Firestore Timestamps to JavaScript Dates
            for (var _i = 0, _a = Object.entries(entity); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], value = _b[1];
                if ((0, google_cloud_types_1.isFirestoreTimestamp)(value)) {
                    entity[key] = value.toDate();
                }
            }
            return entity;
        },
    };
}
/**
 * Sanitize entity for storage
 * Removes any fields that should not be stored in Firestore
 */
function sanitizeEntityForStorage(entity) {
    // Create a copy of the entity to avoid modifying the original
    var sanitized = __assign({}, entity);
    // List of fields to exclude from storage
    var excludedFields = ["_id", "_ref", "_path", "_metadata"];
    // Remove excluded fields
    for (var _i = 0, excludedFields_1 = excludedFields; _i < excludedFields_1.length; _i++) {
        var field = excludedFields_1[_i];
        if (field in sanitized) {
            delete sanitized[field];
        }
    }
    return sanitized;
}
/**
 * Apply server timestamps to entity
 */
function applyServerTimestamps(entity, serverTimestampField, isNewEntity) {
    if (isNewEntity === void 0) { isNewEntity = false; }
    var result = __assign({}, entity);
    // Apply timestamp to updateAt always, and createdAt for new entities
    result.updatedAt = serverTimestampField;
    if (isNewEntity) {
        result.createdAt = serverTimestampField;
    }
    return result;
}
/**
 * Apply client-side timestamps to entity
 */
function applyClientTimestamps(entity, isNewEntity) {
    if (isNewEntity === void 0) { isNewEntity = false; }
    var now = new Date();
    var result = __assign({}, entity);
    // Apply timestamp to updateAt always, and createdAt for new entities
    result.updatedAt = now;
    if (isNewEntity) {
        result.createdAt = now;
    }
    return result;
}
