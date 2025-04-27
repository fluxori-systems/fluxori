"use client";

import { ReactNode, useState, useEffect, useRef } from "react";

import { gsap } from "gsap";

import { Card } from "./Card";
import { Text } from "./Text";
import { AIProcessingIndicator, StreamingText, useMotion } from "../../motion";

/**
 * Agent message types for different contexts
 */
export type AgentMessageType =
  | "user"
  | "agent"
  | "system"
  | "error"
  | "warning"
  | "info";

/**
 * Confidence level indicators
 */
export type ConfidenceLevel = "high" | "medium" | "low" | "unknown";

/**
 * Agent processing state
 */
export type AgentState =
  | "idle"
  | "thinking"
  | "processing"
  | "streaming"
  | "complete"
  | "error";

export interface AgentMessageProps {
  /** Message content */
  children?: ReactNode;

  /** Message text content (for streaming effect) */
  content?: string;

  /** Message type */
  type?: AgentMessageType;

  /** Avatar URL or component */
  avatar?: string | ReactNode;

  /** Sender name */
  sender?: string;

  /** Timestamp */
  timestamp?: string | Date;

  /** Confidence level */
  confidence?: ConfidenceLevel;

  /** Agent state */
  state?: AgentState;

  /** Show confidence indicator */
  showConfidence?: boolean;

  /** Show tools used */
  showTools?: boolean;

  /** Tools used in message */
  tools?: { name: string; count: number }[];

  /** Enable text streaming effect */
  streaming?: boolean;

  /** Streaming speed */
  streamingSpeed?: "slow" | "normal" | "fast";

  /** Additional className */
  className?: string;

  /** Additional style */
  style?: React.CSSProperties;

  /** Other props */
  [key: string]: any;
}

/**
 * Agent Message component for displaying messages with different states and confidence indicators
 * Integrates with the motion framework for animations
 */
export function AgentMessage({
  children,
  content,
  type = "agent",
  avatar,
  sender = type === "agent" ? "Assistant" : type === "user" ? "You" : "System",
  timestamp,
  confidence = "high",
  state = "complete",
  showConfidence = type === "agent",
  showTools = false,
  tools = [],
  streaming = false,
  streamingSpeed = "normal",
  className = "",
  style,
  ...props
}: AgentMessageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { motionMode } = useMotion();
  const messageRef = useRef<HTMLDivElement>(null);

  // Format timestamp
  const formattedTimestamp =
    timestamp instanceof Date
      ? timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : timestamp;

  // Get message variant based on type
  const getMessageVariant = (): "default" | "filled" | "outlined" => {
    switch (type) {
      case "user":
        return "outlined";
      case "system":
      case "info":
      case "warning":
      case "error":
        return "filled";
      default:
        return "default";
    }
  };

  // Get color based on type
  const getMessageColor = (): string => {
    switch (type) {
      case "user":
        return "var(--color-primary-100)";
      case "system":
        return "var(--color-neutral-100)";
      case "error":
        return "var(--color-error-light)";
      case "warning":
        return "var(--color-warning-light)";
      case "info":
        return "var(--color-info-light)";
      default:
        return "var(--background-card)";
    }
  };

  // Get border color based on type
  const getBorderColor = (): string => {
    switch (type) {
      case "user":
        return "var(--color-primary-300)";
      case "system":
        return "var(--color-neutral-300)";
      case "error":
        return "var(--color-error-base)";
      case "warning":
        return "var(--color-warning-base)";
      case "info":
        return "var(--color-info-base)";
      default:
        return "var(--border-light)";
    }
  };

  // Get confidence indicator color
  const getConfidenceColor = (): string => {
    switch (confidence) {
      case "high":
        return "var(--color-success-base)";
      case "medium":
        return "var(--color-warning-base)";
      case "low":
        return "var(--color-error-base)";
      default:
        return "var(--color-neutral-400)";
    }
  };

  // Entry animation
  useEffect(() => {
    if (messageRef.current && motionMode !== "minimal") {
      setIsVisible(true);

      gsap.fromTo(
        messageRef.current,
        {
          y: 20,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
        },
      );
    } else {
      setIsVisible(true);
    }
  }, [motionMode]);

  // Helper to render avatar
  const renderAvatar = () => {
    if (!avatar) {
      // Default avatars
      if (type === "agent") {
        return (
          <div
            className="flx-agent-message-avatar flx-agent-message-avatar-default"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "var(--color-primary-500)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            A
          </div>
        );
      }
      if (type === "user") {
        return (
          <div
            className="flx-agent-message-avatar flx-agent-message-avatar-user"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "var(--color-neutral-200)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-primary)",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            U
          </div>
        );
      }
      return null;
    }

    // Custom avatar
    if (typeof avatar === "string") {
      return (
        <div
          className="flx-agent-message-avatar"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundImage: `url(${avatar})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      );
    }

    return avatar;
  };

  // Helper to render confidence indicator
  const renderConfidenceIndicator = () => {
    if (!showConfidence) return null;

    return (
      <div
        className={`flx-agent-message-confidence flx-agent-message-confidence-${confidence}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-xs)",
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: getConfidenceColor(),
          }}
        />
        <Text size="xs" c="var(--text-secondary)">
          {confidence === "high"
            ? "High confidence"
            : confidence === "medium"
              ? "Medium confidence"
              : confidence === "low"
                ? "Low confidence"
                : "Unknown confidence"}
        </Text>
      </div>
    );
  };

  // Helper to render tools used
  const renderToolsUsed = () => {
    if (!showTools || !tools.length) return null;

    return (
      <div
        className="flx-agent-message-tools"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--spacing-xs)",
          marginTop: "var(--spacing-sm)",
        }}
      >
        <Text size="xs" c="var(--text-secondary)">
          Tools used:
        </Text>
        {tools.map((tool, index) => (
          <div
            key={index}
            style={{
              backgroundColor: "var(--color-neutral-100)",
              borderRadius: "var(--radius-sm)",
              padding: "2px 6px",
              fontSize: 12,
            }}
          >
            {tool.name} {tool.count > 1 && `(${tool.count})`}
          </div>
        ))}
      </div>
    );
  };

  // Helper to render processing indicator
  const renderProcessingIndicator = () => {
    if (state === "idle" || state === "complete") return null;

    return (
      <div style={{ marginBottom: "var(--spacing-sm)" }}>
        <AIProcessingIndicator
          state={
            state === "error"
              ? "idle"
              : state === "streaming"
                ? "processing"
                : state
          }
          size={24}
          color="var(--color-primary-500)"
        />
      </div>
    );
  };

  // Custom styles
  const messageStyles: React.CSSProperties = {
    backgroundColor: getMessageColor(),
    border: `1px solid ${getBorderColor()}`,
    opacity: isVisible ? 1 : 0,
    ...style,
  };

  // Alignment based on message type
  const isUserMessage = type === "user";
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: isUserMessage ? "flex-end" : "flex-start",
    maxWidth: "100%",
    marginBottom: "var(--spacing-lg)",
  };

  // Header styles
  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--spacing-sm)",
    marginBottom: "var(--spacing-xs)",
  };

  return (
    <div
      className={`flx-agent-message flx-agent-message-${type} ${className}`}
      style={containerStyle}
      ref={messageRef}
      {...props}
    >
      <div style={headerStyle}>
        {!isUserMessage && renderAvatar()}
        <Text preset="label">{sender}</Text>
        {formattedTimestamp && (
          <Text preset="caption">{formattedTimestamp}</Text>
        )}
        {isUserMessage && renderAvatar()}
      </div>

      <Card
        variant={getMessageVariant()}
        shadow="xs"
        radius="md"
        p="md"
        style={messageStyles}
        className={`flx-agent-message-card flx-agent-message-card-${type}`}
        w={isUserMessage ? "auto" : "100%"}
        withBorder={false}
      >
        {renderProcessingIndicator()}

        {/* Message content */}
        {streaming && content ? (
          <StreamingText text={content} speed={streamingSpeed} />
        ) : (
          <div className="flx-agent-message-content">{children || content}</div>
        )}

        {/* Footer with confidence and tools used */}
        <div
          style={{
            marginTop:
              showConfidence || (showTools && tools.length)
                ? "var(--spacing-sm)"
                : 0,
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-xs)",
          }}
        >
          {renderConfidenceIndicator()}
          {renderToolsUsed()}
        </div>
      </Card>
    </div>
  );
}
