# Dashboard Layout System

The Dashboard Layout System provides a comprehensive solution for building data-rich, responsive dashboards in the Fluxori application. It's specifically designed with South African market conditions in mind, featuring optimizations for variable network quality and device capabilities.

## Core Components

### DashboardLayout

The top-level container for a dashboard that manages:
- Information density controls (compact/comfortable)
- Layout persistence
- Section collapsing state
- Network-aware optimizations

```tsx
<DashboardLayout 
  showDensityControls={true} 
  defaultDensity="comfortable"
  networkAware={true}>
  {/* Dashboard sections and content */}
</DashboardLayout>
```

### DashboardSection

Organizes related dashboard cards with collapsible headers:

```tsx
<DashboardSection
  id="kpi-section"
  title="Key Performance Indicators"
  description="Overview of critical metrics"
  collapsible={true}>
  {/* Section content */}
</DashboardSection>
```

### DashboardGrid

Provides a responsive grid layout for dashboard cards:

```tsx
<DashboardGrid columns={12} gap="md">
  <DashboardGrid.Col span={{ xs: 12, sm: 6, md: 3 }}>
    {/* Card content */}
  </DashboardGrid.Col>
</DashboardGrid>
```

### DashboardCard

Base card component with consistent styling and behavior:

```tsx
<DashboardCard
  id="card-1"
  title="Card Title"
  description="Optional description"
  type="metric"
  refreshInterval={30000}
  onRefresh={() => fetchNewData()}>
  {/* Card content */}
</DashboardCard>
```

## Specialized Cards

### MetricCard

For displaying KPIs with trend indicators:

```tsx
<MetricCard
  id="revenue-metric"
  title="Total Revenue"
  value={1250976}
  previousValue={1120500}
  percentChange={11.6}
  isPositiveWhenUp={true}
  format="$0,0"
  refreshInterval={30000}
/>
```

### ChartCard

For data visualizations:

```tsx
<ChartCard
  id="revenue-chart"
  title="Revenue Trends"
  chartType="line"
  chartData={data}
  showLegend={true}
  interactive={true}
  canSimplify={true}
  textAlternative="Revenue has increased by 23% year-over-year"
/>
```

## South African Market Optimizations

The Dashboard Layout System includes comprehensive optimizations for South African market conditions:

### Network Quality Adaptations

- **Data Saver Mode**: Simplified layouts and disabled animations when data saver is enabled
- **Poor Connection Handling**: Reduced complexity for slow connections
- **Simplified Visualizations**: Chart simplification for low bandwidth
- **Text Alternatives**: Provides text summaries for charts when needed

### Device Performance Optimizations

- **Layout Simplification**: Reduces grid complexity for low-end devices
- **Animation Disabling**: Turns off animations for feature phones and basic smartphones
- **Resource Prioritization**: Critical content loads first and gets more resources

### UI Density Controls

- **Compact Mode**: Higher information density for experienced users
- **Comfortable Mode**: More spacing for better readability
- **Automatic Switching**: Activates compact mode on poor connections

## Example Dashboard

```tsx
<DashboardLayout>
  <DashboardSection id="kpi-section" title="Key Metrics">
    <DashboardGrid columns={12} gap="md">
      <DashboardGrid.Col span={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          id="revenue"
          title="Revenue"
          value={1250976}
          previousValue={1120500}
          percentChange={11.6}
          format="$0,0"
        />
      </DashboardGrid.Col>
      
      <DashboardGrid.Col span={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          id="orders"
          title="Orders"
          value={8254}
          previousValue={7844}
          percentChange={5.2}
        />
      </DashboardGrid.Col>
    </DashboardGrid>
  </DashboardSection>
  
  <DashboardSection id="charts-section" title="Performance Charts">
    <DashboardGrid columns={12} gap="md">
      <DashboardGrid.Col span={{ xs: 12, lg: 8 }}>
        <ChartCard
          id="revenue-chart"
          title="Revenue Trends"
          chartType="line"
          chartData={revenueData}
          showLegend={true}
        />
      </DashboardGrid.Col>
      
      <DashboardGrid.Col span={{ xs: 12, sm: 6, lg: 4 }}>
        <ChartCard
          id="category-chart"
          title="Sales by Category"
          chartType="pie"
          chartData={categoryData}
          showLegend={true}
        />
      </DashboardGrid.Col>
    </DashboardGrid>
  </DashboardSection>
</DashboardLayout>
```

## Best Practices

1. **Network-Aware Development**:
   - Always enable `networkAware` prop on components
   - Provide text alternatives for charts
   - Test with the ConnectionQualitySimulator

2. **Responsive Design**:
   - Use responsive span values in Grid.Col components
   - Test across all breakpoints

3. **Performance Optimization**:
   - Lazy-load non-critical dashboard sections
   - Keep refresh intervals reasonable (30s minimum)
   - Use appropriate card types for the data

4. **Accessibility**:
   - Ensure color contrasts are WCAG compliant
   - Provide meaningful titles and descriptions
   - Test with screen readers