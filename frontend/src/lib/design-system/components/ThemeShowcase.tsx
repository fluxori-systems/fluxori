'use client';

import { useTheme } from '../theme/ThemeContext';
import { useDesignTokens } from '../hooks';
import { Box, Paper, Title, Text, Stack, Group, Grid, Button } from '@mantine/core';
import { useState } from 'react';

/**
 * Component to showcase the design system tokens
 * Useful for development and documentation
 */
export function ThemeShowcase() {
  const { toggleColorMode, colorMode } = useTheme();
  const { tokens, color } = useDesignTokens();
  const [activeSection, setActiveSection] = useState<string>('colors');
  
  // Sections for the showcase
  const sections = [
    { id: 'colors', label: 'Colors' },
    { id: 'typography', label: 'Typography' },
    { id: 'spacing', label: 'Spacing' },
    { id: 'shadows', label: 'Shadows' },
    { id: 'radius', label: 'Border Radius' },
  ];
  
  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Fluxori Design System</Title>
        <Button onClick={toggleColorMode}>
          Toggle {colorMode === 'light' ? 'Dark' : 'Light'} Mode
        </Button>
      </Group>
      
      <Paper p="md" mb="xl">
        <Text>
          This showcase demonstrates the design tokens used throughout the Fluxori application.
          The design system provides consistent styling, typography, spacing, and more.
        </Text>
      </Paper>
      
      <Group mb="xl">
        {sections.map((section) => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? 'filled' : 'outline'}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </Button>
        ))}
      </Group>
      
      {activeSection === 'colors' && <ColorShowcase />}
      {activeSection === 'typography' && <TypographyShowcase />}
      {activeSection === 'spacing' && <SpacingShowcase />}
      {activeSection === 'shadows' && <ShadowShowcase />}
      {activeSection === 'radius' && <RadiusShowcase />}
    </Box>
  );
}

/**
 * Component to showcase color tokens
 */
function ColorShowcase() {
  const { tokens } = useDesignTokens();
  const { colors } = tokens;
  
  // Helper function to determine if text should be light or dark
  const getTextColor = (bgColor: string) => {
    // Simplified version - ideally use the accessibility utility
    return bgColor.includes('50') || 
           bgColor.includes('100') || 
           bgColor.includes('200') || 
           bgColor.includes('300') ? 'black' : 'white';
  };
  
  return (
    <Stack>
      <Title order={2}>Color Palette</Title>
      
      {/* Primary Colors */}
      <Paper p="md" withBorder>
        <Title order={3} mb="md">Primary</Title>

        <Grid>
          {Object.entries(colors.primary).map(([shade, value]) => (
            <Grid.Col span={2} key={`primary-${shade}`}>
              <Box
                p="md"
                style={{
                  backgroundColor: value,
                  color: getTextColor(`primary-${shade}`),
                  height: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Text fw={700}>{shade}</Text>
                <Text size="sm">{value}</Text>
              </Box>
            </Grid.Col>
          ))}
        </Grid>
      </Paper>
      
      {/* Secondary Colors */}
      <Paper p="md" withBorder>
        <Title order={3} mb="md">Secondary</Title>
        <Grid>
          {Object.entries(colors.secondary).map(([shade, value]) => (
            <Grid.Col span={2} key={`secondary-${shade}`}>
              <Box
                p="md"
                style={{
                  backgroundColor: value,
                  color: getTextColor(`secondary-${shade}`),
                  height: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Text fw={700}>{shade}</Text>
                <Text size="sm">{value}</Text>
              </Box>
            </Grid.Col>
          ))}
        </Grid>
      </Paper>
      
      {/* Neutral Colors */}
      <Paper p="md" withBorder>
        <Title order={3} mb="md">Neutral</Title>
        <Grid>
          {Object.entries(colors.neutral).map(([shade, value]) => (
            <Grid.Col span={2} key={`neutral-${shade}`}>
              <Box
                p="md"
                style={{
                  backgroundColor: value,
                  color: getTextColor(`neutral-${shade}`),
                  height: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Text fw={700}>{shade}</Text>
                <Text size="sm">{value}</Text>
              </Box>
            </Grid.Col>
          ))}
        </Grid>
      </Paper>
      
      {/* Semantic Colors */}
      <Paper p="md" withBorder>
        <Title order={3} mb="md">Semantic Colors</Title>
        <Grid>
          {['success', 'warning', 'error', 'info'].map((semantic) => (
            <Grid.Col span={3} key={semantic}>
              <Paper withBorder p="sm" mb="md">
                <Text fw={700} tt="capitalize" mb="xs">{semantic}</Text>
                <Grid>
                  {Object.entries(colors[semantic as keyof typeof colors]).map(([variant, value]) => (
                    <Grid.Col span={12} key={`${semantic}-${variant}`}>
                      <Box
                        p="md"
                        style={{
                          backgroundColor: value,
                          color: variant === 'contrast' ? 
                            (colors[semantic as keyof typeof colors] as any).base : 
                            (colors[semantic as keyof typeof colors] as any).contrast,
                          height: '60px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Text fw={700}>{variant}</Text>
                        <Text size="sm">{value}</Text>
                      </Box>
                    </Grid.Col>
                  ))}
                </Grid>
              </Paper>
            </Grid.Col>
          ))}
        </Grid>
      </Paper>
      
      {/* UI Colors */}
      <Paper p="md" withBorder>
        <Title order={3} mb="md">UI Colors</Title>
        
        <Title order={4} mb="xs">Background</Title>
        <Grid mb="md">
          {Object.entries(colors.background).map(([name, value]) => (
            <Grid.Col span={3} key={`bg-${name}`}>
              <Box
                p="md"
                style={{
                  backgroundColor: value,
                  color: colors.text.primary,
                  height: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: `1px solid ${colors.border.default}`,
                }}
              >
                <Text fw={700}>{name}</Text>
                <Text size="sm">{value}</Text>
              </Box>
            </Grid.Col>
          ))}
        </Grid>
        
        <Title order={4} mb="xs">Text</Title>
        <Grid mb="md">
          {Object.entries(colors.text).map(([name, value]) => (
            <Grid.Col span={3} key={`text-${name}`}>
              <Box
                p="md"
                style={{
                  backgroundColor: colors.background.surface,
                  color: value,
                  height: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: `1px solid ${colors.border.default}`,
                }}
              >
                <Text fw={700}>{name}</Text>
                <Text size="sm">{value}</Text>
              </Box>
            </Grid.Col>
          ))}
        </Grid>
        
        <Title order={4} mb="xs">Border</Title>
        <Grid>
          {Object.entries(colors.border).map(([name, value]) => (
            <Grid.Col span={4} key={`border-${name}`}>
              <Box
                p="md"
                style={{
                  backgroundColor: colors.background.surface,
                  color: colors.text.primary,
                  height: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: `4px solid ${value}`,
                }}
              >
                <Text fw={700}>{name}</Text>
                <Text size="sm">{value}</Text>
              </Box>
            </Grid.Col>
          ))}
        </Grid>
      </Paper>
    </Stack>
  );
}

/**
 * Component to showcase typography tokens
 */
function TypographyShowcase() {
  const { tokens } = useDesignTokens();
  const { typography } = tokens;
  
  return (
    <Stack>
      <Title order={2}>Typography</Title>
      
      <Paper p="md" withBorder>
        <Title order={3} mb="md">Font Families</Title>
        <Stack>
          {Object.entries(typography.fonts).map(([name, value]) => (
            <Box key={name} mb="md">
              <Text fw={700} tt="capitalize">{name}</Text>
              <Text style={{ fontFamily: value }}>
                The quick brown fox jumps over the lazy dog
              </Text>
              <Text size="xs" c="dimmed">{value}</Text>
            </Box>
          ))}
        </Stack>
      </Paper>
      
      <Paper p="md" withBorder>
        <Title order={3} mb="md">Font Sizes</Title>
        <Stack>
          {Object.entries(typography.fontSizes).map(([name, value]) => (
            <Box key={name}>
              <Group>
                <Text fw={700} style={{ width: '60px' }}>{name}</Text>
                <Text style={{ fontSize: value }}>
                  The quick brown fox jumps over the lazy dog
                </Text>
                <Text size="xs" c="dimmed">{value}</Text>
              </Group>
            </Box>
          ))}
        </Stack>
      </Paper>
      
      <Paper p="md" withBorder>
        <Title order={3} mb="md">Font Weights</Title>
        <Stack>
          {Object.entries(typography.fontWeights).map(([name, value]) => (
            <Box key={name}>
              <Group>
                <Text fw={700} style={{ width: '100px' }}>{name}</Text>
                <Text fw={value as any}>
                  The quick brown fox jumps over the lazy dog
                </Text>
                <Text size="xs" c="dimmed">{value}</Text>
              </Group>
            </Box>
          ))}
        </Stack>
      </Paper>
      
      <Paper p="md" withBorder>
        <Title order={3} mb="md">Line Heights</Title>
        <Grid>
          {Object.entries(typography.lineHeights).map(([name, value]) => (
            <Grid.Col span={4} key={name}>
              <Box 
                p="md" 
                style={{ 
                  height: '200px',
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0'
                }}
              >
                <Text fw={700}>{name} ({value})</Text>
                <Text style={{ lineHeight: value }}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                  exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </Text>
              </Box>
            </Grid.Col>
          ))}
        </Grid>
      </Paper>
      
      <Paper p="md" withBorder>
        <Title order={3} mb="md">Letter Spacing</Title>
        <Grid>
          {Object.entries(typography.letterSpacings).map(([name, value]) => (
            <Grid.Col span={4} key={name}>
              <Box p="md" style={{ border: '1px solid #e2e8f0' }}>
                <Text fw={700}>{name}</Text>
                <Text style={{ letterSpacing: value }}>
                  The quick brown fox jumps over the lazy dog
                </Text>
                <Text size="xs" c="dimmed">{value}</Text>
              </Box>
            </Grid.Col>
          ))}
        </Grid>
      </Paper>
    </Stack>
  );
}

/**
 * Component to showcase spacing tokens
 */
function SpacingShowcase() {
  const { tokens } = useDesignTokens();
  const { spacing } = tokens;
  
  return (
    <Stack>
      <Title order={2}>Spacing</Title>
      
      <Paper p="md" withBorder>
        <Title order={3} mb="md">Spacing Scale</Title>
        <Stack>
          {Object.entries(spacing).map(([name, value]) => (
            <Box key={name}>
              <Group align="center">
                <Text fw={700} style={{ width: '60px' }}>{name}</Text>
                <Box
                  style={{
                    width: value,
                    height: '24px',
                    backgroundColor: tokens.colors.primary[500],
                  }}
                />
                <Text>{value}</Text>
              </Group>
            </Box>
          ))}
        </Stack>
      </Paper>
      
      <Paper p="md" withBorder>
        <Title order={3} mb="md">Spacing Examples</Title>
        
        <Title order={4} mb="sm">Padding</Title>
        <Grid mb="xl">
          {['xs', 'sm', 'md', 'lg', 'xl'].map((size) => (
            <Grid.Col span={2} key={`padding-${size}`}>
              <Box
                style={{
                  padding: spacing[size as keyof typeof spacing],
                  backgroundColor: tokens.colors.neutral[100],
                  border: `1px solid ${tokens.colors.border.default}`,
                }}
              >
                <Box
                  style={{
                    backgroundColor: tokens.colors.primary[500],
                    height: '40px',
                    width: '100%',
                  }}
                />
              </Box>
              <Text ta="center" mt="xs">{`Padding ${size}`}</Text>
            </Grid.Col>
          ))}
        </Grid>
        
        <Title order={4} mb="sm">Margin</Title>
        <Box style={{ backgroundColor: tokens.colors.neutral[100], padding: '24px' }}>
          {['xs', 'sm', 'md', 'lg', 'xl'].map((size) => (
            <Box
              key={`margin-${size}`}
              style={{
                backgroundColor: tokens.colors.primary[500],
                height: '40px',
                width: '40%',
                marginBottom: spacing[size as keyof typeof spacing],
              }}
            >
              <Text c="white" ta="center">Margin {size}</Text>
            </Box>
          ))}
        </Box>
      </Paper>
    </Stack>
  );
}

/**
 * Component to showcase shadow tokens
 */
function ShadowShowcase() {
  const { tokens } = useDesignTokens();
  const { shadows } = tokens;
  
  return (
    <Stack>
      <Title order={2}>Shadows</Title>
      
      <Paper p="md" withBorder>
        <Title order={3} mb="md">Shadow Scale</Title>
        <Grid>
          {Object.entries(shadows).map(([name, value]) => (
            <Grid.Col span={3} key={name}>
              <Box
                p="md"
                style={{
                  backgroundColor: tokens.colors.background.card,
                  boxShadow: value,
                  height: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px',
                }}
              >
                <Text fw={700}>{name}</Text>
              </Box>
              <Text size="xs" tt="capitalize" mb="md">{name}</Text>
              <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>{value}</Text>
            </Grid.Col>
          ))}
        </Grid>
      </Paper>
    </Stack>
  );
}

/**
 * Component to showcase border radius tokens
 */
function RadiusShowcase() {
  const { tokens } = useDesignTokens();
  const { radii } = tokens;
  
  return (
    <Stack>
      <Title order={2}>Border Radius</Title>
      
      <Paper p="md" withBorder>
        <Title order={3} mb="md">Radius Scale</Title>
        <Grid>
          {Object.entries(radii).map(([name, value]) => (
            <Grid.Col span={3} key={name}>
              <Box
                style={{
                  backgroundColor: tokens.colors.primary[500],
                  borderRadius: value,
                  height: '100px',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <Text fw={700} c="white">{name}</Text>
              </Box>
              <Text tt="capitalize">{name}</Text>
              <Text size="xs" c="dimmed">{value}</Text>
            </Grid.Col>
          ))}
        </Grid>
      </Paper>
    </Stack>
  );
}