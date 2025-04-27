"use client";

import { ReactNode, createContext, useContext, useMemo } from "react";

import {
  IAnimationService,
  ANIMATION_SERVICE_KEY,
} from "../services/animation-service.interface";
import {
  IConnectionService,
  CONNECTION_SERVICE_KEY,
} from "../services/connection-service.interface";
import { SERVICE_KEYS } from "../services/service-registry";

import type { MotionContextType } from "../interfaces/motion-hooks.interface";

// Create context to hold all service implementations
interface ServiceContextType {
  [key: string]: any;
}

const ServiceContext = createContext<ServiceContextType>({});

interface ServiceProviderProps {
  children: ReactNode;
  animationService: IAnimationService;
  connectionService: IConnectionService;
}

/**
 * Provider component for all services
 * This allows components to access services through hooks
 */
export function ServiceProvider({
  children,
  animationService,
  connectionService,
}: ServiceProviderProps) {
  // Create services object that will be provided through context
  const services = useMemo(
    () => ({
      [ANIMATION_SERVICE_KEY]: animationService,
      [CONNECTION_SERVICE_KEY]: connectionService,
    }),
    [animationService, connectionService],
  );

  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
}

/**
 * Hook to access the service context
 * @returns Service context
 */
export function useServiceContext(): ServiceContextType {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error("useServiceContext must be used within a ServiceProvider");
  }
  return context;
}

/**
 * Get a service from the service context
 * @param key Service key
 * @returns Service instance
 */
export function useService<T>(key: string): T {
  const services = useServiceContext();
  const service = services[key];

  if (!service) {
    throw new Error(`Service ${key} not found in context`);
  }

  return service as T;
}

/**
 * Implementation of the animation service hook
 * Overrides the placeholder in the interface
 */
export function useAnimationService(): IAnimationService {
  return useService<IAnimationService>(SERVICE_KEYS.ANIMATION_SERVICE);
}

/**
 * Implementation of the connection service hook
 * Overrides the placeholder in the interface
 */
export function useConnectionService(): IConnectionService {
  return useService<IConnectionService>(SERVICE_KEYS.CONNECTION_SERVICE);
}

/**
 * Get motion context from wherever it's implemented, using dependency inversion
 *
 * This uses a dynamic import and type checking to avoid direct dependencies
 * on the motion module. If the motion module is not available, it provides
 * sensible defaults instead of failing.
 */
export function useMotion(): MotionContextType {
  // Default motion context in case the real one isn't available
  const defaultMotionContext: MotionContextType = {
    prefersReducedMotion: false,
    isAnimating: false,
    setIsAnimating: () => {},
    animationComplexity: "standard",
    enableAnimations: () => {},
    disableAnimations: () => {},
    setAnimationComplexity: () => {},
  };

  try {
    // Try to dynamically get the real motion context
    // In a real environment, this would be provided by the motion module
    // but we decouple it via this dynamic import
    return (window as any).__MOTION_CONTEXT_HOOK
      ? (window as any).__MOTION_CONTEXT_HOOK()
      : defaultMotionContext;
  } catch (e) {
    // If anything fails, return the default
    return defaultMotionContext;
  }
}
