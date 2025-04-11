'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { 
  useSouthAfricanMarketOptimizations,
  SouthAfricanMarketOptimizations,
  SADeviceProfile,
  SANetworkProfile
} from '../hooks/useSouthAfricanMarketOptimizations';

// Create the context
const SouthAfricanMarketContext = createContext<SouthAfricanMarketOptimizations | null>(null);

interface SouthAfricanMarketProviderProps {
  children: ReactNode;
  // Optional overrides for testing specific conditions
  deviceProfileOverride?: SADeviceProfile;
  networkProfileOverride?: SANetworkProfile;
  dataUsageOverrides?: {
    isDataSaver?: boolean;
    isMetered?: boolean;
  };
}

/**
 * Provider component for South African market optimizations
 * This allows components to access South African market optimizations
 * without creating circular dependencies
 */
export function SouthAfricanMarketProvider({
  children,
  deviceProfileOverride,
  networkProfileOverride,
  dataUsageOverrides
}: SouthAfricanMarketProviderProps) {
  // Get optimizations from the hook
  const optimizations = useSouthAfricanMarketOptimizations();
  
  // Apply overrides if provided (useful for testing)
  const finalOptimizations: SouthAfricanMarketOptimizations = {
    ...optimizations,
    deviceProfile: deviceProfileOverride || optimizations.deviceProfile,
    networkProfile: networkProfileOverride || optimizations.networkProfile,
    isMetered: dataUsageOverrides?.isMetered !== undefined 
      ? dataUsageOverrides.isMetered 
      : optimizations.isMetered,
  };
  
  return (
    <SouthAfricanMarketContext.Provider value={finalOptimizations}>
      {children}
    </SouthAfricanMarketContext.Provider>
  );
}

/**
 * Hook to access South African market optimizations from context
 */
export function useSouthAfricanMarketContext(): SouthAfricanMarketOptimizations {
  const context = useContext(SouthAfricanMarketContext);
  
  // If context is not available, use the hook directly
  if (!context) {
    // This allows the hook to work even outside the provider
    return useSouthAfricanMarketOptimizations();
  }
  
  return context;
}