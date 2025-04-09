/**
 * Fluxori UI Component Library
 * Enhanced components that integrate with the design system and motion framework
 * Implements dependency inversion pattern to avoid circular dependencies
 */

// Export all enhanced components
export * from './components';

// Export shared types
export * from './types';

// Export utility functions 
export * from './utils';

// Export hooks
export * from './hooks';

// Export these Mantine components directly (to be replaced with enhanced versions in future)
export {
  Paper,
  AppShell,
  Avatar,
  Badge,
  Checkbox,
  Divider,
  Modal,
  Popover,
  TextInput,
  Textarea,
  Select,
  Switch,
  Tooltip,
  Accordion,
  Drawer,
  ActionIcon,
  Burger,
  Table,
  ThemeIcon,
  Box,
  Center,
  Loader,
  LoadingOverlay,
  Title,
} from '@mantine/core';

// Export shared services and hooks through dependency inversion
// Instead of direct imports from Motion module, use shared interfaces
export { 
  useAnimationService, 
  useConnectionService 
} from '../shared/services';

// Instead of direct exports, re-export from shared module
export type { 
  MotionMode, 
  ConnectionQuality, 
  AnimationMode, 
  AnimationParams
} from '../shared/types';
