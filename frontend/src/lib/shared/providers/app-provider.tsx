'use client';

import React, { ReactNode } from 'react';
import { ServiceProvider } from './service-provider';
import { defaultAnimationService } from '../../motion/services/animation-service.impl';
import { defaultConnectionService } from '../../motion/services/connection-service.impl';
import { registerAnimationService, registerConnectionService } from '../services/service-registry';

/**
 * Props for AppProvider
 */
interface AppProviderProps {
  /** Child components */
  children: ReactNode;
}

/**
 * Main application provider that sets up all services
 * 
 * This provider component acts as the entry point for the application
 * and sets up all required services and contexts.
 */
export function AppProvider({ children }: AppProviderProps) {
  // Register services in the registry
  // We do this here to ensure they're available even outside of the provider context
  React.useEffect(() => {
    registerAnimationService(defaultAnimationService);
    registerConnectionService(defaultConnectionService);
  }, []);
  
  return (
    <ServiceProvider 
      animationService={defaultAnimationService}
      connectionService={defaultConnectionService}
    >
      {children}
    </ServiceProvider>
  );
}