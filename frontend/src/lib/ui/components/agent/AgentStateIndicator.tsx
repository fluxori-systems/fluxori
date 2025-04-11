'use client';

import React from 'react';
import { Text } from '../Text';
import { Group } from '../Group';
import { AIProcessingIndicator } from '../../../motion/components/AIProcessingIndicator';
import { useMotion } from '../../../motion/context/MotionContext';

export interface AgentStateIndicatorProps {
  /** Current agent state */
  state: 'idle' | 'thinking' | 'processing' | 'streaming' | 'complete' | 'error';
  
  /** Show text label alongside indicator */
  showLabel?: boolean;
  
  /** Custom label text for states */
  labels?: {
    idle?: string;
    thinking?: string;
    processing?: string;
    streaming?: string;
    complete?: string;
    error?: string;
  };
  
  /** Size of the indicator */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  
  /** Custom color */
  color?: string;
  
  /** Custom class name */
  className?: string;
  
  /** Custom style */
  style?: React.CSSProperties;
  
  /** Other props */
  [key: string]: any;
}

/**
 * Agent state indicator component
 * Visualizes different states of the agent with animations
 */
export function AgentStateIndicator({
  state = 'idle',
  showLabel = true,
  labels = {
    idle: 'Ready',
    thinking: 'Thinking...',
    processing: 'Processing...',
    streaming: 'Responding...',
    complete: 'Complete',
    error: 'Error'
  },
  size = 'md',
  color,
  className = '',
  style,
  ...props
}: AgentStateIndicatorProps) {
  const { motionMode } = useMotion();
  
  // Map size to pixel values
  const sizeMap = {
    xs: 16,
    sm: 24,
    md: 32,
    lg: 48
  };
  
  // Get indicator state for AIProcessingIndicator
  const getIndicatorState = () => {
    switch (state) {
      case 'thinking': return 'thinking';
      case 'processing': return 'processing';
      case 'streaming': return 'processing';
      default: return 'idle';
    }
  };
  
  // Get color based on state
  const getStateColor = () => {
    if (color) return color;
    
    switch (state) {
      case 'idle': return 'var(--color-neutral-400)';
      case 'thinking': return 'var(--color-primary-500)';
      case 'processing': return 'var(--color-primary-600)';
      case 'streaming': return 'var(--color-success-500)';
      case 'complete': return 'var(--color-success-600)';
      case 'error': return 'var(--color-error-500)';
      default: return 'var(--color-neutral-500)';
    }
  };
  
  // Get label text
  const getLabelText = () => {
    return labels[state] || state;
  };
  
  // For idle and complete states, just show a static indicator
  const renderStaticIndicator = () => (
    <div
      style={{
        width: sizeMap[size],
        height: sizeMap[size],
        borderRadius: '50%',
        backgroundColor: getStateColor(),
        opacity: state === 'idle' ? 0.5 : 1
      }}
    />
  );
  
  return (
    <Group 
      gap="xs" 
      align="center"
      className={`agent-state-indicator agent-state-indicator-${state} ${className}`}
      style={style}
      {...props}
    >
      {state === 'idle' || state === 'complete' ? (
        renderStaticIndicator()
      ) : (
        <AIProcessingIndicator
          state={getIndicatorState()}
          size={sizeMap[size]}
          color={getStateColor()}
        />
      )}
      
      {showLabel && (
        <Text 
          size={size === 'lg' ? 'md' : size === 'xs' ? 'xs' : 'sm'}
          fw={500}
          c={getStateColor()}
        >
          {getLabelText()}
        </Text>
      )}
    </Group>
  );
}