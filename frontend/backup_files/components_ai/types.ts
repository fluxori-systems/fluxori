/**
 * Types for AI components and functionality
 */

export interface ChatMessage {
  /** Unique ID for the message */
  id: string;
  /** The message content */
  content: string;
  /** Who sent the message */
  role: 'user' | 'assistant' | 'system';
  /** Timestamp when the message was created */
  timestamp: Date;
  /** Whether the message is currently being streamed */
  isStreaming?: boolean;
  /** Metadata for the message */
  metadata?: Record<string, any>;
}

export interface AIChatProps {
  /** List of chat messages */
  messages: ChatMessage[];
  /** Whether the AI is currently processing */
  isProcessing?: boolean;
  /** Function to handle sending a new message */
  onSendMessage: (message: string) => void;
  /** Controls whether the text input is enabled */
  isInputEnabled?: boolean;
  /** Placeholder text for the input field */
  inputPlaceholder?: string;
  /** Label for the send button */
  sendButtonLabel?: string;
}

export interface AIState {
  /** Current confidence level of AI system (0-1) */
  confidence: number;
  /** Whether the AI is currently processing */
  isProcessing: boolean;
  /** The current status of the AI system */
  status: 'idle' | 'thinking' | 'processing' | 'responding' | 'error';
  /** Error message if status is 'error' */
  error?: string;
  /** Progress of AI task (0-100) */
  progress?: number;
}
