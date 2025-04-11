// Re-export UI components with proper Mantine v7 compatibility

// Core structural components
export { Button } from './Button';
export { Text } from './Text';
export { Group } from './Group';
export { Stack } from './Stack';
export { Grid } from './Grid';
export { SimpleGrid } from './SimpleGrid';
export { Container } from './Container';
export { Card, CardSection } from './Card';

// Interactive and navigation components
export { Menu } from './Menu';
export { Tabs } from './Tabs';

// Form components
export { FormField } from './FormField';

// Feedback and notification components
export { Alert } from './Alert';

// Agent-focused components
export { AgentMessage } from './AgentMessage';
export { 
  AgentConversation,
  AgentConversationProvider,
  useAgentConversation,
  AgentInput,
  AgentToolUsage,
  AgentStateIndicator,
  AgentConfidenceDisplay,
  AgentInteractiveElement,
  AgentSuggestionChip
} from './agent';

// Dashboard components
export { 
  DashboardLayout,
  DashboardGrid,
  DashboardSection,
  DashboardCard,
  MetricCard,
  ChartCard
} from './dashboard';

// Demo and documentation
export { ComponentShowcase } from './ComponentShowcase';