'use client';

import React from 'react';
import { useMotion } from '../../../motion/context/MotionContext';
import { AgentSuggestion } from './types';
import { useConnectionQuality } from '../../../motion/hooks';

export interface AgentSuggestionChipProps {
  suggestion: AgentSuggestion;
  onClick: () => void;
  disabled?: boolean;
  networkAware?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Agent suggestion chip component
 * Displays clickable suggestion options for quick responses
 */
export function AgentSuggestionChip({
  suggestion,
  onClick,
  disabled = false,
  networkAware = true,
  className = '',
  style,
  ...props
}: AgentSuggestionChipProps) {
  const { motionMode } = useMotion();
  const { quality } = useConnectionQuality();
  
  // Adapt to network conditions when networkAware is true
  const useSimpleDesign = networkAware && quality === 'low';
  const showIcon = suggestion.icon && !useSimpleDesign;
  const showDescription = suggestion.description && !useSimpleDesign;
  
  // Handle click
  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };
  
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`agent-suggestion-chip ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: useSimpleDesign ? '4px 8px' : '6px 12px',
        backgroundColor: 'var(--color-primary-50)',
        border: '1px solid var(--color-primary-200)',
        borderRadius: 'var(--radius-md)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: motionMode === 'full' ? 'all 0.2s ease' : 'none',
        color: 'var(--color-primary-700)',
        fontWeight: 500,
        fontSize: useSimpleDesign ? 'var(--font-size-sm)' : 'var(--font-size-md)',
        lineHeight: 1.2,
        opacity: disabled ? 0.6 : 1,
        outline: 'none',
        ...style
      }}
      {...props}
    >
      {showIcon && (
        <span className="agent-suggestion-icon">
          {suggestion.icon}
        </span>
      )}
      
      <span className="agent-suggestion-text">
        {suggestion.text}
      </span>
      
      {showDescription && (
        <span 
          className="agent-suggestion-description"
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-primary-500)',
            fontWeight: 'normal'
          }}
        >
          {suggestion.description}
        </span>
      )}
    </button>
  );
}