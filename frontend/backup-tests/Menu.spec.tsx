import '@testing-library/jest-dom';
'use client';

import React from 'react';
import { vi, describe, it, expect } from 'vitest';
import { renderWithProviders, screen, fireEvent, within } from '../../../../testing/utils/render';
import { Menu } from '../Menu';

describe('Menu Component', () => {
  it('should render correctly with default props', () => {
    renderWithProviders(
      <Menu>
        <Menu.Target>
          <button>Open Menu</button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item>Item 1</Menu.Item>
          <Menu.Item>Item 2</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
    
    expect(screen.getByText('Open Menu')).toBeInTheDocument();
    
    // Menu items should not be visible until clicked
    expect(screen.queryByText('Item 1')).toBeNull();
    expect(screen.queryByText('Item 2')).toBeNull();
  });
  
  it('should open and close when target is clicked', () => {
    renderWithProviders(
      <Menu>
        <Menu.Target>
          <button data-testid="menu-target">Open Menu</button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item>Item 1</Menu.Item>
          <Menu.Item>Item 2</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
    
    // Initially closed
    expect(screen.queryByText('Item 1')).toBeNull();
    
    // Click to open
    fireEvent.click(screen.getByTestId('menu-target'));
    
    // Should be open now
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    
    // Click again to close
    fireEvent.click(screen.getByTestId('menu-target'));
    
    // Should be closed again
    expect(screen.queryByText('Item 1')).toBeNull();
    expect(screen.queryByText('Item 2')).toBeNull();
  });
  
  it('should render items with left and right sections', () => {
    renderWithProviders(
      <Menu opened>
        <Menu.Target>
          <button>Open Menu</button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<span>🔍</span>} rightSection={<span>⌘F</span>}>
            Search
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
    
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('🔍')).toBeInTheDocument();
    expect(screen.getByText('⌘F')).toBeInTheDocument();
  });
  
  it('should handle legacy icon props correctly', () => {
    renderWithProviders(
      <Menu opened>
        <Menu.Target>
          <button>Open Menu</button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item 
            icon={<span>📂</span>} 
            rightIcon={<span>→</span>}
          >
            Open File
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
    
    expect(screen.getByText('Open File')).toBeInTheDocument();
    expect(screen.getByText('📂')).toBeInTheDocument();
    expect(screen.getByText('→')).toBeInTheDocument();
  });
  
  it('should apply intent colors correctly', () => {
    renderWithProviders(
      <Menu opened intent="primary">
        <Menu.Target>
          <button>Open Menu</button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item intent="success">Success</Menu.Item>
          <Menu.Item intent="error">Error</Menu.Item>
          <Menu.Item intent="warning">Warning</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
    
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
  });
});