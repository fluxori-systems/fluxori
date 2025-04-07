import React from 'react';
import { Box, Progress, Tooltip, useMantineTheme } from '@mantine/core'
import { Group, Text } from '@/components/ui';
import { AIProcessingIndicator, IconFeedback } from '../motion';
import { IconInfoCircle, IconBrain, IconAlertTriangle } from '@tabler/icons-react';
import { AIState } from './types';

interface AIStatusBarProps {
  /** Current state of the AI system */
  state: AIState;
  /** Whether to show the confidence indicator */
  showConfidence?: boolean;
  /** Optional custom message to display */
  statusMessage?: string;
}

/**
 * Status bar that shows AI processing state with visual indicators
 */
export function AIStatusBar({
  state,
  showConfidence = true,
  statusMessage,
}: AIStatusBarProps) {
  const theme = useMantineTheme();
  
  // Determine status text based on current state
  const getStatusText = () => {
    if (statusMessage) return statusMessage;
    
    switch (state.status) {
      case 'idle':
        return 'AI ready';
      case 'thinking':
        return 'AI thinking...';
      case 'processing':
        return 'Processing data...';
      case 'responding':
        return 'Generating response...';
      case 'error':
        return state.error || 'An error occurred';
      default:
        return 'AI Assistant';
    }
  };

  // Determine status color based on state
  const getStatusColor = () => {
    switch (state.status) {
      case 'idle':
        return theme.colors.blue[5];
      case 'thinking': 
      case 'processing':
      case 'responding':
        return theme.colors.green[5];
      case 'error':
        return theme.colors.red[5];
      default:
        return theme.colors.gray[5];
    }
  };

  // Get appropriate icon based on state
  const getStatusIcon = () => {
    if (state.status === 'error') {
      return (
        <IconFeedback 
          icon={<IconAlertTriangle size="1rem" />}
          effectSize="1.75rem"
          color={theme.colors.red[5]}
          active={true}
          effect="pulse"
        />
      );
    }
    
    if (state.status === 'idle') {
      return (
        <IconFeedback
          icon={<IconBrain size="1rem" />}
          effectSize="1.75rem"
          color={theme.colors.blue[5]}
        />
      );
    }
    
    return (
      <AIProcessingIndicator 
        isProcessing={state.status !== 'idle'}
        confidence={state.confidence}
        size="1rem"
      />
    );
  };

  return (
    <Box
      p="xs"
      style={{
        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
        borderRadius: theme.radius.sm,
        border: `1px solid ${theme.colors.gray[3]}`,
      }}
    >
      <Group position="apart" spacing="md">
        <Group spacing="xs">
          {getStatusIcon()}
          <Text size="sm" weight={500} color={getStatusColor()}>
            {getStatusText()}
          </Text>
          
          {state.status === 'error' && state.error && (
            <Tooltip label={state.error} position="right" withArrow>
              <Box style={{ display: 'inline-block', cursor: 'help' }}>
                <IconInfoCircle size="1rem" color={theme.colors.gray[6]} />
              </Box>
            </Tooltip>
          )}
        </Group>
        
        {showConfidence && state.status !== 'idle' && state.status !== 'error' && (
          <Group spacing="xs">
            <Text size="xs" color="dimmed">
              Confidence: {Math.round(state.confidence * 100)}%
            </Text>
            {state.progress !== undefined && (
              <Progress 
                value={state.progress} 
                size="xs" 
                style={{ width: 60 }} 
                color={state.confidence > 0.7 ? 'green' : state.confidence > 0.4 ? 'yellow' : 'red'}
              />
            )}
          </Group>
        )}
      </Group>
    </Box>
  );
}