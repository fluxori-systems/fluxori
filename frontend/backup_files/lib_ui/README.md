# UI Library

This UI library provides a consistent set of components for building the Fluxori frontend.

## Usage

```tsx
import { Button, Text, Stack } from '@/lib/ui';

function MyComponent() {
  return (
    <Stack spacing="md">
      <Text weight={500}>Hello world</Text>
      <Button onClick={() => console.log('Clicked')}>Click me</Button>
    </Stack>
  );
}
```

## Philosophy

- **Type Safety**: All components are fully typed
- **Consistency**: Consistent API across components
- **Simplicity**: Simple, intuitive API for common use cases
- **Extensibility**: Easy to extend and customize

## Components

The library includes wrappers around Mantine UI components to ensure proper typing and consistent API.
