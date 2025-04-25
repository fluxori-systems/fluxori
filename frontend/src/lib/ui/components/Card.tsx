'use client';

import React, { forwardRef, useRef, useState, useCallback } from 'react';

import { Card as MantineCard, CardProps as MantineCardProps, CardSection , useMantineTheme } from '@mantine/core';

import { getColorFromMantine, getRadiusFromMantine, getShadowFromMantine } from '../../design-system/utils/mantine-theme-adapter';
import { useTokenTracking } from '../../design-system/utils/token-analysis';
import { useSouthAfricanMarketOptimizations } from '../../shared/hooks/useSouthAfricanMarketOptimizations';
import { useConnectionQuality, useNetworkAware } from '../hooks/useConnection';
import { BaseComponentProps, AnimatableComponentProps, Intent, Radius } from '../types';
import { useCombinedRefs } from '../utils/use-combined-refs';
/**
 * Card variant types for different use cases
 */
export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled' | 'transparent';

/**
 * Card elevation levels
 */
export type CardElevation = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface CardProps extends BaseComponentProps, AnimatableComponentProps {
  /** Card title */
  title?: React.ReactNode;
  
  /** Card variant */
  variant?: CardVariant;
  
  /** Card padding */
  p?: string | number;
  
  /** Card padding horizontal */
  px?: string | number;
  
  /** Card padding vertical */
  py?: string | number;
  
  /** Card padding top */
  pt?: string | number;
  
  /** Card padding bottom */
  pb?: string | number;
  
  /** Card padding left */
  pl?: string | number;
  
  /** Card padding right */
  pr?: string | number;
  
  /** Card radius */
  radius?: Radius;
  
  /** Card shadow */
  shadow?: CardElevation;
  
  /** Card width */
  w?: string | number;
  
  /** Card height */
  h?: string | number;
  
  /** Card background color */
  bg?: string;
  
  /** Card withBorder */
  withBorder?: boolean;
  
  /** Component to render as */
  component?: React.ElementType;
  
  /** Semantic intent for the card */
  intent?: Intent;
  
  /** Enable network-aware optimizations */
  networkAware?: boolean;
  
  /** South African market optimizations */
  saSensitive?: boolean;
  
  /** Content priority for resource loading */
  priority?: 'critical' | 'high' | 'medium' | 'low';
  
  /** onClick handler */
  onClick?: React.MouseEventHandler<HTMLDivElement> | (() => void) | (() => Promise<void>);
}

/**
 * Enhanced Card component that integrates with Fluxori Design System
 * Supports various card variants, animations, and network-aware optimizations for the South African market
 * Implements dependency inversion pattern to avoid circular dependencies
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    children,
    title,
    variant = 'default',
    animated = true,
    animationType = 'shadow',
    animationDelay = 0,
    animationSpeed = 1.0,
    shadow = 'sm',
    radius = 'md',
    withBorder,
    className = '',
    intent = 'default',
    networkAware = true,
    saSensitive = false,
    priority = 'medium',
    onClick,
    ...props 
  }, ref) => {
    const cardRef = useRef<HTMLDivElement | null>(null);
    const combinedRef = useCombinedRefs(ref, cardRef);
    const [isHovered, setIsHovered] = useState(false);
    const theme = useMantineTheme();
    const tokenTracking = useTokenTracking('Card');
    const { quality: networkQuality, isDataSaver } = useConnectionQuality();
    const saMarket = useSouthAfricanMarketOptimizations();
    
    // Track token usage
    tokenTracking.trackToken(`variant-${variant}`);
    tokenTracking.trackToken(`shadow-${shadow}`);
    tokenTracking.trackToken(`radius-${radius}`);
    
    if (intent !== 'default') {
      tokenTracking.trackToken(`intent-${intent}`);
    }
    
    // Determine if we should optimize based on network conditions
    const shouldSimplify = networkAware && (isDataSaver || networkQuality === 'poor' || networkQuality === 'low');
    const isRuralSouthAfrican = saSensitive && saMarket.isRural;
    
    // Apply network-aware animation delay
    const networkAnimationDelay = useNetworkAware({
      highQuality: animationDelay / 1000,
      mediumQuality: (animationDelay * 0.8) / 1000,
      lowQuality: (animationDelay * 0.5) / 1000,
      poorQuality: (animationDelay * 0.3) / 1000,
      dataSaverMode: 0 // No animation delay in data saver mode
    });
    
    // Apply network-aware animation speed
    const networkAnimationSpeed = useNetworkAware({
      highQuality: animationSpeed,
      mediumQuality: animationSpeed * 0.8,
      lowQuality: animationSpeed * 0.6,
      poorQuality: animationSpeed * 0.4,
      dataSaverMode: animationSpeed * 0.2
    });
    
    // Map variant to design system styling with South African market optimizations
    const getVariantStyles = useCallback((): React.CSSProperties => {
      // For rural South African connections with poor network quality, simplify variants
      if (isRuralSouthAfrican && saMarket.shouldReduceJavascript && shouldSimplify) {
        // Use only simple variants for poor connections
        tokenTracking.trackToken('sa-simplify-card-variant');
        return {
          backgroundColor: getColorFromMantine(theme, 'background.card', 'var(--background-card)'),
          boxShadow: 'none',
          border: withBorder ? `1px solid ${getColorFromMantine(theme, 'border.default', 'var(--border-default)')}` : undefined
        };
      }
      
      switch (variant) {
        case 'elevated':
          tokenTracking.trackToken('background-raised');
          return {
            backgroundColor: getColorFromMantine(theme, 'background.raised', 'var(--background-raised)'),
            boxShadow: shouldSimplify ? 'none' : getShadowFromMantine(theme, 'md', undefined),
          };
        case 'outlined':
          tokenTracking.trackToken('background-surface');
          tokenTracking.trackToken('border-default');
          return {
            backgroundColor: getColorFromMantine(theme, 'background.surface', 'var(--background-surface)'),
            border: `1px solid ${getColorFromMantine(theme, 'border.default', 'var(--border-default)')}`,
            boxShadow: 'none',
          };
        case 'filled':
          tokenTracking.trackToken('background-card');
          return {
            backgroundColor: getColorFromMantine(theme, 'background.card', 'var(--background-card)'),
            boxShadow: shouldSimplify ? 'none' : getShadowFromMantine(theme, 'xs', undefined),
          };
        case 'transparent':
          return {
            backgroundColor: 'transparent',
            boxShadow: 'none',
          };
        default:
          tokenTracking.trackToken('background-card');
          return {
            backgroundColor: getColorFromMantine(theme, 'background.card', 'var(--background-card)'),
            // Box shadow will be set separately based on shadow prop
          };
      }
    }, [variant, theme, shouldSimplify, withBorder, isRuralSouthAfrican, saMarket.shouldReduceJavascript, tokenTracking]);
    
    // Apply intent styling if specified
    const getIntentStyles = useCallback((): React.CSSProperties => {
      if (intent === 'default') return {};
      
      // Use thinner border for poor connections to improve performance
      if (shouldSimplify) {
        return {
          borderLeft: `2px solid ${getColorFromMantine(theme, `intent.${intent}`, undefined)}`,
        };
      }
      
      return {
        borderLeft: `4px solid ${getColorFromMantine(theme, `intent.${intent}`, undefined)}`,
      };
    }, [intent, theme, shouldSimplify]);
    
    // Event handlers
    const handleMouseEnter = () => {
      if (animated && !shouldSimplify && !isRuralSouthAfrican) {
        setIsHovered(true);
      }
    };
    
    const handleMouseLeave = () => {
      if (animated) {
        setIsHovered(false);
      }
    };
    
    // Get animation styles based on network conditions and animation type
    const getAnimationStyles = (): React.CSSProperties => {
      // Disable animations for rural South African connections or critical priority content
      if ((isRuralSouthAfrican && saMarket.shouldReduceMotion) || 
          (priority === 'critical' && shouldSimplify)) {
        return {};
      }
      
      // Skip animations for data saver mode
      if (isDataSaver) {
        return {};
      }
      
      if (!animated || !isHovered) {
        return {}; 
      }
      
      // Use CSS animations instead of GSAP for better performance
      switch (animationType) {
        case 'hover':
          return {
            transform: 'translateY(-5px)',
            transition: `transform ${networkAnimationSpeed * 0.3}s ease-out`,
          };
        case 'shadow':
          return {
            boxShadow: getShadowFromMantine(theme, 'lg', undefined),
            transition: `box-shadow ${networkAnimationSpeed * 0.3}s ease-out`,
          };
        case 'scale':
          return {
            transform: 'scale(1.02)',
            transition: `transform ${networkAnimationSpeed * 0.3}s ease-out`,
          };
        default:
          return {};
      }
    };
    
    // Custom styles with token integration
    const cardStyles: React.CSSProperties = {
      ...getVariantStyles(),
      ...getIntentStyles(),
      ...getAnimationStyles(),
      borderRadius: getRadiusFromMantine(theme, radius, undefined),
      boxShadow: shouldSimplify ? 'none' : shadow ? getShadowFromMantine(theme, shadow, undefined) : undefined,
      transition: animated ? `all ${networkAnimationSpeed * 0.3}s ease-out` : undefined,
      cursor: onClick ? 'pointer' : 'default',
      ...props.style
    };
    
    // Combine classnames with intent and optimization markers
    const combinedClassName = `flx-card flx-card-${variant} ${
      intent !== 'default' ? `flx-card-${intent}` : ''
    } ${
      saSensitive ? 'sa-optimized' : ''
    } ${
      priority ? `priority-${priority}` : ''
    } ${className}`.trim();
    
    // Additional data attributes for monitoring and debugging
    const dataAttributes = {
      'data-network-quality': networkQuality,
      'data-sa-optimized': saSensitive && shouldSimplify ? 'true' : undefined,
      'data-priority': priority,
      'data-animated': animated ? 'true' : undefined,
      'data-intent': intent
    };
    
    // For rural South African connections with low priority, further simplify card structure
    if (isRuralSouthAfrican && saMarket.shouldReduceJavascript && priority === 'low') {
      tokenTracking.trackToken('sa-optimize-low-priority-card');
      
      // Return a simpler version of the card without animations
      return (
        <div
          ref={combinedRef}
          className={`flx-card-simplified ${combinedClassName}`}
          style={{
            ...cardStyles,
            boxShadow: 'none',
            border: '1px solid var(--color-border-light)',
            borderRadius: getRadiusFromMantine(theme, 'sm', undefined),
            padding: props.p || 'var(--spacing-md)'
          }}
          onClick={onClick}
          {...dataAttributes}
          {...props}
        >
          {title && (
            <div className="flx-card-title-simplified" style={{ 
              marginBottom: 'var(--spacing-sm)',
              paddingBottom: 'var(--spacing-xs)',
              borderBottom: '1px solid var(--color-border-light)',
              fontWeight: 'var(--typography-font-weights-medium)'
            }}>
              {title}
            </div>
          )}
          {children}
        </div>
      );
    }
    
    return (
      <MantineCard
        ref={combinedRef}
        shadow={shouldSimplify ? 'none' : shadow}
        radius={radius}
        withBorder={withBorder}
        className={combinedClassName}
        style={cardStyles}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        {...dataAttributes}
        {...props}
      >
        {title && (
          <CardSection 
            className="flx-card-title" 
            inheritPadding 
            p={shouldSimplify ? 'xs' : 'sm'} 
            withBorder
          >
            {title}
          </CardSection>
        )}
        {children}
      </MantineCard>
    );
  }
);

// Export CardSection component for consistency
export { CardSection };

Card.displayName = 'Card';