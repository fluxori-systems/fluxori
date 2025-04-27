// Dependencies for international trade module
// Using Google Cloud services

// Export the interfaces and types needed by this module
export interface IHSCodeDocument {
  id: string;
  code: string;
  description: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IComplianceRequirementDocument {
  id: string;
  countryCode: string;
  hsCode: string;
  requirement: string;
  documentationRequired: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITradeRestrictionDocument {
  id: string;
  countryCode: string;
  hsCode: string;
  restrictionType: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInternationalShipmentDocument {
  id: string;
  organizationId: string;
  destination: string;
  hsCode: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  status: string;
  compliance: {
    isCompliant: boolean;
    issues: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}
