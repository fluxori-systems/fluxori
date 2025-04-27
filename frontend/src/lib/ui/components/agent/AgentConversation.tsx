"use client";

import React, {
  createContext as reactCreateContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

// Create context with a different name to avoid conflict
const createContext = reactCreateContext;
import { v4 as uuidv4 } from "uuid";

import { AgentMessage as AgentMessageComponent } from "../AgentMessage";
import { Stack } from "../Stack";
import { Text } from "../Text";
import { AgentInput } from "./AgentInput";
import {
  AgentMessage,
  AgentConversationContext,
  AgentConversationProviderProps,
  AgentToolUsage,
} from "./types";
import { useConnectionQuality } from "../../../motion/hooks";

// Create context with default values
const AgentConversationContextValue = createContext<
  AgentConversationContext | undefined
>(undefined);

/**
 * Custom hook for accessing the agent conversation context
 */
export function useAgentConversation() {
  const context = useContext(AgentConversationContextValue);
  if (!context) {
    throw new Error(
      "useAgentConversation must be used within an AgentConversationProvider",
    );
  }
  return context;
}

/**
 * Provider component that makes agent conversation context available to child components
 */
export function AgentConversationProvider({
  children,
  initialConversation,
  agentConfigId = "default",
  onError,
  networkAware = true,
}: AgentConversationProviderProps) {
  // Connection quality for network-aware features
  const { quality } = useConnectionQuality();

  // Parse initial date if provided as string
  const initialLastUpdated = initialConversation?.lastUpdated
    ? new Date(initialConversation.lastUpdated)
    : new Date();

  // State management for conversation
  const [id, setId] = useState<string>(initialConversation?.id || uuidv4());
  const [title, setTitle] = useState<string>(
    initialConversation?.title || "New Conversation",
  );
  const [messages, setMessages] = useState<AgentMessage[]>(
    initialConversation?.messages || [],
  );
  const [agentState, setAgentState] = useState<
    "idle" | "thinking" | "processing" | "streaming" | "complete" | "error"
  >(initialConversation?.agentState || "idle");
  const [activeTools, setActiveTools] = useState<AgentToolUsage[]>(
    initialConversation?.activeTools || [],
  );
  const [lastUpdated, setLastUpdated] = useState<Date>(initialLastUpdated);
  const [metadata, setMetadata] = useState<Record<string, any>>(
    initialConversation?.metadata || {},
  );

  // Mock API for sending messages to backend agent service
  // In a real implementation, this would use the actual agent service API
  const sendMessage = useCallback(
    async (content: string, attachments?: any[]) => {
      try {
        // Create user message
        const userMessage: AgentMessage = {
          id: uuidv4(),
          content,
          role: "user",
          timestamp: new Date(),
          metadata: attachments ? { attachments } : undefined,
        };

        // Add user message to conversation
        setMessages((prev) => [...prev, userMessage]);
        setLastUpdated(new Date());

        // Set agent to thinking state
        setAgentState("thinking");

        // Simulate network delay (would be real API call in production)
        // Adjust delay based on network quality for better experience on slow networks
        const networkDelay = networkAware && quality === "low" ? 500 : 1500;
        await new Promise((resolve) => setTimeout(resolve, networkDelay));

        // Simulate agent selecting and using tools
        const mockTool: AgentToolUsage = {
          id: uuidv4(),
          name: "search",
          count: 1,
          status: "running",
          timestamp: new Date(),
        };

        setActiveTools([mockTool]);
        setAgentState("processing");

        // Simulate tool processing time
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Update tool status
        setActiveTools((prev) =>
          prev.map((tool) =>
            tool.id === mockTool.id
              ? {
                  ...tool,
                  status: "success",
                  result: "Found relevant information",
                }
              : tool,
          ),
        );

        // Simulate agent generating response
        setAgentState("streaming");

        // Simulate streaming response
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Add agent response to conversation
        const agentResponse: AgentMessage = {
          id: uuidv4(),
          content: `Here's a response to your message: "${content}"\n\nThis is a simulated response for the agent interaction prototype. In the final implementation, this will be connected to the real agent framework backend.`,
          role: "assistant",
          timestamp: new Date(),
          confidence: "high",
          tools: [{ ...mockTool, status: "success" }],
        };

        setMessages((prev) => [...prev, agentResponse]);
        setActiveTools([]);
        setAgentState("complete");
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Error sending message:", error);
        setAgentState("error");

        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    },
    [quality, networkAware, onError],
  );

  // Clear the current conversation and start a new one
  const clearConversation = useCallback(() => {
    const newId = uuidv4();
    setId(newId);
    setTitle("New Conversation");
    setMessages([]);
    setActiveTools([]);
    setAgentState("idle");
    setLastUpdated(new Date());
    setMetadata({});
  }, []);

  // Load a specific conversation by ID
  const loadConversation = useCallback(
    async (conversationId: string) => {
      try {
        setAgentState("processing");

        // In a real implementation, this would fetch the conversation from the API
        // For the prototype, we'll simulate loading with a delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // For demo purposes, we're just setting a mock conversation
        // In production, this would be fetched from the API
        const mockConversation = {
          id: conversationId,
          title: `Loaded Conversation ${conversationId.slice(0, 8)}`,
          messages: [
            {
              id: uuidv4(),
              content: "This is a previously loaded conversation.",
              role: "user" as const,
              timestamp: new Date(Date.now() - 60000),
            },
            {
              id: uuidv4(),
              content:
                "I understand you want to access a previous conversation. Here it is!",
              role: "assistant" as const,
              timestamp: new Date(Date.now() - 55000),
              confidence: "high" as const,
            },
          ],
          lastUpdated: new Date(),
          metadata: { source: "loaded" },
        };

        setId(mockConversation.id);
        setTitle(mockConversation.title);
        setMessages(mockConversation.messages);
        setLastUpdated(mockConversation.lastUpdated);
        setMetadata(mockConversation.metadata);
        setAgentState("complete");
      } catch (error) {
        console.error("Error loading conversation:", error);
        setAgentState("error");

        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    },
    [onError],
  );

  // Update conversation title
  const updateTitle = useCallback(
    async (newTitle: string) => {
      try {
        setTitle(newTitle);
        setLastUpdated(new Date());

        // In a real implementation, this would update the title in the backend
        // For the prototype, we're just updating local state
      } catch (error) {
        console.error("Error updating title:", error);

        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    },
    [onError],
  );

  // Combine all context values
  const contextValue = {
    id,
    title,
    messages,
    agentState,
    agentConfigId,
    lastUpdated,
    metadata,
    activeTools,
    sendMessage,
    clearConversation,
    loadConversation,
    updateTitle,
  };

  return (
    <AgentConversationContextValue.Provider value={contextValue}>
      {children}
    </AgentConversationContextValue.Provider>
  );
}

/**
 * Agent conversation component that displays the conversation and input area
 */
export function AgentConversation({
  showTitle = true,
  showInput = true,
  height = "100%",
  className = "",
  style,
  children,
  enableSuggestions = true,
  networkAware = true,
  placeholder = "Type a message...",
  suggestions = [],
  ...props
}: {
  showTitle?: boolean;
  showInput?: boolean;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
  enableSuggestions?: boolean;
  networkAware?: boolean;
  placeholder?: string;
  suggestions?: Array<{ id: string; text: string }>;
  [key: string]: any;
}) {
  const { title, messages, agentState, sendMessage, activeTools } =
    useAgentConversation();

  // Component styles
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    height,
    width: "100%",
    overflow: "hidden",
    ...style,
  };

  const conversationStyle: React.CSSProperties = {
    flex: 1,
    overflow: "auto",
    padding: "var(--spacing-md)",
  };

  return (
    <div
      className={`agent-conversation ${className}`}
      style={containerStyle}
      {...props}
    >
      {showTitle && (
        <div
          className="agent-conversation-header"
          style={{
            padding: "var(--spacing-md)",
            borderBottom: "1px solid var(--border-light)",
            backgroundColor: "var(--background-subtle)",
          }}
        >
          <Text fw={600}>{title}</Text>
        </div>
      )}

      <div className="agent-conversation-messages" style={conversationStyle}>
        <Stack gap="md">
          {messages.map((message) => (
            <AgentMessageComponent
              key={message.id}
              type={
                message.role === "user"
                  ? "user"
                  : message.role === "system"
                    ? "system"
                    : "agent"
              }
              content={message.content}
              state={message.state}
              confidence={message.confidence}
              timestamp={message.timestamp}
              showTools={message.tools?.length ? true : false}
              tools={message.tools?.map((tool) => ({
                name: tool.name,
                count: tool.count,
              }))}
            />
          ))}

          {agentState !== "idle" && agentState !== "complete" && (
            <AgentMessageComponent
              type="agent"
              state={agentState}
              content=""
              showTools={activeTools.length > 0}
              tools={activeTools.map((tool) => ({
                name: tool.name,
                count: tool.count,
              }))}
            />
          )}

          {children}
        </Stack>
      </div>

      {showInput && (
        <div
          className="agent-conversation-input"
          style={{
            padding: "var(--spacing-md)",
            borderTop: "1px solid var(--border-light)",
            backgroundColor: "var(--background-subtle)",
          }}
        >
          <AgentInput
            placeholder={placeholder}
            disabled={
              agentState === "thinking" ||
              agentState === "processing" ||
              agentState === "streaming"
            }
            loading={
              agentState !== "idle" &&
              agentState !== "complete" &&
              agentState !== "error"
            }
            onSend={sendMessage}
            suggestions={enableSuggestions ? suggestions : []}
            networkAware={networkAware}
            attachmentsEnabled={true}
          />
        </div>
      )}
    </div>
  );
}
