'use client';

import React, { useEffect, useState, useRef } from 'react';

import { useSouthAfricanPerformance } from '../hooks/useSouthAfricanPerformance';

interface SouthAfricanOptimizedContainerProps {
  /** Component children */
  children: React.ReactNode;
  
  /** Whether to optimize animations automatically based on device and network profiles */
  autoOptimize?: boolean;
  
  /** Whether to show warnings for expensive operations on certain networks */
  showDataUsageWarnings?: boolean;
  
  /** Whether to show critical performance insights as notifications */
  showPerformanceAlerts?: boolean;
  
  /** Optional className for container */
  className?: string;
}

/**
 * A container component that automatically optimizes content for South African 
 * market conditions based on device and network profiles.
 * 
 * It can:
 * - Disable animations on low-end devices or expensive networks
 * - Limit image quality and sizes for slow or expensive connections
 * - Show data usage warnings for expensive networks
 * - Show critical performance insights as notifications
 */
export const SouthAfricanOptimizedContainer: React.FC<SouthAfricanOptimizedContainerProps> = ({
  children,
  autoOptimize = true,
  showDataUsageWarnings = true,
  showPerformanceAlerts = true,
  className = ''
}) => {
  // Get South African market performance data
  const {
    deviceProfile,
    networkProfile,
    criticalInsights,
    animationRecommendations,
    networkRecommendations
  } = useSouthAfricanPerformance();
  
  // Refs to track loaded resources
  const loadedImagesRef = useRef<{ src: string, size: number }[]>([]);
  const loadedResourcesRef = useRef<{ url: string, size: number }[]>([]);
  
  // State for data usage and alerts
  const [dataUsage, setDataUsage] = useState<number>(0);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [showDataWarning, setShowDataWarning] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<{ id: string, message: string }[]>([]);
  
  // Apply optimizations when profiles change
  useEffect(() => {
    if (!autoOptimize) return;
    
    // Apply CSS variables for animations based on device and network profiles
    const root = document.documentElement;
    
    if (animationRecommendations) {
      root.style.setProperty('--sa-animation-duration-multiplier', 
        animationRecommendations.durationMultiplier.toString());
      
      root.style.setProperty('--sa-max-fps', 
        animationRecommendations.maxFps.toString());
      
      root.style.setProperty('--sa-use-simple-animations', 
        animationRecommendations.useSimpleAnimations ? '1' : '0');
      
      root.style.setProperty('--sa-animations-enabled', 
        animationRecommendations.shouldAnimateAtAll ? '1' : '0');
    }
    
    // Apply image quality optimizations
    if (networkRecommendations) {
      root.style.setProperty('--sa-max-image-size', 
        `${networkRecommendations.maxImageSizeKB}kb`);
      
      root.style.setProperty('--sa-compression-enabled', 
        networkRecommendations.shouldUseCompression ? '1' : '0');
      
      root.style.setProperty('--sa-lazy-loading-enabled', 
        networkRecommendations.shouldUseLazyLoading ? '1' : '0');
    }
    
    // Show data usage warning on expensive networks
    if (networkRecommendations?.isExpensiveNetwork && showDataUsageWarnings) {
      setShowDataWarning(true);
    } else {
      setShowDataWarning(false);
    }
    
    // Clean up function
    return () => {
      root.style.removeProperty('--sa-animation-duration-multiplier');
      root.style.removeProperty('--sa-max-fps');
      root.style.removeProperty('--sa-use-simple-animations');
      root.style.removeProperty('--sa-animations-enabled');
      root.style.removeProperty('--sa-max-image-size');
      root.style.removeProperty('--sa-compression-enabled');
      root.style.removeProperty('--sa-lazy-loading-enabled');
    };
  }, [
    autoOptimize, 
    animationRecommendations, 
    networkRecommendations, 
    showDataUsageWarnings
  ]);
  
  // Show performance alerts when critical insights arrive
  useEffect(() => {
    if (!showPerformanceAlerts) return;
    
    // Only show new alerts
    const currentAlertIds = alerts.map(a => a.id);
    const newAlerts = criticalInsights
      .filter(insight => !currentAlertIds.includes(insight.id))
      .map(insight => ({
        id: insight.id,
        message: `${insight.title}: ${insight.recommendation}`
      }));
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts]);
    }
  }, [criticalInsights, alerts, showPerformanceAlerts]);
  
  // Track resource loading for data usage estimation
  useEffect(() => {
    if (!showDataUsageWarnings || !networkProfile) return;
    
    // Create performance observer to monitor resource loading
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach(entry => {
        // Check if this is a resource entry
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Calculate transferred size (using encodedBodySize as an approximation)
          const size = resourceEntry.encodedBodySize || 0;
          const url = resourceEntry.name;
          
          // Don't track already loaded resources
          const isAlreadyLoaded = loadedResourcesRef.current.some(r => r.url === url);
          if (isAlreadyLoaded) return;
          
          // Add to loaded resources
          loadedResourcesRef.current.push({ url, size });
          
          // Update total data usage
          const totalUsage = loadedResourcesRef.current.reduce((sum, r) => sum + r.size, 0) / 1024; // KB
          setDataUsage(totalUsage);
          
          // Calculate estimated cost
          if (networkRecommendations) {
            const costZAR = (totalUsage / 1024) * networkRecommendations.dataCostPerMBZAR;
            setEstimatedCost(costZAR);
          }
        }
      });
    });
    
    // Start observing resource timing entries
    observer.observe({ entryTypes: ['resource'] });
    
    // Clean up
    return () => {
      observer.disconnect();
    };
  }, [networkProfile, networkRecommendations, showDataUsageWarnings]);
  
  // Handle image loading to track sizes
  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const src = img.src;
    
    // Don't track already loaded images
    const isAlreadyLoaded = loadedImagesRef.current.some(i => i.src === src);
    if (isAlreadyLoaded) return;
    
    // Estimate image size based on dimensions and format (very rough estimate)
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const format = src.split('.').pop()?.toLowerCase();
    
    // Rough estimate of image size based on dimensions and format
    let estimatedSize = (width * height * 3) / 1024; // Uncompressed RGB size in KB
    
    // Apply compression estimate based on format
    if (format === 'jpg' || format === 'jpeg') {
      estimatedSize *= 0.1; // ~10:1 compression for JPEG
    } else if (format === 'png') {
      estimatedSize *= 0.5; // ~2:1 compression for PNG
    } else if (format === 'webp') {
      estimatedSize *= 0.05; // ~20:1 compression for WebP
    } else if (format === 'avif') {
      estimatedSize *= 0.025; // ~40:1 compression for AVIF
    }
    
    // Add to loaded images
    loadedImagesRef.current.push({ src, size: estimatedSize });
  };
  
  // Dismiss an alert
  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };
  
  // Dismiss data warning
  const dismissDataWarning = () => {
    setShowDataWarning(false);
  };
  
  // Check if we should apply optimizations (no device profile = no optimizations)
  const shouldOptimize = autoOptimize && !!deviceProfile;
  
  // Apply optimizations by wrapping children in event listeners
  const optimizedChildren = shouldOptimize ? 
    React.Children.map(children, child => {
      // Only process element children
      if (!React.isValidElement(child)) return child;
      
      // Apply optimizations to image elements
      if (child.type === 'img') {
        return React.cloneElement(child as React.ReactElement<any>, {
          onLoad: (e: React.SyntheticEvent<HTMLImageElement>) => {
            // Call original onLoad if it exists
            if (child.props.onLoad) child.props.onLoad(e);
            // Track image load
            handleImageLoad(e);
          },
          loading: networkRecommendations?.shouldUseLazyLoading ? 'lazy' : undefined,
        });
      }
      
      // Pass other elements through unchanged
      return child;
    }) : 
    children;
  
  return (
    <div className={`sa-optimized-container ${className}`}>
      {/* Data usage warning */}
      {showDataWarning && (
        <div className="sa-data-warning">
          <div className="sa-data-warning-content">
            <div className="sa-data-warning-icon">⚠️</div>
            <div className="sa-data-warning-text">
              <h4>Data Costs Warning</h4>
              <p>You are on an expensive data connection (R{networkRecommendations?.dataCostPerMBZAR.toFixed(2)}/MB).</p>
              {dataUsage > 0 && (
                <p>Current page: {dataUsage.toFixed(1)} KB ({estimatedCost.toFixed(2)} ZAR)</p>
              )}
            </div>
            <button className="sa-data-warning-close" onClick={dismissDataWarning}>×</button>
          </div>
        </div>
      )}
      
      {/* Performance alerts */}
      {alerts.length > 0 && (
        <div className="sa-alerts">
          {alerts.map(alert => (
            <div key={alert.id} className="sa-alert">
              <div className="sa-alert-content">
                <div className="sa-alert-icon">🔥</div>
                <div className="sa-alert-text">{alert.message}</div>
                <button className="sa-alert-close" onClick={() => dismissAlert(alert.id)}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Device/Network info (dev mode only) */}
      {process.env.NODE_ENV === 'development' && deviceProfile && (
        <div className="sa-dev-info">
          <details>
            <summary>South African Market Optimization</summary>
            <div className="sa-dev-info-content">
              <p><strong>Device:</strong> {deviceProfile.deviceName} ({deviceProfile.marketSharePercent.toFixed(1)}% market share)</p>
              {networkProfile && (
                <p><strong>Network:</strong> {networkProfile.provider} {networkProfile.networkType} in {networkProfile.locationType} (R{networkProfile.dataCostPerMBZAR.toFixed(3)}/MB)</p>
              )}
              <p><strong>Animations:</strong> {animationRecommendations?.shouldAnimateAtAll ? 'Enabled' : 'Disabled'}</p>
              {animationRecommendations?.shouldAnimateAtAll && (
                <>
                  <p><strong>Animation style:</strong> {animationRecommendations?.useSimpleAnimations ? 'Simple' : 'Normal'}</p>
                  <p><strong>Animation speed:</strong> {animationRecommendations?.durationMultiplier.toFixed(1)}x</p>
                </>
              )}
              <p><strong>Images:</strong> Max {networkRecommendations?.maxImageSizeKB}KB</p>
              <p><strong>Data usage:</strong> {dataUsage.toFixed(1)} KB (~R{estimatedCost.toFixed(2)})</p>
            </div>
          </details>
        </div>
      )}
      
      {/* Main content */}
      <div className="sa-optimized-content">
        {optimizedChildren}
      </div>
      
      {/* Styles */}
      <style jsx>{`
        .sa-optimized-container {
          position: relative;
        }
        
        .sa-data-warning {
          position: sticky;
          top: 0;
          z-index: 1000;
          background-color: #FFF3CD;
          border-bottom: 1px solid #FFEEBA;
          padding: 8px 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        .sa-data-warning-content {
          display: flex;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .sa-data-warning-icon {
          margin-right: 12px;
          font-size: 20px;
        }
        
        .sa-data-warning-text {
          flex: 1;
        }
        
        .sa-data-warning-text h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
        }
        
        .sa-data-warning-text p {
          margin: 0;
          font-size: 12px;
          color: #856404;
        }
        
        .sa-data-warning-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #856404;
          padding: 0 0 0 12px;
        }
        
        .sa-alerts {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 400px;
        }
        
        .sa-alert {
          background-color: #F8D7DA;
          border: 1px solid #F5C6CB;
          border-radius: 4px;
          padding: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          animation: slideIn 0.3s ease;
        }
        
        .sa-alert-content {
          display: flex;
          align-items: flex-start;
        }
        
        .sa-alert-icon {
          margin-right: 10px;
        }
        
        .sa-alert-text {
          flex: 1;
          font-size: 13px;
          color: #721C24;
        }
        
        .sa-alert-close {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: #721C24;
          padding: 0 0 0 10px;
        }
        
        .sa-dev-info {
          position: fixed;
          bottom: 10px;
          left: 10px;
          z-index: 1000;
          font-family: monospace;
          font-size: 12px;
          background-color: rgba(0,0,0,0.8);
          color: white;
          border-radius: 4px;
          max-width: 400px;
        }
        
        .sa-dev-info summary {
          padding: 5px 10px;
          cursor: pointer;
        }
        
        .sa-dev-info-content {
          padding: 5px 10px;
          font-size: 11px;
        }
        
        .sa-dev-info-content p {
          margin: 5px 0;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        /* Apply animation optimizations based on CSS variables */
        .sa-optimized-content {
          --animation-duration-multiplier: var(--sa-animation-duration-multiplier, 1);
          --max-fps: var(--sa-max-fps, 60);
          --use-simple-animations: var(--sa-use-simple-animations, 0);
          --animations-enabled: var(--sa-animations-enabled, 1);
          
          width: 100%;
        }
        
        /* When animations are disabled */
        .sa-optimized-content:has(~ [style*='--sa-animations-enabled: 0']) * {
          transition: none !important;
          animation: none !important;
          transform: none !important;
        }
      `}</style>
    </div>
  );
};

export default SouthAfricanOptimizedContainer;