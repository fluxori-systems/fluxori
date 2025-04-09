'use client';

import { forwardRef, useRef, useState, useEffect } from 'react';
import { Button, ButtonProps } from './Button';
import { useAnimationService } from '../../shared/services';
import { 
  useSouthAfricanMarketOptimizations,
  useAnimationPerformance,
  usePerformanceMonitoring
} from '../../shared/hooks';

/**
 * Performance Button props extend regular Button props
 * with additional performance monitoring capabilities
 */
export interface PerformanceButtonProps extends ButtonProps {
  /**
   * Whether to adapt animation based on performance
   * @default true
   */
  adaptToPerformance?: boolean;
  
  /**
   * Animation complexity level
   * @default "medium"
   */
  animationComplexity?: 'high' | 'medium' | 'low';
  
  /**
   * Whether to show performance metrics
   * @default false
   */
  showPerformanceMetrics?: boolean;
}

/**
 * Enhanced button with performance monitoring and adaptation
 * Automatically adjusts animation complexity based on device capabilities
 * and network conditions for optimal South African market experience
 */
export const PerformanceButton = forwardRef<HTMLButtonElement, PerformanceButtonProps>(
  ({ 
    children,
    adaptToPerformance = true,
    animationComplexity = 'medium',
    showPerformanceMetrics = false,
    animated = true,
    animationType = 'hover',
    networkAware = true,
    ...props 
  }, ref) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [lastAnimationDuration, setLastAnimationDuration] = useState<number | null>(null);
    
    // Use animation performance hook
    const { 
      startMonitoring, 
      stopMonitoring, 
      recordFrame,
      adaptedSettings,
      hasPerformanceIssues
    } = useAnimationPerformance({
      componentName: 'PerformanceButton',
      animationType: animationType || 'hover',
      complexity: animationComplexity,
      measureFrameTimes: true,
      autoAdapt: adaptToPerformance,
    });
    
    // Use performance monitoring for general metrics
    const performance = usePerformanceMonitoring({
      componentName: 'PerformanceButton',
      measureMountTime: true,
      measureRenderTime: true,
    });
    
    // Apply animation settings based on performance
    const animationSpeed = adaptToPerformance 
      ? adaptedSettings.durationMultiplier 
      : props.animationSpeed || 1.0;
    
    const useSimpleAnimation = adaptToPerformance 
      ? adaptedSettings.useSimpleEasings 
      : false;
    
    // Monitor animation performance
    useEffect(() => {
      if (isHovered || isPressed) {
        const animationId = startMonitoring();
        
        // Record frames (animation ticks)
        const frameId = requestAnimationFrame(function frameLoop() {
          recordFrame();
          if (isHovered || isPressed) {
            requestAnimationFrame(frameLoop);
          }
        });
        
        return () => {
          stopMonitoring(animationId);
          cancelAnimationFrame(frameId);
        };
      }
    }, [isHovered, isPressed]);
    
    // Event handlers with performance timing
    const handleMouseEnter = performance.measureExecutionTime(() => {
      setIsHovered(true);
    }, { name: 'mouseEnter', type: 'interaction' });
    
    const handleMouseLeave = performance.measureExecutionTime(() => {
      setIsHovered(false);
      setIsPressed(false);
    }, { name: 'mouseLeave', type: 'interaction' });
    
    const handleMouseDown = performance.measureExecutionTime(() => {
      setIsPressed(true);
      
      // Measure click response time
      const startTime = performance.now();
      
      // Record click time on next frame
      requestAnimationFrame(() => {
        const clickTime = performance.now() - startTime;
        setLastAnimationDuration(clickTime);
        
        performance.recordMetric('clickResponse', clickTime, {
          type: 'interaction',
          priority: 'medium',
        });
      });
    }, { name: 'mouseDown', type: 'interaction' });
    
    const handleMouseUp = () => {
      setIsPressed(false);
    };
    
    return (
      <div className="performance-button-container" style={{ position: 'relative' }}>
        <Button
          ref={buttonRef}
          animated={animated}
          animationType={animationType}
          networkAware={networkAware}
          animationSpeed={animationSpeed}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          data-component-name="PerformanceButton"
          {...props}
        >
          {children}
        </Button>
        
        {showPerformanceMetrics && lastAnimationDuration !== null && (
          <div
            style={{
              position: 'absolute',
              bottom: '-18px',
              right: '0',
              fontSize: '10px',
              color: lastAnimationDuration > 16 ? 'rgba(255, 100, 100, 0.9)' : 'rgba(100, 180, 100, 0.9)',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              padding: '2px 4px',
              borderRadius: '3px',
              pointerEvents: 'none',
            }}
          >
            {lastAnimationDuration.toFixed(1)} ms
            {hasPerformanceIssues && <span> ⚠️</span>}
          </div>
        )}
      </div>
    );
  }
);

PerformanceButton.displayName = 'PerformanceButton';