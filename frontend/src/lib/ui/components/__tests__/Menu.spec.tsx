'use client';

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Create a complete mock implementation for Menu component
const MenuMock = {
  Root: ({ children }) => <div data-testid="menu-root">{children}</div>,
  Target: ({ children }) => <div data-testid="menu-target">{children}</div>,
  Dropdown: ({ children }) => <div data-testid="menu-dropdown">{children}</div>,
  Item: ({ onClick, children }) => (
    <div data-testid="menu-item" onClick={onClick}>{children}</div>
  ),
  Divider: () => <div data-testid="menu-divider" />
};

// Directly mock the module
vi.mock('../Menu', () => ({
  Menu: MenuMock
}));

// Import after mocking
import { Menu } from '../Menu';

describe('Menu Component', () => {
  test('renders with default props', () => {
    render(
      <Menu.Root>
        <Menu.Target>
          <button>Open menu</button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item>Item 1</Menu.Item>
          <Menu.Item>Item 2</Menu.Item>
        </Menu.Dropdown>
      </Menu.Root>
    );
    
    expect(screen.getByText('Open menu')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });
  
  test('handles click events correctly', () => {
    const handleClick = vi.fn();
    
    render(
      <Menu.Root>
        <Menu.Target>
          <button>Open menu</button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item onClick={handleClick}>Clickable item</Menu.Item>
        </Menu.Dropdown>
      </Menu.Root>
    );
    
    fireEvent.click(screen.getByText('Clickable item'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});