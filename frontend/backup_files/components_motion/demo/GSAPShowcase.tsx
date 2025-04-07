import React, { useState } from 'react';
import { Title, Box, Paper, Card, useMantineTheme } from '@mantine/core'
import { Stack, Text, Group, Button, SimpleGrid, Tabs } from '@/components/ui';
import { IconRefresh, IconMountain, IconRocket, IconBulb, IconBrandGithub } from '@tabler/icons-react';
import { 
  GSAPFadeIn, GSAPStagger, GSAPReveal, GSAPBusinessFeatures
} from '../gsap';

/**
 * Component that showcases GSAP-powered animations
 */
export function GSAPShowcase() {
  const theme = useMantineTheme();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [activeEffect, setActiveEffect] = useState<'fade' | 'slide' | 'scale' | 'rotate'>('fade');
  
  const resetAnimations = () => {
    setRefreshKey(prev => prev + 1);
    setIsRevealed(false);
    // Re-reveal after a small delay
    setTimeout(() => {
      setIsRevealed(true);
    }, 300);
  };
  
  return (
    <Stack spacing="xl">
      <Title order={2}>GSAP Motion Animations</Title>
      <Text>
        These components demonstrate the power of GSAP-based animations that adhere to
        our motion design principles while providing more advanced animation capabilities.
      </Text>
      
      <Group position="left" mb="lg">
        <Button 
          leftIcon={<IconRefresh size="1rem" />}
          onClick={resetAnimations}
        >
          Reset Animations
        </Button>
      </Group>

      <Tabs defaultValue="basics">
        <Tabs.List mb="lg">
          <Tabs.Tab value="basics">Basic GSAP</Tabs.Tab>
          <Tabs.Tab value="stagger">Staggered Animations</Tabs.Tab>
          <Tabs.Tab value="reveal">Reveal Effects</Tabs.Tab>
          <Tabs.Tab value="business">Business Features</Tabs.Tab>
        </Tabs.List>
        
        <Tabs.Panel value="basics">
          <Title order={3} mb="md">Basic GSAP Animations</Title>
          <Text mb="xl">
            Simple fade and slide animations powered by GSAP's precise animation engine.
          </Text>
          
          <SimpleGrid cols={4} breakpoints={[{ maxWidth: 'md', cols: 2 }, { maxWidth: 'xs', cols: 1 }]}>
            {/* Basic fade up with different delays */}
            <GSAPFadeIn 
              key={`fade-1-${refreshKey}`}
              duration="NORMAL"
              fromY={30}
              delay={0}
            >
              <Card shadow="sm" p="md">
                <Text align="center" size="lg" mb="xs">No Delay</Text>
                <Box 
                  h={100} 
                  bg={theme.colors.blue[1]} 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.md }}
                >
                  <IconRocket size="2rem" color={theme.colors.blue[6]} />
                </Box>
              </Card>
            </GSAPFadeIn>
            
            <GSAPFadeIn 
              key={`fade-2-${refreshKey}`}
              duration="NORMAL"
              fromY={30}
              delay={0.2}
            >
              <Card shadow="sm" p="md">
                <Text align="center" size="lg" mb="xs">0.2s Delay</Text>
                <Box 
                  h={100} 
                  bg={theme.colors.green[1]} 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.md }}
                >
                  <IconRocket size="2rem" color={theme.colors.green[6]} />
                </Box>
              </Card>
            </GSAPFadeIn>
            
            <GSAPFadeIn 
              key={`fade-3-${refreshKey}`}
              duration="NORMAL"
              fromY={30}
              delay={0.4}
            >
              <Card shadow="sm" p="md">
                <Text align="center" size="lg" mb="xs">0.4s Delay</Text>
                <Box 
                  h={100} 
                  bg={theme.colors.violet[1]} 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.md }}
                >
                  <IconRocket size="2rem" color={theme.colors.violet[6]} />
                </Box>
              </Card>
            </GSAPFadeIn>
            
            <GSAPFadeIn 
              key={`fade-4-${refreshKey}`}
              duration="NORMAL"
              fromY={30}
              delay={0.6}
            >
              <Card shadow="sm" p="md">
                <Text align="center" size="lg" mb="xs">0.6s Delay</Text>
                <Box 
                  h={100} 
                  bg={theme.colors.orange[1]} 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.md }}
                >
                  <IconRocket size="2rem" color={theme.colors.orange[6]} />
                </Box>
              </Card>
            </GSAPFadeIn>
          </SimpleGrid>
        </Tabs.Panel>
        
        <Tabs.Panel value="stagger">
          <Title order={3} mb="md">Staggered Animations</Title>
          <Text mb="lg">
            Staggered animations create a coordinated sequence of elements animating one after another.
          </Text>
          
          <Card shadow="sm" p="xl" mb="xl">
            <GSAPStagger
              key={`stagger-${refreshKey}`}
              duration="NORMAL"
              staggerDelay={0.1}
              fromY={20}
              fromOpacity={0}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <Box 
                  key={i} 
                  mb="md" 
                  p="md" 
                  style={{ 
                    borderRadius: theme.radius.md,
                    backgroundColor: theme.colors.blue[i % 2 ? 1 : 2],
                    border: `1px solid ${theme.colors.blue[i % 2 ? 3 : 4]}`,
                  }}
                >
                  <Group>
                    <IconBulb size="1.5rem" style={{ color: theme.colors.blue[6] }} />
                    <div>
                      <Text weight={500}>Staggered Item {i + 1}</Text>
                      <Text size="sm" color="dimmed">
                        This item animates {i * 0.1}s after the previous one
                      </Text>
                    </div>
                  </Group>
                </Box>
              ))}
            </GSAPStagger>
          </Card>
          
          <SimpleGrid cols={3} breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
            <Card shadow="sm" p="md">
              <Text align="center" weight={500} mb="md">Fade Stagger</Text>
              <GSAPStagger
                key={`stagger-icons-1-${refreshKey}`}
                duration="NORMAL"
                staggerDelay={0.1}
                fromY={0}
                fromOpacity={0}
              >
                <SimpleGrid cols={3}>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <Box 
                      key={i} 
                      p="sm" 
                      style={{ 
                        borderRadius: theme.radius.md,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconMountain 
                        size="2rem" 
                        style={{ color: theme.colors.blue[6] }} 
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              </GSAPStagger>
            </Card>
            
            <Card shadow="sm" p="md">
              <Text align="center" weight={500} mb="md">Scale Stagger</Text>
              <GSAPStagger
                key={`stagger-icons-2-${refreshKey}`}
                duration="NORMAL"
                staggerDelay={0.05}
                fromY={0}
                fromOpacity={0}
                fromScale={0.5}
              >
                <SimpleGrid cols={3}>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <Box 
                      key={i} 
                      p="sm" 
                      style={{ 
                        borderRadius: theme.radius.md,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconMountain 
                        size="2rem" 
                        style={{ color: theme.colors.violet[6] }} 
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              </GSAPStagger>
            </Card>
            
            <Card shadow="sm" p="md">
              <Text align="center" weight={500} mb="md">Y-Axis Stagger</Text>
              <GSAPStagger
                key={`stagger-icons-3-${refreshKey}`}
                duration="NORMAL"
                staggerDelay={0.08}
                fromY={30}
                fromOpacity={0}
              >
                <SimpleGrid cols={3}>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <Box 
                      key={i} 
                      p="sm" 
                      style={{ 
                        borderRadius: theme.radius.md,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconMountain 
                        size="2rem" 
                        style={{ color: theme.colors.teal[6] }} 
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              </GSAPStagger>
            </Card>
          </SimpleGrid>
        </Tabs.Panel>
        
        <Tabs.Panel value="reveal">
          <Title order={3} mb="md">Reveal Effects</Title>
          <Text mb="md">
            Toggle animations that show and hide content with various effects.
          </Text>
          
          <Group position="center" mb="xl">
            <Button onClick={() => setIsRevealed(!isRevealed)}>
              {isRevealed ? 'Hide Content' : 'Reveal Content'}
            </Button>
            <Button.Group>
              <Button 
                variant={activeEffect === 'fade' ? 'filled' : 'light'} 
                onClick={() => setActiveEffect('fade')}
                size="sm"
              >
                Fade
              </Button>
              <Button 
                variant={activeEffect === 'slide' ? 'filled' : 'light'} 
                onClick={() => setActiveEffect('slide')}
                size="sm"
              >
                Slide
              </Button>
              <Button 
                variant={activeEffect === 'scale' ? 'filled' : 'light'} 
                onClick={() => setActiveEffect('scale')}
                size="sm"
              >
                Scale
              </Button>
              <Button 
                variant={activeEffect === 'rotate' ? 'filled' : 'light'} 
                onClick={() => setActiveEffect('rotate')}
                size="sm"
              >
                Rotate
              </Button>
            </Button.Group>
          </Group>
          
          <SimpleGrid cols={1}>
            <GSAPReveal
              key={`reveal-${activeEffect}`}
              isRevealed={isRevealed}
              duration="NORMAL"
              effect={activeEffect}
            >
              <Paper p="xl" shadow="md" withBorder>
                <Title order={3} mb="md">Animated Content</Title>
                <Text mb="md">
                  This content reveals and hides with a {activeEffect} effect when you
                  toggle the button above. The animation respects reduced motion preferences
                  and maintains the core motion design principles.
                </Text>
                <Group>
                  <IconBulb size="3rem" style={{ color: theme.colors.yellow[6] }} />
                  <div>
                    <Text weight={500}>Purposeful Intelligence</Text>
                    <Text size="sm" color="dimmed">
                      The animation serves to draw attention to content changes in an
                      intelligent, predictable way.
                    </Text>
                  </div>
                </Group>
              </Paper>
            </GSAPReveal>
          </SimpleGrid>
        </Tabs.Panel>
        
        <Tabs.Panel value="business">
          <GSAPBusinessFeatures key={`business-${refreshKey}`} />
        </Tabs.Panel>
      </Tabs>

      <Box p="md" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '8px' }} mt="xl">
        <Title order={3} mb="md">GSAP Animation Benefits</Title>
        <Text>
          These advanced animations powered by GSAP offer several benefits:
        </Text>
        <ul>
          <li>
            <Text>
              <strong>Performance Optimization:</strong> GSAP's high-performance animation engine 
              delivers smoother animations with minimal impact on framerate.
            </Text>
          </li>
          <li>
            <Text>
              <strong>Complex Animation Sequences:</strong> Support for timelines, staggered animations, 
              and coordinated movement between multiple elements.
            </Text>
          </li>
          <li>
            <Text>
              <strong>Physics-Based Motion:</strong> More sophisticated easing options for natural movement
              that follows the laws of physics.
            </Text>
          </li>
          <li>
            <Text>
              <strong>Accessibility Integration:</strong> All GSAP animations respect reduced motion preferences
              and maintain full functionality without animations.
            </Text>
          </li>
        </ul>
      </Box>
    </Stack>
  );
}