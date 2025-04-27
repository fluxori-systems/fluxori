/**
 * Types for the International Trade module
 */

export enum ShippingMethod {
  AIR = "air",
  SEA = "sea",
  ROAD = "road",
  RAIL = "rail",
  EXPRESS = "express",
}

export enum ShipmentStatus {
  DRAFT = "draft",
  BOOKED = "booked",
  IN_TRANSIT = "in_transit",
  CUSTOMS = "customs",
  DELIVERED = "delivered",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum CustomsStatus {
  NOT_STARTED = "not_started",
  DOCUMENTS_PREPARING = "documents_preparing",
  DOCUMENTS_SUBMITTED = "documents_submitted",
  INSPECTION = "inspection",
  DUTIES_PENDING = "duties_pending",
  DUTIES_PAID = "duties_paid",
  CLEARED = "cleared",
  REJECTED = "rejected",
}

export enum ComplianceStatus {
  UNKNOWN = "unknown",
  PENDING_REVIEW = "pending_review",
  COMPLIANT = "compliant",
  NON_COMPLIANT = "non_compliant",
  EXEMPTION = "exemption",
}

export enum IncoTerm {
  EXW = "exw", // Ex Works
  FCA = "fca", // Free Carrier
  FAS = "fas", // Free Alongside Ship
  FOB = "fob", // Free On Board
  CFR = "cfr", // Cost and Freight
  CIF = "cif", // Cost, Insurance and Freight
  CPT = "cpt", // Carriage Paid To
  CIP = "cip", // Carriage and Insurance Paid To
  DAP = "dap", // Delivered At Place
  DPU = "dpu", // Delivered at Place Unloaded
  DDP = "ddp", // Delivered Duty Paid
}

export interface IInternationalShipment {
  organizationId: string;
  referenceNumber: string;
  description: string;
  originCountry: string;
  originAddress: string;
  destinationCountry: string;
  destinationAddress: string;
  shippingMethod: ShippingMethod;
  incoTerm: IncoTerm;
  status: ShipmentStatus;
  customsStatus: CustomsStatus;
  complianceStatus: ComplianceStatus;
  estimatedDeparture: Date;
  estimatedArrival: Date;
  actualDeparture?: Date;
  actualArrival?: Date;
  carrierId?: string;
  carrierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  totalWeight: number;
  weightUnit: string;
  totalVolume: number;
  volumeUnit: string;
  totalValue: number;
  currencyCode: string;
  insuranceValue?: number;
  dutiesAndTaxes?: number;
  totalCost?: number;
  products: {
    productId: string;
    sku: string;
    name: string;
    description: string;
    hsCode?: string;
    quantity: number;
    unitValue: number;
    totalValue: number;
    weight: number;
    countryOfOrigin: string;
  }[];
  documents: {
    type: string;
    name: string;
    fileUrl: string;
    uploadedAt: Date;
    status: string;
  }[];
  notes?: string;
  customsDeclarationNumber?: string;
  customsDeclarationDate?: Date;
  companyCertifications?: string[];
  productCertifications?: Record<string, string[]>;
  restrictedItems?: boolean;
  dangerousGoods?: boolean;
  specialHandling?: string[];
}

export interface IInternationalShipmentDocument
  extends IInternationalShipment,
    Document {}

export interface CreateShipmentDto {
  organizationId: string;
  referenceNumber: string;
  description: string;
  originCountry: string;
  originAddress: string;
  destinationCountry: string;
  destinationAddress: string;
  shippingMethod: ShippingMethod;
  incoTerm: IncoTerm;
  estimatedDeparture: Date;
  estimatedArrival: Date;
  carrierId?: string;
  carrierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  totalWeight: number;
  weightUnit: string;
  totalVolume: number;
  volumeUnit: string;
  totalValue: number;
  currencyCode: string;
  insuranceValue?: number;
  products: {
    productId: string;
    sku: string;
    name: string;
    description: string;
    hsCode?: string;
    quantity: number;
    unitValue: number;
    totalValue: number;
    weight: number;
    countryOfOrigin: string;
  }[];
  notes?: string;
  companyCertifications?: string[];
  restrictedItems?: boolean;
  dangerousGoods?: boolean;
  specialHandling?: string[];
}

export interface UpdateShipmentDto {
  description?: string;
  status?: ShipmentStatus;
  customsStatus?: CustomsStatus;
  complianceStatus?: ComplianceStatus;
  estimatedDeparture?: Date;
  estimatedArrival?: Date;
  actualDeparture?: Date;
  actualArrival?: Date;
  trackingNumber?: string;
  trackingUrl?: string;
  insuranceValue?: number;
  dutiesAndTaxes?: number;
  totalCost?: number;
  documents?: {
    type: string;
    name: string;
    fileUrl: string;
    uploadedAt: Date;
    status: string;
  }[];
  notes?: string;
  customsDeclarationNumber?: string;
  customsDeclarationDate?: Date;
}

export interface QueryShipmentsDto {
  organizationId?: string;
  status?: ShipmentStatus;
  customsStatus?: CustomsStatus;
  originCountry?: string;
  destinationCountry?: string;
  shippingMethod?: ShippingMethod;
  fromDate?: Date;
  toDate?: Date;
  referenceNumber?: string;
  limit?: number;
  offset?: number;
}

export interface ShipmentResponse {
  id: string;
  organizationId: string;
  referenceNumber: string;
  description: string;
  originCountry: string;
  originAddress: string;
  destinationCountry: string;
  destinationAddress: string;
  shippingMethod: ShippingMethod;
  incoTerm: IncoTerm;
  status: ShipmentStatus;
  customsStatus: CustomsStatus;
  complianceStatus: ComplianceStatus;
  estimatedDeparture: Date;
  estimatedArrival: Date;
  actualDeparture?: Date;
  actualArrival?: Date;
  carrierId?: string;
  carrierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  totalWeight: number;
  weightUnit: string;
  totalVolume: number;
  volumeUnit: string;
  totalValue: number;
  currencyCode: string;
  insuranceValue?: number;
  dutiesAndTaxes?: number;
  totalCost?: number;
  products: {
    productId: string;
    sku: string;
    name: string;
    description: string;
    hsCode?: string;
    quantity: number;
    unitValue: number;
    totalValue: number;
    weight: number;
    countryOfOrigin: string;
  }[];
  documents: {
    type: string;
    name: string;
    fileUrl: string;
    uploadedAt: Date;
    status: string;
  }[];
  notes?: string;
  customsDeclarationNumber?: string;
  customsDeclarationDate?: Date;
  companyCertifications?: string[];
  productCertifications?: Record<string, string[]>;
  restrictedItems?: boolean;
  dangerousGoods?: boolean;
  specialHandling?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IHSCode {
  code: string;
  section: string;
  chapter: string;
  heading: string;
  description: string;
  notes?: string;
  alternativeNames?: string[];
  dutyRates?: Record<string, number>;
  restrictedCountries?: string[];
  requiredCertifications?: string[];
}

export interface IHSCodeDocument extends IHSCode, Document {}

export interface ITradeRestriction {
  originCountry: string;
  destinationCountry: string;
  type: string;
  description: string;
  details: string;
  affectedProducts?: string[];
  affectedHSCodes?: string[];
  startDate?: Date;
  endDate?: Date;
  exemptionCriteria?: string;
  sourceUrl?: string;
}

export interface ITradeRestrictionDocument
  extends ITradeRestriction,
    Document {}

export interface IComplianceRequirement {
  country: string;
  productCategory: string;
  requirementType: string;
  description: string;
  isRequired: boolean;
  details: string;
  affectedHSCodes?: string[];
  documentationNeeded?: string[];
  regulatoryBody?: string;
  regulationReference?: string;
  lastUpdated: Date;
}

export interface IComplianceRequirementDocument
  extends IComplianceRequirement,
    Document {}
