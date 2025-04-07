import { Tabs as MantineTabs, TabsProps as MantineTabsProps, TabsTabProps, TabsListProps, TabsPanelProps } from '@mantine/core';
import { forwardRef, ReactNode } from 'react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

export interface TabsProps extends MantineTabsProps {
  children?: ReactNode;
}

export interface TabProps extends Omit<TabsTabProps, 'leftSection'> {
  children?: ReactNode;
  icon?: ReactNode;
  leftSection?: ReactNode;
}

// Full type definition for the composite Tabs component
export interface TabsComponent extends ForwardRefExoticComponent<TabsProps & RefAttributes<HTMLDivElement>> {
  Tab: ForwardRefExoticComponent<TabProps & RefAttributes<HTMLButtonElement>>;
  List: typeof MantineTabs.List;
  Panel: typeof MantineTabs.Panel;
}

// Main Tabs component
const TabsComponent = forwardRef<HTMLDivElement, TabsProps>(({ children, ...props }, ref) => {
  return (
    <MantineTabs {...props} ref={ref}>
      {children}
    </MantineTabs>
  );
});

// Tab subcomponent with proper typing
const Tab = forwardRef<HTMLButtonElement, TabProps>(
  ({ children, icon, ...props }, ref) => {
    return (
      <MantineTabs.Tab
        ref={ref}
        {...props}
        leftSection={icon || props.leftSection}
      >
        {children}
      </MantineTabs.Tab>
    );
  }
);

// Create composite component with proper type casting
export const Tabs = Object.assign(TabsComponent, {
  Tab,
  List: MantineTabs.List,
  Panel: MantineTabs.Panel
}) as TabsComponent;

TabsComponent.displayName = 'Tabs';
Tab.displayName = 'Tabs.Tab';