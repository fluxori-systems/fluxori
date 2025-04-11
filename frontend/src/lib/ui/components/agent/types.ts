'use client';

import { ReactNode } from 'react';
import { AgentMessageType, AgentState, ConfidenceLevel } from '../AgentMessage';

/**
 * Agent message interface that extends the type for conversation history
 */
export interface AgentMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system' | 'function';
  timestamp: Date;
  confidence?: ConfidenceLevel;
  state?: AgentState;
  type?: AgentMessageType;
  metadata?: Record<string, any>;
  tools?: AgentToolUsage[];
  functionCall?: {
    name: string;
    arguments: Record<string, any>;
  };
}

/**
 * Agent tool usage information
 */
export interface AgentToolUsage {
  id: string;
  name: string;
  count: number;
  duration?: number;
  result?: string;
  status: 'pending' | 'running' | 'success' | 'error';
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Agent conversation context interface
 */
export interface AgentConversationContext {
  /** Conversation ID */
  id: string;
  
  /** Conversation title */
  title: string;
  
  /** Message history */
  messages: AgentMessage[];
  
  /** Current agent state */
  agentState: AgentState;
  
  /** Agent configuration ID */
  agentConfigId: string;

  /** Last message timestamp */
  lastUpdated: Date;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
  
  /** Currently active tools */
  activeTools: AgentToolUsage[];
  
  /** Add a user message to the conversation */
  sendMessage: (message: string, attachments?: any[]) => Promise<void>;
  
  /** Clear the conversation */
  clearConversation: () => void;
  
  /** Load a previous conversation */
  loadConversation: (conversationId: string) => Promise<void>;
  
  /** Update conversation title */
  updateTitle: (title: string) => Promise<void>;
}

/**
 * Interface for conversation provider props
 */
export interface AgentConversationProviderProps {
  children: ReactNode;
  initialConversation?: Partial<AgentConversationContext>;
  agentConfigId?: string;
  onError?: (error: Error) => void;
  networkAware?: boolean;
}

/**
 * Type for agent input suggestion
 */
export interface AgentSuggestion {
  id: string;
  text: string;
  description?: string;
  category?: string;
  priority?: number;
  icon?: ReactNode;
}

/**
 * Agent interactive element types
 */
export type AgentInteractiveElementType = 
  | 'button'
  | 'link'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'input'
  | 'form';

/**
 * Agent interactive element props
 */
export interface AgentInteractiveElementProps {
  /** Element type */
  type: AgentInteractiveElementType;
  
  /** Element label */
  label: string;
  
  /** Element action or callback */
  action: string | (() => void);
  
  /** Element style preset */
  intent?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  
  /** Child elements for complex interactive components */
  children?: ReactNode;
  
  /** Additional props specific to element type */
  [key: string]: any;
}

/**
 * Agent confidence display details
 */
export interface AgentConfidenceDisplayProps {
  /** Confidence level */
  level: ConfidenceLevel;
  
  /** Show detailed explanation */
  showExplanation?: boolean;
  
  /** Detailed explanation text */
  explanation?: string;
  
  /** Visualization type */
  visualizationType?: 'icon' | 'bar' | 'radar' | 'minimal';
  
  /** Custom className */
  className?: string;
}

/**
 * Input props for agent message composition
 */
export interface AgentInputProps {
  /** Placeholder text */
  placeholder?: string;
  
  /** Initial input value */
  initialValue?: string;
  
  /** Whether input is disabled */
  disabled?: boolean;
  
  /** Whether input is loading/processing */
  loading?: boolean;
  
  /** Suggestions to display */
  suggestions?: AgentSuggestion[];
  
  /** Callback when message is sent */
  onSend?: (message: string) => void;
  
  /** Callback when suggestions are selected */
  onSuggestionSelect?: (suggestion: AgentSuggestion) => void;
  
  /** Support for attachments */
  attachmentsEnabled?: boolean;

  /** Network-aware optimizations */
  networkAware?: boolean;
  
  /** Custom class name */
  className?: string;
}