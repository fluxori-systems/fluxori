'use client';

import React, { useState } from 'react';
import { Card, Container, Group, Stack, Text, Button } from '@/lib/ui';
import { 
  AgentMessage,
  AgentConfidenceDisplay,
  AgentStateIndicator,
  AgentInteractiveElement,
  AgentConversation,
  AgentConversationProvider,
  AgentToolUsage
} from '@/lib/ui';
import type { AgentToolUsage as AgentToolUsageType } from '@/lib/ui/components/agent/types';

/**
 * Agent Interaction Components Showcase Page
 * Demonstrates all available agent-related components
 */
export default function AgentShowcasePage() {
  const [showComponent, setShowComponent] = useState<string>('conversation');
  
  // Sample tool for demonstration
  const sampleTool: AgentToolUsageType = {
    id: '1',
    name: 'search',
    count: 1,
    duration: 1200,
    status: 'success',
    timestamp: new Date(),
    result: 'Found 3 relevant documents matching your query.',
    metadata: { source: 'web' }
  };
  
  // Sample message with suggestions
  const suggestions = [
    { id: '1', text: 'Show sales data', description: 'View recent sales figures' },
    { id: '2', text: 'Analyze inventory', description: 'Check current stock levels' },
    { id: '3', text: 'Compare marketplaces', description: 'See performance across platforms' },
    { id: '4', text: 'Optimize pricing', description: 'Get pricing recommendations' }
  ];
  
  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Stack gap="md">
          <Text preset="h1">Agent Interaction Components</Text>
          <Text preset="body1">
            This showcase demonstrates the agent interaction components that power Fluxori's agent-first 
            interface approach. These components enable users to interact with our multi-model agent 
            framework in an intuitive and transparent way.
          </Text>
        </Stack>
        
        <Group gap="md">
          <Button 
            intent={showComponent === 'conversation' ? 'primary' : 'neutral'}
            onClick={() => setShowComponent('conversation')}
          >
            Full Conversation
          </Button>
          <Button 
            intent={showComponent === 'messages' ? 'primary' : 'neutral'}
            onClick={() => setShowComponent('messages')}
          >
            Message Components
          </Button>
          <Button 
            intent={showComponent === 'state' ? 'primary' : 'neutral'}
            onClick={() => setShowComponent('state')}
          >
            State Components
          </Button>
          <Button 
            intent={showComponent === 'interactive' ? 'primary' : 'neutral'}
            onClick={() => setShowComponent('interactive')}
          >
            Interactive Elements
          </Button>
        </Group>
        
        {showComponent === 'conversation' && (
          <AgentConversationProvider>
            <Card p={0} withBorder shadow="sm">
              <AgentConversation 
                height="600px"
                suggestions={suggestions}
              />
            </Card>
            <Text size="sm" c="var(--text-secondary)" ta="center">
              Try sending a message to see the agent's response and tool usage.
            </Text>
          </AgentConversationProvider>
        )}
        
        {showComponent === 'messages' && (
          <Stack gap="xl">
            <Card withBorder p="lg">
              <Text preset="h3" mb="md">Agent Message Types</Text>
              
              <Stack gap="md">
                <AgentMessage
                  type="user"
                  content="Tell me about my sales performance this month."
                  timestamp={new Date()}
                />
                
                <AgentMessage
                  type="agent"
                  content="I'm analyzing your sales data for this month. Let me check the figures across all your connected marketplaces."
                  timestamp={new Date()}
                  confidence="high"
                  showTools={true}
                  tools={[
                    { name: 'Sales Analytics', count: 1 },
                    { name: 'Marketplace API', count: 3 }
                  ]}
                />
                
                <AgentMessage
                  type="system"
                  content="System notification: New marketplace integration added."
                  timestamp={new Date()}
                />
                
                <AgentMessage
                  type="error"
                  content="Unable to retrieve data from Amazon Marketplace API. Please check your credentials."
                  timestamp={new Date()}
                />
                
                <AgentMessage
                  type="warning"
                  content="Your Takealot inventory is running low on 5 SKUs."
                  timestamp={new Date()}
                />
                
                <AgentMessage
                  type="info"
                  content="Tip: You can connect additional marketplaces in Settings > Integrations."
                  timestamp={new Date()}
                />
              </Stack>
            </Card>
            
            <Card withBorder p="lg">
              <Text preset="h3" mb="md">Agent Message States</Text>
              
              <Stack gap="md">
                <AgentMessage
                  type="agent"
                  state="thinking"
                  content=""
                  timestamp={new Date()}
                />
                
                <AgentMessage
                  type="agent"
                  state="processing"
                  content=""
                  showTools={true}
                  tools={[{ name: 'Data Analysis', count: 1 }]}
                  timestamp={new Date()}
                />
                
                <AgentMessage
                  type="agent"
                  state="streaming"
                  content="I'm analyzing your inventory levels across all connected marketplaces..."
                  streaming={true}
                  timestamp={new Date()}
                />
              </Stack>
            </Card>
            
            <Card withBorder p="lg">
              <Text preset="h3" mb="md">Agent Confidence Levels</Text>
              
              <Stack gap="md">
                <AgentMessage
                  type="agent"
                  content="Your total sales for March 2025 are R459,782.35, which represents a 12.4% increase over February 2025."
                  timestamp={new Date()}
                  confidence="high"
                />
                
                <AgentMessage
                  type="agent"
                  content="Based on the partial data available, your Takealot sales appear to be trending upward by approximately 8-10% this month."
                  timestamp={new Date()}
                  confidence="medium"
                />
                
                <AgentMessage
                  type="agent"
                  content="I can't confidently estimate your Q2 growth projections with the limited historical data available in your account."
                  timestamp={new Date()}
                  confidence="low"
                />
              </Stack>
            </Card>
          </Stack>
        )}
        
        {showComponent === 'state' && (
          <Stack gap="xl">
            <Card withBorder p="lg">
              <Text preset="h3" mb="md">Agent State Indicators</Text>
              
              <Stack gap="md">
                <Group gap="xl">
                  <AgentStateIndicator state="idle" />
                  <AgentStateIndicator state="thinking" />
                  <AgentStateIndicator state="processing" />
                  <AgentStateIndicator state="streaming" />
                  <AgentStateIndicator state="complete" />
                  <AgentStateIndicator state="error" />
                </Group>
                
                <Text preset="h4" mt="lg">Sizes</Text>
                <Group gap="xl" align="center">
                  <AgentStateIndicator state="processing" size="xs" />
                  <AgentStateIndicator state="processing" size="sm" />
                  <AgentStateIndicator state="processing" size="md" />
                  <AgentStateIndicator state="processing" size="lg" />
                </Group>
              </Stack>
            </Card>
            
            <Card withBorder p="lg">
              <Text preset="h3" mb="md">Agent Confidence Displays</Text>
              
              <Stack gap="md">
                <Text preset="h4">Basic Indicators</Text>
                <Group gap="xl">
                  <AgentConfidenceDisplay level="high" />
                  <AgentConfidenceDisplay level="medium" />
                  <AgentConfidenceDisplay level="low" />
                  <AgentConfidenceDisplay level="unknown" />
                </Group>
                
                <Text preset="h4" mt="lg">Visualization Types</Text>
                <Group gap="xl" align="center">
                  <Stack gap="xs">
                    <Text ta="center" size="sm">Icon</Text>
                    <AgentConfidenceDisplay level="high" visualizationType="icon" />
                  </Stack>
                  
                  <Stack gap="xs">
                    <Text ta="center" size="sm">Bar</Text>
                    <AgentConfidenceDisplay level="medium" visualizationType="bar" />
                  </Stack>
                  
                  <Stack gap="xs">
                    <Text ta="center" size="sm">Radar</Text>
                    <AgentConfidenceDisplay level="high" visualizationType="radar" />
                  </Stack>
                </Group>
                
                <Text preset="h4" mt="lg">With Explanation</Text>
                <AgentConfidenceDisplay 
                  level="medium" 
                  showExplanation={true}
                  explanation="This response is based on 3 months of historical data, which provides moderate confidence in the trend analysis. More historical data would improve confidence."
                />
              </Stack>
            </Card>
            
            <Card withBorder p="lg">
              <Text preset="h3" mb="md">Agent Tool Usage</Text>
              
              <Stack gap="md">
                <Text preset="h4">Tool States</Text>
                <Group gap="md" align="start">
                  <Stack style={{ flex: 1 }}>
                    <Text size="sm">Pending</Text>
                    <AgentToolUsage 
                      tool={{
                        ...sampleTool,
                        status: 'pending',
                        result: undefined
                      }}
                    />
                  </Stack>
                  
                  <Stack style={{ flex: 1 }}>
                    <Text size="sm">Running</Text>
                    <AgentToolUsage 
                      tool={{
                        ...sampleTool,
                        status: 'running',
                        result: undefined
                      }}
                    />
                  </Stack>
                </Group>
                
                <Group gap="md" align="start" mt="md">
                  <Stack style={{ flex: 1 }}>
                    <Text size="sm">Success</Text>
                    <AgentToolUsage 
                      tool={{
                        ...sampleTool,
                        status: 'success'
                      }}
                    />
                  </Stack>
                  
                  <Stack style={{ flex: 1 }}>
                    <Text size="sm">Error</Text>
                    <AgentToolUsage 
                      tool={{
                        ...sampleTool,
                        status: 'error',
                        result: 'Failed to connect to the data source.'
                      }}
                    />
                  </Stack>
                </Group>
                
                <Text preset="h4" mt="lg">Detailed View</Text>
                <AgentToolUsage 
                  tool={sampleTool}
                  detailed={true}
                />
                
                <Text preset="h4" mt="lg">Expandable</Text>
                <AgentToolUsage 
                  tool={sampleTool}
                  expandable={true}
                />
              </Stack>
            </Card>
          </Stack>
        )}
        
        {showComponent === 'interactive' && (
          <AgentConversationProvider>
            <Card withBorder p="lg">
              <Text preset="h3" mb="md">Interactive Agent Elements</Text>
              
              <Stack gap="xl">
                <Stack gap="md">
                  <Text preset="h4">Button Types</Text>
                  <Group gap="md">
                    <AgentInteractiveElement
                      type="button"
                      label="Primary Action"
                      action="Show me sales data"
                      intent="primary"
                    />
                    
                    <AgentInteractiveElement
                      type="button"
                      label="Secondary Action"
                      action="Generate report"
                      intent="secondary"
                    />
                    
                    <AgentInteractiveElement
                      type="button"
                      label="Success Action"
                      action="Approve order"
                      intent="success"
                    />
                    
                    <AgentInteractiveElement
                      type="button"
                      label="Warning Action"
                      action="Flag for review"
                      intent="warning"
                    />
                    
                    <AgentInteractiveElement
                      type="button"
                      label="Danger Action"
                      action="Delete item"
                      intent="danger"
                    />
                  </Group>
                </Stack>
                
                <Stack gap="md">
                  <Text preset="h4">Link Element</Text>
                  <AgentInteractiveElement
                    type="link"
                    label="View detailed analytics"
                    action="Show me detailed analytics"
                    intent="primary"
                  />
                </Stack>
                
                <Stack gap="md">
                  <Text preset="h4">Form Controls</Text>
                  <Group gap="xl" align="start">
                    <AgentInteractiveElement
                      type="checkbox"
                      label="Include tax information"
                      action={() => console.log('Checkbox toggled')}
                    />
                    
                    <AgentInteractiveElement
                      type="radio"
                      label="Sort by revenue"
                      action="Sort data by revenue"
                    />
                    
                    <AgentInteractiveElement
                      type="select"
                      label="Select time period"
                      action={() => console.log('Selection changed')}
                    >
                      <option value="week">Last 7 days</option>
                      <option value="month">Last 30 days</option>
                      <option value="quarter">Last 90 days</option>
                      <option value="year">Last 365 days</option>
                    </AgentInteractiveElement>
                  </Group>
                </Stack>
                
                <Stack gap="md">
                  <Text preset="h4">Input Element</Text>
                  <AgentInteractiveElement
                    type="input"
                    label="Search products"
                    action="Search for product"
                  />
                </Stack>
                
                <Stack gap="md">
                  <Text preset="h4">Form Element</Text>
                  <AgentInteractiveElement
                    type="form"
                    label="Create Quick Report"
                    action={() => console.log('Form submitted')}
                  >
                    <Stack gap="md">
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px' }}>
                          Report Name
                        </label>
                        <input
                          type="text"
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-light)',
                            width: '100%'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px' }}>
                          Time Period
                        </label>
                        <select
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-light)',
                            width: '100%'
                          }}
                        >
                          <option value="week">Last 7 days</option>
                          <option value="month">Last 30 days</option>
                          <option value="quarter">Last 90 days</option>
                          <option value="year">Last 365 days</option>
                        </select>
                      </div>
                      
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input type="checkbox" />
                          <span>Include comparison to previous period</span>
                        </label>
                      </div>
                    </Stack>
                  </AgentInteractiveElement>
                </Stack>
                
                <Stack gap="md">
                  <Text preset="h4">Message With Interactive Elements</Text>
                  <AgentMessage
                    type="agent"
                    content="I've analyzed your inventory levels. Would you like to see:"
                    timestamp={new Date()}
                    confidence="high"
                  >
                    <Stack gap="md" mt="md">
                      <AgentInteractiveElement
                        type="button"
                        label="Low stock items"
                        action="Show me low stock items"
                        intent="primary"
                      />
                      
                      <AgentInteractiveElement
                        type="button"
                        label="Overstocked items"
                        action="Show me overstocked items"
                        intent="secondary"
                      />
                      
                      <AgentInteractiveElement
                        type="button"
                        label="Items needing reorder"
                        action="Show items that need reordering"
                        intent="warning"
                      />
                    </Stack>
                  </AgentMessage>
                </Stack>
              </Stack>
            </Card>
          </AgentConversationProvider>
        )}
      </Stack>
    </Container>
  );
}