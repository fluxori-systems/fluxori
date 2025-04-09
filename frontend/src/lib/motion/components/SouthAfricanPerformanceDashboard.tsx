'use client';

import React, { useState, useEffect } from 'react';
import { 
  PerformanceInsight,
  defaultPerformanceAnalyticsService 
} from '../services/performance/performance-analytics.service';
import { 
  DeviceProfile, 
  NetworkProfile,
  southAfricanDeviceProfiles,
  southAfricanNetworkProfiles
} from '../data/device-profiles';
import { defaultPerformanceMonitoringService } from '../services/performance/performance-monitoring.service';

// Network information type for narrowing in checks
type ConnectionType = {
  downlink?: number;
  saveData?: boolean;
};

/**
 * Dashboard component specifically for South African market performance monitoring
 * Shows insights, recommendations, and device/network profiles relevant to SA market
 */
export const SouthAfricanPerformanceDashboard: React.FC = () => {
  // State for insights and filters
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [deviceCapabilities, setDeviceCapabilities] = useState(
    defaultPerformanceMonitoringService.getDeviceCapabilities()
  );
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile | null>(null);
  const [networkProfile, setNetworkProfile] = useState<NetworkProfile | null>(null);
  const [viewMode, setViewMode] = useState<'insights' | 'device' | 'network'>('insights');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  
  // Fetch insights from the analytics service
  useEffect(() => {
    // Initial fetch
    fetchInsights();
    
    // Set up interval to refresh insights
    const intervalId = setInterval(fetchInsights, 10000);
    
    // Get device and network profiles
    detectProfiles();
    
    return () => clearInterval(intervalId);
  }, [severityFilter]);
  
  // Fetch insights with the current filter
  const fetchInsights = () => {
    let latestInsights = defaultPerformanceAnalyticsService.getAllInsights();
    
    // Filter by severity if needed
    if (severityFilter !== 'all') {
      latestInsights = latestInsights.filter(insight => 
        getSeverityLevel(insight.severity) >= getSeverityLevel(severityFilter as any)
      );
    }
    
    setInsights(latestInsights);
  };
  
  // Helper to convert severity to numeric level for comparison
  const getSeverityLevel = (severity: string): number => {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  };
  
  // Detect device and network profiles
  const detectProfiles = () => {
    // Get device capabilities
    const capabilities = defaultPerformanceMonitoringService.getDeviceCapabilities();
    setDeviceCapabilities(capabilities);
    
    // Find matching device profile
    const profileCapabilities = {
      memory: capabilities.memory || 4096,
      cpuCores: capabilities.hardwareConcurrency || 4,
      pixelRatio: capabilities.screenDimensions?.dpr || 1,
      screenWidth: capabilities.screenDimensions?.width || 1280,
      screenHeight: capabilities.screenDimensions?.height || 800,
      isLowEndDevice: capabilities.cpuPerformance === 'low'
    };
    
    // Find matching device profile
    for (const profile of southAfricanDeviceProfiles) {
      // Simple matching logic - can be improved
      if (
        (capabilities.memory && profile.memory === Math.floor(capabilities.memory)) ||
        (capabilities.deviceType === 'mobile' && 
         profile.deviceType.includes('mobile'))
      ) {
        setDeviceProfile(profile);
        break;
      }
    }
    
    // Safely check navigator.connection with proper type handling
    let isLowBandwidth = capabilities.cpuPerformance === 'low';
    
    // Type guard to safely access navigator.connection properties
    if (typeof navigator !== 'undefined' && navigator.connection) {
      const connection = navigator.connection as ConnectionType;
      if (connection.saveData === true) {
        isLowBandwidth = true;
      }
    }
    
    if (isLowBandwidth) {
      // Find a township or rural profile
      const profile = southAfricanNetworkProfiles.find(p => 
        p.locationType === 'township' || p.locationType === 'rural'
      );
      setNetworkProfile(profile || null);
    } else {
      // Find an urban profile
      const profile = southAfricanNetworkProfiles.find(p => 
        p.locationType === 'urban'
      );
      setNetworkProfile(profile || null);
    }
  };
  
  // Trigger analytics collection
  const triggerAnalysis = () => {
    // Generate new insights from analytics service
    const newInsights = defaultPerformanceAnalyticsService.generateInsights();
    // Refresh the insights display
    fetchInsights();
  };
  
  // Get color for severity
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#FFCC00';
      case 'low': return '#34C759';
      case 'info': return '#007AFF';
      default: return '#8E8E93';
    }
  };
  
  // Get affected market share text
  const getMarketShareText = (insight: PerformanceInsight): string => {
    if (insight.affectedMarketSharePercent) {
      return `Impacts ${insight.affectedMarketSharePercent.toFixed(1)}% of SA market`;
    }
    return '';
  };

  return (
    <div className="sa-performance-dashboard">
      <div className="dashboard-header">
        <h2>South African Market Performance Dashboard</h2>
        <div className="device-info">
          {deviceProfile ? (
            <span>Detected device type: {deviceProfile.deviceName} ({deviceProfile.marketSharePercent.toFixed(1)}% market share)</span>
          ) : (
            <span>Unknown device type</span>
          )}
          {networkProfile && (
            <span> · Network: {networkProfile.provider} {networkProfile.networkType} in {networkProfile.locationType} area</span>
          )}
        </div>
        <div className="dashboard-tabs">
          <button 
            className={viewMode === 'insights' ? 'active' : ''} 
            onClick={() => setViewMode('insights')}
          >
            Insights
          </button>
          <button 
            className={viewMode === 'device' ? 'active' : ''} 
            onClick={() => setViewMode('device')}
          >
            Device Profile
          </button>
          <button 
            className={viewMode === 'network' ? 'active' : ''} 
            onClick={() => setViewMode('network')}
          >
            Network Profile
          </button>
        </div>
        {viewMode === 'insights' && (
          <div className="filter-controls">
            <label>Severity:</label>
            <select 
              value={severityFilter} 
              onChange={(e) => setSeverityFilter(e.target.value as any)}
            >
              <option value="all">All issues</option>
              <option value="critical">Critical only</option>
              <option value="high">High and above</option>
              <option value="medium">Medium and above</option>
              <option value="low">Low and above</option>
            </select>
            <button onClick={triggerAnalysis} className="analyze-btn">
              Run Analysis
            </button>
          </div>
        )}
      </div>
      
      <div className="dashboard-content">
        {viewMode === 'insights' && (
          <>
            {insights.length === 0 ? (
              <div className="empty-state">
                <p>No performance insights available yet. Run analysis to generate insights.</p>
              </div>
            ) : (
              <div className="insights-list">
                {insights.map(insight => (
                  <div key={insight.id} className="insight-card">
                    <div 
                      className="severity-indicator" 
                      style={{ backgroundColor: getSeverityColor(insight.severity) }}
                    />
                    <div className="insight-content">
                      <h3>{insight.title}</h3>
                      <p>{insight.description}</p>
                      <div className="insight-details">
                        <div className="impact-indicator">
                          Impact: {Array(insight.estimatedImpact).fill('●').join('')}
                          {Array(10 - insight.estimatedImpact).fill('○').join('')}
                        </div>
                        {getMarketShareText(insight) && (
                          <div className="market-share">
                            {getMarketShareText(insight)}
                          </div>
                        )}
                      </div>
                      <div className="recommendation">
                        <strong>Recommendation:</strong> {insight.recommendation}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        
        {viewMode === 'device' && deviceProfile && (
          <div className="profile-detail">
            <h3>Device Profile: {deviceProfile.deviceName}</h3>
            
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-label">Market share:</span> 
                <span className="stat-value">{deviceProfile.marketSharePercent.toFixed(1)}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Processor tier:</span> 
                <span className="stat-value">{deviceProfile.processorTier}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Memory:</span> 
                <span className="stat-value">{deviceProfile.memory} GB</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Resolution:</span> 
                <span className="stat-value">{deviceProfile.resolution.width}×{deviceProfile.resolution.height}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Pixel ratio:</span> 
                <span className="stat-value">{deviceProfile.pixelRatio}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">GPU acceleration:</span> 
                <span className="stat-value">{deviceProfile.hasGPUAcceleration ? 'Yes' : 'No'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Throttling prone:</span> 
                <span className="stat-value">{deviceProfile.throttlingProne ? 'Yes' : 'No'}</span>
              </div>
            </div>
            
            <h4>Optimization Recommendations</h4>
            <div className="recommendations-list">
              <div className="recommendation-item">
                <span className="recommendation-label">Max concurrent animations:</span> 
                <span className="recommendation-value">{deviceProfile.optimizationRecommendations.maxConcurrentAnimations}</span>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-label">Disable physics:</span> 
                <span className="recommendation-value">{deviceProfile.optimizationRecommendations.disablePhysics ? 'Yes' : 'No'}</span>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-label">Use simple bezier:</span> 
                <span className="recommendation-value">{deviceProfile.optimizationRecommendations.useSimpleBezier ? 'Yes' : 'No'}</span>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-label">Disable parallax:</span> 
                <span className="recommendation-value">{deviceProfile.optimizationRecommendations.disableParallax ? 'Yes' : 'No'}</span>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-label">Use simplified shadows:</span> 
                <span className="recommendation-value">{deviceProfile.optimizationRecommendations.useSimplifiedShadows ? 'Yes' : 'No'}</span>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-label">Disable backdrop filters:</span> 
                <span className="recommendation-value">{deviceProfile.optimizationRecommendations.disableBackdropFilters ? 'Yes' : 'No'}</span>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-label">Use lower quality images:</span> 
                <span className="recommendation-value">{deviceProfile.optimizationRecommendations.useLowerQualityImages ? 'Yes' : 'No'}</span>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-label">Target FPS:</span> 
                <span className="recommendation-value">{deviceProfile.optimizationRecommendations.maxFPS}</span>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-label">Duration multiplier:</span> 
                <span className="recommendation-value">{deviceProfile.optimizationRecommendations.durationMultiplier.toFixed(1)}</span>
              </div>
            </div>
            
            <div className="device-comparison">
              <h4>South African Market Comparison</h4>
              <div className="market-bar-chart">
                {southAfricanDeviceProfiles.map(profile => (
                  <div key={profile.deviceType} className="market-bar-item">
                    <div className="bar-label">{profile.deviceName.split('/')[0]}</div>
                    <div className="bar-container">
                      <div 
                        className="bar" 
                        style={{ 
                          width: `${profile.marketSharePercent * 2}%`,
                          backgroundColor: profile.deviceType === deviceProfile.deviceType ? '#007AFF' : '#E5E5EA'
                        }}
                      />
                      <span className="bar-value">{profile.marketSharePercent.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {viewMode === 'network' && networkProfile && (
          <div className="profile-detail">
            <h3>Network Profile: {networkProfile.provider} {networkProfile.networkType} in {networkProfile.locationType} area</h3>
            
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-label">Download speed:</span> 
                <span className="stat-value">{networkProfile.downloadSpeedMbps.toFixed(1)} Mbps</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Upload speed:</span> 
                <span className="stat-value">{networkProfile.uploadSpeedMbps.toFixed(1)} Mbps</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Latency:</span> 
                <span className="stat-value">{networkProfile.latencyMs} ms</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Packet loss:</span> 
                <span className="stat-value">{networkProfile.packetLossPercent.toFixed(1)}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Jitter:</span> 
                <span className="stat-value">{networkProfile.jitterMs} ms</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Data cost:</span> 
                <span className="stat-value">R{networkProfile.dataCostPerMBZAR.toFixed(3)}/MB</span>
              </div>
            </div>
            
            <h4>Bandwidth Recommendations</h4>
            <div className="recommendations-list">
              <div className="recommendation-item">
                <span className="recommendation-label">Max initial page size:</span> 
                <span className="recommendation-value">{networkProfile.bandwidthRecommendations.maxInitialPageSizeKB} KB</span>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-label">Max image size:</span> 
                <span className="recommendation-value">{networkProfile.bandwidthRecommendations.maxImageSizeKB} KB</span>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-label">Max animations data:</span> 
                <span className="recommendation-value">{networkProfile.bandwidthRecommendations.maxAnimationsDataKB} KB</span>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-label">Max concurrent requests:</span> 
                <span className="recommendation-value">{networkProfile.bandwidthRecommendations.maxConcurrentRequests}</span>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-label">Use compression:</span> 
                <span className="recommendation-value">{networkProfile.bandwidthRecommendations.useCompression ? 'Yes' : 'No'}</span>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-label">Use aggressive caching:</span> 
                <span className="recommendation-value">{networkProfile.bandwidthRecommendations.useAggressiveCaching ? 'Yes' : 'No'}</span>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-label">Preload critical resources:</span> 
                <span className="recommendation-value">{networkProfile.bandwidthRecommendations.preloadCriticalResources ? 'Yes' : 'No'}</span>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-label">Lazy load non-critical:</span> 
                <span className="recommendation-value">{networkProfile.bandwidthRecommendations.lazyLoadNonCritical ? 'Yes' : 'No'}</span>
              </div>
            </div>
            
            <div className="network-comparison">
              <h4>South African Network Comparison</h4>
              <div className="comparison-tabs">
                <button className="active">Download Speed</button>
                <button>Latency</button>
                <button>Data Cost</button>
              </div>
              <div className="network-bar-chart">
                {southAfricanNetworkProfiles
                  .filter(p => p.networkType !== 'Fiber' && p.networkType !== '5G')
                  .sort((a, b) => b.downloadSpeedMbps - a.downloadSpeedMbps)
                  .map(profile => (
                    <div key={`${profile.provider}_${profile.locationType}`} className="network-bar-item">
                      <div className="bar-label">{profile.provider} ({profile.locationType})</div>
                      <div className="bar-container">
                        <div 
                          className="bar" 
                          style={{ 
                            width: `${Math.min(100, profile.downloadSpeedMbps * 2)}%`,
                            backgroundColor: 
                              profile.provider === networkProfile.provider && 
                              profile.locationType === networkProfile.locationType
                                ? '#007AFF' 
                                : '#E5E5EA'
                          }}
                        />
                        <span className="bar-value">{profile.downloadSpeedMbps.toFixed(1)} Mbps</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
            
            <div className="data-saver-tips">
              <h4>Data Saving Tips for {networkProfile.provider} in {networkProfile.locationType} Areas</h4>
              <ul>
                {networkProfile.dataCostPerMBZAR > 0.05 ? (
                  <>
                    <li>Implement aggressive data saving mode (text-only view)</li>
                    <li>Limit or disable animations completely</li>
                    <li>Implement offline-first functionality for critical features</li>
                    <li>Display data usage estimates for operations</li>
                    <li>Use SVG instead of raster images where possible</li>
                  </>
                ) : (
                  <>
                    <li>Implement standard data saving optimizations</li>
                    <li>Use optimized image formats (WebP) with proper sizing</li>
                    <li>Keep animations lightweight and non-essential</li>
                    <li>Implement caching strategies appropriate for this network</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .sa-performance-dashboard {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
        }
        
        .dashboard-header {
          margin-bottom: 30px;
        }
        
        .dashboard-header h2 {
          margin: 0 0 10px 0;
          font-size: 24px;
          font-weight: 600;
        }
        
        .device-info {
          font-size: 14px;
          color: #666;
          margin-bottom: 20px;
        }
        
        .dashboard-tabs {
          display: flex;
          margin-bottom: 15px;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .dashboard-tabs button {
          background: none;
          border: none;
          padding: 10px 20px;
          font-size: 16px;
          cursor: pointer;
          position: relative;
          color: #666;
        }
        
        .dashboard-tabs button.active {
          color: #007AFF;
          font-weight: 500;
        }
        
        .dashboard-tabs button.active:after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: #007AFF;
        }
        
        .filter-controls {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
          gap: 10px;
        }
        
        .filter-controls label {
          font-size: 14px;
          margin-right: 5px;
        }
        
        .filter-controls select {
          padding: 6px 10px;
          border-radius: 4px;
          border: 1px solid #ddd;
        }
        
        .analyze-btn {
          padding: 6px 12px;
          background-color: #007AFF;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-left: auto;
        }
        
        .empty-state {
          text-align: center;
          padding: 40px;
          background-color: #f9f9f9;
          border-radius: 8px;
          color: #666;
        }
        
        .insights-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }
        
        .insight-card {
          display: flex;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .insight-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .severity-indicator {
          width: 6px;
          flex-shrink: 0;
        }
        
        .insight-content {
          padding: 15px;
          flex-grow: 1;
        }
        
        .insight-content h3 {
          margin: 0 0 10px 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .insight-content p {
          margin: 0 0 15px 0;
          font-size: 14px;
          color: #666;
        }
        
        .insight-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          font-size: 12px;
          color: #888;
        }
        
        .impact-indicator {
          letter-spacing: -1px;
        }
        
        .recommendation {
          font-size: 14px;
          padding-top: 10px;
          border-top: 1px solid #eee;
        }
        
        .profile-detail {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .profile-detail h3 {
          margin: 0 0 20px 0;
          font-size: 18px;
          font-weight: 600;
        }
        
        .profile-detail h4 {
          margin: 25px 0 15px 0;
          font-size: 16px;
          font-weight: 600;
          color: #555;
        }
        
        .profile-stats {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
        }
        
        .stat-item, .recommendation-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .stat-label, .recommendation-label {
          color: #666;
        }
        
        .stat-value, .recommendation-value {
          font-weight: 500;
        }
        
        .recommendations-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 15px;
        }
        
        .device-comparison, .network-comparison {
          margin-top: 30px;
        }
        
        .market-bar-chart, .network-bar-chart {
          margin-top: 15px;
        }
        
        .market-bar-item, .network-bar-item {
          margin-bottom: 12px;
        }
        
        .bar-label {
          font-size: 13px;
          margin-bottom: 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .bar-container {
          position: relative;
          height: 20px;
          background-color: #f5f5f5;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .bar {
          height: 100%;
          background-color: #E5E5EA;
          border-radius: 4px;
        }
        
        .bar-value {
          position: absolute;
          right: 8px;
          top: 2px;
          font-size: 12px;
          color: #333;
        }
        
        .comparison-tabs {
          display: flex;
          margin-bottom: 15px;
          gap: 10px;
        }
        
        .comparison-tabs button {
          padding: 6px 12px;
          background-color: #f0f0f0;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
        }
        
        .comparison-tabs button.active {
          background-color: #007AFF;
          color: white;
        }
        
        .data-saver-tips {
          margin-top: 30px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #007AFF;
        }
        
        .data-saver-tips h4 {
          margin-top: 0;
        }
        
        .data-saver-tips ul {
          margin: 10px 0 0 0;
          padding-left: 20px;
        }
        
        .data-saver-tips li {
          margin-bottom: 5px;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default SouthAfricanPerformanceDashboard;