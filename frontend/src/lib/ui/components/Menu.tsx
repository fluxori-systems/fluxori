'use client';

import { Menu as MantineMenu } from '@mantine/core';
import { forwardRef, ReactNode } from 'react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

// Menu main component props
export interface MenuProps {
  /** Menu content */
  children?: ReactNode;
  
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
  
  /** Additional className */
  className?: string;
  
  /** Other props */
  [key: string]: any;
}

// Menu Item props
export interface MenuItemProps {
  /** Item content */
  children?: ReactNode;
  
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
  
  /** Additional className */
  className?: string;
  
  /** Component to render as */
  component?: React.ElementType;
  
  /** Other props */
  [key: string]: any;
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
const MenuBase = forwardRef<HTMLDivElement, MenuProps>(({ ...props }, ref) => {
  return <MantineMenu {...props} />;
});

// Item subcomponent with proper typing
const Item = forwardRef<HTMLButtonElement, MenuItemProps>(({ children, icon, rightIcon, leftSection: leftSectionProp, rightSection: rightSectionProp, color, c: cProp, ...props }, ref) => {
  // Map legacy props to Mantine v7 props
  const leftSection = icon !== undefined ? icon : leftSectionProp;
  const rightSection = rightIcon !== undefined ? rightIcon : rightSectionProp;
  const c = color !== undefined ? color : cProp;
  
  return (
    <MantineMenu.Item
      ref={ref}
      leftSection={leftSection}
      rightSection={rightSection}
      c={c}
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