import { Menu as MantineMenu, MenuProps as MantineMenuProps, MenuItemProps } from '@mantine/core';
import { forwardRef, ReactNode } from 'react';

export interface ExtendedMenuItemProps extends Omit<MenuItemProps, 'leftSection'> {
  icon?: ReactNode;
  leftSection?: ReactNode;
  color?: string;
  children?: ReactNode;
}

export interface MenuProps extends Omit<MantineMenuProps, 'children'> {
  children?: ReactNode;
}

// Main Menu component
const MenuComponent = forwardRef<HTMLDivElement, MenuProps>((props, ref) => {
  return <MantineMenu {...props} ref={ref} />;
});

// Item subcomponent
const Item = forwardRef<HTMLButtonElement, ExtendedMenuItemProps>(
  ({ icon, color, ...props }, ref) => {
    return (
      <MantineMenu.Item
        ref={ref}
        {...props}
        leftSection={icon || props.leftSection}
        c={color || props.c}
      />
    );
  }
);

// Sub-components
const Target = MantineMenu.Target;
const Dropdown = MantineMenu.Dropdown;
const Divider = MantineMenu.Divider;
const Label = MantineMenu.Label;

// Create composite component
export const Menu = Object.assign(MenuComponent, {
  Item,
  Target,
  Dropdown,
  Divider,
  Label
});

MenuComponent.displayName = 'Menu';
Item.displayName = 'Menu.Item';