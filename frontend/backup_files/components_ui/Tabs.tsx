import { Tabs as MantineTabs, TabsProps as MantineTabsProps, TabsTabProps } from '@mantine/core';
import { forwardRef, ReactNode } from 'react';

export interface TabsProps extends Omit<MantineTabsProps, 'children'> {
  children?: ReactNode;
}

export interface TabProps extends Omit<TabsTabProps, 'leftSection'> {
  icon?: ReactNode;
  leftSection?: ReactNode;
  children?: ReactNode;
}

// Main Tabs component
const TabsComponent = forwardRef<HTMLDivElement, TabsProps>((props, ref) => {
  return <MantineTabs {...props} ref={ref} />;
});

// Tab subcomponent
const Tab = forwardRef<HTMLButtonElement, TabProps>(
  ({ icon, ...props }, ref) => {
    return (
      <MantineTabs.Tab
        ref={ref}
        {...props}
        leftSection={icon || props.leftSection}
      />
    );
  }
);

// List subcomponent
const List = MantineTabs.List;

// Panel subcomponent
const Panel = MantineTabs.Panel;

// Create composite component
export const Tabs = Object.assign(TabsComponent, {
  Tab,
  List,
  Panel
});

TabsComponent.displayName = 'Tabs';
Tab.displayName = 'Tabs.Tab';