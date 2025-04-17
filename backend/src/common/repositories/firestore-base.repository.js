"use strict";
/**
 * Firestore Base Repository
 *
 * Implements a generic repository pattern for Firestore with caching,
 * soft-delete support, transactions, and optimistic locking.
 *
 * Fully TypeScript-compliant implementation with proper generic typing
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
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantAwareRepository = exports.FirestoreBaseRepository = void 0;
var common_1 = require("@nestjs/common");
var firestore_1 = require("@google-cloud/firestore");
// Configuration service
var base_1 = require("./base");
/**
 * Base Firestore repository implementation
 * Generic repository pattern for Firestore documents
 * TypeScript-compliant with proper interface implementation
 */
var FirestoreBaseRepository = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var FirestoreBaseRepository = _classThis = /** @class */ (function () {
        /**
         * Constructor for the FirestoreBaseRepository
         */
        function FirestoreBaseRepository_1(firestoreConfigService, collectionName, options) {
            var _a, _b, _c, _d, _e;
            this.firestoreConfigService = firestoreConfigService;
            this.collectionName = collectionName;
            this.logger = new common_1.Logger(this.constructor.name);
            this.statsTracker = (0, base_1.createRepositoryStats)();
            // Set options with defaults
            var defaultOptions = {
                collectionName: this.collectionName,
                useSoftDeletes: true,
                useVersioning: true,
                enableCache: false,
                cacheTTLMs: 60000, // 1 minute cache TTL
            };
            var mergedOptions = __assign(__assign({}, defaultOptions), options);
            this.useSoftDeletes = (_a = mergedOptions.useSoftDeletes) !== null && _a !== void 0 ? _a : true;
            this.useVersioning = (_b = mergedOptions.useVersioning) !== null && _b !== void 0 ? _b : true;
            this.requiredFields = (_c = mergedOptions.requiredFields) !== null && _c !== void 0 ? _c : [];
            // Initialize cache if enabled
            this.cache = new base_1.RepositoryCache({
                enabled: (_d = mergedOptions.enableCache) !== null && _d !== void 0 ? _d : false,
                ttlMs: (_e = mergedOptions.cacheTTLMs) !== null && _e !== void 0 ? _e : 60000,
                maxItems: 100,
                logger: this.logger,
            });
            // Create entity converter
            this.converter = (0, base_1.createEntityConverter)();
            // Get Firestore server timestamp
            this.serverTimestamp = firestore_1.FieldValue.serverTimestamp();
            this.logger.log("Repository initialized for collection: ".concat(this.collectionName));
        }
        Object.defineProperty(FirestoreBaseRepository_1.prototype, "firestore", {
            /**
             * Get Firestore instance
             */
            get: function () {
                return this.firestoreConfigService.getFirestore();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(FirestoreBaseRepository_1.prototype, "collection", {
            /**
             * Get collection reference
             */
            get: function () {
                return this.firestore.collection(this.collectionName);
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Get document reference by ID
         */
        FirestoreBaseRepository_1.prototype.getDocRef = function (id) {
            return this.collection.doc(id);
        };
        /**
         * Find an entity by its ID
         * @param id Document ID to find
         * @param options Find options
         * @returns The entity or null if not found
         */
        FirestoreBaseRepository_1.prototype.findById = function (id_1) {
            return __awaiter(this, arguments, void 0, function (id, options) {
                var cachedEntity, docSnapshot, entity, error_1;
                if (options === void 0) { options = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 5, , 6]);
                            // Validate ID
                            (0, base_1.validateEntityId)(id);
                            // Check cache first if enabled
                            if (!options.bypassCache && this.cache.has(id)) {
                                cachedEntity = this.cache.get(id);
                                if (cachedEntity) {
                                    (0, base_1.incrementCacheHits)(this.statsTracker);
                                    // Skip soft-deleted documents unless explicitly included
                                    if (!options.includeDeleted && (0, base_1.isEntityDeleted)(cachedEntity)) {
                                        return [2 /*return*/, null];
                                    }
                                    return [2 /*return*/, cachedEntity];
                                }
                            }
                            (0, base_1.incrementCacheMisses)(this.statsTracker);
                            docSnapshot = void 0;
                            if (!options.transaction) return [3 /*break*/, 2];
                            return [4 /*yield*/, options.transaction.get(this.getDocRef(id).withConverter(this.converter))];
                        case 1:
                            docSnapshot = (_a.sent());
                            return [3 /*break*/, 4];
                        case 2: return [4 /*yield*/, this.getDocRef(id)
                                .withConverter(this.converter)
                                .get()];
                        case 3:
                            docSnapshot = (_a.sent());
                            (0, base_1.incrementReads)(this.statsTracker);
                            _a.label = 4;
                        case 4:
                            // Return null if document doesn't exist
                            if (!docSnapshot.exists) {
                                if (options.throwIfNotFound) {
                                    throw new Error("Document with id ".concat(id, " not found in ").concat(this.collectionName));
                                }
                                return [2 /*return*/, null];
                            }
                            entity = docSnapshot.data();
                            // Skip soft-deleted documents unless explicitly included
                            if (!options.includeDeleted && (0, base_1.isEntityDeleted)(entity)) {
                                return [2 /*return*/, null];
                            }
                            // Add to cache
                            this.cache.set(id, entity);
                            return [2 /*return*/, entity];
                        case 5:
                            error_1 = _a.sent();
                            (0, base_1.recordError)(this.statsTracker, error_1);
                            this.logger.error("Error finding document by ID ".concat(id, ": ").concat(error_1.message), error_1.stack);
                            throw error_1;
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Find entities based on query options
         * @param options Query options
         * @returns Array of matching entities
         */
        FirestoreBaseRepository_1.prototype.find = function () {
            return __awaiter(this, arguments, void 0, function (options) {
                var query, _i, _a, _b, field, value, _c, _d, filter, querySnapshot, results, _e, results_1, entity, error_2;
                var _f;
                if (options === void 0) { options = {}; }
                return __generator(this, function (_g) {
                    switch (_g.label) {
                        case 0:
                            _g.trys.push([0, 5, , 6]);
                            query = this.collection.withConverter(this.converter);
                            // Apply filter if provided
                            if (options.filter) {
                                for (_i = 0, _a = Object.entries(options.filter); _i < _a.length; _i++) {
                                    _b = _a[_i], field = _b[0], value = _b[1];
                                    if (value !== undefined) {
                                        query = query.where(field, "==", value);
                                    }
                                }
                            }
                            // Apply advanced filters if provided
                            if (options.advancedFilters && options.advancedFilters.length > 0) {
                                for (_c = 0, _d = options.advancedFilters; _c < _d.length; _c++) {
                                    filter = _d[_c];
                                    query = query.where(String(filter.field), filter.operator, filter.value);
                                }
                            }
                            // Skip soft-deleted documents by default
                            if (this.useSoftDeletes && !options.includeDeleted) {
                                query = query.where("isDeleted", "==", false);
                            }
                            // Apply query options
                            if (options.queryOptions) {
                                // Apply ordering
                                if (options.queryOptions.orderBy) {
                                    query = query.orderBy(String(options.queryOptions.orderBy), options.queryOptions.direction || "asc");
                                }
                                // Apply limit
                                if (options.queryOptions.limit) {
                                    query = query.limit(options.queryOptions.limit);
                                }
                                // Apply offset by implementing a cursor-based approach
                                if (options.queryOptions.offset && options.queryOptions.offset > 0) {
                                    query = query.limit((options.queryOptions.limit || 100) + options.queryOptions.offset);
                                }
                                // Apply cursor-based pagination
                                if (options.queryOptions.startAfter) {
                                    query = query.startAfter(options.queryOptions.startAfter);
                                }
                                if (options.queryOptions.endBefore) {
                                    query = query.endBefore(options.queryOptions.endBefore);
                                }
                                // Apply field selection
                                if (options.queryOptions.select &&
                                    options.queryOptions.select.length > 0) {
                                    query = query.select.apply(query, options.queryOptions.select.map(String));
                                }
                            }
                            querySnapshot = void 0;
                            if (!options.transaction) return [3 /*break*/, 2];
                            return [4 /*yield*/, options.transaction.get(query)];
                        case 1:
                            querySnapshot = _g.sent();
                            return [3 /*break*/, 4];
                        case 2: return [4 /*yield*/, query.get()];
                        case 3:
                            querySnapshot = _g.sent();
                            (0, base_1.incrementReads)(this.statsTracker);
                            _g.label = 4;
                        case 4:
                            results = querySnapshot.docs.map(function (doc) { return doc.data(); });
                            // Apply offset (since Firestore doesn't support native offset)
                            if (((_f = options.queryOptions) === null || _f === void 0 ? void 0 : _f.offset) && options.queryOptions.offset > 0) {
                                results = results.slice(options.queryOptions.offset);
                                // Re-apply limit after offset
                                if (options.queryOptions.limit) {
                                    results = results.slice(0, options.queryOptions.limit);
                                }
                            }
                            // Add to cache if enabled and not too many results
                            if (options.useCache !== false && results.length <= 100) {
                                for (_e = 0, results_1 = results; _e < results_1.length; _e++) {
                                    entity = results_1[_e];
                                    this.cache.set(entity.id, entity);
                                }
                            }
                            return [2 /*return*/, results];
                        case 5:
                            error_2 = _g.sent();
                            (0, base_1.recordError)(this.statsTracker, error_2);
                            this.logger.error("Error finding documents: ".concat(error_2.message), error_2.stack);
                            throw error_2;
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get all entities
         * @param options Find options
         * @returns Promise with array of all entities
         */
        FirestoreBaseRepository_1.prototype.findAll = function () {
            return __awaiter(this, arguments, void 0, function (options) {
                if (options === void 0) { options = {}; }
                return __generator(this, function (_a) {
                    // Simple wrapper around find to maintain backwards compatibility
                    return [2 /*return*/, this.find(options)];
                });
            });
        };
        /**
         * Count entities based on query options
         * @param options Count options
         * @returns The count of matching entities
         */
        FirestoreBaseRepository_1.prototype.count = function () {
            return __awaiter(this, arguments, void 0, function (options) {
                var query, _i, _a, _b, field, value, _c, _d, filter, count, snapshot, countSnapshot, snapshot, error_3;
                if (options === void 0) { options = {}; }
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            _e.trys.push([0, 8, , 9]);
                            query = this.collection;
                            // Apply filter if provided
                            if (options.filter) {
                                for (_i = 0, _a = Object.entries(options.filter); _i < _a.length; _i++) {
                                    _b = _a[_i], field = _b[0], value = _b[1];
                                    if (value !== undefined) {
                                        query = query.where(field, "==", value);
                                    }
                                }
                            }
                            // Apply advanced filters if provided
                            if (options.advancedFilters && options.advancedFilters.length > 0) {
                                for (_c = 0, _d = options.advancedFilters; _c < _d.length; _c++) {
                                    filter = _d[_c];
                                    query = query.where(String(filter.field), filter.operator, filter.value);
                                }
                            }
                            // Skip soft-deleted documents by default
                            if (this.useSoftDeletes && !options.includeDeleted) {
                                query = query.where("isDeleted", "==", false);
                            }
                            count = void 0;
                            if (!options.transaction) return [3 /*break*/, 2];
                            return [4 /*yield*/, options.transaction.get(query)];
                        case 1:
                            snapshot = _e.sent();
                            count = snapshot.size;
                            return [3 /*break*/, 7];
                        case 2:
                            if (!(typeof query.count === "function")) return [3 /*break*/, 4];
                            return [4 /*yield*/, query.count().get()];
                        case 3:
                            countSnapshot = _e.sent();
                            count = countSnapshot.data().count;
                            return [3 /*break*/, 6];
                        case 4: return [4 /*yield*/, query.get()];
                        case 5:
                            snapshot = _e.sent();
                            count = snapshot.size;
                            _e.label = 6;
                        case 6:
                            (0, base_1.incrementReads)(this.statsTracker);
                            _e.label = 7;
                        case 7: return [2 /*return*/, count];
                        case 8:
                            error_3 = _e.sent();
                            (0, base_1.recordError)(this.statsTracker, error_3);
                            this.logger.error("Error counting documents: ".concat(error_3.message), error_3.stack);
                            throw error_3;
                        case 9: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Create a new entity
         * @param data The entity data to create
         * @param options Creation options
         * @returns The created entity
         */
        FirestoreBaseRepository_1.prototype.create = function (data_1) {
            return __awaiter(this, arguments, void 0, function (data, options) {
                var docId, docRef, entityData, createdEntity, error_4;
                if (options === void 0) { options = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 4, , 5]);
                            // Validate required fields
                            if (this.requiredFields.length > 0) {
                                (0, base_1.validateRequiredFields)(data, this.requiredFields);
                            }
                            docId = options.useCustomId || this.collection.doc().id;
                            docRef = this.getDocRef(docId);
                            entityData = __assign({}, data);
                            // Add timestamps and metadata
                            if (options.useServerTimestamp) {
                                entityData = (0, base_1.applyServerTimestamps)(entityData, this.serverTimestamp, true);
                            }
                            else {
                                entityData = (0, base_1.applyClientTimestamps)(entityData, true);
                            }
                            // Add soft-delete flag
                            entityData.isDeleted = false;
                            // Add version if needed
                            if (this.useVersioning) {
                                entityData.version = options.initialVersion || 1;
                            }
                            if (!options.transaction) return [3 /*break*/, 1];
                            options.transaction.set(docRef, entityData);
                            return [3 /*break*/, 3];
                        case 1: return [4 /*yield*/, docRef.set(entityData)];
                        case 2:
                            _a.sent();
                            (0, base_1.incrementWrites)(this.statsTracker);
                            _a.label = 3;
                        case 3:
                            createdEntity = __assign({ id: docId }, entityData);
                            // Add to cache if enabled
                            if (options.addToCache !== false) {
                                this.cache.set(docId, createdEntity);
                            }
                            return [2 /*return*/, createdEntity];
                        case 4:
                            error_4 = _a.sent();
                            (0, base_1.recordError)(this.statsTracker, error_4);
                            this.logger.error("Error creating document: ".concat(error_4.message), error_4.stack);
                            throw error_4;
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Update an existing entity
         * @param id Document ID to update
         * @param data Data to update
         * @param options Update options
         * @returns The updated entity
         */
        FirestoreBaseRepository_1.prototype.update = function (id_1, data_1) {
            return __awaiter(this, arguments, void 0, function (id, data, options) {
                var docRef, docSnapshot, existingDoc, updateData, existingDoc, updateData, updatedDoc, error_5;
                if (options === void 0) { options = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 7, , 8]);
                            // Validate ID
                            (0, base_1.validateEntityId)(id);
                            docRef = this.getDocRef(id);
                            if (!options.transaction) return [3 /*break*/, 2];
                            return [4 /*yield*/, options.transaction.get(docRef)];
                        case 1:
                            docSnapshot = _a.sent();
                            if (!docSnapshot.exists) {
                                throw new Error("Document with id ".concat(id, " not found in ").concat(this.collectionName));
                            }
                            existingDoc = docSnapshot.data();
                            // Check if document is soft-deleted
                            if (!options.bypassSoftDeleteCheck && existingDoc.isDeleted) {
                                throw new Error("Cannot update soft-deleted document with id ".concat(id));
                            }
                            updateData = __assign({}, data);
                            // Update timestamp and version if needed
                            updateData.updatedAt = this.serverTimestamp;
                            if (this.useVersioning && options.incrementVersion !== false) {
                                updateData.version = (existingDoc.version || 0) + 1;
                            }
                            // Clean up data before sending to Firestore
                            if (options.sanitizeData !== false) {
                                updateData = (0, base_1.sanitizeEntityForStorage)(updateData);
                            }
                            // Perform update in transaction
                            options.transaction.update(docRef, updateData);
                            // For transactions, we can't return updated doc immediately
                            return [2 /*return*/, __assign(__assign(__assign({}, existingDoc), updateData), { id: id })];
                        case 2: return [4 /*yield*/, this.findById(id, {
                                bypassCache: true,
                                includeDeleted: options.bypassSoftDeleteCheck,
                            })];
                        case 3:
                            existingDoc = _a.sent();
                            if (!existingDoc) {
                                throw new Error("Document with id ".concat(id, " not found in ").concat(this.collectionName));
                            }
                            // Check if document is soft-deleted
                            if (!options.bypassSoftDeleteCheck && existingDoc.isDeleted) {
                                throw new Error("Cannot update soft-deleted document with id ".concat(id));
                            }
                            updateData = __assign({}, data);
                            // Update timestamp
                            updateData.updatedAt = new Date();
                            // Update version if needed
                            if (this.useVersioning && options.incrementVersion !== false) {
                                updateData.version = (existingDoc.version || 0) + 1;
                            }
                            // Clean up data before sending to Firestore
                            if (options.sanitizeData !== false) {
                                updateData = (0, base_1.sanitizeEntityForStorage)(updateData);
                            }
                            // Perform update
                            return [4 /*yield*/, docRef.update(updateData)];
                        case 4:
                            // Perform update
                            _a.sent();
                            (0, base_1.incrementWrites)(this.statsTracker);
                            // Invalidate cache if enabled
                            if (options.invalidateCache !== false) {
                                this.cache.delete(id);
                            }
                            return [4 /*yield*/, this.findById(id, { bypassCache: true })];
                        case 5:
                            updatedDoc = _a.sent();
                            if (!updatedDoc) {
                                throw new Error("Failed to retrieve updated document with id ".concat(id));
                            }
                            return [2 /*return*/, updatedDoc];
                        case 6: return [3 /*break*/, 8];
                        case 7:
                            error_5 = _a.sent();
                            (0, base_1.recordError)(this.statsTracker, error_5);
                            this.logger.error("Error updating document with id ".concat(id, ": ").concat(error_5.message), error_5.stack);
                            throw error_5;
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Delete an entity by ID (soft or hard delete)
         * @param id Document ID to delete
         * @param options Delete options
         */
        FirestoreBaseRepository_1.prototype.delete = function (id_1) {
            return __awaiter(this, arguments, void 0, function (id, options) {
                var docRef, softDelete, error_6;
                if (options === void 0) { options = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 7, , 8]);
                            // Validate ID
                            (0, base_1.validateEntityId)(id);
                            docRef = this.getDocRef(id);
                            softDelete = this.useSoftDeletes && options.softDelete !== false && !options.force;
                            if (!options.transaction) return [3 /*break*/, 1];
                            if (softDelete) {
                                // Soft delete - update the document
                                options.transaction.update(docRef, {
                                    isDeleted: true,
                                    deletedAt: new Date(),
                                    updatedAt: new Date(),
                                });
                            }
                            else {
                                // Hard delete - remove the document
                                options.transaction.delete(docRef);
                            }
                            return [3 /*break*/, 6];
                        case 1:
                            if (!softDelete) return [3 /*break*/, 3];
                            // Soft delete - update the document
                            return [4 /*yield*/, docRef.update({
                                    isDeleted: true,
                                    deletedAt: new Date(),
                                    updatedAt: new Date(),
                                })];
                        case 2:
                            // Soft delete - update the document
                            _a.sent();
                            return [3 /*break*/, 5];
                        case 3: 
                        // Hard delete - remove the document
                        return [4 /*yield*/, docRef.delete()];
                        case 4:
                            // Hard delete - remove the document
                            _a.sent();
                            _a.label = 5;
                        case 5:
                            (0, base_1.incrementWrites)(this.statsTracker);
                            _a.label = 6;
                        case 6:
                            // Clear from cache if enabled
                            if (options.clearCache !== false) {
                                this.cache.delete(id);
                            }
                            return [3 /*break*/, 8];
                        case 7:
                            error_6 = _a.sent();
                            (0, base_1.recordError)(this.statsTracker, error_6);
                            this.logger.error("Error deleting document with id ".concat(id, ": ").concat(error_6.message), error_6.stack);
                            throw error_6;
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Create multiple entities in batch
         * @param items Array of entities to create
         * @param options Batch options
         * @returns Result of the batch operation
         */
        FirestoreBaseRepository_1.prototype.createBatch = function (items_1) {
            return __awaiter(this, arguments, void 0, function (items, options) {
                var now_1, batchSize, batches, createdEntities_2, _loop_1, i, result, _i, createdEntities_1, entity, error_7;
                var _this = this;
                if (options === void 0) { options = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            // Validate items
                            (0, base_1.validateBatchItems)(items);
                            now_1 = new Date();
                            batchSize = 500;
                            batches = [];
                            createdEntities_2 = [];
                            _loop_1 = function (i) {
                                var batchItems = items.slice(i, i + batchSize);
                                batches.push(function (batch) {
                                    for (var _i = 0, batchItems_1 = batchItems; _i < batchItems_1.length; _i++) {
                                        var item = batchItems_1[_i];
                                        // Validate required fields
                                        if (_this.requiredFields.length > 0) {
                                            (0, base_1.validateRequiredFields)(item, _this.requiredFields);
                                        }
                                        // Generate doc reference
                                        var docRef = _this.collection.doc();
                                        // Prepare entity data
                                        var entityData = __assign({}, item);
                                        // Add timestamps and metadata
                                        if (options.useServerTimestamp) {
                                            entityData = (0, base_1.applyServerTimestamps)(entityData, _this.serverTimestamp, true);
                                        }
                                        else {
                                            entityData = __assign(__assign({}, entityData), { createdAt: now_1, updatedAt: now_1 });
                                        }
                                        // Add soft-delete flag
                                        entityData.isDeleted = false;
                                        // Add version if needed
                                        if (_this.useVersioning) {
                                            entityData.version = options.initialVersion || 1;
                                        }
                                        // Add to batch
                                        batch.set(docRef, entityData);
                                        // Add to created entities
                                        createdEntities_2.push(__assign({ id: docRef.id }, entityData));
                                    }
                                });
                            };
                            // Split into batches if needed
                            for (i = 0; i < items.length; i += batchSize) {
                                _loop_1(i);
                            }
                            return [4 /*yield*/, (0, base_1.executeMultiBatch)(this.firestore, batches)];
                        case 1:
                            result = _a.sent();
                            // Track stats
                            (0, base_1.incrementWrites)(this.statsTracker, result.writtenCount || 0);
                            // Cache entities if successful
                            if (options.addToCache !== false && result.status !== "error") {
                                for (_i = 0, createdEntities_1 = createdEntities_2; _i < createdEntities_1.length; _i++) {
                                    entity = createdEntities_1[_i];
                                    this.cache.set(entity.id, entity);
                                }
                            }
                            // If any errors, throw the first one
                            if (result.errors && result.errors.length > 0) {
                                throw result.errors[0].error;
                            }
                            return [2 /*return*/, createdEntities_2];
                        case 2:
                            error_7 = _a.sent();
                            (0, base_1.recordError)(this.statsTracker, error_7);
                            this.logger.error("Error creating batch: ".concat(error_7.message), error_7.stack);
                            throw error_7;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Execute a function within a transaction
         * @param txFn Function to execute in transaction
         * @param options Transaction options
         * @returns Result of the transaction
         */
        FirestoreBaseRepository_1.prototype.runTransaction = function (txFn_1) {
            return __awaiter(this, arguments, void 0, function (txFn, options) {
                var error_8;
                var _this = this;
                if (options === void 0) { options = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, (0, base_1.executeTransaction)(this.firestore, function (txContext) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, txFn(txContext)];
                                            case 1: 
                                            // Execute the function with the transaction context
                                            return [2 /*return*/, _a.sent()];
                                        }
                                    });
                                }); }, options)];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            error_8 = _a.sent();
                            (0, base_1.recordError)(this.statsTracker, error_8);
                            this.logger.error("Error executing transaction: ".concat(error_8.message), error_8.stack);
                            throw error_8;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Backwards compatibility method for withTransaction
         * @deprecated Use runTransaction instead
         */
        FirestoreBaseRepository_1.prototype.withTransaction = function (fn) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.runTransaction(function (context) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, fn(context.transaction)];
                            });
                        }); })];
                });
            });
        };
        /**
         * Find with pagination
         * @param queryOptions Query options
         * @returns Paginated result
         */
        FirestoreBaseRepository_1.prototype.paginate = function () {
            return __awaiter(this, arguments, void 0, function (queryOptions) {
                var page, pageSize, offset, advancedFilters, _i, _a, filter, totalPromise, itemsPromise, _b, total, items, totalPages, error_9;
                var _c, _d, _e, _f, _g, _h;
                if (queryOptions === void 0) { queryOptions = {}; }
                return __generator(this, function (_j) {
                    switch (_j.label) {
                        case 0:
                            _j.trys.push([0, 2, , 3]);
                            page = ((_c = queryOptions.pagination) === null || _c === void 0 ? void 0 : _c.page) || 1;
                            pageSize = ((_d = queryOptions.pagination) === null || _d === void 0 ? void 0 : _d.pageSize) || 10;
                            offset = (page - 1) * pageSize;
                            advancedFilters = [];
                            if (queryOptions.filters) {
                                for (_i = 0, _a = queryOptions.filters; _i < _a.length; _i++) {
                                    filter = _a[_i];
                                    advancedFilters.push({
                                        field: filter.field,
                                        operator: filter.operator,
                                        value: filter.value,
                                    });
                                }
                            }
                            totalPromise = this.count({
                                advancedFilters: advancedFilters,
                                includeDeleted: queryOptions.includeDeleted,
                            });
                            itemsPromise = this.find({
                                advancedFilters: advancedFilters,
                                queryOptions: {
                                    limit: pageSize,
                                    offset: offset,
                                    orderBy: (_f = (_e = queryOptions.orderBy) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.field,
                                    direction: (_h = (_g = queryOptions.orderBy) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.direction,
                                },
                                includeDeleted: queryOptions.includeDeleted,
                            });
                            return [4 /*yield*/, Promise.all([totalPromise, itemsPromise])];
                        case 1:
                            _b = _j.sent(), total = _b[0], items = _b[1];
                            totalPages = Math.ceil(total / pageSize);
                            return [2 /*return*/, {
                                    items: items,
                                    total: total,
                                    page: page,
                                    pageSize: pageSize,
                                    totalPages: totalPages,
                                    hasNext: page < totalPages,
                                    hasPrevious: page > 1,
                                }];
                        case 2:
                            error_9 = _j.sent();
                            (0, base_1.recordError)(this.statsTracker, error_9);
                            this.logger.error("Error paginating documents: ".concat(error_9.message), error_9.stack);
                            throw error_9;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get statistics for this repository
         */
        FirestoreBaseRepository_1.prototype.getStats = function () {
            return __assign({}, this.statsTracker);
        };
        return FirestoreBaseRepository_1;
    }());
    __setFunctionName(_classThis, "FirestoreBaseRepository");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FirestoreBaseRepository = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FirestoreBaseRepository = _classThis;
}();
exports.FirestoreBaseRepository = FirestoreBaseRepository;
/**
 * Tenant-aware repository implementation that adds organization filtering
 */
var TenantAwareRepository = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _classSuper = FirestoreBaseRepository;
    var TenantAwareRepository = _classThis = /** @class */ (function (_super) {
        __extends(TenantAwareRepository_1, _super);
        function TenantAwareRepository_1() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
         * Find all entities for a specific organization
         */
        TenantAwareRepository_1.prototype.findByOrganization = function (organizationId_1) {
            return __awaiter(this, arguments, void 0, function (organizationId, options) {
                var filter;
                if (options === void 0) { options = {}; }
                return __generator(this, function (_a) {
                    filter = __assign(__assign({}, options.filter), { organizationId: organizationId });
                    return [2 /*return*/, this.find(__assign(__assign({}, options), { filter: filter }))];
                });
            });
        };
        /**
         * Count entities for a specific organization
         */
        TenantAwareRepository_1.prototype.countByOrganization = function (organizationId_1) {
            return __awaiter(this, arguments, void 0, function (organizationId, options) {
                var filter;
                if (options === void 0) { options = {}; }
                return __generator(this, function (_a) {
                    filter = __assign(__assign({}, options.filter), { organizationId: organizationId });
                    return [2 /*return*/, this.count(__assign(__assign({}, options), { filter: filter }))];
                });
            });
        };
        /**
         * Paginate entities for a specific organization
         */
        TenantAwareRepository_1.prototype.paginateByOrganization = function (organizationId_1) {
            return __awaiter(this, arguments, void 0, function (organizationId, queryOptions) {
                var filters;
                if (queryOptions === void 0) { queryOptions = {}; }
                return __generator(this, function (_a) {
                    filters = __spreadArray(__spreadArray([], (queryOptions.filters || []), true), [
                        {
                            field: "organizationId",
                            operator: "==",
                            value: organizationId,
                        },
                    ], false);
                    return [2 /*return*/, this.paginate(__assign(__assign({}, queryOptions), { filters: filters }))];
                });
            });
        };
        return TenantAwareRepository_1;
    }(_classSuper));
    __setFunctionName(_classThis, "TenantAwareRepository");
    (function () {
        var _a;
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_a = _classSuper[Symbol.metadata]) !== null && _a !== void 0 ? _a : null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TenantAwareRepository = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TenantAwareRepository = _classThis;
}();
exports.TenantAwareRepository = TenantAwareRepository;
