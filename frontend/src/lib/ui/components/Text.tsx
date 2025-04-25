'use client';

import React, { forwardRef, useRef, useEffect } from 'react';

import { Text as MantineText , useMantineTheme } from '@mantine/core';

import { typography } from '../../design-system/tokens/typography';
import { getColorFromMantine } from '../../design-system/utils/mantine-theme-adapter';
import { useTokenTracking } from '../../design-system/utils/token-analysis';
import { getColor, getFontSize, getSpacing } from '../../design-system/utils/tokens';
import { SouthAfricanMarketOptimizer, SAOptimizer } from '../../shared/components/SouthAfricanMarketOptimizer';
import { 
  useSouthAfricanMarketOptimizations, 
  SANetworkProfile 
} from '../../shared/hooks/useSouthAfricanMarketOptimizations';
import { useCombinedRefs } from '../../shared/utils/ref-utils';
import { useComponentAnimation } from '../hooks/useComponentAnimation';
import { useConnectionQuality, useNetworkAware } from '../hooks/useConnection';
import { BaseComponentProps, AnimatableComponentProps, Intent, Size } from '../types';

// Import from shared modules to avoid circular dependencies
// Define font weight type
type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

/**
 * Text preset types for typography consistency
 */
export type TextPreset = 
  | 'display1' | 'display2' | 'display3'  // Large headings
  | 'heading1' | 'heading2' | 'heading3' | 'heading4' | 'heading5' | 'heading6'  // Headings
  | 'body1' | 'body2' | 'body3'  // Body text
  | 'caption' | 'label' | 'overline' | 'code';  // Utility text

/**
 * Text semantic types for semantic meaning
 */
export type TextRole = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'disabled';

export interface TextProps extends BaseComponentProps, AnimatableComponentProps {
  /** Typography preset */
  preset?: TextPreset;
  
  /** Semantic role (affects color) */
  role?: TextRole;
  
  /** Semantic intent (alternative to role) */
  intent?: Intent;
  
  /** Use heading font (Space Grotesk) */
  heading?: boolean;
  
  /** Use monospace font */
  mono?: boolean;
  
  /** Font size */
  fz?: Size | string | number;
  
  /** Legacy size property (mapped to fz) */
  size?: Size | string | number;
  
  /** Font weight */
  fw?: FontWeight;
  
  /** Legacy weight property (mapped to fw) */
  weight?: FontWeight;
  
  /** Text alignment */
  ta?: 'left' | 'center' | 'right' | 'justify';
  
  /** Legacy align property (mapped to ta) */
  align?: 'left' | 'center' | 'right' | 'justify';
  
  /** Text color */
  c?: string;
  
  /** Legacy color property (mapped to c) */
  color?: string;
  
  /** Truncate text with ellipsis */
  truncate?: boolean | 'start' | 'end';
  
  /** Line clamp */
  lineClamp?: number;
  
  /** Inline or block element */
  inline?: boolean;
  
  /** Inherit font properties */
  inherit?: boolean;
  
  /** Line height */
  lh?: 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose' | number;
  
  /** Letter spacing */
  ls?: 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest' | string;
  
  /** Gradient configuration */
  gradient?: { from: string; to: string; deg?: number };
  
  /** Render as span instead of p */
  span?: boolean;
  
  /** Transform text case */
  tt?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
  
  /** Text decoration */
  td?: 'underline' | 'line-through' | 'none';
  
  /** Font style */
  fs?: 'italic' | 'normal';
  
  /** Component to render as */
  component?: React.ElementType;
  
  /** Enable network-aware optimizations */
  networkAware?: boolean;
  
  /** Loading priority for South African optimizations */
  priority?: 'critical' | 'high' | 'medium' | 'low';
  
  /** Enable South African market specific optimizations */
  saSensitive?: boolean;
}

/**
 * Enhanced Text component that integrates with Fluxori Design System typography tokens
 * Supports typography presets, semantic roles/intents, and network-aware optimizations
 * for the South African market.
 */
export const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ 
    children, 
    weight, 
    fw: fwProp, 
    align, 
    ta: taProp, 
    size, 
    fz: fzProp, 
    color, 
    c: cProp,
    preset,
    role = 'default',
    intent = 'default',
    heading = false,
    mono = false,
    lh,
    ls,
    className = '',
    animated = false,
    animationType = 'fade',
    animationDelay = 0,
    animationSpeed = 1.0,
    networkAware = true,
    priority = 'medium',
    saSensitive = true,
    style,
    ...props 
  }, ref) => {
    // Setup refs and hooks
    const textRef = useRef<HTMLParagraphElement>(null);
    // Create the combined ref at the top level to avoid conditional hook calls
    const combinedRef = useCombinedRefs(ref, textRef);
    const theme = useMantineTheme();
    const tokenTracking = useTokenTracking('Text');
    const connectionQuality = useConnectionQuality();
    const { quality: networkQuality, isDataSaver } = connectionQuality;
    const saMarket = useSouthAfricanMarketOptimizations();
    
    // Use network-aware animation speed
    const networkAnimationSpeed = useNetworkAware({
      highQuality: animationSpeed,
      mediumQuality: animationSpeed * 0.8,
      lowQuality: animationSpeed * 0.6,
      poorQuality: animationSpeed * 0.4,
      dataSaverMode: 0 // No animation in data saver mode
    });
    
    // Map legacy props to Mantine v7 props
    const fw = weight !== undefined ? weight : fwProp;
    const ta = align !== undefined ? align : taProp;
    const fz = size !== undefined ? size : fzProp;
    let c = color !== undefined ? color : cProp;
    
    // Track token usage
    useEffect(() => {
      if (preset) {
        tokenTracking.trackToken(`preset-${preset}`);
      }
      
      if (role !== 'default') {
        tokenTracking.trackToken(`role-${role}`);
      }
      
      if (intent !== 'default') {
        tokenTracking.trackToken(`intent-${intent}`);
      }
    }, [preset, role, intent, tokenTracking]);
    
    // Apply typography preset styles
    const getPresetStyles = (): Partial<TextProps> => {
      if (!preset) return {};
      
      switch (preset) {
        case 'display1':
          return {
            fz: '6xl',
            fw: 700,
            lh: 'tight',
            ls: 'tight',
            heading: true
          };
        case 'display2':
          return {
            fz: '5xl',
            fw: 700,
            lh: 'tight',
            ls: 'tight',
            heading: true
          };
        case 'display3':
          return {
            fz: '4xl',
            fw: 600,
            lh: 'tight',
            ls: 'tight',
            heading: true
          };
        case 'heading1':
          return {
            fz: '3xl',
            fw: 700,
            lh: 'tight',
            ls: 'tight',
            heading: true
          };
        case 'heading2':
          return {
            fz: '2xl',
            fw: 600,
            lh: 'tight',
            heading: true
          };
        case 'heading3':
          return {
            fz: 'xl',
            fw: 600,
            lh: 'snug',
            heading: true
          };
        case 'heading4':
          return {
            fz: 'lg',
            fw: 600,
            lh: 'snug',
            heading: true
          };
        case 'heading5':
          return {
            fz: 'md',
            fw: 600,
            lh: 'snug'
          };
        case 'heading6':
          return {
            fz: 'sm',
            fw: 600,
            lh: 'snug',
            ls: 'wide',
            tt: 'uppercase'
          };
        case 'body1':
          return {
            fz: 'md',
            fw: 400,
            lh: 'normal'
          };
        case 'body2':
          return {
            fz: 'sm',
            fw: 400,
            lh: 'normal'
          };
        case 'body3':
          return {
            fz: 'xs',
            fw: 400,
            lh: 'normal'
          };
        case 'caption':
          return {
            fz: 'xs',
            fw: 400,
            lh: 'snug',
            c: getColorFromMantine(theme, 'text.secondary', 'var(--text-secondary)')
          };
        case 'label':
          return {
            fz: 'sm',
            fw: 500,
            lh: 'snug'
          };
        case 'overline':
          return {
            fz: 'xs',
            fw: 500,
            lh: 'none',
            ls: 'wider',
            tt: 'uppercase',
            c: getColorFromMantine(theme, 'text.secondary', 'var(--text-secondary)')
          };
        case 'code':
          return {
            fz: 'sm',
            fw: 400,
            lh: 'normal',
            mono: true,
            c: getColorFromMantine(theme, 'text.secondary', 'var(--text-secondary)'),
            fs: 'normal'
          };
        default:
          return {};
      }
    };
    
    // Get semantic color based on role and intent
    const getSemanticColor = (): string => {
      // Intent takes precedence over role if both are provided
      if (intent !== 'default') {
        tokenTracking.trackToken(`color-intent-${intent}`);
        return getColorFromMantine(theme, `intent.${intent}`, undefined);
      }
      
      switch (role) {
        case 'primary':
          tokenTracking.trackToken('color-primary-600');
          return getColorFromMantine(theme, 'primary.600', 'var(--color-primary-600)');
        case 'secondary':
          tokenTracking.trackToken('color-secondary-600');
          return getColorFromMantine(theme, 'secondary.600', 'var(--color-secondary-600)');
        case 'success':
          tokenTracking.trackToken('color-success-base');
          return getColorFromMantine(theme, 'success.base', 'var(--color-success-base)');
        case 'warning':
          tokenTracking.trackToken('color-warning-base');
          return getColorFromMantine(theme, 'warning.base', 'var(--color-warning-base)');
        case 'error':
          tokenTracking.trackToken('color-error-base');
          return getColorFromMantine(theme, 'error.base', 'var(--color-error-base)');
        case 'info':
          tokenTracking.trackToken('color-info-base');
          return getColorFromMantine(theme, 'info.base', 'var(--color-info-base)');
        case 'disabled':
          tokenTracking.trackToken('text-disabled');
          return getColorFromMantine(theme, 'text.disabled', 'var(--text-disabled)');
        default:
          tokenTracking.trackToken('text-primary');
          return getColorFromMantine(theme, 'text.primary', 'var(--text-primary)');
      }
    };
    
    // Get font family based on heading/mono props
    const getFontFamily = (): string | undefined => {
      if (mono) {
        tokenTracking.trackToken('font-mono');
        return typography.fonts.mono;
      }
      
      if (heading || ['display1', 'display2', 'display3', 'heading1', 'heading2', 'heading3', 'heading4'].includes(preset || '')) {
        tokenTracking.trackToken('font-heading');
        return typography.fonts.heading;
      }
      
      return undefined; // Use default (will be the base font)
    };
    
    // Get line height
    const getLineHeight = (): number | string | undefined => {
      if (lh === undefined && preset) {
        const presetStyles = getPresetStyles();
        if (presetStyles.lh) {
          tokenTracking.trackToken(`line-height-${presetStyles.lh}`);
          return typography.lineHeights[presetStyles.lh as keyof typeof typography.lineHeights];
        }
        return undefined;
      }
      
      if (lh) {
        tokenTracking.trackToken(`line-height-${lh}`);
        return typeof lh === 'string' ? typography.lineHeights[lh as keyof typeof typography.lineHeights] || lh : lh;
      }
      
      return undefined;
    };
    
    // Get letter spacing
    const getLetterSpacing = (): string | undefined => {
      if (ls === undefined && preset) {
        const presetStyles = getPresetStyles();
        if (presetStyles.ls) {
          tokenTracking.trackToken(`letter-spacing-${presetStyles.ls}`);
          return typography.letterSpacings[presetStyles.ls as keyof typeof typography.letterSpacings];
        }
        return undefined;
      }
      
      if (ls) {
        tokenTracking.trackToken(`letter-spacing-${ls}`);
        return typography.letterSpacings[ls as keyof typeof typography.letterSpacings] || ls;
      }
      
      return undefined;
    };
    
    // Calculate optimal delay based on network conditions
    const networkDelay = useNetworkAware({
      highQuality: animationDelay / 1000,
      mediumQuality: (animationDelay * 0.8) / 1000,
      lowQuality: (animationDelay * 0.5) / 1000,
      poorQuality: (animationDelay * 0.3) / 1000,
      dataSaverMode: 0 // No delay in data saver mode
    });
    
    // Apply animation if enabled
    useComponentAnimation({
      ref: textRef,
      enabled: animated,
      mode: animationType,
      isActive: true, // For initial animation
      networkAware,
      durationMultiplier: networkAware ? networkAnimationSpeed : animationSpeed,
      properties: {
        delay: networkAware ? networkDelay : animationDelay / 1000,
        y: animationType === 'slide' ? 5 : undefined,
        opacity: animationType === 'fade' || animationType === 'slide' ? 0 : undefined,
      }
    });
    
    // If in data saver mode, simplify typography for better performance
    const shouldSimplify = networkAware && (
      isDataSaver || 
      networkQuality === 'poor' || 
      (saSensitive && (saMarket.isRural || saMarket.shouldReduceDataUsage))
    );
    
    // Merge preset styles with explicit props
    const presetStyles = getPresetStyles();
    
    // Get semantic color from role or intent
    if (!c && (role !== 'default' || intent !== 'default')) {
      c = getSemanticColor();
    }
    
    // Optimize font size display for network conditions
    let optimizedFz = fz || presetStyles.fz;
    if (shouldSimplify && typeof optimizedFz === 'string') {
      // Apply South African market specific optimizations for display text
      if (saSensitive && saMarket.isRural && ['5xl', '6xl', '4xl', '3xl'].includes(optimizedFz)) {
        // Use more aggressive optimization for rural South African connections
        optimizedFz = {
          '6xl': '3xl', // More aggressive reduction for rural areas
          '5xl': '2xl',
          '4xl': 'xl',
          '3xl': 'lg'
        }[optimizedFz] as Size;
        
        // Track usage of SA-specific optimization
        tokenTracking.trackToken('sa-rural-optimize-fontsize');
      } 
      // General network optimization for large text
      else if ((isDataSaver || networkQuality === 'poor') && ['5xl', '6xl', '4xl'].includes(optimizedFz)) {
        optimizedFz = {
          '6xl': '4xl',
          '5xl': '3xl',
          '4xl': '2xl'
        }[optimizedFz] as Size;
        
        // Track usage of network optimization
        tokenTracking.trackToken('network-optimize-fontsize');
      }
    }
    
    // Network-aware font family (simplify to system font on poor connections)
    const fontFamily = shouldSimplify ? undefined : getFontFamily();
    const lineHeight = getLineHeight();
    const letterSpacing = getLetterSpacing();
    
    // Additional styles
    const customStyles: React.CSSProperties = {
      fontFamily,
      letterSpacing,
      ...(style || {})
    };
    
    // Determine which props to pass down vs from preset
    const textWeight = fw || presetStyles.fw;
    const textAlign = ta || presetStyles.ta;
    const textTransform = props.tt || presetStyles.tt;
    const textDecoration = props.td || presetStyles.td;
    const fontStyle = props.fs || presetStyles.fs;
    
    // Compose class names
    const combinedClassName = [
      'flx-text',
      preset ? `flx-text-${preset}` : '',
      role !== 'default' ? `flx-text-role-${role}` : '',
      intent !== 'default' ? `flx-text-intent-${intent}` : '',
      shouldSimplify ? 'flx-text-network-optimized' : '',
      saSensitive && saMarket.isRural ? 'flx-text-sa-optimized' : '',
      className
    ].filter(Boolean).join(' ');
    
    // For rural South African market, wrap non-critical text with optimizer
    if (saSensitive && saMarket.isRural && preset && 
        ['display1', 'display2', 'display3'].includes(preset) && 
        priority !== 'critical') {
      return (
        <SouthAfricanMarketOptimizer
          component={`Text-${preset}`}
          priority={priority}
          networkAware={networkAware}
          animate={animated}
          animationDuration={animationDelay}
        >
          <MantineText 
            ref={combinedRef} 
            fw={textWeight as number} 
            ta={textAlign}
            fz={optimizedFz}
            c={c}
            lh={lineHeight}
            tt={textTransform}
            td={textDecoration}
            fs={fontStyle}
            className={combinedClassName}
            style={customStyles}
            data-network-optimized={shouldSimplify}
            data-sa-optimized={saMarket.isRural}
            {...props}
          >
            {children}
          </MantineText>
        </SouthAfricanMarketOptimizer>
      );
    }
    
    // For simple data-saver optimization with lightweight wrapper
    if (shouldSimplify && !['critical', 'high'].includes(priority) && 
        (preset === 'caption' || preset === 'body3' || preset === 'overline')) {
      return (
        <SAOptimizer priority={priority}>
          <MantineText 
            ref={combinedRef} 
            fw={textWeight as number} 
            ta={textAlign}
            fz={optimizedFz}
            c={c}
            lh={lineHeight}
            tt={textTransform}
            td={textDecoration}
            fs={fontStyle}
            className={combinedClassName}
            style={customStyles}
            data-network-optimized={shouldSimplify}
            {...props}
          >
            {children}
          </MantineText>
        </SAOptimizer>
      );
    }
    
    // Default rendering
    return (
      <MantineText 
        ref={combinedRef} 
        fw={textWeight as number} 
        ta={textAlign}
        fz={optimizedFz}
        c={c}
        lh={lineHeight}
        tt={textTransform}
        td={textDecoration}
        fs={fontStyle}
        className={combinedClassName}
        style={customStyles}
        data-network-optimized={shouldSimplify}
        {...props}
      >
        {children}
      </MantineText>
    );
  }
);

Text.displayName = 'Text';