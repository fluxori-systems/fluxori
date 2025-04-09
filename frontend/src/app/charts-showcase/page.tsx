'use client';

import React, { useState, useEffect } from 'react';
import { 
  NetworkAwareLineChart, 
  NetworkAwareBarChart, 
  NetworkAwarePieChart,
  type ChartConnectionQuality,
  type ChartDataPoint
} from '../../components/charts';
import { Text } from '../../lib/ui/components/Text';
import { useSouthAfricanMarketOptimizations } from '../../lib/shared/hooks/useSouthAfricanMarketOptimizations';

// Sample data for line chart
interface LineDataPoint extends ChartDataPoint {
  name: string;
  sales: number;
  revenue: number;
  profit: number;
}

const generateLineData = (points: number): LineDataPoint[] => {
  const data: LineDataPoint[] = [];
  for (let i = 0; i < points; i++) {
    data.push({
      name: `Day ${i + 1}`,
      sales: Math.floor(Math.random() * 1000) + 500,
      revenue: Math.floor(Math.random() * 5000) + 1000,
      profit: Math.floor(Math.random() * 2000) + 200,
    });
  }
  return data;
};

// Sample data for bar chart
interface BarDataPoint extends ChartDataPoint {
  category: string;
  sales: number;
  target: number;
}

const barData: BarDataPoint[] = [
  { category: 'Electronics', sales: 4000, target: 3000 },
  { category: 'Clothing', sales: 3000, target: 3500 },
  { category: 'Furniture', sales: 2000, target: 2200 },
  { category: 'Books', sales: 2780, target: 2500 },
  { category: 'Food', sales: 1890, target: 2000 },
  { category: 'Toys', sales: 2390, target: 2800 },
  { category: 'Sports', sales: 3490, target: 3200 },
];

// Sample data for pie chart
interface PieDataPoint extends ChartDataPoint {
  name: string;
  value: number;
}

const pieData: PieDataPoint[] = [
  { name: 'Electronics', value: 35 },
  { name: 'Clothing', value: 25 },
  { name: 'Furniture', value: 15 },
  { name: 'Books', value: 10 },
  { name: 'Food', value: 8 },
  { name: 'Toys', value: 5 },
  { name: 'Sports', value: 2 },
];

/**
 * Chart Showcase Page
 */
export default function ChartsShowcasePage() {
  // Get South African market optimizations
  const { 
    networkProfile, 
    shouldReduceDataUsage 
  } = useSouthAfricanMarketOptimizations();
  
  // State to control the connection quality simulation
  const [simulatedQuality, setSimulatedQuality] = useState<ChartConnectionQuality | undefined>(undefined);
  
  // Generate larger dataset for complex charts
  const [lineData, setLineData] = useState<ReturnType<typeof generateLineData>>(generateLineData(30));
  
  // Regenerate data periodically to demonstrate animations
  useEffect(() => {
    const interval = setInterval(() => {
      setLineData(generateLineData(30));
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <Text fw="bold" size="xl" style={{ marginBottom: 'var(--spacing-md)' }}>
          Fluxori Advanced Charts
        </Text>
        <Text style={{ marginBottom: 'var(--spacing-md)' }}>
          These charts are built with Chart.js and integrate with our design system and South African market optimizations.
          They adapt to network conditions to provide the best performance across different connection speeds.
        </Text>
        <div style={{ 
          display: 'flex', 
          gap: 'var(--spacing-md)', 
          marginBottom: 'var(--spacing-lg)',
          flexWrap: 'wrap'
        }}>
          <div>
            <Text fw="semibold" style={{ marginBottom: 'var(--spacing-xs)' }}>
              Current Network Profile
            </Text>
            <Text>
              {networkProfile} {shouldReduceDataUsage ? '(Data saving enabled)' : ''}
            </Text>
          </div>
          
          <div>
            <Text fw="semibold" style={{ marginBottom: 'var(--spacing-xs)' }}>
              Simulate Connection Quality
            </Text>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              {(['high', 'medium', 'low', 'poor'] as ChartConnectionQuality[]).map((quality) => (
                <button
                  key={quality}
                  onClick={() => setSimulatedQuality(
                    simulatedQuality === quality ? undefined : quality
                  )}
                  style={{
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    border: '1px solid var(--color-border-default)',
                    borderRadius: 'var(--radius-sm)',
                    background: simulatedQuality === quality 
                      ? 'var(--color-primary-500)' 
                      : 'var(--color-background-card)',
                    color: simulatedQuality === quality 
                      ? 'white' 
                      : 'var(--color-text-primary)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-xs)'
                  }}
                >
                  {quality.charAt(0).toUpperCase() + quality.slice(1)}
                </button>
              ))}
              {simulatedQuality && (
                <button
                  onClick={() => setSimulatedQuality(undefined)}
                  style={{
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    border: '1px solid var(--color-border-default)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-error-base)',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-xs)'
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Line Chart */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <Text fw="semibold" size="lg" style={{ marginBottom: 'var(--spacing-md)' }}>
          Line Chart
        </Text>
        <div style={{ 
          padding: 'var(--spacing-md)',
          background: 'var(--color-background-card)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <NetworkAwareLineChart
            data={lineData}
            xAxisDataKey="name"
            yAxisDataKey={['sales', 'revenue', 'profit']}
            xAxisLabel="Time Period"
            yAxisLabel="Amount (R)"
            height={400}
            forceConnectionQuality={simulatedQuality}
            fillArea={true}
            showDots={true}
            textAlternative="This line chart shows sales, revenue, and profit trends over time. Sales and revenue show positive growth with profit margins remaining stable."
          />
        </div>
        <Text size="sm" c="dimmed" style={{ marginTop: 'var(--spacing-xs)' }}>
          This chart dynamically adapts to connection quality. Try simulating different connection qualities above.
        </Text>
      </div>
      
      {/* Bar Chart */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <Text fw="semibold" size="lg" style={{ marginBottom: 'var(--spacing-md)' }}>
          Bar Chart
        </Text>
        <div style={{ 
          padding: 'var(--spacing-md)',
          background: 'var(--color-background-card)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <NetworkAwareBarChart
            data={barData}
            xAxisDataKey="category"
            yAxisDataKey={['sales', 'target']}
            xAxisLabel="Product Category"
            yAxisLabel="Sales (R1000)"
            height={400}
            forceConnectionQuality={simulatedQuality}
            radius={4}
            textAlternative="This bar chart compares sales vs targets across product categories. Electronics, Sports, and Clothing are the top performers, with Electronics and Sports exceeding targets."
          />
        </div>
        <Text size="sm" c="dimmed" style={{ marginTop: 'var(--spacing-xs)' }}>
          Notice how grid lines, animations, and data labels adapt based on connection quality.
        </Text>
      </div>
      
      {/* Pie Chart */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <Text fw="semibold" size="lg" style={{ marginBottom: 'var(--spacing-md)' }}>
          Pie Chart
        </Text>
        <div style={{ 
          padding: 'var(--spacing-md)',
          background: 'var(--color-background-card)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <NetworkAwarePieChart
            data={pieData}
            nameKey="name"
            valueKey="value"
            height={400}
            forceConnectionQuality={simulatedQuality}
            donut={true}
            showLabels={true}
            textAlternative="This pie chart shows the distribution of sales by product category. Electronics (35%) and Clothing (25%) make up the majority of sales, followed by Furniture (15%)."
          />
        </div>
        <Text size="sm" c="dimmed" style={{ marginTop: 'var(--spacing-xs)' }}>
          On poor connections, this shows a simplified table view to conserve data and improve performance.
        </Text>
      </div>
      
      <div style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-md)' }}>
        <Text fw="semibold" size="md">Implementation Details</Text>
        <Text size="sm" style={{ marginTop: 'var(--spacing-xs)' }}>
          These charts integrate with our design system tokens for colors, typography, and motion,
          and automatically adapt to network conditions through the South African market optimizations.
          They implement the Agent Appropriateness Framework to determine when to show interactive 
          visualizations versus simplified alternatives.
        </Text>
      </div>
    </div>
  );
}