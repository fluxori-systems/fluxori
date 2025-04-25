import React, { useState, useEffect } from 'react';

import { format, subHours } from 'date-fns';

import { HealthStatusCard } from './HealthStatusCard';
import { MetricsChart } from './MetricsChart';
import { TraceViewer } from './TraceViewer';
import { observabilityApi } from '../../api/observability.api';
import { SystemHealthInfo, Trace } from '../../types/observability.types';

interface ObservabilityDashboardProps {
  title?: string;
  showHealth?: boolean;
  showMetrics?: boolean;
  showTraces?: boolean;
  timeRange?: {
    hours: number;
  };
  refreshInterval?: number; // in milliseconds
}

/**
 * A comprehensive dashboard for monitoring system health, metrics, and traces
 */
export const ObservabilityDashboard: React.FC<ObservabilityDashboardProps> = ({
  title = 'System Observability',
  showHealth = true,
  showMetrics = true,
  showTraces = true,
  timeRange = { hours: 1 },
  refreshInterval = 60000 // Default to 1 minute
}) => {
  const [healthStatus, setHealthStatus] = useState<SystemHealthInfo | null>(null);
  const [metrics, setMetrics] = useState<{ name: string; description: string; type: string }[]>([]);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  
  // Get formatted time range for API calls
  const getTimeRange = () => {
    const endTime = new Date();
    const startTime = subHours(endTime, timeRange.hours);
    
    return {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    };
  };
  
  // Fetch initial data
  useEffect(() => {
    const fetchMetricsData = async () => {
      try {
        setLoading(true);
        
        if (showMetrics) {
          const metricsList = await observabilityApi.listMetrics();
          setMetrics(metricsList);
        }
        
        if (showTraces) {
          const { startTime, endTime } = getTimeRange();
          const tracesList = await observabilityApi.searchTraces({
            startTime,
            endTime,
            limit: 10
          });
          setTraces(tracesList);
          
          if (tracesList.length > 0 && !selectedTraceId) {
            setSelectedTraceId(tracesList[0].traceId);
          }
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load observability data');
        console.error('Dashboard data load failed:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMetricsData();
    
    // Set up refresh interval
    const intervalId = setInterval(fetchMetricsData, refreshInterval);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [refreshInterval, showMetrics, showTraces, timeRange.hours]);
  
  // Handle health status change
  const handleHealthStatusChange = (status: SystemHealthInfo) => {
    setHealthStatus(status);
  };
  
  // Render dashboard content
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{title}</h1>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {showHealth && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">System Health</h2>
            <HealthStatusCard 
              refreshInterval={refreshInterval} 
              detailed={true} 
              onStatusChange={handleHealthStatusChange} 
            />
          </div>
        )}
        
        {showMetrics && metrics.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Key Metrics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* API Response Time */}
              <MetricsChart 
                metricName="http.server.duration" 
                title="API Response Time"
                description="Average time to process API requests"
                refreshInterval={refreshInterval}
                startTime={getTimeRange().startTime}
                endTime={getTimeRange().endTime}
                chartType="line"
                colors={{
                  backgroundColor: 'rgba(66, 153, 225, 0.2)',
                  borderColor: 'rgba(66, 153, 225, 1)'
                }}
              />
              
              {/* Error Rate */}
              <MetricsChart 
                metricName="http.server.error_rate" 
                title="Error Rate"
                description="Percentage of API requests resulting in errors"
                refreshInterval={refreshInterval}
                startTime={getTimeRange().startTime}
                endTime={getTimeRange().endTime}
                chartType="line"
                colors={{
                  backgroundColor: 'rgba(237, 100, 166, 0.2)',
                  borderColor: 'rgba(237, 100, 166, 1)'
                }}
              />
              
              {/* Request Count */}
              <MetricsChart 
                metricName="http.server.request_count" 
                title="Request Volume"
                description="Number of API requests per minute"
                refreshInterval={refreshInterval}
                startTime={getTimeRange().startTime}
                endTime={getTimeRange().endTime}
                chartType="bar"
                colors={{
                  backgroundColor: 'rgba(72, 187, 120, 0.2)',
                  borderColor: 'rgba(72, 187, 120, 1)'
                }}
              />
              
              {/* Database Operations */}
              <MetricsChart 
                metricName="db.operation.duration" 
                title="Database Performance"
                description="Average time for database operations"
                refreshInterval={refreshInterval}
                startTime={getTimeRange().startTime}
                endTime={getTimeRange().endTime}
                chartType="line"
                colors={{
                  backgroundColor: 'rgba(246, 173, 85, 0.2)',
                  borderColor: 'rgba(246, 173, 85, 1)'
                }}
              />
            </div>
          </div>
        )}
        
        {showTraces && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Traces</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Trace</label>
              <select 
                className="block w-full p-2 border border-gray-300 rounded"
                value={selectedTraceId || ''}
                onChange={(e) => setSelectedTraceId(e.target.value)}
              >
                <option value="">Select a trace...</option>
                {traces.map(trace => (
                  <option key={trace.traceId} value={trace.traceId}>
                    {trace.name} ({format(new Date(trace.startTime), 'HH:mm:ss')}) - {(trace.duration / 1000).toFixed(2)}s
                  </option>
                ))}
              </select>
            </div>
            
            {selectedTraceId && (
              <TraceViewer traceId={selectedTraceId} height={600} />
            )}
          </div>
        )}
        
        {/* System Information */}
        {healthStatus && (
          <div className="bg-white rounded-lg shadow p-4 mb-8">
            <h2 className="text-xl font-semibold mb-4">System Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Version</h3>
                <p className="mt-1 text-lg">{healthStatus.version}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Environment</h3>
                <p className="mt-1 text-lg">{process.env.NODE_ENV || 'development'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Region</h3>
                <p className="mt-1 text-lg">{process.env.NEXT_PUBLIC_GCP_REGION || 'africa-south1'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};