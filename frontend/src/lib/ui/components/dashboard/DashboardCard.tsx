'use client';

import React, { forwardRef, useRef, useState, useEffect } from 'react';

import { DashboardCardBaseProps, DashboardDensity } from '../../../design-system/types/dashboard';
import { useTokenTracking } from '../../../design-system/utils/token-analysis';
import { useSouthAfricanMarketOptimizations } from '../../../shared/hooks/useSouthAfricanMarketOptimizations';
import { useCombinedRefs } from '../../../shared/utils/ref-utils';
import { Button } from '../../components/Button';
import { Card, CardSection } from '../../components/Card';
import { Text } from '../../components/Text';
import { useConnectionQuality } from '../../hooks/useConnection';

export interface BaseDashboardCardProps extends DashboardCardBaseProps {
  /** Card content */
  children?: React.ReactNode;
  
  /** Current dashboard density */
  density?: DashboardDensity;
  
  /** Card controls to display in the top-right */
  controls?: React.ReactNode;
  
  /** Function to run when refresh is requested */
  onRefresh?: () => void;
  
  /** Whether to animate card entrance */
  animateEntrance?: boolean;
  
  /** Whether to allow collapsing the card */
  allowCollapse?: boolean;
  
  /** Function called when collapse state changes */
  onCollapseChange?: (collapsed: boolean) => void;
  
  /** Additional CSS class */
  className?: string;
  
  /** Additional inline styles */
  style?: React.CSSProperties;
}

/**
 * Base Dashboard Card component that provides consistent styling and behavior
 * for all dashboard card types. Includes support for loading states, errors,
 * collapsible content, refresh controls, and network-aware optimizations.
 */
export const DashboardCard = forwardRef<HTMLDivElement, BaseDashboardCardProps>(
  ({
    id,
    title,
    description,
    type,
    isLoading = false,
    hasError = false,
    errorMessage,
    lastUpdated,
    networkAware = true,
    refreshInterval = 0,
    children,
    density = 'comfortable',
    controls,
    onRefresh,
    animateEntrance = true,
    collapsible = false,
    collapsed = false,
    allowCollapse = true,
    onCollapseChange,
    className = '',
    style
  }, ref) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const combinedRef = useCombinedRefs(ref, cardRef);
    const [isCollapsed, setIsCollapsed] = useState(collapsed);
    const [refreshTimestamp, setRefreshTimestamp] = useState<Date | null>(null);
    const [nextRefreshIn, setNextRefreshIn] = useState<number | null>(null);
    const { quality, isDataSaver } = useConnectionQuality();
    const { shouldReduceMotion, shouldReduceDataUsage } = useSouthAfricanMarketOptimizations();
    const tokenTracking = useTokenTracking('DashboardCard');

    // Track dashboard card type
    useEffect(() => {
      tokenTracking.trackToken(`dashboard-card-${type}`);
      tokenTracking.trackToken(`dashboard-density-${density}`);
    }, [type, density, tokenTracking]);

    // Toggle collapse state
    const handleToggleCollapse = () => {
      if (!allowCollapse) return;
      
      const newCollapsedState = !isCollapsed;
      setIsCollapsed(newCollapsedState);
      
      if (onCollapseChange) {
        onCollapseChange(newCollapsedState);
      }
    };

    // Handle refresh
    const handleRefresh = () => {
      if (!onRefresh || isLoading) return;
      
      setRefreshTimestamp(new Date());
      onRefresh();
    };

    // Set up auto-refresh interval
    useEffect(() => {
      if (!refreshInterval || refreshInterval <= 0 || !onRefresh || isDataSaver) return;
      
      // Don't auto-refresh on poor connections
      if (networkAware && quality === 'poor') return;
      
      let intervalId: NodeJS.Timeout;
      let countdownId: NodeJS.Timeout;
      
      const startInterval = () => {
        // Clear any existing intervals
        if (intervalId) clearInterval(intervalId);
        if (countdownId) clearInterval(countdownId);
        
        // Create new refresh interval
        intervalId = setInterval(() => {
          if (!document.hidden) { // Only refresh if tab is visible
            handleRefresh();
          }
        }, refreshInterval);
        
        // Create countdown timer for UI
        let remainingTime = refreshInterval;
        countdownId = setInterval(() => {
          remainingTime -= 1000;
          setNextRefreshIn(Math.max(0, remainingTime));
          
          if (remainingTime <= 0) {
            setNextRefreshIn(refreshInterval);
          }
        }, 1000);
        
        // Initial countdown value
        setNextRefreshIn(refreshInterval);
      };
      
      // Start the interval
      startInterval();
      
      // Reset interval when tab becomes visible
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          startInterval();
        }
      };
      
      // Listen for visibility changes
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Clean up on unmount
      return () => {
        if (intervalId) clearInterval(intervalId);
        if (countdownId) clearInterval(countdownId);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }, [refreshInterval, onRefresh, isDataSaver, networkAware, quality]);

    // Format the time for display
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Format the remaining time
    const formatRemainingTime = (ms: number) => {
      const seconds = Math.floor(ms / 1000);
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m ${seconds % 60}s`;
    };

    // Determine padding based on density and network conditions
    const getPadding = () => {
      // For poor connections or data saver mode, use minimal padding
      if (networkAware && (quality === 'poor' || isDataSaver)) {
        return 'xs';
      }
      
      // Otherwise use density setting
      return density === 'compact' ? 'sm' : 'md';
    };

    // Simplified card for poor connections or data saver mode
    if (networkAware && (quality === 'poor' || isDataSaver) && shouldReduceDataUsage) {
      return (
        <Card
          ref={combinedRef}
          title={title}
          radius="sm"
          shadow="xs"
          p={getPadding()}
          className={`dashboard-card dashboard-card-${type} dashboard-card-simplified ${className}`}
          style={style}
          intent={hasError ? 'error' : 'default'}
          networkAware={true}
          saSensitive={true}
          animated={false}
        >
          {isLoading ? (
            <div className="dashboard-card-loading-simplified">
              <Text>Loading...</Text>
            </div>
          ) : hasError ? (
            <div className="dashboard-card-error-simplified">
              <Text c="red">{errorMessage || 'An error occurred'}</Text>
            </div>
          ) : (
            <>
              {description && (
                <Text size="sm" c="dimmed" mb="sm">{description}</Text>
              )}
              <div className="dashboard-card-content">
                {children}
              </div>
            </>
          )}
        </Card>
      );
    }

    // Normal card with full features
    return (
      <Card
        ref={combinedRef}
        shadow="sm"
        radius="md"
        p={0} // No padding since we'll use CardSection
        className={`dashboard-card dashboard-card-${type} dashboard-density-${density} ${className}`}
        style={{
          height: isCollapsed ? 'auto' : '100%',
          display: 'flex',
          flexDirection: 'column',
          ...style
        }}
        animated={animateEntrance && !shouldReduceMotion}
        animationType="shadow"
        intent={hasError ? 'error' : 'default'}
        networkAware={networkAware}
      >
        {/* Card Header */}
        <CardSection 
          className="dashboard-card-header"
          p={getPadding()}
          inheritPadding
          withBorder={!isCollapsed}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--spacing-xs)'
          }}
        >
          <div className="dashboard-card-title">
            <Text fw={600} size={density === 'compact' ? 'sm' : 'md'}>
              {title}
            </Text>
            {description && (
              <Text c="dimmed" size="xs" lineClamp={1} style={{ marginTop: 2 }}>
                {description}
              </Text>
            )}
          </div>
          
          <div className="dashboard-card-controls" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* Custom Controls */}
            {controls}
            
            {/* Refresh Button - Only show if onRefresh provided */}
            {onRefresh && (
              <Button
                variant="subtle"
                size="xs"
                onClick={handleRefresh}
                disabled={isLoading}
                title="Refresh"
                aria-label="Refresh"
                style={{ padding: 4 }}
              >
                {isLoading ? '⟳' : '↻'}
              </Button>
            )}
            
            {/* Collapse Button - Only show if collapsible enabled */}
            {collapsible && allowCollapse && (
              <Button
                variant="subtle"
                size="xs"
                onClick={handleToggleCollapse}
                title={isCollapsed ? 'Expand' : 'Collapse'}
                aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                style={{ padding: 4 }}
              >
                {isCollapsed ? '▼' : '▲'}
              </Button>
            )}
          </div>
        </CardSection>
        
        {/* Card Content - Only show if not collapsed */}
        {!isCollapsed && (
          <CardSection 
            className="dashboard-card-content"
            p={getPadding()} 
            style={{ 
              flex: 1,
              overflow: 'auto',
              position: 'relative',
              minHeight: 70 // Minimum height for content
            }}
          >
            {isLoading ? (
              <div className="dashboard-card-loading" style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                height: '100%',
                minHeight: 70
              }}>
                <Text>Loading...</Text>
              </div>
            ) : hasError ? (
              <div className="dashboard-card-error" style={{ 
                padding: 'var(--spacing-sm)',
                color: 'var(--color-error-base)'
              }}>
                <Text c="error" fw={500}>{errorMessage || 'An error occurred'}</Text>
              </div>
            ) : (
              children
            )}
          </CardSection>
        )}
        
        {/* Card Footer - Only show if has refresh or update info */}
        {(lastUpdated || refreshTimestamp || nextRefreshIn) && !isCollapsed && (
          <CardSection
            className="dashboard-card-footer"
            p={density === 'compact' ? 'xs' : 'sm'} 
            inheritPadding
            withBorder
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)'
            }}
          >
            <div className="dashboard-card-last-updated">
              {lastUpdated && (
                <Text size="xs" c="dimmed">
                  Updated: {formatTime(lastUpdated)}
                </Text>
              )}
              {refreshTimestamp && !lastUpdated && (
                <Text size="xs" c="dimmed">
                  Refreshed: {formatTime(refreshTimestamp)}
                </Text>
              )}
            </div>
            
            {nextRefreshIn !== null && refreshInterval > 0 && (
              <div className="dashboard-card-refresh-countdown">
                <Text size="xs" c="dimmed">
                  Next refresh: {formatRemainingTime(nextRefreshIn)}
                </Text>
              </div>
            )}
          </CardSection>
        )}
      </Card>
    );
  }
);

DashboardCard.displayName = 'DashboardCard';