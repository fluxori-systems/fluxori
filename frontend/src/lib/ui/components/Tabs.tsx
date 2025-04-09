'use client';

import React, { forwardRef, ReactNode, useRef, useState, useEffect, useCallback } from 'react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

import { Tabs as MantineTabs } from '@mantine/core';
import { useCombinedRefs } from '../../shared/utils/ref-utils';
import { BaseComponentProps, AnimatableComponentProps, Intent } from '../types';
import { 
  useComponentAnimation, 
  useHoverAnimation 
} from '../hooks/useComponentAnimation';
import { useTokenTracking } from '../../design-system/utils/token-analysis';
import { useMantineTheme } from '@mantine/core';
import { useNetworkAware } from '../hooks/useConnection';
import { getColorFromMantine } from '../../design-system/utils/mantine-theme-adapter';

export interface TabsProps extends BaseComponentProps, AnimatableComponentProps {
  /** Active tab value */
  value?: string;
  
  /** Default value for uncontrolled component */
  defaultValue?: string;
  
  /** Called when value changes */
  onChange?: (value: string) => void;
  
  /** Tabs orientation */
  orientation?: 'horizontal' | 'vertical';
  
  /** Tab activation mode */
  activateTabWithKeyboard?: boolean;
  
  /** Loop focus when user navigates with keyboard */
  loop?: boolean;
  
  /** Tab content placement */
  placement?: 'right' | 'left';
  
  /** Intent/theme of the tabs */
  intent?: Intent;
  
  /** Enable network-aware optimizations */
  networkAware?: boolean;
}

export interface TabProps extends BaseComponentProps {
  /** Tab value, should be unique */
  value: string;
  
  /** Left section content */
  leftSection?: ReactNode;
  
  /** Legacy icon prop (mapped to leftSection) */
  icon?: ReactNode;
  
  /** Right section content */
  rightSection?: ReactNode;
  
  /** Legacy rightIcon prop (mapped to rightSection) */
  rightIcon?: ReactNode;
  
  /** Color */
  color?: string;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Intent/theme of the tab */
  intent?: Intent;
  
  /** Enable network-aware optimizations */
  networkAware?: boolean;
}

// Full type definition for the composite Tabs component
export interface TabsComponent extends ForwardRefExoticComponent<TabsProps & RefAttributes<HTMLDivElement>> {
  Tab: ForwardRefExoticComponent<TabProps & RefAttributes<HTMLButtonElement>>;
  List: typeof MantineTabs.List;
  Panel: typeof MantineTabs.Panel;
}

// Main Tabs component
const TabsBase = forwardRef<HTMLDivElement, TabsProps>(({ 
  children, 
  animated = true, 
  animationType = 'fade', 
  animationDelay = 0, 
  animationSpeed = 1.0,
  intent = 'default',
  networkAware = true,
  ...props 
}, ref) => {
  const tabsRef = useRef<HTMLDivElement>(null);
  const tokenTracking = useTokenTracking('Tabs');
  const theme = useMantineTheme();
  const [activeTab, setActiveTab] = useState<string | null>(props.value || props.defaultValue || null);
  
  // Get network-aware animation speed
  const networkAnimationSpeed = useNetworkAware({
    highQuality: animationSpeed,
    mediumQuality: animationSpeed * 0.9,
    lowQuality: animationSpeed * 0.7,
    poorQuality: animationSpeed * 0.5,
    dataSaverMode: 0 // Disable animations in data saver mode
  });
  
  // Track token usage
  if (intent !== 'default') {
    tokenTracking.trackToken(`intent-${intent}`);
  }
  
  // Update active tab when props change
  useEffect(() => {
    if (props.value !== undefined && props.value !== activeTab) {
      setActiveTab(props.value);
    }
  }, [props.value, activeTab]);

  // Handle tab changes
  const handleChange = useCallback((value: string | null) => {
    if (props.value === undefined && value !== null) {
      setActiveTab(value);
    }
    if (value !== null && props.onChange) {
      props.onChange(value);
    }
  }, [props.value, props.onChange]);

  // Apply container animation using the shared animation service
  useComponentAnimation({
    ref: tabsRef,
    enabled: animated,
    mode: 'hover',
    isActive: !!activeTab,
    durationMultiplier: networkAware ? networkAnimationSpeed : animationSpeed,
    networkAware,
    properties: {
      delay: animationDelay / 1000, // Convert ms to seconds for GSAP
    }
  });

  return (
    <MantineTabs
      ref={useCombinedRefs(ref, tabsRef)}
      value={props.value || activeTab || undefined}
      onChange={handleChange}
      {...props}
    >
      {children}
    </MantineTabs>
  );
});

// Tab subcomponent with proper typing
const Tab = forwardRef<HTMLButtonElement, TabProps>(({ 
  children, 
  value, 
  icon, 
  rightIcon, 
  leftSection: leftSectionProp, 
  rightSection: rightSectionProp,
  color: colorProp,
  intent = 'default',
  networkAware = true,
  ...props 
}, ref) => {
  const tabRef = useRef<HTMLButtonElement>(null);
  const tokenTracking = useTokenTracking('Tabs.Tab');
  const theme = useMantineTheme();
  const [isFocused, setIsFocused] = useState(false);
  
  // Get hover animation handlers from our hook
  const [handleMouseEnter, handleMouseLeave] = useHoverAnimation(tabRef, {
    enabled: true,
    networkAware,
    properties: {
      brightness: 1.05,
    }
  });
  
  // Map legacy icon props to Mantine v7 section props
  const leftSection = icon !== undefined ? icon : leftSectionProp;
  const rightSection = rightIcon !== undefined ? rightIcon : rightSectionProp;
  
  // Determine color based on intent if no specific color is provided
  let color = colorProp;
  if (!color && intent !== 'default') {
    color = getColorFromMantine(theme, `intent.${intent}`, undefined);
    tokenTracking.trackToken(`color-intent-${intent}`);
  }
  
  // Focus handlers
  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);
  
  return (
    <MantineTabs.Tab
      ref={useCombinedRefs(ref, tabRef)}
      value={value}
      leftSection={leftSection}
      rightSection={rightSection}
      color={color}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    >
      {children}
    </MantineTabs.Tab>
  );
});

// Create composite component with proper type casting
export const Tabs = Object.assign(TabsBase, {
  Tab,
  List: MantineTabs.List,
  Panel: MantineTabs.Panel
}) as TabsComponent;

TabsBase.displayName = 'Tabs';
Tab.displayName = 'Tabs.Tab';