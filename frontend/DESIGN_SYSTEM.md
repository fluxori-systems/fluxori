# Fluxori Design System & Motion Framework
Revised and Enhanced Edition

## Core Design Philosophy: The Agent-First Interface

Fluxori's design system reflects our unique position as an agent-first e-commerce operations platform. Unlike conventional dashboards with complex UI layers, our design system prioritizes the interaction between users and intelligent agents, creating an interface where the AI is the primary interaction method.

### Guiding Principles

#### Verbs Over Nouns: Design for actions and workflows, not static elements

- Focus on what users want to accomplish (analyze inventory, optimize pricing)
- Reduce UI complexity in favor of natural language interactions
- Visualize agent workflows when complexity requires transparency
- Balance consideration: Maintain familiar UI elements for critical or frequent tasks

#### Progressive Intelligence: Interface adapts to user capabilities and context

- New users receive more guidance and structure
- Experienced users gain access to more powerful, streamlined interactions
- Context-aware UI that highlights relevant options based on current tasks
- Experience layers: Clearly defined progression from guided to advanced interactions

#### Ambient Awareness: System communicates state without overwhelming

- Clear, multimodal feedback about agent activity
- Subtle visual cues for background processes
- Minimal but informative loading states
- Confidence visualization: Transparent indication of agent certainty levels

#### South African Optimization: Designed for the region's specific challenges

- Mobile-first approach for the predominantly mobile market
- Performance optimization for variable connection speeds
- Data-efficient interactions for bandwidth-constrained users (average cost: R85/GB)
- Offline capabilities for essential functions
- Regional context: Support for local payment methods, logistics providers, and marketplace integrations

#### Agent Appropriateness Framework

- Complexity assessment: Use agents only for tasks requiring dynamic decision-making
- Value threshold: Reserve agent interactions for high-value operations (>R1000 value impact)
- Error tolerance: Implement human-in-the-loop safeguards for high-risk operations
- Fallback patterns: Clear workflows for when agent capabilities aren't sufficient
- Hybrid approach: Combine static UI elements with agent capabilities based on the task requirements

## Visual Language

### Typography System

#### Primary Font Family: Inter

| Element | Weight | Size | Line Height | Usage |
|---------|--------|------|-------------|-------|
| Headings H1 | 700 | 28px | 36px | Page titles |
| Headings H2 | 600 | 24px | 32px | Section headers |
| Headings H3 | 600 | 20px | 28px | Card titles, panel headers |
| Body | 400 | 16px | 24px | Primary content |
| Small/Caption | 400 | 14px | 20px | Secondary information, labels |
| Micro | 500 | 12px | 16px | Metadata, timestamps |

#### Secondary Font Family: Space Grotesk

| Element | Weight | Size | Line Height | Usage |
|---------|--------|------|-------------|-------|
| Agent Responses | 400 | 16px | 24px | AI-generated content |
| Data Viz Labels | 500 | 14px | 20px | Chart labels, numerical data |
| Code/Technical | 400 | 14px | 20px | Code, technical data |

Font Pairing Rationale: Inter provides excellent readability for interface elements, while Space Grotesk offers a slightly more distinctive character for agent-generated content, creating subtle visual distinction between system UI and AI-generated content.

### Color System

#### Primary Palette

- Primary: #3055EE (blue)
  - Contrast ratio with white: 4.5:1 (WCAG AA compliant)
  - Contrast ratio with black: 8.7:1 (WCAG AAA compliant)
- Primary Light: #D0D9FC
- Primary Lighter: #EDF1FE

#### Secondary Palette

- Secondary: #2C3E50 (slate)
  - Contrast ratio with white: 10.7:1 (WCAG AAA compliant)
- Secondary Light: #95A5A6
- Secondary Lighter: #ECF0F1

#### Semantic Colors

- Success: #10B981 (WCAG AA compliant with black text)
- Warning: #F59E0B (WCAG AA compliant with black text)
- Error: #EF4444 (WCAG AA compliant with white text)
- Info: #3498DB (WCAG AA compliant with black text)

#### Neutrals

- Black: #000000
- Gray 900: #1A202C
- Gray 800: #2D3748
- Gray 700: #4A5568
- Gray 600: #718096
- Gray 500: #A0AEC0
- Gray 400: #CBD5E0
- Gray 300: #E2E8F0
- Gray 200: #EDF2F7
- Gray 100: #F7FAFC
- White: #FFFFFF

#### Dark Mode Adjustments

- Background: #121212
- Surface: #1E1E1E
- Higher Surfaces: #2C2C2C
- Highest Surfaces: #333333

#### Accessibility Considerations

- All text colors maintain minimum 4.5:1 contrast ratio against their backgrounds (WCAG AA)
- Interactive elements have a 3:1 contrast ratio against adjacent colors
- Color is never the sole indicator of meaning (always paired with text or icons)
- Color blindness accommodations with redundant visual cues

### Elevation & Shadows

| Level | Usage | Shadow Value (Light Mode) | Shadow Value (Dark Mode) |
|-------|-------|---------------------------|--------------------------|
| 0 | Flat elements | none | none |
| 1 | Cards, navigation | 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06) | 0 1px 3px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.15) |
| 2 | Dropdowns, popovers | 0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06) | 0 4px 6px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2) |
| 3 | Dialogs, modals | 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05) | 0 10px 15px rgba(0,0,0,0.35), 0 4px 6px rgba(0,0,0,0.2) |
| 4 | Highest elevation elements | 0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04) | 0 20px 25px rgba(0,0,0,0.4), 0 10px 10px rgba(0,0,0,0.2) |

Shadow Usage Guidelines:
- Shadows should communicate interactive hierarchy
- Higher elevation = higher importance or user attention
- Dark mode shadows use higher opacity values for better visibility
- Shadow use should be judicious and purposeful

## Motion Design Framework

### Core Motion Principles

#### 1. Purposeful Intelligence
Animations communicate meaning and reflect our AI-powered platform:

- Informative Motion: Every animation serves a purpose - guiding attention, showing relationships, or providing feedback
- Spatial Relationships: Movement helps users understand how interface elements relate to each other
- Context Preservation: Transitions maintain context and continuity between states
- AI Feedback: Subtle animations indicate AI processing and decision-making
- Confidence Indicators: Animation intensity and character correlates with agent certainty levels

Example: When an agent is analyzing inventory data, a subtle pulsing animation on the data visualization indicates processing, with the pulse becoming more regular and defined as confidence in the analysis increases.

#### 2. Fluid Efficiency
Animations are smooth and optimized for performance:

- Performance First: All animations optimized for minimal CPU/GPU impact (<5% CPU usage)
- Natural Physics: Movement follows natural physical properties with appropriate easing and momentum
- Timing Discipline: Animations are quick enough to feel responsive but slow enough to be perceived
- Reduced Motion Support: All animations respect user preferences for reduced motion
- Resource Awareness: Animation complexity scales with device capabilities
- Data Usage Consideration: Optional setting to reduce animation complexity for data-sensitive connections

Implementation Metrics:
- Target animation frame rate: 60fps on mid-range devices
- Animation bundle size: <40KB (gzipped)
- CPU usage during animations: <5% on target devices

#### 3. Precision & Accuracy
Animations are exact and intentional:

- Calibrated Timing: Precise durations for different animation types
- Purposeful Easing: Specific easing functions for different motion purposes
- Coordinated Sequences: Related elements animate in harmonious coordination
- Consistent Implementation: Similar UI elements animate in similar ways
- Risk-Appropriate Motion: More subtle animations for high-stakes operations

Orchestration Pattern: When multiple elements need to animate together (like a dashboard refresh), stagger elements by 50ms in a logical reading pattern (top to bottom, left to right) to create a sense of flow without overwhelming the user.

### Animation Timing Reference

| Animation Type | Duration | Easing Function | Data Cost | Notes |
|----------------|----------|-----------------|-----------|-------|
| Micro-interactions | 100-150ms | ease-out | Minimal | Button clicks, toggles, ripples |
| Element transitions | 200-300ms | ease-in-out | Low | Cards appearing/disappearing, expansion |
| Page transitions | 300-400ms | cubic-bezier(0.83, 0, 0.17, 1) | Medium | Moving between major views |
| Agent thinking indicators | Ongoing | ease-in-out (looping) | Low | Subtle pulsing during AI processing |
| Data visualization updates | 500-800ms | ease-out | Medium | Chart transitions, data refreshes |
| High-stakes confirmations | 400-600ms | ease-in-out | Medium | Actions with significant consequences |

## South African Optimizations

### Market-Specific Considerations

- Mobile-first approach: Most users access via mobile devices
- Variable connection speeds: Urban fiber vs. rural connections
- Data costs: Average R85/GB, requiring data-efficient UX
- Device diversity: From feature phones to high-end smartphones
- Regional payment methods: Support for local payment systems
- Marketplace integrations: Local e-commerce platforms

### Performance Optimization Strategies

- Progressive loading: Critical content first
- Data usage indicators: Show users estimated data consumption
- Image optimization: Adaptive resolution based on network quality
- Offline capabilities: Core functions available without connection
- Reduced animation: Option to minimize animation for data-sensitive users
- Bandwidth-aware: Adjust experience based on network conditions

### Agent Appropriateness Framework

- Value threshold: Only use agent for operations with >R1000 impact in data-constrained environments
- Complexity assessment: Use agents for complex decision-making, static UI for simple tasks
- Data efficiency ratio: Agent interactions must be more data-efficient than equivalent UI flow
- Human-in-loop safeguards: Verification steps for high-risk operations
- Fallback patterns: Alternative workflows when agent capabilities aren't available

### Implementation Details

- Network quality detection: Real-time assessment of connection type, speed, and stability
- Device capability detection: Memory, CPU, and browser feature detection
- Regional optimization profiles: Pre-configured settings for different regions of South Africa
- Data usage estimation: Calculate and display costs in local currency (Rand)
- Adaptive complexity: Scale UI and agent capabilities based on device and network

## Implementation Resources

The Fluxori Design System & Motion Framework is implemented through a comprehensive set of tokens, components, and utilities:

- `frontend/src/lib/design-system/`: Core design system implementation
- `frontend/src/lib/motion/`: Motion framework components and utilities
- `frontend/src/lib/shared/`: South African market optimizations

### File Structure

```
/lib/design-system/
├── tokens/               # Design tokens definitions
│   ├── colors.ts         # Color palettes for light/dark modes
│   ├── typography.ts     # Typography system tokens
│   ├── spacing.ts        # Spacing scale
│   ├── radii.ts          # Border radius tokens
│   ├── shadows.ts        # Shadow tokens for light/dark modes
│   ├── motion.ts         # Animation durations and easings
│   └── index.ts          # Token exports
├── types/                # TypeScript type definitions
│   └── tokens.ts         # Design token interfaces
├── theme/                # Theme management
│   └── ThemeContext.tsx  # Theme context provider
├── utils/                # Utilities
│   ├── accessibility.ts  # Contrast ratio and a11y utilities
│   ├── generateCssVars.ts # CSS variable generation
│   └── tokens.ts         # Token access utilities
├── hooks/                # React hooks
│   ├── useDesignTokens.ts # Hook for accessing tokens
│   ├── useMediaQuery.ts  # Responsive media query hooks
│   └── useReducedMotion.ts # Reduced motion preferences hook
├── components/           # Showcase components
│   ├── ThemeShowcase.tsx # Visual showcase of tokens
│   └── DesignSystemDocs.tsx # Usage documentation
└── index.ts              # Main exports

/lib/motion/
├── components/           # Motion components
│   ├── AIProcessingIndicator.tsx # AI processing animations
│   ├── TransitionFade.tsx # Fade transitions
│   ├── AnimatedTabIndicator.tsx # Tab animations
│   └── StreamingText.tsx # Text streaming effects
├── hooks/                # Motion hooks
│   ├── useConnectionQuality.ts # Network quality detection
│   ├── useAnimationPerformance.ts # Performance monitoring
│   └── useSouthAfricanPerformance.ts # Regional optimizations
├── utils/                # Motion utilities
│   └── motion-tokens.ts  # GSAP-specific motion tokens
└── index.ts              # Main exports

/lib/shared/
├── hooks/                # Shared hooks
│   └── useSouthAfricanMarketOptimizations.ts # SA market optimizations
├── types/                # Shared types
│   └── sa-market-types.ts # South African market types
└── services/             # Services
    └── connection-service.interface.ts # Connection service
```

### Key Files

- `tokens/colors.ts`: Color palette and semantic colors
- `tokens/typography.ts`: Typography system
- `tokens/shadows.ts`: Elevation and shadow system
- `tokens/motion.ts`: Animation durations and easings
- `motion/utils/motion-tokens.ts`: GSAP-specific motion tokens
- `shared/hooks/useSouthAfricanMarketOptimizations.ts`: South African market optimizations

### Usage Guidelines

1. Always use design tokens instead of hard-coded values
2. Respect the Agent Appropriateness Framework for agent interactions
3. Consider South African market conditions for all user interfaces
4. Test on low-end devices and slow connections regularly
5. Monitor data usage for all features, especially agent interactions

## CSS Variables Implementation

All design tokens are implemented as CSS variables in the global stylesheet. This allows for:

1. Easy theming and customization
2. Efficient updates (only CSS variables change, not component styles)
3. Consistent access patterns throughout the application

Example:

```css
:root {
  --color-primary-500: #3055EE;
  --typography-font-sizes-md: 1rem;
  --spacing-md: 1rem;
}

[data-theme="dark"] {
  --color-primary-500: #4B6EF1;
  --color-background-surface: #121212;
}
```

## Accessibility Considerations

The design system prioritizes accessibility with the following features:

- **Color Contrast**: All color combinations meet WCAG AA standards (4.5:1 contrast ratio for normal text)
- **Reduced Motion**: Support for users who prefer reduced motion
- **Responsive Typography**: Proper scaling of typography across devices
- **Semantic Colors**: Clear semantic meaning for status indicators
- **Focus Styles**: Visible focus indicators for keyboard navigation

## Usage Examples

### Accessing Design Tokens

```tsx
'use client';

import { useDesignTokens } from '@/lib/design-system';

function MyComponent() {
  const { color, fontSize, spacing } = useDesignTokens();
  
  return (
    <div style={{
      color: color('text.primary'),
      fontSize: fontSize('md'),
      padding: spacing('md'),
      borderRadius: radius('md'),
      boxShadow: shadow('md'),
    }}>
      Styled using design tokens
    </div>
  );
}
```

### Using South African Market Optimizations

```tsx
'use client';

import { useSouthAfricanMarketOptimizations } from '@/lib/shared/hooks';

function DataVisualizer({ data }) {
  const { 
    shouldReduceMotion,
    shouldReduceDataUsage,
    agentAppropriateness,
    networkProfile
  } = useSouthAfricanMarketOptimizations();
  
  // Adjust visualization based on optimizations
  const chartAnimationDuration = shouldReduceMotion ? 0 : 600;
  const imageQuality = shouldReduceDataUsage ? 'low' : 'high';
  
  // Use agent appropriateness to determine interaction mode
  const showAgentInterface = agentAppropriateness !== 'DISABLED';
  
  return (
    <div>
      {/* Render content differently based on optimizations */}
      {shouldReduceDataUsage ? (
        <SimplifiedView data={data} />
      ) : (
        <RichDataView data={data} animationDuration={chartAnimationDuration} />
      )}
      
      {/* Conditionally render agent UI */}
      {showAgentInterface && (
        <AgentAssistant valueImpact={1500} />
      )}
      
      {/* Show data usage information */}
      <DataUsageIndicator networkProfile={networkProfile} />
    </div>
  );
}
```

### Animation with Motion Framework

```tsx
'use client';

import { AIProcessingIndicator } from '@/lib/motion/components';
import { useAnimationPerformance } from '@/lib/motion/hooks';
import { durations, easings } from '@/lib/motion/utils/motion-tokens';

function AgentProcessingView() {
  const { complexityPreset } = useAnimationPerformance();
  
  // Adjust animation based on performance profile
  const duration = durations.agentThinking * complexityPreset.reduceDuration;
  const ease = complexityPreset.useSimpleEasings ? easings.easeInOut : easings.easeInOutQuart;
  
  return (
    <div>
      <AIProcessingIndicator 
        confidenceLevel="medium"
        duration={duration}
        ease={ease}
        disableParticles={complexityPreset.disableParticles}
      />
      <p>Processing your request...</p>
    </div>
  );
}
```