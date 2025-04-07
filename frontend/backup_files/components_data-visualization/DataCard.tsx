import React from 'react';
import { Card, Title, ThemeIcon, useMantineTheme } from '@mantine/core'
import { Group, Text, Stack } from '@/components/ui';
import { IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react';
import { TransitionFade } from '../motion';

export interface DataCardProps {
  /** Title of the card */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Optional icon to display */
  icon?: React.ReactNode;
  /** Percent change to display */
  change?: number;
  /** Additional information to display */
  subtitle?: string;
  /** Whether the card is currently loading */
  loading?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Color for the icon */
  iconColor?: string;
}

/**
 * Data card component for displaying key metrics with animated transitions
 */
export function DataCard({
  title,
  value,
  icon,
  change,
  subtitle,
  loading = false,
  className,
  iconColor,
}: DataCardProps) {
  const theme = useMantineTheme();
  
  // Determine the color for change indicator
  const getChangeColor = () => {
    if (!change) return 'gray';
    return change > 0 ? 'green' : 'red';
  };

  // Format the change value 
  const formatChange = () => {
    if (change === undefined) return null;
    const prefix = change > 0 ? '+' : '';
    return `${prefix}${change}%`;
  };

  // Get the appropriate icon
  const getChangeIcon = () => {
    if (!change) return null;
    return change > 0 ? (
      <IconArrowUpRight size="1rem" color={theme.colors.green[6]} />
    ) : (
      <IconArrowDownRight size="1rem" color={theme.colors.red[6]} />
    );
  };

  return (
    <Card 
      shadow="sm" 
      p="md" 
      radius="md"
      withBorder 
      className={className}
    >
      <TransitionFade show={!loading} duration="NORMAL">
        <Stack spacing="xs">
          <Group position="apart" mb="xs">
            <Text size="sm" color="dimmed" weight={500}>
              {title}
            </Text>
            {icon && (
              <ThemeIcon 
                color={iconColor || 'blue'} 
                variant="light"
                size="lg"
                radius="xl"
              >
                {icon}
              </ThemeIcon>
            )}
          </Group>

          <Group position="apart" align="flex-end" spacing="xs">
            <Title order={3}>{value}</Title>
            {change !== undefined && (
              <Group spacing={5} align="center">
                {getChangeIcon()}
                <Text 
                  size="sm" 
                  weight={500}
                  color={getChangeColor()}
                >
                  {formatChange()}
                </Text>
              </Group>
            )}
          </Group>

          {subtitle && (
            <Text size="xs" color="dimmed">
              {subtitle}
            </Text>
          )}
        </Stack>
      </TransitionFade>
      
      {loading && (
        <Stack spacing="xs">
          <div 
            style={{ 
              height: '1rem', 
              width: '60%', 
              backgroundColor: theme.colors.gray[1],
              borderRadius: theme.radius.sm,
            }} 
          />
          <div 
            style={{ 
              height: '2rem', 
              width: '40%', 
              backgroundColor: theme.colors.gray[1],
              borderRadius: theme.radius.sm,
              marginTop: theme.spacing.sm,
            }} 
          />
          <div 
            style={{ 
              height: '0.75rem', 
              width: '80%', 
              backgroundColor: theme.colors.gray[1],
              borderRadius: theme.radius.sm,
              marginTop: theme.spacing.xs,
            }} 
          />
        </Stack>
      )}
    </Card>
  );
}