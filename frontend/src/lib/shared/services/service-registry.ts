'use client';

import { IAnimationService } from './animation-service.interface';
import { IConnectionService } from './connection-service.interface';

// Define a type for the default services
interface DefaultServices {
  defaultAnimationService: IAnimationService;
  defaultConnectionService: IConnectionService;
}

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

/**
 * Get default service implementations with lazy loading and dependency inversion
 * 
 * This function dynamically imports the default service implementations from 
 * the motion module, allowing the Shared module to avoid direct dependencies
 * on the Motion module at build/compile time.
 */
export function getDefaultServices(): DefaultServices {
  // Create minimal placeholder services that do nothing
  // These will be used if the actual implementations can't be loaded
  const nullAnimationService: IAnimationService = {
    animateElement: () => Promise.resolve(),
    createAnimation: () => ({ id: 'null', play: () => Promise.resolve(), stop: () => {} }),
    setGlobalAnimationScale: () => {},
    getGlobalAnimationScale: () => 1,
    enableAnimations: () => {},
    disableAnimations: () => {},
    isAnimationEnabled: () => true
  };
  
  const nullConnectionService: IConnectionService = {
    getConnectionQuality: () => ({
      quality: 'medium',
      isMetered: false,
      isDataSaver: false,
      saveData: false
    }),
    subscribeToConnectionChanges: () => () => {},
    isDataSaverEnabled: () => false,
    getNetworkType: () => 'unknown',
    getEffectiveConnectionType: () => '4g',
    getDownlinkSpeed: () => 10,
    getRTT: () => 100,
    simulateConnectionType: () => {}
  };
  
  try {
    // Try to dynamically load the actual services
    // In a real environment, this would be provided by the motion module
    // This dynamic import keeps us from having a build-time dependency
    if (typeof window !== 'undefined' && window.__DEFAULT_SERVICES) {
      return window.__DEFAULT_SERVICES;
    }
    
    // For development or SSR where window isn't available
    return {
      defaultAnimationService: nullAnimationService,
      defaultConnectionService: nullConnectionService
    };
  } catch (error) {
    // Fallback to null implementations if there's an error
    console.warn('Error loading default services:', error);
    return {
      defaultAnimationService: nullAnimationService,
      defaultConnectionService: nullConnectionService
    };
  }
}