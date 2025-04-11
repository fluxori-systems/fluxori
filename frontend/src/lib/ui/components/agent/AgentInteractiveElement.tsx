'use client';

import React, { useState } from 'react';
import { Button } from '../Button';
import { Group } from '../Group';
import { Text } from '../Text';
import { Card } from '../Card';
import { AgentInteractiveElementProps } from './types';
import { useConnectionQuality } from '../../../motion/hooks';
import { useAgentConversation } from './AgentConversation';

/**
 * Interactive element component for agent responses
 * Embeds interactive UI elements within agent messages
 */
export function AgentInteractiveElement({
  type = 'button',
  label,
  action,
  intent = 'primary',
  children,
  disabled = false,
  ...props
}: AgentInteractiveElementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { quality } = useConnectionQuality();
  const { sendMessage } = useAgentConversation();
  
  // Adapt to network conditions
  const useSimpleDesign = quality === 'low';
  const isActionString = typeof action === 'string';
  
  // Handle click action
  const handleAction = async () => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (isActionString) {
        // If the action is a string, send it as a message
        await sendMessage(action as string);
        setSuccess('Action completed');
      } else if (typeof action === 'function') {
        // If the action is a function, execute it
        await (action as Function)();
        setSuccess('Action completed');
      }
    } catch (err) {
      console.error('Error executing action:', err);
      setError('Failed to complete action');
    } finally {
      setIsLoading(false);
      
      // Clear success message after a delay
      if (success) {
        setTimeout(() => setSuccess(null), 3000);
      }
    }
  };
  
  // Render button element
  const renderButton = () => (
    <Button
      onClick={handleAction}
      loading={isLoading}
      disabled={disabled}
      intent={intent}
      size={useSimpleDesign ? 'sm' : 'md'}
      animated={!useSimpleDesign}
      {...props}
    >
      {label}
    </Button>
  );
  
  // Render link element
  const renderLink = () => (
    <button
      onClick={handleAction}
      disabled={disabled || isLoading}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        color: `var(--color-${intent}-500)`,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        textDecoration: 'underline',
        fontSize: 'var(--font-size-md)',
        opacity: disabled || isLoading ? 0.5 : 1
      }}
      {...props}
    >
      {isLoading ? 'Loading...' : label}
    </button>
  );
  
  // Render checkbox element
  const renderCheckbox = () => {
    const [checked, setChecked] = useState(false);
    
    return (
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1
        }}
        {...props}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => {
            setChecked(!checked);
            handleAction();
          }}
          disabled={disabled || isLoading}
          style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        />
        <span>{label}</span>
      </label>
    );
  };
  
  // Render radio element
  const renderRadio = () => {
    const [selected, setSelected] = useState(false);
    
    return (
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1
        }}
        {...props}
      >
        <input
          type="radio"
          checked={selected}
          onChange={() => {
            setSelected(!selected);
            handleAction();
          }}
          disabled={disabled || isLoading}
          style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        />
        <span>{label}</span>
      </label>
    );
  };
  
  // Render select element
  const renderSelect = () => {
    const options = children ? (Array.isArray(children) ? children : [children]) : [];
    
    return (
      <div>
        <label htmlFor="agent-select" style={{ display: 'block', marginBottom: '4px' }}>
          {label}
        </label>
        <select
          id="agent-select"
          onChange={handleAction}
          disabled={disabled || isLoading}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)',
            backgroundColor: 'var(--background-default)',
            width: '100%',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1
          }}
          {...props}
        >
          {options.map((option, index) => (
            <option key={index} value={option.props?.value}>
              {option.props?.children || option}
            </option>
          ))}
        </select>
      </div>
    );
  };
  
  // Render input element
  const renderInput = () => {
    const [value, setValue] = useState('');
    
    return (
      <div>
        <label htmlFor="agent-input" style={{ display: 'block', marginBottom: '4px' }}>
          {label}
        </label>
        <Group gap="xs">
          <input
            id="agent-input"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={disabled || isLoading}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--background-default)',
              flex: 1,
              opacity: disabled ? 0.5 : 1
            }}
            {...props}
          />
          <Button
            onClick={() => {
              if (isActionString) {
                sendMessage(`${action as string}: ${value}`);
              } else if (typeof action === 'function') {
                (action as Function)(value);
              }
            }}
            loading={isLoading}
            disabled={disabled || !value.trim()}
            size="sm"
            intent={intent}
          >
            Submit
          </Button>
        </Group>
      </div>
    );
  };
  
  // Render form element
  const renderForm = () => {
    return (
      <Card p="md" radius="md" withBorder>
        <Text fw={500} mb="sm">{label}</Text>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAction();
          }}
        >
          {children}
          <Group justify="flex-end" mt="md">
            <Button
              type="submit"
              loading={isLoading}
              disabled={disabled}
              intent={intent}
            >
              Submit
            </Button>
          </Group>
        </form>
      </Card>
    );
  };
  
  // Render the appropriate element based on type
  const renderElement = () => {
    switch (type) {
      case 'button': return renderButton();
      case 'link': return renderLink();
      case 'checkbox': return renderCheckbox();
      case 'radio': return renderRadio();
      case 'select': return renderSelect();
      case 'input': return renderInput();
      case 'form': return renderForm();
      default: return renderButton();
    }
  };
  
  return (
    <div className="agent-interactive-element">
      {renderElement()}
      
      {error && (
        <Text c="var(--color-error-500)" size="xs" mt="xs">
          {error}
        </Text>
      )}
      
      {success && (
        <Text c="var(--color-success-500)" size="xs" mt="xs">
          {success}
        </Text>
      )}
    </div>
  );
}