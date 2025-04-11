'use client';

import React from 'react';
import { Card } from '../Card';
import { Text } from '../Text';
import { Group } from '../Group';
import { Stack } from '../Stack';
import { AgentStateIndicator } from './AgentStateIndicator';
import { AgentToolUsage as AgentToolUsageType } from './types';

export interface AgentToolUsageProps {
  /** Tool usage data */
  tool: AgentToolUsageType;
  
  /** Whether to show detailed information */
  detailed?: boolean;
  
  /** Whether to show elapsed time */
  showTime?: boolean;
  
  /** Whether the tool can be expanded for more details */
  expandable?: boolean;
  
  /** Custom component to render tool result */
  resultRenderer?: (result: any) => React.ReactNode;
  
  /** Custom class name */
  className?: string;
  
  /** Custom style */
  style?: React.CSSProperties;
  
  /** Other props */
  [key: string]: any;
}

/**
 * Component to display tool usage information for transparency
 */
export function AgentToolUsage({
  tool,
  detailed = false,
  showTime = true,
  expandable = false,
  resultRenderer,
  className = '',
  style,
  ...props
}: AgentToolUsageProps) {
  const [expanded, setExpanded] = React.useState(false);
  const hasResult = !!tool.result;
  
  // Format the timestamp
  const formattedTime = tool.timestamp 
    ? new Date(tool.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '';
  
  // Format duration to human-readable format
  const formattedDuration = tool.duration 
    ? tool.duration < 1000 
      ? `${tool.duration}ms` 
      : `${(tool.duration / 1000).toFixed(1)}s`
    : '';
  
  // Get status color
  const getStatusColor = () => {
    switch (tool.status) {
      case 'pending': return 'var(--color-neutral-400)';
      case 'running': return 'var(--color-primary-500)';
      case 'success': return 'var(--color-success-500)';
      case 'error': return 'var(--color-error-500)';
      default: return 'var(--color-neutral-500)';
    }
  };
  
  // Get status label
  const getStatusLabel = () => {
    switch (tool.status) {
      case 'pending': return 'Pending';
      case 'running': return 'Running';
      case 'success': return 'Complete';
      case 'error': return 'Failed';
      default: return 'Unknown';
    }
  };
  
  // Render tool icon based on name
  const renderToolIcon = () => {
    // Simplified function to render an appropriate icon based on tool name
    const iconMap: Record<string, React.ReactNode> = {
      search: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.5 15.5L19 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 11C5 14.3137 7.68629 17 11 17C12.6597 17 14.1621 16.3261 15.2483 15.237C16.3308 14.1517 17 12.654 17 11C17 7.68629 14.3137 5 11 5C7.68629 5 5 7.68629 5 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      calculate: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 8H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 16H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      analyze: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9L12 5L21 9L12 13L3 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 19L12 15L21 19L12 23L3 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 9V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 13V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 9V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      fetch: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 9L19 17C19 18.1046 18.1046 19 17 19L7 19C5.89543 19 5 18.1046 5 17L5 7C5 5.89543 5.89543 5 7 5L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13 11L19 5M19 5H15M19 5V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    };
    
    // Default icon if no match
    const defaultIcon = (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 12L15 15M12 12L9 9M12 12L9 15M12 12L15 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
    
    return iconMap[tool.name.toLowerCase()] || defaultIcon;
  };
  
  // Toggle expansion
  const toggleExpand = () => {
    if (expandable) {
      setExpanded(prev => !prev);
    }
  };
  
  // Handle rendering the result
  const renderResult = () => {
    if (!hasResult) return null;
    
    if (resultRenderer) {
      return resultRenderer(tool.result);
    }
    
    return (
      <div 
        className="agent-tool-result"
        style={{
          padding: '8px 12px',
          backgroundColor: 'var(--color-neutral-50)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--font-size-sm)',
          border: '1px solid var(--border-light)'
        }}
      >
        <Text size="sm">{tool.result}</Text>
      </div>
    );
  };
  
  return (
    <Card
      className={`agent-tool-usage ${className}`}
      style={{
        border: `1px solid ${getStatusColor()}20`,
        backgroundColor: `${getStatusColor()}05`,
        borderRadius: 'var(--radius-md)',
        padding: detailed || expanded ? 'var(--spacing-md)' : 'var(--spacing-sm)',
        cursor: expandable ? 'pointer' : 'default',
        ...style
      }}
      onClick={toggleExpand}
      {...props}
    >
      <Group gap="sm" align="center" justify="space-between" wrap="nowrap">
        <Group gap="xs" wrap="nowrap">
          <div 
            style={{ 
              color: getStatusColor(),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {renderToolIcon()}
          </div>
          
          <Text fw={500} c="var(--text-primary)">
            {tool.name}
            {tool.count > 1 && <span style={{ opacity: 0.7 }}> ({tool.count})</span>}
          </Text>
        </Group>
        
        <Group gap="sm" wrap="nowrap">
          {!detailed && tool.status === 'running' && (
            <AgentStateIndicator 
              state="processing" 
              size="xs" 
              showLabel={false}
              color={getStatusColor()}
            />
          )}
          
          {detailed && (
            <Text size="xs" c="var(--text-secondary)">
              {getStatusLabel()}
            </Text>
          )}
          
          {showTime && formattedTime && (
            <Text size="xs" c="var(--text-secondary)" style={{ whiteSpace: 'nowrap' }}>
              {formattedTime}
            </Text>
          )}
          
          {detailed && formattedDuration && (
            <Text size="xs" c="var(--text-secondary)" style={{ whiteSpace: 'nowrap' }}>
              {formattedDuration}
            </Text>
          )}
        </Group>
      </Group>
      
      {(detailed || expanded) && hasResult && (
        <Stack gap="xs" mt="xs">
          {renderResult()}
        </Stack>
      )}
      
      {expandable && (
        <div 
          style={{
            position: 'absolute',
            bottom: '4px',
            right: '8px',
            fontSize: '10px',
            color: 'var(--text-secondary)'
          }}
        >
          {expanded ? '▲' : '▼'}
        </div>
      )}
    </Card>
  );
}