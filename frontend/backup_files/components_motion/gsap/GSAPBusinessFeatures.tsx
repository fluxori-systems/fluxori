import React, { useEffect, useRef, useState } from 'react';
import { Box, Title, Paper, Card } from '@mantine/core'
import { Text, Group, SimpleGrid, Button } from '@/components/ui';
import { useGSAPAnimation } from './useGSAPAnimation';
import { useReducedMotion } from '../useReducedMotion';
import { DURATION } from '../constants';
import { IconBrush, IconRefresh } from '@tabler/icons-react';

// Import GSAP and the business plugins
import gsap from 'gsap';

// Types for the props
interface GSAPBusinessFeaturesProps {
  children?: React.ReactNode;
}

/**
 * A component that showcases GSAP Business features
 */
export function GSAPBusinessFeatures({ children }: GSAPBusinessFeaturesProps) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const splitTextRef = useRef<HTMLDivElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Register plugins when component mounts
  useEffect(() => {
    // This would be the place to register GSAP Business plugins
    // Example: 
    // gsap.registerPlugin(DrawSVG, SplitText, MorphSVG, etc.);
    // Using your module token: aa268268-f5ee-47e4-9af7-ec057209343b
    
    // For demonstration purposes, we're showing how these would be used
    // but the actual registration depends on the import method
    
    console.log('GSAP Business features would be registered with token');
    
    // Clean up function if needed
    return () => {
      // Clean up any timelines or animations
    };
  }, []);
  
  // Effect to animate SVG drawing when component mounts or refreshKey changes
  useEffect(() => {
    if (prefersReducedMotion || !svgRef.current) return;
    
    // This would use DrawSVG plugin if registered
    const paths = svgRef.current.querySelectorAll('path');
    
    // Create a timeline for the SVG drawing
    const tl = gsap.timeline();
    
    // Example of what would be done with DrawSVG plugin
    /*
    tl.fromTo(paths, {
      drawSVG: "0%"
    }, {
      drawSVG: "100%",
      duration: prefersReducedMotion ? 0 : DURATION.SLOW / 1000,
      stagger: 0.1,
      ease: "power2.inOut"
    });
    */
    
    // Fallback animation without the plugin
    tl.fromTo(paths, {
      opacity: 0,
      strokeDasharray: 100,
      strokeDashoffset: 100
    }, {
      opacity: 1,
      strokeDashoffset: 0,
      duration: prefersReducedMotion ? 0 : DURATION.SLOW / 1000,
      stagger: 0.1,
      ease: "power2.inOut"
    });
    
    // Clean up
    return () => {
      tl.kill();
    };
  }, [prefersReducedMotion, refreshKey]);
  
  // Effect to animate text scrambling when component mounts or refreshKey changes
  useEffect(() => {
    if (prefersReducedMotion || !textRef.current) return;
    
    // This would use ScrambleText plugin if registered
    
    // Create a timeline for the text scrambling
    const tl = gsap.timeline();
    
    // Example of what would be done with ScrambleText plugin
    /*
    tl.fromTo(textRef.current, {
      scrambleText: {text: "", chars: "0123456789!@#$%^&*()", speed: 0.3, delimiter: ""}
    }, {
      scrambleText: {text: "GSAP Business Features", speed: 0.3},
      duration: 2,
      ease: "none"
    });
    */
    
    // Fallback animation without the plugin
    tl.fromTo(textRef.current, {
      opacity: 0,
    }, {
      opacity: 1,
      duration: prefersReducedMotion ? 0 : DURATION.NORMAL / 1000,
      ease: "power2.inOut"
    });
    
    // Clean up
    return () => {
      tl.kill();
    };
  }, [prefersReducedMotion, refreshKey]);
  
  // Effect to animate split text when component mounts or refreshKey changes
  useEffect(() => {
    if (prefersReducedMotion || !splitTextRef.current) return;
    
    // This would use SplitText plugin if registered
    
    // Create a timeline for the split text
    const tl = gsap.timeline();
    
    // Example of what would be done with SplitText plugin
    /*
    // Create a SplitText instance
    const splitText = new SplitText(splitTextRef.current, {
      type: "chars,words", 
      charsClass: "char",
      wordsClass: "word"
    });
    
    // Animate the chars
    tl.fromTo(splitText.chars, {
      y: 50,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      stagger: 0.02,
      duration: 0.5,
      ease: "back.out"
    });
    */
    
    // Fallback animation without the plugin
    tl.fromTo(splitTextRef.current, {
      opacity: 0,
      y: 20
    }, {
      opacity: 1,
      y: 0,
      duration: prefersReducedMotion ? 0 : DURATION.NORMAL / 1000,
      ease: "back.out"
    });
    
    // Clean up
    return () => {
      tl.kill();
      // Also clean up any SplitText instances
      // if (splitText) splitText.revert();
    };
  }, [prefersReducedMotion, refreshKey]);
  
  // Function to reset animations
  const resetAnimations = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  return (
    <Box ref={containerRef}>
      <Group position="apart" mb="lg">
        <div>
          <Title order={3} mb="xs" ref={textRef}>GSAP Business Features</Title>
          <Text ref={splitTextRef}>
            Advanced animation capabilities with premium GSAP plugins.
          </Text>
        </div>
        <Button 
          leftIcon={<IconRefresh size="1rem" />}
          onClick={resetAnimations}
        >
          Reset Animations
        </Button>
      </Group>
      
      <SimpleGrid cols={2} spacing="lg" breakpoints={[{ maxWidth: 'sm', cols: 1 }]} mb="xl">
        <Card shadow="sm" p="lg">
          <Title order={4} mb="md">SVG Animation</Title>
          <Box p="md" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '8px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg 
              ref={svgRef} 
              width="160" 
              height="160" 
              viewBox="0 0 200 200" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M100 20C142.48 20 176.19 59.67 179.8 102" stroke="#2563eb" strokeWidth="4" strokeLinecap="round"/>
              <path d="M180 100C180 144.18 144.18 180 100 180C55.82 180 20 144.18 20 100C20 55.82 55.82 20 100 20" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round"/>
              <path d="M100 180C78.4 180 60 141.42 60 100C60 58.58 78.4 20 100 20" stroke="#db2777" strokeWidth="4" strokeLinecap="round"/>
              <path d="M140 100C140 122.09 122.09 140 100 140C77.91 140 60 122.09 60 100C60 77.91 77.91 60 100 60" stroke="#059669" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          </Box>
          <Text size="sm" mt="md" color="dimmed">
            Demonstrates the DrawSVG plugin for precise control over SVG path animations.
          </Text>
        </Card>
        
        <Card shadow="sm" p="lg">
          <Title order={4} mb="md">Text Effects</Title>
          <Box p="md" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '8px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <Text size="xl" weight={700} mb="lg" style={{ fontSize: '1.5rem' }} className="scramble-text" key={`scramble-${refreshKey}`}>
              GSAP Business Features
            </Text>
            <Text size="lg" className="split-text" key={`split-${refreshKey}`}>
              Premium animation capabilities
            </Text>
          </Box>
          <Text size="sm" mt="md" color="dimmed">
            Showcases ScrambleText and SplitText plugins for advanced text animations.
          </Text>
        </Card>
      </SimpleGrid>
      
      <Title order={4} mb="md">Available Premium Features</Title>
      <SimpleGrid cols={3} spacing="md" breakpoints={[{ maxWidth: 'md', cols: 2 }, { maxWidth: 'xs', cols: 1 }]}>
        {[
          'DrawSVG',
          'Physics2D',
          'PhysicsProps',
          'ScrambleText',
          'CustomBounce',
          'CustomWiggle',
          'ScrollSmoother',
          'MorphSVG',
          'Inertia',
          'SplitText',
          'MotionPathHelper',
          'GSDevTools'
        ].map((feature, index) => (
          <Paper p="md" withBorder key={index}>
            <Group>
              <IconBrush size="1.5rem" color="var(--mantine-color-blue-6)" />
              <Text weight={500}>{feature}</Text>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>
      
      <Text mt="xl" size="sm" color="dimmed">
        Note: This component demonstrates how GSAP Business features would be integrated.
        Actual plugin usage requires proper registration with the provided token.
      </Text>
    </Box>
  );
}