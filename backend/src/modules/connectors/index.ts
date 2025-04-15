/**
 * Connectors Module
 * 
 * This module provides standardized connectors for various marketplaces and services.
 * It includes base classes, interfaces, and concrete implementations for
 * connecting to external APIs with built-in South African network optimizations.
 */

// Module export
export * from './connectors.module';

// Core interfaces and types
export * from './interfaces';

// Services
export * from './services/connector-factory.service';

// Repositories
export * from './repositories/connector-credentials.repository';

// Base adapters
export * from './adapters/base-connector';
export * from './adapters/base-marketplace-connector';

// Marketplace connectors
export * from './adapters/woocommerce-connector';
export * from './adapters/takealot-connector';
export * from './adapters/bidorbuy-connector';
export * from './adapters/makro-connector';
export * from './adapters/superbalist-connector';
export * from './adapters/wantitall-connector';
export * from './adapters/amazon-sp';
export * from './adapters/shopify';

// Financial connectors
export * from './adapters/xero';

// Utilities
export * from './utils/network-aware-client';