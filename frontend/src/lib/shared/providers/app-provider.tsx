'use client';

import React, { ReactNode } from 'react';
import { ServiceProvider } from './service-provider';
import { 
  IAnimationService, 
  IConnectionService
} from '../services/index';
import { 
  registerAnimationService, 
  registerConnectionService,
  getDefaultServices 
} from '../services/service-registry';

/**
 * Props for AppProvider
 */
interface AppProviderProps {
  /** Child components */
  children: ReactNode;
  /** Optional custom animation service */
  animationService?: IAnimationService;
  /** Optional custom connection service */
  connectionService?: IConnectionService;
}

/**
 * Main application provider that sets up all services
 * 
 * This provider component acts as the entry point for the application
 * and sets up all required services and contexts.
 * 
 * Now uses dependency inversion pattern to avoid direct imports from motion module.
 */
export function AppProvider({ 
  children,
  animationService: customAnimationService,
  connectionService: customConnectionService 
}: AppProviderProps) {
  // Dynamically get default services
  const [animationService, connectionService] = React.useMemo(() => {
    // Use provided services or get defaults
    const { 
      defaultAnimationService, 
      defaultConnectionService 
    } = getDefaultServices();
    
    return [
      customAnimationService || defaultAnimationService,
      customConnectionService || defaultConnectionService
    ];
  }, [customAnimationService, customConnectionService]);
  
  // Register services in the registry
  React.useEffect(() => {
    registerAnimationService(animationService);
    registerConnectionService(connectionService);
  }, [animationService, connectionService]);
  
  return (
    <ServiceProvider 
      animationService={animationService}
      connectionService={connectionService}
    >
      {children}
    </ServiceProvider>
  );
}