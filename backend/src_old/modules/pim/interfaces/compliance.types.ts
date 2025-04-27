/**
 * Types for the Advanced Compliance Framework (PIM Module)
 * Extracted here to break circular dependencies between services and repositories.
 */

/** Compliance check status */
export enum ComplianceStatus {
  COMPLIANT = "compliant",
  NON_COMPLIANT = "non_compliant",
  PENDING_VERIFICATION = "pending_verification",
  EXEMPT = "exempt",
  NOT_APPLICABLE = "not_applicable",
  IN_PROGRESS = "in_progress",
  EXPIRED = "expired",
}

/** Compliance categories for organization */
export enum ComplianceCategory {
  PRODUCT_SAFETY = "product_safety",
  LABELING = "labeling",
  PACKAGING = "packaging",
  RESTRICTED_SUBSTANCES = "restricted_substances",
  CERTIFICATION = "certification",
  IMPORT_EXPORT = "import_export",
  DATA_PROTECTION = "data_protection",
  ACCESSIBILITY = "accessibility",
  ENVIRONMENTAL = "environmental",
  CONSUMER_PROTECTION = "consumer_protection",
}

/** Compliance authority - regulatory body or standard */
export enum ComplianceAuthority {
  SABS = "sabs",
  NRCS = "nrcs",
  ICASA = "icasa",
  SAHPRA = "sahpra",
  SARS = "sars",
  ARSO = "arso",
  AFSEC = "afsec",
  ISO = "iso",
  IEC = "iec",
  CE = "ce",
  ROHS = "rohs",
  WEEE = "weee",
  GDPR = "gdpr",
  FCC = "fcc",
  FDA = "fda",
  CPSC = "cpsc",
  TAKEALOT = "takealot",
  AMAZON = "amazon",
  BIDORBUY = "bidorbuy",
  MAKRO = "makro",
}

/** Validation rule for compliance checking */
export interface ComplianceValidationRule {
  id: string;
  type:
    | "attribute_presence"
    | "attribute_value"
    | "file_presence"
    | "certificate_validity"
    | "custom";
  attribute?: string;
  condition?: string;
  validationExpression?: string;
  customValidator?: string;
  errorMessage: string;
}

/** Compliance rule with requirements and validation logic */
export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: ComplianceCategory;
  authority: ComplianceAuthority;
  regionCodes: string[];
  productTypes: string[];
  requiredAttributes: string[];
  validationRules: ComplianceValidationRule[];
  severity: "critical" | "high" | "medium" | "low";
  exemptionCriteria?: string;
  references?: string[];
  effectiveDate: Date;
  expirationDate?: Date;
  version: string;
  updatedAt: Date;
  createdAt: Date;
}

/** History of compliance status changes */
export interface ComplianceStatusChange {
  status: ComplianceStatus;
  date: Date;
  userId: string;
  notes?: string;
}

/** Compliance requirement for a product */
export interface ComplianceRequirement {
  id: string;
  productId: string;
  ruleId: string;
  status: ComplianceStatus;
  requiredBy: Date;
  documentationUrls?: string[];
  certificateIds?: string[];
  notes?: string;
  assignedTo?: string;
  lastChecked?: Date;
  history: ComplianceStatusChange[];
}

/** Result of a compliance check */
export interface ComplianceCheckResult {
  productId: string;
  ruleId: string;
  status: ComplianceStatus;
  validationResults: {
    passed: boolean;
    rule: ComplianceValidationRule;
    message: string;
    attributes?: Record<string, any>;
  }[];
  overallCompliance: boolean;
  missingRequirements: string[];
  recommendations: string[];
  checkDate: Date;
}

/** Certificate information */
export interface ComplianceCertificate {
  id: string;
  name: string;
  authority: ComplianceAuthority;
  certificateNumber: string;
  issueDate: Date;
  expirationDate: Date;
  documentUrl?: string;
  productIds: string[];
  status: "valid" | "expired" | "revoked" | "pending";
}

/** Options for compliance checks */
export interface ComplianceCheckOptions {
  region?: string;
  includeExempt?: boolean;
  includeExpired?: boolean;
  categories?: ComplianceCategory[];
  authorities?: ComplianceAuthority[];
  severities?: ("critical" | "high" | "medium" | "low")[];
}
