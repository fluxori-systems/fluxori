import React, { useState, useEffect } from 'react';

import { observabilityApi } from '../../api/observability.api';
import { SystemHealthInfo, HealthCheckResult } from '../../types/observability.types';

interface HealthStatusCardProps {
  refreshInterval?: number; // in milliseconds
  detailed?: boolean;
  onStatusChange?: (newStatus: SystemHealthInfo) => void;
}

/**
 * A card component that displays the current health status of the system
 */
export const HealthStatusCard: React.FC<HealthStatusCardProps> = ({
  refreshInterval = 60000, // Default to 1 minute
  detailed = false,
  onStatusChange
}) => {
  const [healthInfo, setHealthInfo] = useState<SystemHealthInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchHealthInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const info = detailed 
        ? await observabilityApi.getDetailedHealth()
        : await observabilityApi.getSystemHealth();
      
      setHealthInfo(info);
      
      if (onStatusChange) {
        onStatusChange(info);
      }
    } catch (err) {
      setError('Failed to fetch health information');
      console.error('Health check failed:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchHealthInfo();
    
    // Set up the refresh interval
    const intervalId = setInterval(fetchHealthInfo, refreshInterval);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [refreshInterval, detailed]);
  
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
      case 'up':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
      case 'down':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const formatUptime = (uptime: number): string => {
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0 || days > 0) result += `${hours}h `;
    result += `${minutes}m`;
    
    return result;
  };
  
  const renderComponentStatus = (component: HealthCheckResult) => (
    <div key={component.name} className="flex items-center justify-between p-2 border-b border-gray-200">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(component.status)}`}></div>
        <span className="font-medium">{component.name}</span>
      </div>
      {component.message && (
        <span className="text-sm text-gray-600">{component.message}</span>
      )}
    </div>
  );
  
  if (loading && !healthInfo) {
    return (
      <div className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
        <h3 className="text-lg font-semibold mb-2">Health Status Unavailable</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchHealthInfo}
          className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!healthInfo) {
    return null;
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">System Health</h3>
        <div className="flex items-center">
          <div className={`w-4 h-4 rounded-full mr-2 ${getStatusColor(healthInfo.status)}`}></div>
          <span className="font-medium capitalize">{healthInfo.status}</span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <span className="text-sm text-gray-600">Uptime</span>
            <p className="font-medium">{formatUptime(healthInfo.uptime)}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Version</span>
            <p className="font-medium">{healthInfo.version}</p>
          </div>
        </div>
        
        {detailed && healthInfo.components && healthInfo.components.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-gray-700">Components</h4>
            <div className="max-h-80 overflow-y-auto">
              {healthInfo.components.map(renderComponentStatus)}
            </div>
          </div>
        )}
      </div>
      
      <div className="px-4 py-3 bg-gray-50 text-right">
        <button 
          onClick={fetchHealthInfo}
          className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};