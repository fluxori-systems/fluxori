'use client';

import React, { ReactNode } from 'react';
import { MotionProvider } from '../lib/motion/context/MotionContext';
import { ServiceProvider } from '../lib/shared/providers/service-provider';
import { defaultAnimationService } from '../lib/motion/services/animation-service.impl';
import { defaultConnectionService } from '../lib/motion/services/connection-service.impl';
import { registerAnimationService, registerConnectionService } from '../lib/shared/services/service-registry';

// Register service implementations
registerAnimationService(defaultAnimationService);
registerConnectionService(defaultConnectionService);

interface AppProviderProps {
  children: ReactNode;
}

/**
 * Root provider for the application
 * Sets up all required contexts and services
 */
export function AppProvider({ children }: AppProviderProps) {
  return (
    <ServiceProvider
      animationService={defaultAnimationService}
      connectionService={defaultConnectionService}
    >
      <MotionProvider>
        {children}
      </MotionProvider>
    </ServiceProvider>
  );
}