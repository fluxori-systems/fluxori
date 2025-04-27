/**
 * Financial Connector Interface
 *
 * Interface for financial connectors like accounting systems (Xero, QuickBooks, etc.)
 */

import { IConnector } from "./connector.interface";
import {
  OperationResult,
  PaginatedResponse,
  PaginationOptions,
} from "./connector.types";

/**
 * Financial entity interfaces - these would typically be defined in more detail
 * in the specific connector implementation
 */
export interface OrganizationEntity {
  id: string;
  externalId: string;
  name: string;
  [key: string]: any;
}

export interface ContactEntity {
  id: string;
  externalId: string;
  name: string;
  [key: string]: any;
}

export interface InvoiceEntity {
  id: string;
  externalId: string;
  [key: string]: any;
}

export interface PaymentEntity {
  id: string;
  externalId: string;
  [key: string]: any;
}

export interface TaxRateEntity {
  id: string;
  externalId: string;
  name: string;
  rate: number;
  [key: string]: any;
}

/**
 * Financial connector interface definition
 */
export interface IFinancialConnector extends IConnector {
  // Organization operations
  getOrganization(): Promise<OperationResult<OrganizationEntity>>;

  // Contact operations
  getContact(contactId: string): Promise<OperationResult<ContactEntity>>;
  getContacts(
    options?: PaginationOptions,
  ): Promise<PaginatedResponse<ContactEntity>>;
  createContact(
    contact: Partial<ContactEntity>,
  ): Promise<OperationResult<ContactEntity>>;
  updateContact(
    contactId: string,
    contact: Partial<ContactEntity>,
  ): Promise<OperationResult<ContactEntity>>;

  // Invoice operations
  getInvoice(invoiceId: string): Promise<OperationResult<InvoiceEntity>>;
  getInvoices(
    options?: PaginationOptions,
  ): Promise<PaginatedResponse<InvoiceEntity>>;
  createInvoice(
    invoice: Partial<InvoiceEntity>,
  ): Promise<OperationResult<InvoiceEntity>>;
  updateInvoice(
    invoiceId: string,
    invoice: Partial<InvoiceEntity>,
  ): Promise<OperationResult<InvoiceEntity>>;

  // Payment operations
  getPayment(paymentId: string): Promise<OperationResult<PaymentEntity>>;
  getPayments(
    options?: PaginationOptions,
  ): Promise<PaginatedResponse<PaymentEntity>>;
  createPayment(
    payment: Partial<PaymentEntity>,
  ): Promise<OperationResult<PaymentEntity>>;

  // Tax operations
  getTaxRates(): Promise<OperationResult<TaxRateEntity[]>>;
}
