"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORAGE_SERVICE = void 0;
/**
 * Token for storage service provider
 *
 * Use this token for dependency injection of StorageService
 * instead of using the interface directly, which causes TypeScript errors.
 */
exports.STORAGE_SERVICE = Symbol("STORAGE_SERVICE");
