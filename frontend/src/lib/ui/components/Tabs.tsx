'use client';

import { Tabs as MantineTabs } from '@mantine/core';
import { forwardRef, ReactNode } from 'react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

export interface TabsProps {
  /** Tabs content */
  children?: ReactNode;
  
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
  
  /** Additional className */
  className?: string;
  
  /** Tab content placement */
  placement?: 'right' | 'left';
  
  /** Other props */
  [key: string]: any;
}

export interface TabProps {
  /** Tab content */
  children?: ReactNode;
  
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
  
  /** Additional className */
  className?: string;
  
  /** Other props */
  [key: string]: any;
}

// Full type definition for the composite Tabs component
export interface TabsComponent extends ForwardRefExoticComponent<TabsProps & RefAttributes<HTMLDivElement>> {
  Tab: ForwardRefExoticComponent<TabProps & RefAttributes<HTMLButtonElement>>;
  List: typeof MantineTabs.List;
  Panel: typeof MantineTabs.Panel;
}

// Main Tabs component
const TabsBase = forwardRef<HTMLDivElement, TabsProps>(({ children, ...props }, ref) => {
  return <MantineTabs {...props}>{children}</MantineTabs>;
});

// Tab subcomponent with proper typing
const Tab = forwardRef<HTMLButtonElement, TabProps>(({ children, value, icon, rightIcon, leftSection: leftSectionProp, rightSection: rightSectionProp, ...props }, ref) => {
  // Map legacy icon props to Mantine v7 section props
  const leftSection = icon !== undefined ? icon : leftSectionProp;
  const rightSection = rightIcon !== undefined ? rightIcon : rightSectionProp;
  
  return (
    <MantineTabs.Tab
      ref={ref}
      value={value}
      leftSection={leftSection}
      rightSection={rightSection}
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