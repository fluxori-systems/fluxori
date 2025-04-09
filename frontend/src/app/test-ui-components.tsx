'use client';

import React from 'react';
import { Text, Group, Stack, Button } from '@/lib/ui/components';

// A test component to verify our UI components work
export default function TestUIComponents() {
  return (
    <Stack gap="lg">
      <Text fw={700} c="blue">This is a properly typed Text component</Text>
      
      <Group justify="apart">
        <Text>Left aligned</Text>
        <Text>Right aligned</Text>
      </Group>
      
      <Button leftSection={<span>🚀</span>}>
        Click me
      </Button>
    </Stack>
  );
}