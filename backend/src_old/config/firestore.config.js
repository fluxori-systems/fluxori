"use strict";
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
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
exports.FirestoreConfigService = void 0;
var common_1 = require("@nestjs/common");
var firestore_1 = require("@google-cloud/firestore");
/**
 * Implements a type-safe converter for Firestore
 */
var FirestoreConverter = /** @class */ (function () {
  function FirestoreConverter() {}
  /**
   * Convert a model object to Firestore data
   */
  FirestoreConverter.prototype.toFirestore = function (modelObject) {
    return modelObject;
  };
  /**
   * Convert Firestore document data to a typed model object
   */
  FirestoreConverter.prototype.fromFirestore = function (snapshot) {
    var data = snapshot.data();
    // Handle timestamp conversions
    var converted = __assign(__assign({}, data), { id: snapshot.id });
    // Convert Timestamp objects to JavaScript Date objects
    if (data.createdAt instanceof firestore_1.Timestamp) {
      converted.createdAt = data.createdAt.toDate();
    }
    if (data.updatedAt instanceof firestore_1.Timestamp) {
      converted.updatedAt = data.updatedAt.toDate();
    }
    if (data.deletedAt instanceof firestore_1.Timestamp) {
      converted.deletedAt = data.deletedAt.toDate();
    }
    return converted;
  };
  return FirestoreConverter;
})();
/**
 * Firestore Configuration Service
 *
 * This service provides configuration and connection to Google Cloud Firestore.
 */
var FirestoreConfigService = (function () {
  var _classDecorators = [(0, common_1.Injectable)()];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var FirestoreConfigService = (_classThis = /** @class */ (function () {
    function FirestoreConfigService_1(configService) {
      this.configService = configService;
      this.logger = new common_1.Logger(FirestoreConfigService.name);
      this.projectId = this.configService.get("GCP_PROJECT_ID") || "";
      this.region = this.configService.get("GCP_REGION") || "us-central1";
      var databaseId = this.configService.get(
        "FIRESTORE_DATABASE_ID",
        "fluxori-db",
      );
      this.collectionPrefix = this.configService.get(
        "FIRESTORE_COLLECTION_PREFIX",
        "",
      );
      // Configure Firestore settings
      var settings = {
        projectId: this.projectId,
        databaseId: databaseId,
        ignoreUndefinedProperties: true,
      };
      // Initialize Firestore client
      this.firestore = new firestore_1.Firestore(settings);
      this.logger.log(
        "Initialized Firestore connection to project "
          .concat(this.projectId, ", database ")
          .concat(databaseId, ", region ")
          .concat(this.region),
      );
    }
    /**
     * Get the Firestore client instance
     */
    FirestoreConfigService_1.prototype.getFirestore = function () {
      return this.firestore;
    };
    /**
     * Get a Firestore collection with the correct prefix
     * @param collectionName Base collection name
     * @returns Firestore collection reference
     */
    FirestoreConfigService_1.prototype.getCollection = function (
      collectionName,
    ) {
      var fullCollectionName = this.collectionPrefix
        ? "".concat(this.collectionPrefix, "_").concat(collectionName)
        : collectionName;
      // Use the converter for type safety
      return this.firestore
        .collection(fullCollectionName)
        .withConverter(new FirestoreConverter());
    };
    /**
     * Create a document reference
     * @param collectionName Collection name
     * @param documentId Document ID
     * @returns Firestore document reference
     */
    FirestoreConfigService_1.prototype.getDocument = function (
      collectionName,
      documentId,
    ) {
      return this.getCollection(collectionName).doc(documentId);
    };
    /**
     * Generate a full collection name with prefix
     * @param collectionName Base collection name
     * @returns Full collection name with prefix
     */
    FirestoreConfigService_1.prototype.getCollectionName = function (
      collectionName,
    ) {
      return this.collectionPrefix
        ? "".concat(this.collectionPrefix, "_").concat(collectionName)
        : collectionName;
    };
    /**
     * Get the GCP project ID
     * @returns Project ID string
     */
    FirestoreConfigService_1.prototype.getProjectId = function () {
      return this.projectId;
    };
    /**
     * Get the GCP region
     * @returns Region string
     */
    FirestoreConfigService_1.prototype.getRegion = function () {
      return this.region;
    };
    return FirestoreConfigService_1;
  })());
  __setFunctionName(_classThis, "FirestoreConfigService");
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
    FirestoreConfigService = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (FirestoreConfigService = _classThis);
})();
exports.FirestoreConfigService = FirestoreConfigService;
