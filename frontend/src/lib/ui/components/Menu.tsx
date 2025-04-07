import { Menu as MantineMenu, MenuProps as MantineMenuProps, MenuItemProps, MenuTargetProps, MenuDropdownProps, MenuDividerProps, MenuLabelProps } from '@mantine/core';
import { forwardRef, ReactNode } from 'react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

// Properly typed Menu Item props
export interface ExtendedMenuItemProps extends Omit<MenuItemProps, 'leftSection'> {
  children?: ReactNode;
  icon?: ReactNode;
  leftSection?: ReactNode;
  color?: string;
}

// Menu main component props
export interface MenuProps extends MantineMenuProps {
  children?: ReactNode;
}

// Full type definition for the composite Menu component
export interface MenuComponent extends ForwardRefExoticComponent<MenuProps> {
  Item: ForwardRefExoticComponent<ExtendedMenuItemProps & RefAttributes<HTMLButtonElement>>;
  Target: typeof MantineMenu.Target;
  Dropdown: typeof MantineMenu.Dropdown;
  Divider: typeof MantineMenu.Divider;
  Label: typeof MantineMenu.Label;
}

// Main Menu component
const MenuComponent = forwardRef<HTMLDivElement, MenuProps>((props, ref) => {
  return <MantineMenu {...props} />;
});

// Item subcomponent with proper typing
const Item = forwardRef<HTMLButtonElement, ExtendedMenuItemProps>(
  ({ children, icon, color, ...props }, ref) => {
    return (
      <MantineMenu.Item
        ref={ref}
        {...props}
        leftSection={icon || props.leftSection}
        c={color || props.c}
      >
        {children}
      </MantineMenu.Item>
    );
  }
);

// Create composite component with proper type casting
export const Menu = Object.assign(MenuComponent, {
  Item,
  Target: MantineMenu.Target,
  Dropdown: MantineMenu.Dropdown,
  Divider: MantineMenu.Divider,
  Label: MantineMenu.Label
}) as MenuComponent;

MenuComponent.displayName = 'Menu';
Item.displayName = 'Menu.Item';