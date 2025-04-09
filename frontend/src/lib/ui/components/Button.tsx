'use client';

import React, { ReactNode, forwardRef, useState, useRef, useCallback } from 'react';
import { Button as MantineButton } from '@mantine/core';

// Import from shared modules to avoid circular dependencies
import { useCombinedRefs } from '../../shared/utils/ref-utils';
import { 
  useComponentAnimation, 
  useReducedMotion, 
  useHoverAnimation 
} from '../hooks/useComponentAnimation';
import { useNetworkAware } from '../hooks/useConnection';
import { useSouthAfricanMarketOptimizations } from '../../shared/hooks/useSouthAfricanMarketOptimizations';
import { SAOptimizer } from '../../shared/components/SouthAfricanMarketOptimizer';
/**
 * Button intent variants for different semantic uses
 */
export type ButtonIntent = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface ButtonProps {
  /** Button content */
  children?: ReactNode;
  
  /** The color of the button */
  color?: string;
  
  /** Button size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Button variant */
  variant?: 'filled' | 'light' | 'outline' | 'subtle' | 'white' | 'default' | 'gradient' | 'text';
  
  /** Button intent for semantic variations */
  intent?: ButtonIntent;
  
  /** Left section content */
  leftSection?: ReactNode;
  
  /** Right section content */
  rightSection?: ReactNode;
  
  /** Legacy prop for left icon (will use leftSection internally) */
  leftIcon?: ReactNode;
  
  /** Legacy prop for right icon (will use rightSection internally) */
  rightIcon?: ReactNode;
  
  /** Full width button */
  fullWidth?: boolean;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Loading state */
  loading?: boolean;
  
  /** Allow animations */
  animated?: boolean;
  
  /** Animation type */
  animationType?: 'ripple' | 'scale' | 'slide' | 'none';
  
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  
  /** Component to render as */
  component?: React.ElementType;
  
  /** Onclick handler */
  onClick?: React.MouseEventHandler<HTMLButtonElement> | (() => void) | (() => Promise<void>);
  
  /** Additional className */
  className?: string;
  
  /** Additional style */
  style?: React.CSSProperties;
  
  /** Rounded corners (uses design system tokens) */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  /** Network-aware animations */
  networkAware?: boolean;
  
  /** South African market optimizations */
  saSensitive?: boolean;
  
  /** Loading priority for South African optimizations */
  priority?: 'critical' | 'high' | 'medium' | 'low';
  
  /** Other props */
  [key: string]: any;
}

/**
 * Enhanced Button component that integrates with Fluxori Design System and Motion Framework
 * Supports semantic intents, animations, and uses design system tokens for styling
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    leftIcon, 
    rightIcon, 
    leftSection: leftSectionProp, 
    rightSection: rightSectionProp,
    intent = 'primary',
    variant,
    color,
    animated = true,
    animationType = 'ripple',
    radius = 'md',
    className = '',
    networkAware = true,
    saSensitive = true,
    priority = 'medium',
    ...props 
  }, ref) => {
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const rippleRef = useRef<HTMLSpanElement>(null);
    const [isPressed, setIsPressed] = useState(false);
    const saMarket = useSouthAfricanMarketOptimizations();
    
    // Map legacy props to Mantine v7 props
    const leftSection = leftIcon || leftSectionProp;
    const rightSection = rightIcon || rightSectionProp;
    
    // Map intent to design system token colors
    const getIntentColor = (intent: ButtonIntent): string => {
      switch (intent) {
        case 'primary':
          return 'var(--color-primary-500)';
        case 'secondary':
          return 'var(--color-secondary-500)';
        case 'success':
          return 'var(--color-success-base)';
        case 'warning':
          return 'var(--color-warning-base)';
        case 'error':
          return 'var(--color-error-base)';
        case 'info':
          return 'var(--color-info-base)';
        case 'neutral':
          return 'var(--color-neutral-600)';
        default:
          return 'var(--color-primary-500)';
      }
    };
    
    // Apply color based on intent if explicit color is not provided
    const buttonColor = color || getIntentColor(intent);
    
    // Map radius to design system tokens
    const getRadiusValue = (radius: string): string => {
      switch (radius) {
        case 'none': return '0';
        case 'sm': return 'var(--radius-sm)';
        case 'md': return 'var(--radius-md)';
        case 'lg': return 'var(--radius-lg)';
        case 'xl': return 'var(--radius-xl)';
        case 'full': return 'var(--radius-full)';
        default: return 'var(--radius-md)';
      }
    };
    
    // Determine if we should use animations based on various factors
    const shouldReduceMotion = useReducedMotion();
    const shouldDisableAnimations = shouldReduceMotion || 
      (saSensitive && saMarket.shouldReduceMotion) || 
      (networkAware && saMarket.shouldReduceDataUsage);
    
    // Only enable animations if explicitly requested and no reduction factors
    const enableAnimations = animated && !shouldDisableAnimations;
    
    // Get animation duration based on network conditions
    const animationDuration = useNetworkAware({
      highQuality: 0.6,
      mediumQuality: 0.5,
      lowQuality: 0.4,
      poorQuality: 0.3,
      dataSaverMode: 0.25
    });
    
    // Get hover animation handlers that automatically manage hover state
    const [handleMouseEnter, handleMouseLeave] = useHoverAnimation(buttonRef, {
      enabled: enableAnimations,
      networkAware,
      properties: {
        brightness: 1.05,
        scale: animationType === 'scale' ? 1.02 : 1.0,
      }
    });
    
    // Use the component animation hook for press state
    useComponentAnimation({
      ref: buttonRef,
      enabled: enableAnimations,
      mode: 'press',
      isActive: isPressed,
      networkAware,
      properties: {
        scale: 0.98,
        brightness: 0.95,
      }
    });
    
    // Handle ripple animation
    const handleRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (!enableAnimations || animationType !== 'ripple' || !buttonRef.current || !rippleRef.current) return;
      
      const button = buttonRef.current;
      const ripple = rippleRef.current;
      
      // Calculate position for ripple effect
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Create and position ripple
      ripple.style.width = '0';
      ripple.style.height = '0';
      ripple.style.opacity = '0.5';
      ripple.style.display = 'block';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      // Animate ripple with CSS transitions
      // This is more performant than GSAP for simple animations
      // and works better in low-resource environments
      ripple.style.transition = `all ${animationDuration}s ease-out`;
      
      // Set final size and fade out
      setTimeout(() => {
        ripple.style.width = `${rect.width * 2.5}px`;
        ripple.style.height = `${rect.width * 2.5}px`;
        ripple.style.left = `${x - rect.width * 1.25}px`;
        ripple.style.top = `${y - rect.width * 1.25}px`;
        ripple.style.opacity = '0';
      }, 10);
      
      // Hide the ripple when animation is done
      setTimeout(() => {
        ripple.style.display = 'none';
      }, animationDuration * 1000);
      
    }, [enableAnimations, animationType, animationDuration]);
    
    // Mouse down handler combines press state and ripple effect
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      setIsPressed(true);
      if (enableAnimations && animationType === 'ripple') {
        handleRipple(e);
      }
    }, [enableAnimations, animationType, handleRipple]);
    
    // Mouse up handler resets pressed state
    const handleMouseUp = useCallback(() => {
      setIsPressed(false);
    }, []);
    
    // Combined mouse leave handler that calls the hover handler and resets pressed state
    const handleCombinedMouseLeave = useCallback(() => {
      handleMouseLeave();
      setIsPressed(false);
    }, [handleMouseLeave]);
    
    // Click handler to ensure both animation and onClick prop work
    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (props.onClick) {
        // @ts-ignore - We need to allow different onClick signatures
        props.onClick(e);
      }
    }, [props.onClick]);
    
    // Simplify button variant for rural users or data saver mode
    let optimizedVariant = variant;
    if (saSensitive && (saMarket.isRural || saMarket.shouldReduceDataUsage) && variant === 'gradient') {
      // Gradient animations can be resource-intensive, use filled instead
      optimizedVariant = 'filled';
    }
    
    // Custom styles to apply animations
    const buttonStyles: React.CSSProperties = {
      position: 'relative',
      overflow: 'hidden',
      transform: 'translateZ(0)', // Force hardware acceleration
      borderRadius: getRadiusValue(radius),
      ...props.style
    };
    
    // Wrap with South African Market Optimizer for extreme optimization cases
    if (saSensitive && saMarket.isRural && priority !== 'critical') {
      return (
        <SAOptimizer priority={priority}>
          <MantineButton 
            ref={useCombinedRefs(ref, buttonRef)}
            color={buttonColor}
            variant={optimizedVariant}
            radius={radius}
            className={`flx-button flx-button-${intent} ${className}`}
            leftSection={leftSection} 
            rightSection={rightSection}
            style={buttonStyles}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleCombinedMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onClick={handleClick}
            data-sa-optimized="true"
            {...props}
          >
            {children}
            {enableAnimations && animationType === 'ripple' && (
              <span 
                ref={rippleRef}
                style={{
                  position: 'absolute',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.4)',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  display: 'none',
                  willChange: 'width, height, opacity, left, top',
                }}
              />
            )}
          </MantineButton>
        </SAOptimizer>
      );
    }
    
    // Default rendering
    return (
      <MantineButton 
        ref={useCombinedRefs(ref, buttonRef)}
        color={buttonColor}
        variant={optimizedVariant}
        radius={radius}
        className={`flx-button flx-button-${intent} ${className}`}
        leftSection={leftSection} 
        rightSection={rightSection}
        style={buttonStyles}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleCombinedMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        {...props}
      >
        {children}
        {enableAnimations && animationType === 'ripple' && (
          <span 
            ref={rippleRef}
            style={{
              position: 'absolute',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.4)',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              display: 'none',
              willChange: 'width, height, opacity, left, top',
            }}
          />
        )}
      </MantineButton>
    );
  }
);

Button.displayName = 'Button';