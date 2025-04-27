"use client";

/**
 * Agent Interaction Components Public API
 *
 * This file exports all the agent interaction components that power Fluxori's
 * agent-first interface approach. These components represent the primary way
 * users will interact with the platform through conversational interfaces.
 */

// Export all components
export {
  AgentConversation,
  AgentConversationProvider,
  useAgentConversation,
} from "./AgentConversation";

export { AgentInput } from "./AgentInput";
export { AgentSuggestionChip } from "./AgentSuggestionChip";
export { AgentToolUsage } from "./AgentToolUsage";
export { AgentStateIndicator } from "./AgentStateIndicator";
export { AgentConfidenceDisplay } from "./AgentConfidenceDisplay";
export { AgentInteractiveElement } from "./AgentInteractiveElement";

// Export types for external use
export * from "./types";
