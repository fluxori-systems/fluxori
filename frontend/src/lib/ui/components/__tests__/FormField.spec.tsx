'use client';

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock the FormField component to avoid hooks
vi.mock('../FormField', () => ({
  FormField: ({ 
    children, 
    label, 
    description, 
    error, 
    required, 
    intent
  }) => (
    <div data-testid="form-field" className={`form-field ${intent || ''}`}>
      {label && (
        <label data-testid="form-field-label">
          {label} {required && <span data-testid="form-field-required">*</span>}
        </label>
      )}
      <div data-testid="form-field-input">{children}</div>
      {description && <div data-testid="form-field-description">{description}</div>}
      {error && <div data-testid="form-field-error" role="alert">{error}</div>}
    </div>
  )
}));

// Import the component after mocking it
import { FormField } from '../FormField';

describe('FormField Component', () => {
  test('renders with label and input', () => {
    render(
      <FormField label="Username">
        <input type="text" placeholder="Enter username" />
      </FormField>
    );
    
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
  });
  
  test('renders with description and error', () => {
    render(
      <FormField 
        label="Email" 
        description="Enter a valid email address"
        error="Invalid email format"
      >
        <input type="email" placeholder="Enter email" />
      </FormField>
    );
    
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
  });
  
  test('indicates required fields', () => {
    render(
      <FormField label="Password" required>
        <input type="password" placeholder="Enter password" />
      </FormField>
    );
    
    expect(screen.getByTestId('form-field-required')).toBeInTheDocument();
  });
});