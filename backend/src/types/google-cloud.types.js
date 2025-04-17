"use strict";
/**
 * Type definitions for Google Cloud services
 *
 * This file defines interfaces and types for Google Cloud services
 * used throughout the application.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timestamp = void 0;
exports.isFirestoreTimestamp = isFirestoreTimestamp;
var firestore_1 = require("@google-cloud/firestore");
Object.defineProperty(exports, "Timestamp", { enumerable: true, get: function () { return firestore_1.Timestamp; } });
// Type guard to check if an object is a Firebase Timestamp
function isFirestoreTimestamp(obj) {
    return (obj &&
        typeof obj === "object" &&
        "seconds" in obj &&
        "nanoseconds" in obj &&
        typeof obj.seconds === "number" &&
        typeof obj.nanoseconds === "number");
}
