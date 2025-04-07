import React, { useState } from 'react';
import { Box, Title } from '@mantine/core'
import { Button, Grid, Group, Stack, Text } from '@/components/ui';
import { IconCheck, IconSettings, IconX, IconBell, IconArrowRight } from '@tabler/icons-react';

// Import motion components
import { 
  AIProcessingIndicator, 
  StreamingText, 
  TransitionFade,
  IconFeedback,
  AnimatedTabIndicator
} from '../';

/**
 * Component that demonstrates the motion design system
 * Used for development and documentation purposes
 */
export function MotionShowcase() {
  const [showTransitionElement, setShowTransitionElement] = useState(false);
  const [iconFeedbackActive, setIconFeedbackActive] = useState(false);
  const [streamingExample, setStreamingExample] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  
  // Example AI response for streaming text demo
  const aiResponse = "This is an example of AI-generated text that streams in one character at a time, respecting reduced motion preferences. It demonstrates the purposeful intelligence principle in our motion design system.";
  
  const toggleTransition = () => setShowTransitionElement(!showTransitionElement);
  
  const triggerIconFeedback = () => {
    setIconFeedbackActive(true);
    setTimeout(() => setIconFeedbackActive(false), 1500);
  };

  const startStreaming = () => {
    setStreamingExample(true);
  };
  
  const handleStreamComplete = () => {
    console.log('Streaming completed');
  };

  return (
    <Stack spacing="xl">
      <Title order={2}>Fluxori Motion Design System</Title>
      <Text>
        This showcase demonstrates the core components of our motion design system,
        following the principles of Purposeful Intelligence, Fluid Efficiency, and Precision & Accuracy.
      </Text>

      <Box p="md" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '8px' }}>
        <Title order={3} mb="md">AI Processing Indicators</Title>
        <Text mb="md">Shows AI processing state with confidence levels:</Text>
        <Group spacing="xl">
          <Stack align="center" spacing="xs">
            <AIProcessingIndicator isProcessing={true} confidence={1.0} />
            <Text size="sm">High confidence</Text>
          </Stack>
          <Stack align="center" spacing="xs">
            <AIProcessingIndicator isProcessing={true} confidence={0.7} />
            <Text size="sm">Medium confidence</Text>
          </Stack>
          <Stack align="center" spacing="xs">
            <AIProcessingIndicator isProcessing={true} confidence={0.4} />
            <Text size="sm">Low confidence</Text>
          </Stack>
        </Group>
      </Box>

      <Box p="md" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '8px' }}>
        <Title order={3} mb="md">Transition Effects</Title>
        <Button onClick={toggleTransition} mb="lg">
          {showTransitionElement ? 'Hide Element' : 'Show Element'}
        </Button>
        
        <TransitionFade 
          show={showTransitionElement} 
          transformFrom="translateY(20px)"
          p="md" 
          style={{ 
            border: '1px solid var(--mantine-color-blue-5)', 
            borderRadius: '4px',
            maxWidth: '400px'
          }}
        >
          <Text>
            This element smoothly transitions in and out, demonstrating the fluid efficiency
            principle with natural easing. The transition respects reduced motion preferences.
          </Text>
        </TransitionFade>
      </Box>

      <Box p="md" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '8px' }}>
        <Title order={3} mb="md">Icon Feedback</Title>
        <Text mb="md">Provides animated feedback for actions:</Text>
        <Grid>
          <Grid.Col span={3}>
            <Stack align="center">
              <IconFeedback 
                icon={<IconCheck size="1.5rem" />} 
                active={iconFeedbackActive} 
                effect="pulse"
                color="var(--mantine-color-green-5)"
              />
              <Text size="sm">Pulse</Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={3}>
            <Stack align="center">
              <IconFeedback 
                icon={<IconBell size="1.5rem" />} 
                active={iconFeedbackActive} 
                effect="ring"
                color="var(--mantine-color-yellow-5)"
              />
              <Text size="sm">Ring</Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={3}>
            <Stack align="center">
              <IconFeedback 
                icon={<IconSettings size="1.5rem" />} 
                active={iconFeedbackActive} 
                effect="bounce"
                color="var(--mantine-color-blue-5)"
              />
              <Text size="sm">Bounce</Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={3}>
            <Stack align="center">
              <IconFeedback 
                icon={<IconArrowRight size="1.5rem" />} 
                active={iconFeedbackActive} 
                effect="pop"
                color="var(--mantine-color-violet-5)"
              />
              <Text size="sm">Pop</Text>
            </Stack>
          </Grid.Col>
        </Grid>
        <Button onClick={triggerIconFeedback} mt="md">Trigger Animations</Button>
      </Box>

      <Box p="md" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '8px' }}>
        <Title order={3} mb="md">AI Streaming Text</Title>
        <Text mb="md">Demonstrates text streaming with typewriter effect:</Text>
        
        <Box 
          p="md" 
          style={{ 
            border: '1px solid var(--mantine-color-blue-2)', 
            borderRadius: '4px',
            backgroundColor: 'var(--mantine-color-blue-0)',
            minHeight: '100px'
          }}
        >
          {streamingExample ? (
            <StreamingText 
              content={aiResponse}
              speed="medium"
              onStreamComplete={handleStreamComplete}
            />
          ) : (
            <Text color="dimmed" italic>Click "Start Streaming" to see text animation</Text>
          )}
        </Box>
        
        <Button 
          onClick={startStreaming} 
          mt="md" 
          disabled={streamingExample}
        >
          Start Streaming
        </Button>
      </Box>

      <Box p="md" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '8px' }}>
        <Title order={3} mb="md">Animated Tab Indicator</Title>
        <Text mb="md">Shows smooth tab transitions following precision principle:</Text>
        
        <Box style={{ position: 'relative' }}>
          <Group spacing={0} mb="md">
            {['Dashboard', 'Analytics', 'Settings', 'Profile'].map((tab, index) => (
              <Box 
                key={tab}
                p="md"
                style={{ 
                  cursor: 'pointer',
                  position: 'relative',
                  color: activeTabIndex === index ? 'var(--mantine-color-blue-7)' : undefined,
                  fontWeight: activeTabIndex === index ? 500 : 400,
                }}
                onClick={() => setActiveTabIndex(index)}
              >
                {tab}
              </Box>
            ))}
            <AnimatedTabIndicator 
              activeIndex={activeTabIndex}
              totalTabs={4}
              height="3px"
            />
          </Group>
        </Box>
        
        <Group position="center" mt="lg">
          {[0, 1, 2, 3].map((index) => (
            <Button 
              key={index}
              variant={activeTabIndex === index ? "filled" : "outline"}
              onClick={() => setActiveTabIndex(index)}
            >
              Tab {index + 1}
            </Button>
          ))}
        </Group>
      </Box>
    </Stack>
  );
}