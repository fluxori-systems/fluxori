'use client';

import React, { forwardRef, useState, useRef } from 'react';

import { DashboardSectionProps, DashboardDensity } from '../../../design-system/types/dashboard';
import { useSouthAfricanMarketOptimizations } from '../../../shared/hooks/useSouthAfricanMarketOptimizations';
import { useCombinedRefs } from '../../../shared/utils/ref-utils';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Text } from '../../components/Text';
import { useConnectionQuality } from '../../hooks/useConnection';

interface DashboardSectionComponentProps extends DashboardSectionProps {
  /** Current dashboard density */
  density?: DashboardDensity;
}

/**
 * DashboardSection component for grouping related dashboard cards with
 * collapsible headers and consistent styling. Supports network-aware
 * optimizations for South African market conditions.
 */
export const DashboardSection = forwardRef<HTMLDivElement, DashboardSectionComponentProps>(
  ({ 
    id,
    title,
    description,
    collapsible = true,
    collapsed = false,
    onToggleCollapse,
    children,
    layout,
    networkAware = true,
    density = 'comfortable',
    className = '',
  }, ref) => {
    const sectionRef = useRef<HTMLDivElement>(null);
    const combinedRef = useCombinedRefs(ref, sectionRef);
    const [isCollapsed, setIsCollapsed] = useState(collapsed);
    const { quality, isDataSaver } = useConnectionQuality();
    const { shouldReduceMotion } = useSouthAfricanMarketOptimizations();
    
    // Toggle section collapse state
    const handleToggleCollapse = () => {
      const newCollapsedState = !isCollapsed;
      setIsCollapsed(newCollapsedState);
      
      if (onToggleCollapse) {
        onToggleCollapse(id, newCollapsedState);
      }
    };
    
    // Get padding based on density and network conditions
    const getPadding = () => {
      // For poor connections or data saver mode, use minimal padding
      if (networkAware && (quality === 'poor' || isDataSaver)) {
        return 'xs';
      }
      
      // Otherwise use density setting
      return density === 'compact' ? 'sm' : 'md';
    };
    
    // Determine content padding
    const contentPadding = getPadding();
    
    return (
      <div 
        ref={combinedRef}
        id={`dashboard-section-${id}`}
        className={`dashboard-section ${className}`}
        data-section-id={id}
        data-collapsed={isCollapsed}
      >
        {/* Section Header */}
        <Card
          className="dashboard-section-header"
          p={contentPadding}
          radius={density === 'compact' ? 'sm' : 'md'}
          withBorder
          shadow="xs"
          style={{
            marginBottom: isCollapsed ? 0 : 'var(--spacing-md)',
            transition: shouldReduceMotion ? 'none' : 'margin 0.2s ease-out'
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <Text fw={600} size={density === 'compact' ? 'md' : 'lg'}>
                {title}
              </Text>
              
              {description && !isCollapsed && (
                <Text size="sm" c="dimmed" mt={4}>
                  {description}
                </Text>
              )}
            </div>
            
            {collapsible && (
              <Button
                variant="subtle"
                size="sm"
                onClick={handleToggleCollapse}
                title={isCollapsed ? 'Expand section' : 'Collapse section'}
                aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
                style={{ padding: '4px 8px' }}
              >
                {isCollapsed ? '▼ Show' : '▲ Hide'}
              </Button>
            )}
          </div>
        </Card>
        
        {/* Section Content - Only show if not collapsed */}
        {!isCollapsed && (
          <div 
            className="dashboard-section-content"
            style={{
              display: 'grid',
              gap: density === 'compact' ? 'var(--spacing-sm)' : 'var(--spacing-md)',
              transition: shouldReduceMotion ? 'none' : 'opacity 0.2s ease-out, transform 0.2s ease-out',
            }}
          >
            {children}
          </div>
        )}
      </div>
    );
  }
);

DashboardSection.displayName = 'DashboardSection';