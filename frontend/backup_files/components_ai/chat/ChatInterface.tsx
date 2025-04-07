import React, { useState, useRef, useEffect } from 'react';
import { Box, TextInput, Paper, ScrollArea } from '@mantine/core'
import { Button, Stack } from '@/components/ui';
import { IconSend } from '@tabler/icons-react';
import { ChatMessage } from './ChatMessage';
import { AIChatProps } from '../types';
import { TransitionFade } from '../../motion';

/**
 * Complete chat interface with messages and input
 */
export function ChatInterface({
  messages,
  isProcessing = false,
  onSendMessage,
  isInputEnabled = true,
  inputPlaceholder = 'Type your message...',
  sendButtonLabel = 'Send',
}: AIChatProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isInputDisabled = isProcessing || !isInputEnabled;

  // Scroll to the bottom whenever messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim() && !isInputDisabled) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Paper shadow="xs" p={0} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ScrollArea
        style={{ flex: 1 }}
        p="md"
        viewportRef={scrollAreaRef}
        scrollbarSize={8}
      >
        <Stack spacing="md">
          {messages.map((message) => (
            <TransitionFade key={message.id} show={true} duration="FAST">
              <ChatMessage 
                message={message} 
                onStreamComplete={() => console.log('Stream completed for message', message.id)} 
              />
            </TransitionFade>
          ))}
          {isProcessing && (
            <Box style={{ height: 20 }} /> // Extra space at bottom when processing
          )}
        </Stack>
      </ScrollArea>

      <Box p="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <Box style={{ display: 'flex' }}>
            <TextInput
              placeholder={inputPlaceholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isInputDisabled}
              style={{ flex: 1, marginRight: 10 }}
            />
            <Button
              type="submit"
              disabled={isInputDisabled || !inputValue.trim()}
              leftIcon={<IconSend size="1rem" />}
            >
              {sendButtonLabel}
            </Button>
          </Box>
        </form>
      </Box>
    </Paper>
  );
}