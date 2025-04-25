import React, { useState, useEffect, useRef } from 'react';

import { Chart, registerables } from 'chart.js';
import { format } from 'date-fns';

import { observabilityApi } from '../../api/observability.api';
import { Metric } from '../../types/observability.types';

// Register Chart.js components
Chart.register(...registerables);

interface MetricsChartProps {
  metricName: string;
  title?: string;
  description?: string;
  refreshInterval?: number; // in milliseconds
  startTime?: string;
  endTime?: string;
  labels?: Record<string, string>;
  chartType?: 'line' | 'bar';
  height?: number;
  width?: string;
  colors?: {
    backgroundColor?: string;
    borderColor?: string;
  };
}

/**
 * Component for visualizing metrics data as charts
 */
export const MetricsChart: React.FC<MetricsChartProps> = ({
  metricName,
  title,
  description,
  refreshInterval = 60000, // Default to 1 minute
  startTime,
  endTime,
  labels,
  chartType = 'line',
  height = 300,
  width = '100%',
  colors = {
    backgroundColor: 'rgba(66, 153, 225, 0.2)',
    borderColor: 'rgba(66, 153, 225, 1)'
  }
}) => {
  const [metric, setMetric] = useState<Metric | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  const fetchMetricData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        startTime,
        endTime,
        labels
      };
      
      const data = await observabilityApi.getMetrics(metricName, params);
      setMetric(data);
    } catch (err) {
      setError(`Failed to fetch metric: ${metricName}`);
      console.error('Metric fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMetricData();
    
    // Set up the refresh interval
    const intervalId = setInterval(fetchMetricData, refreshInterval);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [metricName, refreshInterval, startTime, endTime, JSON.stringify(labels)]);
  
  useEffect(() => {
    if (!chartRef.current || !metric || metric.dataPoints.length === 0) {
      return;
    }
    
    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Prepare data for the chart
    const sortedDataPoints = [...metric.dataPoints].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    const labels = sortedDataPoints.map(point => 
      format(new Date(point.timestamp), 'HH:mm:ss')
    );
    
    const data = sortedDataPoints.map(point => point.value);
    
    // Create new chart
    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: chartType,
        data: {
          labels,
          datasets: [
            {
              label: metric.name,
              data,
              fill: chartType === 'line',
              backgroundColor: colors.backgroundColor,
              borderColor: colors.borderColor,
              borderWidth: 1,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: metric.unit
              }
            },
            x: {
              title: {
                display: true,
                text: 'Time'
              }
            }
          },
          plugins: {
            tooltip: {
              mode: 'index',
              intersect: false
            },
            legend: {
              display: false
            },
            title: {
              display: Boolean(title),
              text: title || metric.name
            }
          }
        }
      });
    }
    
    // Clean up on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [metric, chartType, title, colors]);
  
  if (loading && !metric) {
    return (
      <div className="bg-white rounded-lg shadow p-4 animate-pulse" style={{ height }}>
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div style={{ height: height - 60, backgroundColor: '#f9fafb' }}></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500" style={{ height }}>
        <h3 className="text-lg font-semibold mb-2">{title || metricName}</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchMetricData}
          className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!metric || metric.dataPoints.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4" style={{ height }}>
        <h3 className="text-lg font-semibold mb-2">{title || metricName}</h3>
        <p className="text-gray-600">No data available for this metric.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-4" style={{ width }}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">{title || metric.name}</h3>
          {description || metric.description ? (
            <p className="text-sm text-gray-600">{description || metric.description}</p>
          ) : null}
        </div>
        <div className="text-xs text-gray-500">
          {metric.type}: {metric.unit}
        </div>
      </div>
      
      <div style={{ height: height - 70 }}>
        <canvas ref={chartRef}></canvas>
      </div>
      
      <div className="mt-3 text-right">
        <button 
          onClick={fetchMetricData}
          className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};