import { Metadata } from 'next';
import { Container, Paper } from '@mantine/core';
import { AIShowcase } from '@/components/ai/demo';

export const metadata: Metadata = {
  title: 'AI Components | Fluxori',
  description: 'Showcase of AI components with motion design principles',
};

/**
 * Page that demonstrates the AI components with motion design integration
 */
export default function AIShowcasePage() {
  return (
    <Container size="lg" py="xl">
      <Paper p="xl" shadow="xs" withBorder>
        <AIShowcase />
      </Paper>
    </Container>
  );
}