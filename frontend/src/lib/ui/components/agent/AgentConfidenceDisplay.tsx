'use client';

import React, { useState } from 'react';
import { Group } from '../Group';
import { Text } from '../Text';
import { Card } from '../Card';
import { AgentConfidenceDisplayProps } from './types';
import { useConnectionQuality } from '../../../motion/hooks';

/**
 * Confidence display component for agent responses
 * Shows the confidence level of an agent's response with visual indicators
 */
export function AgentConfidenceDisplay({
  level = 'high',
  showExplanation = false,
  explanation = '',
  visualizationType = 'icon',
  className = '',
  ...props
}: AgentConfidenceDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const { quality } = useConnectionQuality();
  
  // For low-bandwidth connections, default to minimal visualization
  const effectiveVisualizationType = quality === 'low' ? 'minimal' : visualizationType;
  
  // Get color based on confidence level
  const getConfidenceColor = () => {
    switch (level) {
      case 'high': return 'var(--color-success-500)';
      case 'medium': return 'var(--color-warning-500)';
      case 'low': return 'var(--color-error-500)';
      default: return 'var(--color-neutral-400)';
    }
  };
  
  // Get label text based on confidence level
  const getConfidenceLabel = () => {
    switch (level) {
      case 'high': return 'High confidence';
      case 'medium': return 'Medium confidence';
      case 'low': return 'Low confidence';
      default: return 'Unknown confidence';
    }
  };
  
  // Get percentage value based on confidence level
  const getConfidencePercentage = () => {
    switch (level) {
      case 'high': return 90;
      case 'medium': return 60;
      case 'low': return 30;
      default: return 0;
    }
  };
  
  // Generate default explanation if none provided
  const getDefaultExplanation = () => {
    switch (level) {
      case 'high':
        return 'The agent has high confidence in this response based on clear evidence and reliable information.';
      case 'medium':
        return 'The agent has moderate confidence in this response. Some aspects may be well-supported while others might be less certain.';
      case 'low':
        return 'The agent has low confidence in this response. The information may be incomplete, contradictory, or based on limited evidence.';
      default:
        return 'The confidence level for this response cannot be determined.';
    }
  };
  
  // Get explanation text
  const explanationText = explanation || getDefaultExplanation();
  
  // Render icon-based indicator
  const renderIconIndicator = () => (
    <div 
      className="confidence-icon-indicator"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      <div 
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: getConfidenceColor()
        }}
      />
      <Text size="sm" c="var(--text-secondary)">
        {getConfidenceLabel()}
      </Text>
    </div>
  );
  
  // Render bar-based indicator
  const renderBarIndicator = () => (
    <div 
      className="confidence-bar-indicator"
      style={{
        width: '100%',
        maxWidth: '140px'
      }}
    >
      <Text size="sm" c="var(--text-secondary)" mb="2px">
        {getConfidenceLabel()}
      </Text>
      <div 
        style={{
          width: '100%',
          height: '6px',
          backgroundColor: 'var(--color-neutral-100)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}
      >
        <div 
          style={{
            width: `${getConfidencePercentage()}%`,
            height: '100%',
            backgroundColor: getConfidenceColor(),
            borderRadius: '3px'
          }}
        />
      </div>
    </div>
  );
  
  // Render radar chart (simplified for this example)
  const renderRadarIndicator = () => (
    <div 
      className="confidence-radar-indicator"
      style={{
        position: 'relative',
        width: '60px',
        height: '60px'
      }}
    >
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle 
          cx="30" 
          cy="30" 
          r="25" 
          fill="none" 
          stroke="var(--color-neutral-200)" 
          strokeWidth="1"
        />
        <circle 
          cx="30" 
          cy="30" 
          r="15" 
          fill="none" 
          stroke="var(--color-neutral-200)" 
          strokeWidth="1"
        />
        <circle 
          cx="30" 
          cy="30" 
          r="5" 
          fill="none" 
          stroke="var(--color-neutral-200)" 
          strokeWidth="1"
        />
        
        {/* Generate radar points */}
        <path 
          d={`M30,30 L50,30 A20,20 0 0,1 45,45 Z`} 
          fill={getConfidenceColor()} 
          fillOpacity="0.3" 
          stroke={getConfidenceColor()} 
          strokeWidth="1.5"
        />
        <path 
          d={`M30,30 L45,45 A20,20 0 0,1 30,50 Z`} 
          fill={getConfidenceColor()} 
          fillOpacity="0.3" 
          stroke={getConfidenceColor()} 
          strokeWidth="1.5"
        />
        <path 
          d={`M30,30 L30,50 A20,20 0 0,1 15,45 Z`} 
          fill={getConfidenceColor()} 
          fillOpacity="0.3" 
          stroke={getConfidenceColor()} 
          strokeWidth="1.5"
        />
        <path 
          d={`M30,30 L15,45 A20,20 0 0,1 10,30 Z`} 
          fill={getConfidenceColor()} 
          fillOpacity="0.3" 
          stroke={getConfidenceColor()} 
          strokeWidth="1.5"
        />
        <path 
          d={`M30,30 L10,30 A20,20 0 0,1 15,15 Z`} 
          fill={getConfidenceColor()} 
          fillOpacity="0.3" 
          stroke={getConfidenceColor()} 
          strokeWidth="1.5"
        />
        <path 
          d={`M30,30 L15,15 A20,20 0 0,1 30,10 Z`} 
          fill={getConfidenceColor()} 
          fillOpacity="0.3" 
          stroke={getConfidenceColor()} 
          strokeWidth="1.5"
        />
        <path 
          d={`M30,30 L30,10 A20,20 0 0,1 45,15 Z`} 
          fill={getConfidenceColor()} 
          fillOpacity="0.3" 
          stroke={getConfidenceColor()} 
          strokeWidth="1.5"
        />
        <path 
          d={`M30,30 L45,15 A20,20 0 0,1 50,30 Z`} 
          fill={getConfidenceColor()} 
          fillOpacity="0.3" 
          stroke={getConfidenceColor()} 
          strokeWidth="1.5"
        />
      </svg>
      
      <Text 
        size="xs" 
        ta="center" 
        fw={500}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: getConfidenceColor()
        }}
      >
        {getConfidencePercentage()}%
      </Text>
    </div>
  );
  
  // Render the appropriate visualization based on type
  const renderVisualization = () => {
    switch (effectiveVisualizationType) {
      case 'bar': return renderBarIndicator();
      case 'radar': return renderRadarIndicator();
      case 'minimal': return renderIconIndicator();
      case 'icon':
      default: return renderIconIndicator();
    }
  };
  
  return (
    <div 
      className={`agent-confidence-display confidence-${level} ${className}`}
      {...props}
    >
      <Group gap="sm" align="center">
        {renderVisualization()}
        
        {showExplanation && (
          <div 
            className="confidence-explanation-toggle"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            onClick={() => setExpanded(prev => !prev)}
          >
            <Text size="xs" c="var(--text-secondary)">
              {expanded ? 'Hide details' : 'Show details'}
            </Text>
            <span 
              style={{ 
                fontSize: '8px', 
                marginLeft: '4px',
                color: 'var(--text-secondary)'
              }}
            >
              {expanded ? '▲' : '▼'}
            </span>
          </div>
        )}
      </Group>
      
      {showExplanation && expanded && (
        <Card
          mt="xs"
          p="xs"
          radius="sm"
          style={{
            backgroundColor: `${getConfidenceColor()}10`,
            border: `1px solid ${getConfidenceColor()}30`
          }}
        >
          <Text size="sm" c="var(--text-secondary)">
            {explanationText}
          </Text>
        </Card>
      )}
    </div>
  );
}