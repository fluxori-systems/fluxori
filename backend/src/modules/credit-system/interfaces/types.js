"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditUsageType = exports.CreditModelType = void 0;
/**
 * Credit allocation model types
 */
var CreditModelType;
(function (CreditModelType) {
    CreditModelType["SUBSCRIPTION"] = "subscription";
    CreditModelType["PAY_AS_YOU_GO"] = "pay_as_you_go";
    CreditModelType["QUOTA"] = "quota";
    CreditModelType["PREPAID"] = "prepaid";
})(CreditModelType || (exports.CreditModelType = CreditModelType = {}));
/**
 * Credit usage types
 */
var CreditUsageType;
(function (CreditUsageType) {
    CreditUsageType["TOKEN_USAGE"] = "token_usage";
    CreditUsageType["MODEL_CALL"] = "model_call";
    CreditUsageType["DOCUMENT_PROCESSING"] = "document_processing";
    CreditUsageType["RAG_QUERY"] = "rag_query";
    CreditUsageType["EMBEDDING"] = "embedding";
    CreditUsageType["INSIGHT_GENERATION"] = "insight_generation";
})(CreditUsageType || (exports.CreditUsageType = CreditUsageType = {}));
