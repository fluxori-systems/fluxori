'use client';

import { IAnimationService } from './animation-service.interface';
import { IConnectionService } from './connection-service.interface';

/**
 * Registry for service implementations
 * This allows for decoupled registration and retrieval of services
 */
class ServiceRegistryClass {
  private services: Map<string, any> = new Map();
  
  /**
   * Register a service implementation
   * @param key Service identifier
   * @param implementation Service implementation
   */
  register<T>(key: string, implementation: T): void {
    this.services.set(key, implementation);
  }
  
  /**
   * Get a service implementation
   * @param key Service identifier
   * @returns Service implementation
   */
  get<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service ${key} not registered`);
    }
    return service as T;
  }
  
  /**
   * Check if a service is registered
   * @param key Service identifier
   * @returns True if the service is registered
   */
  has(key: string): boolean {
    return this.services.has(key);
  }
}

export const ServiceRegistry = new ServiceRegistryClass();

/**
 * Keys for registered services
 */
export const SERVICE_KEYS = {
  ANIMATION_SERVICE: 'animationService',
  CONNECTION_SERVICE: 'connectionService',
};

/**
 * Register the animation service implementation
 * @param implementation Animation service implementation
 */
export function registerAnimationService(implementation: IAnimationService): void {
  ServiceRegistry.register(SERVICE_KEYS.ANIMATION_SERVICE, implementation);
}

/**
 * Register the connection service implementation
 * @param implementation Connection service implementation
 */
export function registerConnectionService(implementation: IConnectionService): void {
  ServiceRegistry.register(SERVICE_KEYS.CONNECTION_SERVICE, implementation);
}

/**
 * Get the registered animation service
 * @returns Animation service implementation
 */
export function getAnimationService(): IAnimationService {
  return ServiceRegistry.get<IAnimationService>(SERVICE_KEYS.ANIMATION_SERVICE);
}

/**
 * Get the registered connection service
 * @returns Connection service implementation
 */
export function getConnectionService(): IConnectionService {
  return ServiceRegistry.get<IConnectionService>(SERVICE_KEYS.CONNECTION_SERVICE);
}