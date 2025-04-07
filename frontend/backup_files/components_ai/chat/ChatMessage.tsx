import React from 'react';
import { Box, Avatar, Paper, useMantineTheme } from '@mantine/core'
import { Text, Group } from '@/components/ui';
import { IconUser, IconRobot } from '@tabler/icons-react';
import { StreamingText, AIProcessingIndicator } from '../../motion';
import { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  /** The message to display */
  message: ChatMessageType;
  /** Handle when streaming is complete */
  onStreamComplete?: () => void;
}

/**
 * Displays a single chat message with streaming text support
 */
export function ChatMessage({ message, onStreamComplete }: ChatMessageProps) {
  const theme = useMantineTheme();
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';

  // Determine avatar and styles based on the message role
  const getAvatar = () => {
    if (isUser) {
      return (
        <Avatar color="blue" radius="xl">
          <IconUser size="1.5rem" />
        </Avatar>
      );
    } else if (isAssistant) {
      return (
        <Avatar 
          color="green" 
          radius="xl"
          style={{ position: 'relative' }}
        >
          <IconRobot size="1.5rem" />
          {message.isStreaming && (
            <Box 
              style={{
                position: 'absolute',
                top: -5,
                right: -5,
              }}
            >
              <AIProcessingIndicator 
                isProcessing 
                size="0.75rem" 
                confidence={1} 
              />
            </Box>
          )}
        </Avatar>
      );
    } else {
      return (
        <Avatar color="gray" radius="xl">
          <Text size="xs">SYS</Text>
        </Avatar>
      );
    }
  };

  return (
    <Box
      style={{
        marginBottom: theme.spacing.md,
        maxWidth: '100%',
      }}
    >
      <Group spacing="xs" align="flex-start" noWrap>
        {getAvatar()}
        
        <Paper
          p="sm"
          style={{
            backgroundColor: isUser 
              ? theme.colors.blue[0] 
              : isAssistant 
              ? theme.colors.green[0] 
              : theme.colors.gray[0],
            borderRadius: theme.radius.md,
            maxWidth: 'calc(100% - 50px)',
          }}
        >
          {message.isStreaming ? (
            <StreamingText
              content={message.content}
              speed="medium"
              onStreamComplete={onStreamComplete}
            />
          ) : (
            <Text style={{ whiteSpace: 'pre-wrap' }}>{message.content}</Text>
          )}
        </Paper>
      </Group>
    </Box>
  );
}