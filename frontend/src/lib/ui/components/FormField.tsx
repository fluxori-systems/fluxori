'use client';

import React, { forwardRef, useRef, useState } from 'react';
import { TextInput, Textarea, NumberInput, Select, MultiSelect, Checkbox } from '@mantine/core';
import { useCombinedRefs } from '../utils/use-combined-refs';
import {  useConnectionQuality  } from '../hooks/useConnection';
import { useComponentAnimation } from '../hooks/useComponentAnimation';
import { Text } from './Text';

/**
 * Form field types supported by the component
 */
export type FormFieldType = 
  'text' | 
  'textarea' | 
  'number' | 
  'select' | 
  'multiselect' | 
  'checkbox';

/**
 * Common form field props
 */
export interface FormFieldProps {
  /** Field type */
  type: FormFieldType;
  
  /** Field label */
  label?: string;
  
  /** Field description */
  description?: string;
  
  /** Error message */
  error?: string;
  
  /** Field value */
  value?: any;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Required field */
  required?: boolean;
  
  /** Disabled field */
  disabled?: boolean;
  
  /** Field name */
  name?: string;
  
  /** Field id */
  id?: string;
  
  /** OnChange handler */
  onChange?: (value: any) => void;
  
  /** Select options */
  options?: Array<{ value: string; label: string }>;
  
  /** Enable network-aware optimizations */
  networkAware?: boolean;
  
  /** Additional className */
  className?: string;
  
  /** Additional style */
  style?: React.CSSProperties;
  
  /** Whether to animate error state */
  animateError?: boolean;
  
  /** Other props specific to the field type */
  [key: string]: any;
}

/**
 * Enhanced form field component with network-aware optimizations
 * Adapts to network conditions to provide better user experience on slow networks
 */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ 
    type,
    label,
    description,
    error,
    value,
    placeholder,
    required,
    disabled,
    name,
    id,
    onChange,
    options = [],
    networkAware = true,
    className = '',
    style,
    animateError = true,
    ...props 
  }, forwardedRef) => {
    const fieldRef = useRef<HTMLInputElement | null>(null);
    const ref = useCombinedRefs(fieldRef, forwardedRef);
    const [isFocused, setIsFocused] = useState(false);
    const { quality, isDataSaver } = useConnectionQuality();
    
    // Standard props that apply to most form fields
    const fieldProps = {
      label,
      placeholder,
      required,
      disabled,
      name,
      id: id || name,
      value,
      onChange,
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false),
      ...props
    };
    
    // Use animation hook for error state
    const useErrorAnimation = Boolean(error) && animateError;
    useComponentAnimation({
      ref: fieldRef,
      enabled: useErrorAnimation,
      mode: 'shake',
      isActive: useErrorAnimation,
      networkAware
    });
    
    // Apply network-aware optimizations to fields
    const shouldSimplify = networkAware && (isDataSaver || quality === 'poor');
    
    // Render field based on type
    const renderField = () => {
      switch (type) {
        case 'text':
          return (
            <TextInput
              ref={ref as any}
              {...fieldProps as any}
              error={!!error}
            />
          );
          
        case 'textarea':
          return (
            <Textarea
              {...fieldProps as any}
              error={!!error}
              autosize={!shouldSimplify} // Disable autosize on poor connections
              minRows={shouldSimplify ? 2 : 3} // Use fewer rows on poor connections
            />
          );
          
        case 'number':
          return (
            <NumberInput
              ref={ref as any}
              {...fieldProps as any}
              error={!!error}
              // Simpler increment/decrement on poor connections
              stepHoldDelay={shouldSimplify ? 750 : 500}
              stepHoldInterval={shouldSimplify ? 150 : 100}
            />
          );
          
        case 'select':
          return (
            <Select
              {...fieldProps as any}
              data={options}
              error={!!error}
              searchable={!shouldSimplify} // Disable search on poor connections
              nothingFoundMessage={shouldSimplify ? null : props.nothingFoundMessage} // Hide message on poor connections
              maxDropdownHeight={shouldSimplify ? 200 : 300} // Reduce dropdown height on poor connections
              dropdownPosition={shouldSimplify ? "bottom" : props.dropdownPosition || "bottom"}
              withinPortal={shouldSimplify ? false : props.withinPortal !== undefined ? props.withinPortal : true}
            />
          );
          
        case 'multiselect':
          return (
            <MultiSelect
              {...fieldProps as any}
              data={options}
              error={!!error}
              searchable={!shouldSimplify} // Disable search on poor connections
              clearable={!shouldSimplify} // Disable clear button on poor connections
              nothingFoundMessage={shouldSimplify ? null : props.nothingFoundMessage} // Hide message on poor connections
              maxDropdownHeight={shouldSimplify ? 200 : 300} // Reduce dropdown height on poor connections
              dropdownPosition={shouldSimplify ? "bottom" : props.dropdownPosition || "bottom"}
              withinPortal={shouldSimplify ? false : props.withinPortal !== undefined ? props.withinPortal : true}
            />
          );
          
        case 'checkbox':
          return (
            <Checkbox
              {...fieldProps as any}
              error={!!error}
              label={(fieldProps as any).checkboxLabel || fieldProps.label}
            />
          );
          
        default:
          return (
            <TextInput
              ref={ref as any}
              {...fieldProps as any}
              error={!!error}
            />
          );
      }
    };
    
    return (
      <div 
        className={`form-field ${className} ${error ? 'has-error' : ''}`}
        style={style}
        data-network-optimized={shouldSimplify}
      >
        {renderField()}
        
        {/* Only show description when not in data saver mode */}
        {description && !isDataSaver && (
          <Text size="xs" color="dimmed" mt={5}>
            {description}
          </Text>
        )}
        
        {/* Always show error messages regardless of network conditions */}
        {error && (
          <Text size="xs" color="red" mt={5}>
            {error}
          </Text>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';