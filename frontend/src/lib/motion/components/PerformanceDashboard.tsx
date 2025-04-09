'use client';

import React, { useState, useEffect } from 'react';
import { defaultPerformanceMonitoringService } from '../services/performance/performance-monitoring.service';
import { PerformanceMetric, DeviceCapabilities, MetricPriority } from '../types/performance';

// Interval to refresh metrics (in ms)
const REFRESH_INTERVAL = 1000;

// Max metrics to show initially
const MAX_METRICS = 50;

interface PerformanceDashboardProps {
  /**
   * Title for the dashboard
   * @default "Performance Dashboard"
   */
  title?: string;
  
  /**
   * Whether the dashboard is initially expanded
   * @default false
   */
  initiallyExpanded?: boolean;
  
  /**
   * Whether to show device capabilities
   * @default true
   */
  showDeviceCapabilities?: boolean;
  
  /**
   * Whether to show animation metrics
   * @default true
   */
  showAnimationMetrics?: boolean;
  
  /**
   * Whether to show component metrics
   * @default true
   */
  showComponentMetrics?: boolean;
  
  /**
   * Minimum priority level to show
   * @default "medium"
   */
  minPriority?: MetricPriority;
  
  /**
   * CSS class name
   */
  className?: string;
}

/**
 * Performance monitoring dashboard component
 * Shows real-time performance metrics for animations and components
 */
export function PerformanceDashboard({
  title = "Performance Dashboard",
  initiallyExpanded = false,
  showDeviceCapabilities = true,
  showAnimationMetrics = true,
  showComponentMetrics = true,
  minPriority = 'medium',
  className = '',
}: PerformanceDashboardProps) {
  // State for performance metrics
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities | null>(null);
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [activeTab, setActiveTab] = useState<'animations' | 'components' | 'device'>('animations');
  
  // Fetch metrics on interval
  useEffect(() => {
    // Initial fetch
    fetchMetrics();
    
    // Set up interval
    const intervalId = setInterval(fetchMetrics, REFRESH_INTERVAL);
    
    // Cleanup
    return () => clearInterval(intervalId);
  }, []);
  
  // Fetch metrics from performance service
  const fetchMetrics = () => {
    // Get device capabilities
    if (showDeviceCapabilities && !deviceCapabilities) {
      setDeviceCapabilities(defaultPerformanceMonitoringService.getDeviceCapabilities());
    }
    
    // Get all metrics
    const allMetrics = defaultPerformanceMonitoringService.getMetrics({
      priority: minPriority,
      limit: MAX_METRICS
    });
    
    // Sort by timestamp (most recent first)
    allMetrics.sort((a, b) => b.timestamp - a.timestamp);
    
    setMetrics(allMetrics);
  };
  
  // Clear metrics
  const handleClearMetrics = () => {
    defaultPerformanceMonitoringService.clearMetrics();
    setMetrics([]);
  };
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Filter metrics by type
  const getFilteredMetrics = (type: 'animation' | 'component' | 'all') => {
    if (type === 'all') return metrics;
    return metrics.filter(m => m.type === type);
  };
  
  // Get color for priority
  const getPriorityColor = (priority: MetricPriority): string => {
    switch (priority) {
      case 'critical': return 'rgb(220, 20, 20)';
      case 'high': return 'rgb(240, 120, 20)';
      case 'medium': return 'rgb(20, 120, 220)';
      case 'low': return 'rgb(120, 120, 120)';
      default: return 'rgb(120, 120, 120)';
    }
  };
  
  // Get color for network quality
  const getNetworkQualityColor = (quality: string | undefined): string => {
    switch (quality) {
      case 'high': return 'rgb(20, 170, 20)';
      case 'medium': return 'rgb(20, 120, 220)';
      case 'low': return 'rgb(240, 180, 20)';
      case 'poor': return 'rgb(220, 20, 20)';
      default: return 'rgb(120, 120, 120)';
    }
  };
  
  // Show either the minimized view or the expanded dashboard
  if (!isExpanded) {
    return (
      <div
        className={`performance-dashboard-mini ${className}`}
        style={{
          position: 'fixed',
          bottom: '4px',
          left: '4px',
          background: 'rgba(30, 30, 30, 0.9)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 9999,
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={toggleExpanded}
      >
        <div style={{ marginRight: '6px' }}>📊</div>
        <div>
          {getFilteredMetrics('animation').length} animations | {getFilteredMetrics('component').length} components
        </div>
      </div>
    );
  }
  
  // Render the expanded dashboard
  return (
    <div
      className={`performance-dashboard ${className}`}
      style={{
        position: 'fixed',
        bottom: '8px',
        left: '8px',
        width: '320px',
        maxHeight: '80vh',
        overflow: 'auto',
        background: 'rgba(30, 30, 30, 0.95)',
        color: 'white',
        borderRadius: '6px',
        zIndex: 9999,
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        fontSize: '12px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ fontWeight: 600 }}>{title}</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleClearMetrics}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            Clear
          </button>
          <button
            onClick={toggleExpanded}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '0',
              width: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {showAnimationMetrics && (
          <button
            onClick={() => setActiveTab('animations')}
            style={{
              flex: 1,
              padding: '6px',
              background: activeTab === 'animations' ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: activeTab === 'animations' ? 'bold' : 'normal',
            }}
          >
            Animations ({getFilteredMetrics('animation').length})
          </button>
        )}
        
        {showComponentMetrics && (
          <button
            onClick={() => setActiveTab('components')}
            style={{
              flex: 1,
              padding: '6px',
              background: activeTab === 'components' ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: activeTab === 'components' ? 'bold' : 'normal',
            }}
          >
            Components ({getFilteredMetrics('component').length})
          </button>
        )}
        
        {showDeviceCapabilities && (
          <button
            onClick={() => setActiveTab('device')}
            style={{
              flex: 1,
              padding: '6px',
              background: activeTab === 'device' ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: activeTab === 'device' ? 'bold' : 'normal',
            }}
          >
            Device
          </button>
        )}
      </div>
      
      {/* Content */}
      <div
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
        }}
      >
        {activeTab === 'animations' && (
          <div>
            {getFilteredMetrics('animation').length === 0 ? (
              <div style={{ padding: '12px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                No animation metrics recorded yet
              </div>
            ) : (
              getFilteredMetrics('animation').map((metric, index) => (
                <div
                  key={`${metric.id}_${index}`}
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    backgroundColor: index % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 'bold' }}>{metric.label}</div>
                    <div style={{ color: metric.value > 100 ? 'rgba(255,100,100,0.9)' : 'rgba(100,255,100,0.9)' }}>
                      {metric.value.toFixed(1)} ms
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                    <div
                      style={{
                        backgroundColor: getPriorityColor(metric.priority),
                        color: 'white',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        fontSize: '10px',
                      }}
                    >
                      {metric.priority}
                    </div>
                    
                    {metric.networkQuality && (
                      <div
                        style={{
                          backgroundColor: getNetworkQualityColor(metric.networkQuality),
                          color: 'white',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          fontSize: '10px',
                        }}
                      >
                        {metric.networkQuality}
                      </div>
                    )}
                    
                    {metric.context?.droppedFrames && (
                      <div
                        style={{
                          backgroundColor: 'rgba(220, 0, 0, 0.8)',
                          color: 'white',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          fontSize: '10px',
                        }}
                      >
                        {metric.context.droppedFrameCount} dropped frames
                      </div>
                    )}
                  </div>
                  
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
                    {metric.component && (
                      <span style={{ marginRight: '8px' }}>{metric.component}</span>
                    )}
                    {metric.context?.complexity && (
                      <span style={{ marginRight: '8px' }}>
                        Complexity: {metric.context.complexity}
                      </span>
                    )}
                    {new Date(metric.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {activeTab === 'components' && (
          <div>
            {getFilteredMetrics('component').length === 0 ? (
              <div style={{ padding: '12px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                No component metrics recorded yet
              </div>
            ) : (
              getFilteredMetrics('component').map((metric, index) => (
                <div
                  key={`${metric.id}_${index}`}
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    backgroundColor: index % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 'bold' }}>{metric.label}</div>
                    <div style={{ color: metric.value > 50 ? 'rgba(255,100,100,0.9)' : 'rgba(100,255,100,0.9)' }}>
                      {metric.value.toFixed(1)} ms
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                    <div
                      style={{
                        backgroundColor: getPriorityColor(metric.priority),
                        color: 'white',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        fontSize: '10px',
                      }}
                    >
                      {metric.priority}
                    </div>
                    
                    {metric.networkQuality && (
                      <div
                        style={{
                          backgroundColor: getNetworkQualityColor(metric.networkQuality),
                          color: 'white',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          fontSize: '10px',
                        }}
                      >
                        {metric.networkQuality}
                      </div>
                    )}
                    
                    {metric.motionMode && (
                      <div
                        style={{
                          backgroundColor: 'rgba(100, 100, 255, 0.8)',
                          color: 'white',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          fontSize: '10px',
                        }}
                      >
                        {metric.motionMode}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
                    {metric.component && (
                      <span style={{ marginRight: '8px' }}>{metric.component}</span>
                    )}
                    {new Date(metric.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {activeTab === 'device' && deviceCapabilities && (
          <div style={{ padding: '12px' }}>
            <div style={{ marginBottom: '8px' }}>
              <h3 style={{ fontSize: '14px', margin: '0 0 8px 0' }}>Device Information</h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Device Type:</span>
                <span style={{ fontWeight: 'bold' }}>{deviceCapabilities.deviceType}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>CPU Performance:</span>
                <span style={{ 
                  fontWeight: 'bold',
                  color: deviceCapabilities.cpuPerformance === 'high' ? 'rgb(100, 220, 100)' :
                         deviceCapabilities.cpuPerformance === 'medium' ? 'rgb(220, 220, 100)' :
                         deviceCapabilities.cpuPerformance === 'low' ? 'rgb(220, 100, 100)' : 'white'
                }}>
                  {deviceCapabilities.cpuPerformance}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>GPU Tier:</span>
                <span style={{ 
                  fontWeight: 'bold',
                  color: deviceCapabilities.gpuTier === 'high' ? 'rgb(100, 220, 100)' :
                         deviceCapabilities.gpuTier === 'medium' ? 'rgb(220, 220, 100)' :
                         deviceCapabilities.gpuTier === 'low' ? 'rgb(220, 100, 100)' : 'white'
                }}>
                  {deviceCapabilities.gpuTier}
                </span>
              </div>
              
              {deviceCapabilities.memory !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Memory:</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {deviceCapabilities.memory} GB
                  </span>
                </div>
              )}
              
              {deviceCapabilities.hardwareConcurrency !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>CPU Cores:</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {deviceCapabilities.hardwareConcurrency}
                  </span>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>High-DPI Screen:</span>
                <span style={{ fontWeight: 'bold' }}>
                  {deviceCapabilities.isHighResolutionScreen ? 'Yes' : 'No'}
                </span>
              </div>
              
              {deviceCapabilities.screenDimensions && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Screen:</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {deviceCapabilities.screenDimensions.width} × {deviceCapabilities.screenDimensions.height} (DPR: {deviceCapabilities.screenDimensions.dpr})
                  </span>
                </div>
              )}
              
              {deviceCapabilities.browserEngine && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Browser Engine:</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {deviceCapabilities.browserEngine}
                  </span>
                </div>
              )}
            </div>
            
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '16px' }}>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Performance Recommendations:</strong>
              </p>
              
              <ul style={{ margin: '0', paddingLeft: '20px' }}>
                {deviceCapabilities.cpuPerformance === 'low' && (
                  <li style={{ marginBottom: '4px' }}>
                    Use simplified animations on this device
                  </li>
                )}
                
                {deviceCapabilities.cpuPerformance === 'low' && deviceCapabilities.deviceType === 'mobile' && (
                  <li style={{ marginBottom: '4px' }}>
                    Reduce layout complexity for mobile performance
                  </li>
                )}
                
                {deviceCapabilities.isHighResolutionScreen && deviceCapabilities.gpuTier !== 'high' && (
                  <li style={{ marginBottom: '4px' }}>
                    High-DPI screen may impact performance with complex animations
                  </li>
                )}
                
                {deviceCapabilities.deviceType === 'mobile' && (
                  <li style={{ marginBottom: '4px' }}>
                    Consider data savings optimizations for mobile users
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div
        style={{
          padding: '6px 12px',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.4)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center',
        }}
      >
        Fluxori Performance Monitor | Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}