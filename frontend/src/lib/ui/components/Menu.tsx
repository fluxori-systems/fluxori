'use client';

import React, { forwardRef, ReactNode, useRef, useState, useCallback } from 'react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

import { Menu as MantineMenu } from '@mantine/core';
import { BaseComponentProps, AnimatableComponentProps, Intent } from '../types';
import { getToken } from '../../design-system/utils/tokens';
import { getColorFromMantine } from '../../design-system/utils/mantine-theme-adapter';
import { useTokenTracking } from '../../design-system/utils/token-analysis';
import { useMantineTheme } from '@mantine/core';

// Import from shared module to avoid circular dependencies
import { useCombinedRefs } from '../../shared/utils/ref-utils';
import { useComponentAnimation, useHoverAnimation } from '../hooks/useComponentAnimation';
import { useNetworkAware } from '../hooks/useConnection';

// Menu main component props
export interface MenuProps extends BaseComponentProps, AnimatableComponentProps {
  /** Whether the menu is opened */
  opened?: boolean;
  
  /** Called when opened state changes */
  onChange?: (opened: boolean) => void;
  
  /** Close the menu when an item is clicked */
  closeOnItemClick?: boolean;
  
  /** Control menu opening delay in ms */
  openDelay?: number;
  
  /** Control menu closing delay in ms */
  closeDelay?: number;
  
  /** Intent/theme of the menu */
  intent?: Intent;
  
  /** Enable network-aware optimizations */
  networkAware?: boolean;
}

// Menu Item props
export interface MenuItemProps extends BaseComponentProps {
  /** Left section content */
  leftSection?: ReactNode;
  
  /** Legacy icon prop (mapped to leftSection) */
  icon?: ReactNode;
  
  /** Right section content */
  rightSection?: ReactNode;
  
  /** Legacy rightIcon prop (mapped to rightSection) */
  rightIcon?: ReactNode;
  
  /** Text color */
  c?: string;
  
  /** Legacy color prop (mapped to c) */
  color?: string;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Called when item is clicked */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  
  /** Component to render as */
  component?: React.ElementType;
  
  /** Intent/theme of the item */
  intent?: Intent;
  
  /** Enable network-aware optimizations */
  networkAware?: boolean;
}

// Full type definition for the composite Menu component
export interface MenuComponent extends ForwardRefExoticComponent<MenuProps & RefAttributes<HTMLDivElement>> {
  Item: ForwardRefExoticComponent<MenuItemProps & RefAttributes<HTMLButtonElement>>;
  Target: typeof MantineMenu.Target;
  Dropdown: typeof MantineMenu.Dropdown;
  Divider: typeof MantineMenu.Divider;
  Label: typeof MantineMenu.Label;
}

// Main Menu component
const MenuBase = forwardRef<HTMLDivElement, MenuProps>(({ 
  animated: isAnimated = true, 
  animationType: animType = 'fade', 
  animationDelay: delay = 0, 
  animationSpeed: speed = 1.0,
  intent: menuIntent = 'default',
  networkAware: isNetworkAware = true,
  ...props 
}, ref) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(props.opened || false);
  const tokenTracking = useTokenTracking('Menu');
  const theme = useMantineTheme();

  // Get network-aware animation speed
  const networkAnimationSpeed = useNetworkAware({
    highQuality: speed,
    mediumQuality: speed * 0.9,
    lowQuality: speed * 0.7,
    poorQuality: speed * 0.5,
    dataSaverMode: speed * 0.3
  });

  // Track token usage
  if (menuIntent !== 'default') {
    tokenTracking.trackToken(`intent-${menuIntent}`);
  }

  // Handle open state changes - memoized to avoid recreating function
  const handleOpenChange = useCallback((opened: boolean) => {
    setIsOpen(opened);
    props.onChange?.(opened);
  }, [props.onChange]);

  // Apply animation using the shared animation service
  useComponentAnimation({
    ref: menuRef,
    enabled: isAnimated,
    mode: 'hover',
    isActive: isOpen,
    networkAware: isNetworkAware,
    durationMultiplier: isNetworkAware ? networkAnimationSpeed : speed,
    properties: {
      delay: delay / 1000, // Convert ms to seconds for GSAP
    }
  });

  // Create a clean props object without custom props
  // Filter any props we don't want to pass to Mantine Menu
  const filteredProps = { ...props };
  
  // Remove custom props to avoid conflicts  
  delete filteredProps.animated;  
  delete filteredProps.animationType;
  delete filteredProps.animationDelay;
  delete filteredProps.animationSpeed;
  delete filteredProps.intent;
  delete filteredProps.networkAware;
  
  // Mantine Menu's ref handling is a bit special
  // We'll use a wrapper div to attach our own ref
  return (
    <div ref={useCombinedRefs(ref, menuRef)} style={{ display: 'contents' }}>
      <MantineMenu
        {...filteredProps}
        opened={props.opened !== undefined ? props.opened : isOpen}
        onChange={handleOpenChange}
      />
    </div>
  );
});

// Item subcomponent with proper typing
const Item = forwardRef<HTMLButtonElement, MenuItemProps>(({ 
  children, 
  icon, 
  rightIcon, 
  leftSection: leftSectionProp, 
  rightSection: rightSectionProp, 
  color, 
  c: cProp, 
  intent = 'default',
  networkAware = true,
  ...props 
}, ref) => {
  const itemRef = useRef<HTMLButtonElement>(null);
  const tokenTracking = useTokenTracking('Menu.Item');
  const theme = useMantineTheme();

  // Map legacy props to Mantine v7 props
  const leftSection = icon !== undefined ? icon : leftSectionProp;
  const rightSection = rightIcon !== undefined ? rightIcon : rightSectionProp;
  
  // Determine color based on intent if no specific color is provided
  let textColor = color !== undefined ? color : cProp;
  if (!textColor && intent !== 'default') {
    textColor = getColorFromMantine(theme, `intent.${intent}`, undefined);
    tokenTracking.trackToken(`color-intent-${intent}`);
  }

  // Use the hover animation hook with dependency inversion
  const [handleMouseEnter, handleMouseLeave] = useHoverAnimation(itemRef, {
    enabled: true,
    networkAware,
    properties: {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
    }
  });
  
  return (
    <MantineMenu.Item
      ref={useCombinedRefs(ref, itemRef)}
      leftSection={leftSection}
      rightSection={rightSection}
      c={textColor}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </MantineMenu.Item>
  );
});

// Create composite component with proper type casting
export const Menu = Object.assign(MenuBase, {
  Item,
  Target: MantineMenu.Target,
  Dropdown: MantineMenu.Dropdown,
  Divider: MantineMenu.Divider,
  Label: MantineMenu.Label
}) as MenuComponent;

MenuBase.displayName = 'Menu';
Item.displayName = 'Menu.Item';