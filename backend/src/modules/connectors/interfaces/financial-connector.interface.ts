/**
 * Financial Connector Interface
 *
 * Interface for financial connectors like accounting systems (Xero, QuickBooks, etc.)
 */

import { IConnector } from './connector.interface';
import {
  OperationResult,
  PaginatedResponse,
  PaginationOptions,
} from './connector.types';

/**
 * Financial entity interfaces - these would typically be defined in more detail
 * in the specific connector implementation
 */
export interface OrganizationEntity {
  id: string;
  externalId: string;
  name: string;
  legalName?: string;
  address?: string;
  taxNumber?: string;
  email?: string;
  phone?: string;
  // Add more fields as your domain requires
} // No loose fields, explicit structure only

export interface ContactEntity {
  id: string;
  externalId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  organizationId?: string;
  // Add more fields as needed
} // No loose fields, explicit structure only

export interface InvoiceEntity {
  id: string;
  externalId: string;
  invoiceNumber?: string;
  dateIssued?: Date;
  dueDate?: Date;
  amount?: number;
  currency?: string;
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  organizationId?: string;
  contactId?: string;
  lineItems?: InvoiceLineItem[];
  // Add more fields as needed
} // No loose fields, explicit structure only

export interface InvoiceLineItem {
  id: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRateId?: string;
}

export interface PaymentEntity {
  id: string;
  externalId: string;
  paymentNumber?: string;
  datePaid?: Date;
  amount?: number;
  currency?: string;
  method?: string;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  invoiceId?: string;
  organizationId?: string;
  contactId?: string;
  // Add more fields as needed
} // No loose fields, explicit structure only

export interface TaxRateEntity {
  id: string;
  externalId: string;
  name: string;
  rate: number;
  description?: string;
  isCompound?: boolean;
  isRecoverable?: boolean;
  // Add more fields as needed
} // No loose fields, explicit structure only

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
