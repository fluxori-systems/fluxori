'use client';

/**
 * Shared service interfaces module
 * 
 * This module exports interfaces for services used by both UI and Motion modules,
 * enabling dependency inversion to avoid circular dependencies.
 */

export * from './animation-service.interface';
export * from './connection-service.interface';
export * from './service-registry';