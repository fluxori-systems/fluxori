'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { 
  useSouthAfricanMarketOptimizations, 
  SADeviceProfile,
  SANetworkProfile,
  useSAPerformanceThresholds
} from '../hooks/useSouthAfricanMarketOptimizations';

interface SouthAfricanMarketOptimizerProps {
  children: ReactNode;
  
  /** Component display name for tracking */
  component?: string;
  
  /** Whether to apply network-aware optimizations */
  networkAware?: boolean;
  
  /** Whether to apply animations */
  animate?: boolean;
  
  /** Base animation duration in ms */
  animationDuration?: number;
  
  /** Defer rendering until needed */
  defer?: boolean;
  
  /** Resource priority for loading decisions */
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Component that wraps content with South African market optimizations
 * This component automatically applies optimizations based on detected
 * network conditions and device capabilities common in South Africa
 */
export function SouthAfricanMarketOptimizer({
  children,
  component = 'Unknown',
  networkAware = true,
  animate = true,
  animationDuration = 300,
  defer = false,
  priority = 'medium'
}: SouthAfricanMarketOptimizerProps) {
  const [isVisible, setIsVisible] = useState(!defer);
  const [isAnimated, setIsAnimated] = useState(false);
  const saMarket = useSouthAfricanMarketOptimizations();
  const thresholds = useSAPerformanceThresholds();
  
  // For deferred components, add intersection observer
  useEffect(() => {
    if (!defer) {
      setIsVisible(true);
      return;
    }
    
    // Check if we should defer based on priority and market conditions
    const shouldApplyDefer = 
      saMarket.shouldDeferNonEssential && 
      (priority === 'low' || priority === 'medium');
      
    if (!shouldApplyDefer) {
      setIsVisible(true);
      return;
    }
    
    // Create intersection observer for deferred loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { 
        rootMargin: '200px', // Load when within 200px of viewport
        threshold: 0.01 
      }
    );
    
    // Find a DOM node to observe
    const element = document.getElementById(`sa-optimizer-${component}`);
    if (element) {
      observer.observe(element);
    }
    
    return () => observer.disconnect();
  }, [defer, saMarket.shouldDeferNonEssential, priority, component]);
  
  // Apply animation with delay based on market conditions
  useEffect(() => {
    if (!isVisible || !animate) return;
    
    // Apply device and network appropriate delay
    const delay = saMarket.networkProfile === SANetworkProfile.RURAL ? 300 : 100;
    
    // Skip animation entirely for certain conditions
    if (saMarket.shouldReduceMotion) {
      setIsAnimated(true);
      return;
    }
    
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [isVisible, animate, saMarket.networkProfile, saMarket.shouldReduceMotion]);
  
  // Calculate optimized animation duration
  const optimizedDuration = 
    networkAware && animate 
      ? thresholds.getAnimationDuration(animationDuration)
      : animationDuration;
  
  // Apply placeholder for non-visible content
  if (!isVisible) {
    return (
      <div 
        id={`sa-optimizer-${component}`} 
        style={{ 
          minHeight: '10px',
          width: '100%'
        }}
        aria-busy="true"
        aria-label={`Loading ${component}`}
      />
    );
  }
  
  // Apply optimized styles
  const style: React.CSSProperties = {
    opacity: isAnimated ? 1 : 0,
    transition: saMarket.shouldReduceMotion 
      ? 'none' 
      : `opacity ${optimizedDuration}ms ease-out`
  };
  
  // Add data attributes for testing and monitoring
  const dataAttributes = {
    'data-sa-device': saMarket.deviceProfile,
    'data-sa-network': saMarket.networkProfile,
    'data-sa-optimized': 'true',
    'data-sa-reduced-motion': saMarket.shouldReduceMotion ? 'true' : 'false',
    'data-sa-reduced-data': saMarket.shouldReduceDataUsage ? 'true' : 'false'
  };
  
  return (
    <div 
      id={`sa-optimizer-${component}`} 
      style={style}
      {...dataAttributes}
    >
      {children}
    </div>
  );
}

// Alternative lightweight version that only applies the most critical optimizations
export function SAOptimizer({ children, priority = 'medium' }: { 
  children: ReactNode;
  priority?: 'critical' | 'high' | 'medium' | 'low';
}) {
  const saMarket = useSouthAfricanMarketOptimizations();
  
  // Skip optimization for critical content
  if (priority === 'critical') {
    return <>{children}</>;
  }
  
  // For low priority content with poor connection, just show a placeholder
  if (
    priority === 'low' && 
    (saMarket.networkProfile === SANetworkProfile.RURAL || 
     saMarket.deviceProfile === SADeviceProfile.FEATURE_PHONE)
  ) {
    return (
      <div 
        style={{ 
          minHeight: '10px',
          width: '100%',
          background: '#f3f3f3'
        }}
        aria-hidden="true"
      />
    );
  }
  
  return <>{children}</>;
}