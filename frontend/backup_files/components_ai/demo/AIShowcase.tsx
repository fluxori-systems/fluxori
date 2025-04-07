import React, { useState, useEffect } from 'react';
import { Box, Title, Paper, Card } from '@mantine/core'
import { Stack, Text, Grid, Button, Group } from '@/components/ui';
import { v4 as uuidv4 } from 'uuid';
import { ChatInterface, AIStatusBar, ChatMessage } from '../';
import { AIState } from '../types';

/**
 * Component that showcases the AI components and interactions
 */
export function AIShowcase() {
  // Demo messages for chat
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Welcome to the Fluxori AI Assistant. How can I help you today?',
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);

  // Demo AI state
  const [aiState, setAIState] = useState<AIState>({
    confidence: 0.9,
    isProcessing: false,
    status: 'idle',
  });

  // Handle sending a new message
  const handleSendMessage = (content: string) => {
    // Add the user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      content,
      role: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Simulate AI thinking and responding
    setAIState({
      confidence: 0.6,
      isProcessing: true,
      status: 'thinking',
    });
    
    // Simulate AI response after a delay
    setTimeout(() => {
      setAIState({
        confidence: 0.8,
        isProcessing: true,
        status: 'processing',
        progress: 30,
      });
      
      // Set a timer to update progress
      let progress = 30;
      const progressInterval = setInterval(() => {
        progress += 10;
        setAIState(prev => ({
          ...prev,
          progress,
          confidence: Math.min(0.5 + progress / 100, 0.95),
        }));
        
        if (progress >= 100) {
          clearInterval(progressInterval);
          
          // Generate a response based on the user's message
          let responseContent = '';
          
          if (content.toLowerCase().includes('hello') || content.toLowerCase().includes('hi')) {
            responseContent = 'Hello! How can I assist with your e-commerce operations today?';
          } else if (content.toLowerCase().includes('inventory') || content.toLowerCase().includes('stock')) {
            responseContent = 'I can help you manage inventory across your warehouses and marketplaces. Would you like me to generate an inventory report or provide specific product stock information?';
          } else if (content.toLowerCase().includes('sales') || content.toLowerCase().includes('revenue')) {
            responseContent = 'Based on your recent sales data, I\'ve noticed a 12% increase in revenue compared to last month. Your top-selling product categories are Electronics and Home Goods.';
          } else if (content.toLowerCase().includes('help') || content.toLowerCase().includes('features')) {
            responseContent = 'I can help with inventory management, order processing, sales analytics, marketplace integration, and pricing optimization. What specific area would you like assistance with?';
          } else {
            responseContent = 'I understand you\'re asking about ' + content + '. To provide the most accurate information, could you provide more details about your specific needs?';
          }
          
          // Add the AI response with streaming
          const assistantMessage: ChatMessage = {
            id: uuidv4(),
            content: responseContent,
            role: 'assistant',
            timestamp: new Date(),
            isStreaming: true,
          };
          
          setMessages(prev => [...prev, assistantMessage]);
          
          setAIState({
            confidence: 0.95,
            isProcessing: true,
            status: 'responding',
          });
          
          // After the response is "streamed", update the state
          setTimeout(() => {
            // Update the message to no longer be streaming
            setMessages(prev => 
              prev.map(msg => 
                msg.id === assistantMessage.id 
                  ? { ...msg, isStreaming: false } 
                  : msg
              )
            );
            
            // Reset AI state
            setAIState({
              confidence: 0.9,
              isProcessing: false,
              status: 'idle',
            });
          }, 3000); // Simulate streaming for 3 seconds
        }
      }, 500);
    }, 1500);
  };

  // Trigger error state for demo
  const triggerError = () => {
    setAIState({
      confidence: 0,
      isProcessing: false,
      status: 'error',
      error: 'Connection to AI service failed. Please try again later.',
    });
    
    // Reset after 3 seconds
    setTimeout(() => {
      setAIState({
        confidence: 0.9,
        isProcessing: false,
        status: 'idle',
      });
    }, 3000);
  };

  // Reset the chat demo
  const resetChat = () => {
    setMessages([
      {
        id: '1',
        content: 'Welcome to the Fluxori AI Assistant. How can I help you today?',
        role: 'assistant',
        timestamp: new Date(),
      },
    ]);
    
    setAIState({
      confidence: 0.9,
      isProcessing: false,
      status: 'idle',
    });
  };

  return (
    <Stack spacing="xl">
      <Title order={2}>AI Components with Motion Design</Title>
      <Text>
        These components showcase Fluxori's AI interface with motion design principles,
        creating a fluid and intelligent user experience.
      </Text>

      <Grid>
        <Grid.Col span={12}>
          <Paper p="md" shadow="xs" withBorder>
            <Title order={3} mb="md">AI Status Indicators</Title>
            <Stack spacing="md">
              <AIStatusBar
                state={{
                  confidence: 0.9,
                  isProcessing: false,
                  status: 'idle',
                }}
              />
              
              <AIStatusBar
                state={{
                  confidence: 0.7,
                  isProcessing: true,
                  status: 'thinking',
                }}
              />
              
              <AIStatusBar
                state={{
                  confidence: 0.8,
                  isProcessing: true,
                  status: 'processing',
                  progress: 60,
                }}
              />
              
              <AIStatusBar
                state={{
                  confidence: 0.95,
                  isProcessing: true,
                  status: 'responding',
                }}
              />
              
              <AIStatusBar
                state={{
                  confidence: 0,
                  isProcessing: false,
                  status: 'error',
                  error: 'Unable to connect to AI service',
                }}
              />
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={12}>
          <Card shadow="sm" p={0} style={{ height: 500 }}>
            <Card.Section p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
              <Group position="apart">
                <Title order={3}>AI Chat Interface</Title>
                <Group>
                  <Button variant="outline" color="gray" size="xs" onClick={resetChat}>
                    Reset Chat
                  </Button>
                  <Button variant="outline" color="red" size="xs" onClick={triggerError}>
                    Trigger Error
                  </Button>
                </Group>
              </Group>
              <AIStatusBar state={aiState} mt="xs" />
            </Card.Section>
            
            <Box style={{ height: 'calc(100% - 140px)' }}>
              <ChatInterface
                messages={messages}
                isProcessing={aiState.isProcessing}
                onSendMessage={handleSendMessage}
                inputPlaceholder="Ask the AI assistant..."
              />
            </Box>
          </Card>
        </Grid.Col>
      </Grid>

      <Box p="md" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '8px' }}>
        <Title order={3} mb="md">AI Motion Design Integration</Title>
        <Text>
          Our AI components use these motion design features:
        </Text>
        <ul>
          <li>
            <Text>
              <strong>Streaming Text:</strong> Character-by-character animation for AI responses 
              that respects reduced motion preferences.
            </Text>
          </li>
          <li>
            <Text>
              <strong>Processing Indicators:</strong> Subtle animations show AI thinking and 
              confidence levels with appropriate visual feedback.
            </Text>
          </li>
          <li>
            <Text>
              <strong>Transition Effects:</strong> Smooth entrance and exit animations for 
              messages and UI elements create a fluid experience.
            </Text>
          </li>
          <li>
            <Text>
              <strong>Status Feedback:</strong> Visual indicators communicate AI state changes
              with appropriate urgency and importance.
            </Text>
          </li>
        </ul>
      </Box>
    </Stack>
  );
}