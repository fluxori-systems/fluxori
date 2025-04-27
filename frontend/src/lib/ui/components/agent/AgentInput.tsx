"use client";

import React, { useState, useRef, useEffect } from "react";

import { Button } from "../Button";
import { Group } from "../Group";
import { AgentSuggestionChip } from "./AgentSuggestionChip";
import { AgentSuggestion, AgentInputProps } from "./types";
import { useConnectionQuality } from "../../../motion/hooks";

/**
 * Input component for typing messages to agents
 * Includes suggestions and attachment support
 */
export function AgentInput({
  placeholder = "Type a message...",
  initialValue = "",
  disabled = false,
  loading = false,
  suggestions = [],
  onSend,
  onSuggestionSelect,
  attachmentsEnabled = false,
  networkAware = true,
  className = "",
  ...props
}: AgentInputProps) {
  const [message, setMessage] = useState(initialValue);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(
    suggestions.length > 0,
  );
  const [activeSuggestions, setActiveSuggestions] =
    useState<AgentSuggestion[]>(suggestions);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { quality } = useConnectionQuality();

  // Adjust UI based on network quality if networkAware is enabled
  const simplifiedUI = networkAware && quality === "low";

  // Auto-resize textarea as content grows
  const autoResizeTextarea = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";

      // Limit height growth on low network connections
      const maxHeight = simplifiedUI ? 120 : 200;
      const scrollHeight = Math.min(inputRef.current.scrollHeight, maxHeight);

      inputRef.current.style.height = `${scrollHeight}px`;
    }
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  // Handle sending a message
  const handleSend = () => {
    if (message.trim() && onSend) {
      onSend(message);
      setMessage("");
      setAttachments([]);
      setShowSuggestions(false);

      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }

      // Focus the input after sending
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  // Handle selecting a suggestion
  const handleSuggestionSelect = (suggestion: AgentSuggestion) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }

    setMessage(suggestion.text);
    setShowSuggestions(false);

    // Focus the input after selection
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize when content changes
  useEffect(() => {
    autoResizeTextarea();
  }, [message]);

  // Update the active suggestions when the input prop changes
  useEffect(() => {
    setActiveSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
  }, [suggestions]);

  // Conditionally render suggestions
  const renderSuggestions = () => {
    if (!showSuggestions || activeSuggestions.length === 0) return null;

    // On slow connections, limit the number of suggestions
    const displayedSuggestions = simplifiedUI
      ? activeSuggestions.slice(0, 3)
      : activeSuggestions;

    return (
      <div
        className="agent-input-suggestions"
        style={{
          marginBottom: "var(--spacing-sm)",
          maxHeight: simplifiedUI ? "60px" : "120px",
          overflow: "auto",
        }}
      >
        <Group gap="xs" wrap="wrap">
          {displayedSuggestions.map((suggestion) => (
            <AgentSuggestionChip
              key={suggestion.id}
              suggestion={suggestion}
              onClick={() => handleSuggestionSelect(suggestion)}
              disabled={disabled || loading}
              networkAware={networkAware}
            />
          ))}
        </Group>
      </div>
    );
  };

  // Render attachment preview if attachments are present
  const renderAttachments = () => {
    if (!attachmentsEnabled || attachments.length === 0) return null;

    return (
      <div
        className="agent-input-attachments"
        style={{
          marginBottom: "var(--spacing-sm)",
        }}
      >
        <Group gap="xs" wrap="wrap">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              style={{
                padding: "4px 8px",
                backgroundColor: "var(--color-neutral-100)",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--font-size-sm)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>{`File ${index + 1}`}</span>
              <button
                onClick={() =>
                  setAttachments((prev) => prev.filter((_, i) => i !== index))
                }
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "var(--color-neutral-600)",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </Group>
      </div>
    );
  };

  return (
    <div className={`agent-input ${className}`} {...props}>
      {renderSuggestions()}
      {renderAttachments()}

      <div
        className="agent-input-container"
        style={{
          display: "flex",
          gap: "var(--spacing-sm)",
          alignItems: "flex-end",
          backgroundColor: "var(--background-default)",
          border: "1px solid var(--border-light)",
          borderRadius: "var(--radius-md)",
          padding: "8px 12px",
        }}
      >
        {attachmentsEnabled && !simplifiedUI && (
          <button
            type="button"
            title="Add attachment"
            disabled={disabled || loading}
            style={{
              background: "none",
              border: "none",
              cursor: disabled || loading ? "not-allowed" : "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-neutral-600)",
              opacity: disabled || loading ? 0.5 : 1,
            }}
            onClick={() => {
              // In a real implementation, this would open a file picker
              setAttachments((prev) => [
                ...prev,
                { type: "file", name: `File ${prev.length + 1}` },
              ]);
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 14V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V6C3 4.89543 3.89543 4 5 4H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13 15L13 8C13 6.34315 14.3431 5 16 5V5C17.6569 5 19 6.34315 19 8V15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17 15V10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 15V10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        <textarea
          ref={inputRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            resize: "none",
            backgroundColor: "transparent",
            minHeight: "24px",
            maxHeight: simplifiedUI ? "120px" : "200px",
            padding: "4px",
            fontSize: "var(--font-size-md)",
            fontFamily: "var(--font-family-body)",
            color: "var(--text-primary)",
          }}
        />

        <Button
          onClick={handleSend}
          disabled={disabled || loading || !message.trim()}
          loading={loading}
          size="sm"
          intent="primary"
          animated={!simplifiedUI}
          style={{ alignSelf: "flex-end" }}
        >
          Send
        </Button>
      </div>
    </div>
  );
}
