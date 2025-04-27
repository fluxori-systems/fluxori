# Fluxori Network-Aware Charts

These chart components integrate Chart.js with the Fluxori Design System and South African market optimizations. They dynamically adapt to network conditions to provide the best user experience across different connection speeds.

## Features

- **Network-Aware**: Charts adapt to network conditions and device capabilities
- **Design System Integration**: Uses design system tokens for colors, typography, and motion
- **South African Market Optimizations**: Special optimizations for South African network conditions
- **Responsive**: Charts work across different screen sizes
- **Accessible**: Follows accessibility best practices with proper contrast and alternative text
- **Performance-Focused**: Optimized for performance on low-end devices

## Available Charts

- **NetworkAwareLineChart**: For time-series and trend data
- **NetworkAwareBarChart**: For comparing values across categories
- **NetworkAwarePieChart**: For showing proportions of a whole

## Usage

Each chart component accepts its specific props plus the following common props:

- `data`: The data to visualize
- `height`: Chart height (default: 300px)
- `width`: Chart width (default: 100%)
- `responsive`: Whether the chart should be responsive (default: true)
- `margin`: Margins around the chart
- `forceConnectionQuality`: Force a specific connection quality (useful for testing)
- `textAlternative`: Text to show instead of the chart on poor connections
- `hideOnPoorConnection`: Whether to hide the chart on poor connections

### Line Chart Example

```tsx
import { NetworkAwareLineChart } from "../components/charts";

// Sample data
const lineData = [
  { month: "Jan", sales: 1000, revenue: 5000 },
  { month: "Feb", sales: 1500, revenue: 7500 },
  { month: "Mar", sales: 1200, revenue: 6000 },
  // ...more data
];

// Component usage
return (
  <NetworkAwareLineChart
    data={lineData}
    xAxisDataKey="month"
    yAxisDataKey={["sales", "revenue"]}
    xAxisLabel="Month"
    yAxisLabel="Amount (R)"
    height={400}
    fillArea={true}
    showDots={true}
    textAlternative="This line chart shows sales and revenue trends by month. Sales and revenue both peaked in February."
  />
);
```

### Bar Chart Example

```tsx
import { NetworkAwareBarChart } from "../components/charts";

// Sample data
const barData = [
  { category: "Electronics", sales: 4000, target: 3000 },
  { category: "Clothing", sales: 3000, target: 3500 },
  { category: "Furniture", sales: 2000, target: 2200 },
  // ...more data
];

// Component usage
return (
  <NetworkAwareBarChart
    data={barData}
    xAxisDataKey="category"
    yAxisDataKey={["sales", "target"]}
    xAxisLabel="Product Category"
    yAxisLabel="Sales (R1000)"
    height={400}
    radius={4}
    textAlternative="This bar chart compares sales vs targets across product categories. Electronics exceeded targets while Clothing fell short."
  />
);
```

### Pie Chart Example

```tsx
import { NetworkAwarePieChart } from "../components/charts";

// Sample data
const pieData = [
  { name: "Electronics", value: 35 },
  { name: "Clothing", value: 25 },
  { name: "Furniture", value: 15 },
  // ...more data
];

// Component usage
return (
  <NetworkAwarePieChart
    data={pieData}
    nameKey="name"
    valueKey="value"
    height={400}
    donut={true}
    showLabels={true}
    textAlternative="This pie chart shows the distribution of sales by product category. Electronics (35%) makes up the largest portion."
  />
);
```

## South African Market Optimizations

These chart components implement the following optimizations for the South African market:

1. **Data Point Reduction**: Reduces the number of data points on slower connections
2. **Animation Disabling**: Disables animations on poor connections
3. **Text Alternatives**: Shows text summaries instead of charts on very slow connections
4. **Simplified Visuals**: Removes non-essential elements on slower connections
5. **Data Usage Awareness**: Adapts based on whether the user has data saver mode enabled

## Integration with Design System

- **Colors**: Uses design system color tokens for consistent branding
- **Typography**: Uses design system typography tokens for text elements
- **Spacing**: Uses design system spacing tokens for consistent layout
- **Motion**: Uses design system motion tokens for animations
- **Shadows**: Uses design system shadow tokens for elevation

## Network Connection Profiles

Charts adapt based on four connection quality profiles:

1. **High**: Full features, animations, and data points
2. **Medium**: Most features enabled with slightly reduced animations
3. **Low**: Simplified visuals with limited animations
4. **Poor**: Minimal visuals or text alternative, no animations

## Custom Chart Integration

If you need to create a custom chart, you can use the `useNetworkAwareChart` hook to get the same network-aware optimizations:

```tsx
import { useNetworkAwareChart } from "../components/charts";
import { Chart } from "chart.js/auto";
import { useRef, useEffect } from "react";

function CustomNetworkAwareChart({ data, ...props }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const {
    shouldSimplify,
    showTextAlternative,
    animation,
    profileConfig,
    getOptimizedData,
    getDesignSystemColors,
  } = useNetworkAwareChart();

  // Get optimized data
  const optimizedData = getOptimizedData(data);

  // Show text alternative if needed
  if (showTextAlternative) {
    return <TextAlternative />;
  }

  useEffect(() => {
    if (!chartRef.current) return;

    // Cleanup previous chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart with network-aware options
    const ctx = chartRef.current.getContext("2d");
    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: optimizedData.map((d) => d.label),
        datasets: [
          {
            data: optimizedData.map((d) => d.value),
            backgroundColor: getDesignSystemColors(1)[0],
          },
        ],
      },
      options: {
        responsive: true,
        animation: {
          duration: animation.enabled ? animation.duration : 0,
          easing: animation.easing,
        },
        // Apply other network-aware settings
        scales: {
          x: {
            grid: {
              display: profileConfig.showGrid,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [optimizedData, animation, profileConfig]);

  // Render custom chart with optimizations
  return (
    <div style={{ width: "100%", height: "300px" }}>
      <canvas ref={chartRef}></canvas>
    </div>
  );
}
```

## Testing Different Connection Qualities

During development, you can force a specific connection quality to test how your charts adapt:

```tsx
<NetworkAwareLineChart
  data={lineData}
  xAxisDataKey="month"
  yAxisDataKey={["sales", "revenue"]}
  forceConnectionQuality="poor" // Try "high", "medium", "low", or "poor"
/>
```

You can see a showcase of all charts with different connection qualities on the `/charts-showcase` page.
