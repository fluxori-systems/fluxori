# Credit System for Fluxori

## Overview

The Credit System is a core infrastructure component that tracks, manages, and optimizes AI model usage across the Fluxori platform. It provides a unified way to handle token usage, cost tracking, and credit allocation for various AI-powered features.

## Key Features

- **Credit Allocation**: Support for different credit models (subscription, pay-as-you-go, quota, prepaid)
- **Token Tracking**: Precise tracking of token usage for all AI model interactions
- **Credit Reservation**: Pre-allocate credits for operations to ensure availability
- **Cost Optimization**: Select the most cost-effective models based on requirements
- **Usage Analytics**: Track and report on credit usage patterns
- **Integration with Feature Flags**: Enable/disable credit-intensive features
- **Multi-Provider Support**: Consistent interface for different AI model providers

## Architecture

The Credit System follows a modular architecture with clear boundaries:

1. **Core Services**:
   - `CreditSystemService`: Main service for credit management
   - `TokenTrackingService`: Integration with Agent Framework for token tracking

2. **Repositories**:
   - `CreditAllocationRepository`: Manages credit allocations
   - `CreditTransactionRepository`: Records credit transactions
   - `CreditPricingTierRepository`: Stores pricing tiers for different models
   - `CreditReservationRepository`: Handles credit reservations
   - `CreditUsageLogRepository`: Logs detailed usage information

3. **Integration Adapters**:
   - `AgentFrameworkAdapter`: Integrates with Agent Framework
   - `FeatureFlagAdapter`: Integrates with Feature Flags

## Usage Examples

### Checking Credits for an AI Operation

```typescript
const creditCheck = await creditSystemService.checkCredits({
  organizationId: "org123",
  userId: "user456",
  expectedInputTokens: 1000,
  expectedOutputTokens: 200,
  modelId: "gpt-4",
  usageType: CreditUsageType.MODEL_CALL,
  operationId: "operation789",
});

if (creditCheck.hasCredits) {
  // Proceed with operation
  const reservationId = creditCheck.reservationId;
  // ...
} else {
  // Handle insufficient credits
  console.log(creditCheck.reason);
}
```

### Recording Token Usage

```typescript
await creditSystemService.recordUsage({
  organizationId: "org123",
  userId: "user456",
  usageType: CreditUsageType.MODEL_CALL,
  modelId: "gpt-4",
  modelProvider: "openai",
  inputTokens: 1000,
  outputTokens: 200,
  processingTime: 1200, // ms
  reservationId: "reservation789", // From previous reservation
  success: true,
});
```

### Optimizing Model Selection

```typescript
const modelSelection = await tokenTrackingService.optimizeModelSelection(
  "org123",
  userPrompt,
  "standard", // Complexity requirement
  preferredModel, // Optional preferred model
);

if (modelSelection.model) {
  // Use the recommended model
  console.log(`Using model: ${modelSelection.model.displayName}`);
  console.log(`Reason: ${modelSelection.reason}`);
} else {
  // Handle case where no suitable model is available
}
```

## Integration with Agent Framework

The Credit System integrates with the Agent Framework through the `TokenTrackingService`, which provides:

1. **Pre-operation Credit Checks**: Verifies sufficient credits before AI operations
2. **Token Usage Recording**: Logs actual token usage after operations
3. **Model Selection Optimization**: Chooses the most cost-effective models

## Integration with Feature Flags

The Credit System uses Feature Flags to:

1. **Control Access to Features**: Enable/disable credit-intensive features
2. **Implement Graduated Access**: Roll out features to specific user groups
3. **Emergency Shutdown**: Disable expensive operations in case of issues

## Extending the Credit System

To extend the Credit System for new AI features:

1. Add appropriate usage types to `CreditUsageType` enum
2. Integrate the feature with `TokenTrackingService` for credit checks
3. Implement credit usage recording in the feature
4. Add any specific pricing tiers needed for new models

## Security Considerations

- **Transactional Operations**: All credit operations use transactions to ensure consistency
- **Permissions**: Credit management operations require admin permissions
- **Race Condition Prevention**: Credit reservations prevent concurrent depletion
- **Audit Logs**: All credit transactions are logged for audit purposes

## Performance Considerations

- **Caching**: Pricing information and allocations are cached for performance
- **Asynchronous Logging**: Non-blocking credit usage logging
- **Efficient Token Counting**: Optimized token estimation and counting
- **Batch Operations**: Support for batch credit operations