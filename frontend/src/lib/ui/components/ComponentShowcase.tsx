'use client';

import { useState } from 'react';
import { Container } from './Container';
import { Text } from './Text';
import { Button } from './Button';
import { Card, CardSection } from './Card';
import { Group } from './Group';
import { Stack } from './Stack';
import { Alert } from './Alert';
import { FormField } from './FormField';
import { AgentMessage } from './AgentMessage';
import { Grid } from './Grid';

export interface ComponentShowcaseProps {
  /** Show all components */
  showAll?: boolean;
  
  /** Show only these component categories */
  show?: ('typography' | 'buttons' | 'cards' | 'layout' | 'forms' | 'feedback' | 'agent')[];
  
  /** Additional className */
  className?: string;
}

/**
 * Component showcase for demonstrating the enhanced UI components
 * Displays examples of each component with various configurations
 */
export function ComponentShowcase({
  showAll = true,
  show = [],
  className = ''
}: ComponentShowcaseProps) {
  // Form field demo state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState('');
  const [notifications, setNotifications] = useState(false);
  
  // Determine which sections to show
  const shouldShow = (section: string) => {
    if (showAll) return true;
    return show.includes(section as any);
  };
  
  return (
    <Container className={`flx-component-showcase ${className}`}>
      <Stack gap="xl">
        {/* Typography */}
        {shouldShow('typography') && (
          <div className="flx-showcase-section">
            <Text preset="heading2" mb="md">Typography</Text>
            
            <Card>
              <CardSection withBorder p="md">
                <Text preset="heading4">Text Presets</Text>
              </CardSection>
              <Stack p="md">
                <Text preset="display1">Display 1</Text>
                <Text preset="display2">Display 2</Text>
                <Text preset="display3">Display 3</Text>
                <Text preset="heading1">Heading 1</Text>
                <Text preset="heading2">Heading 2</Text>
                <Text preset="heading3">Heading 3</Text>
                <Text preset="heading4">Heading 4</Text>
                <Text preset="heading5">Heading 5</Text>
                <Text preset="heading6">Heading 6</Text>
                <Text preset="body1">Body 1 - Main body text used for most content.</Text>
                <Text preset="body2">Body 2 - Secondary body text used for descriptions and less important content.</Text>
                <Text preset="body3">Body 3 - Small text used for supplementary information.</Text>
                <Text preset="caption">Caption - Used for captions, timestamps, and small print.</Text>
                <Text preset="label">Label - Used for form labels and badges.</Text>
                <Text preset="overline">OVERLINE - USED FOR SECTION HEADERS</Text>
                <Text preset="code">code &#123; font: 'monospace' &#125; - Used for code snippets.</Text>
              </Stack>
            </Card>
            
            <Card mt="md">
              <CardSection withBorder p="md">
                <Text preset="heading4">Semantic Text Roles</Text>
              </CardSection>
              <Stack p="md">
                <Text role="default">Default text color</Text>
                <Text role="primary">Primary text color</Text>
                <Text role="secondary">Secondary text color</Text>
                <Text role="success">Success text color</Text>
                <Text role="warning">Warning text color</Text>
                <Text role="error">Error text color</Text>
                <Text role="info">Info text color</Text>
                <Text role="disabled">Disabled text color</Text>
              </Stack>
            </Card>
          </div>
        )}
        
        {/* Buttons */}
        {shouldShow('buttons') && (
          <div className="flx-showcase-section">
            <Text preset="heading2" mb="md">Buttons</Text>
            
            <Card>
              <CardSection withBorder p="md">
                <Text preset="heading4">Button Variants</Text>
              </CardSection>
              <div style={{ padding: 'var(--spacing-md)' }}>
                <Group gap="md" mb="md">
                  <Button variant="filled">Filled</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="light">Light</Button>
                  <Button variant="subtle">Subtle</Button>
                  <Button variant="default">Default</Button>
                </Group>
              </div>
            </Card>
            
            <Card mt="md">
              <CardSection withBorder p="md">
                <Text preset="heading4">Button Intents</Text>
              </CardSection>
              <div style={{ padding: 'var(--spacing-md)' }}>
                <Group gap="md" mb="md">
                  <Button intent="primary">Primary</Button>
                  <Button intent="secondary">Secondary</Button>
                  <Button intent="success">Success</Button>
                  <Button intent="warning">Warning</Button>
                  <Button intent="error">Error</Button>
                  <Button intent="info">Info</Button>
                  <Button intent="neutral">Neutral</Button>
                </Group>
              </div>
            </Card>
            
            <Card mt="md">
              <CardSection withBorder p="md">
                <Text preset="heading4">Button Sizes</Text>
              </CardSection>
              <div style={{ padding: 'var(--spacing-md)' }}>
                <Group gap="md" align="center" mb="md">
                  <Button size="xs">XS</Button>
                  <Button size="sm">SM</Button>
                  <Button size="md">MD</Button>
                  <Button size="lg">LG</Button>
                  <Button size="xl">XL</Button>
                </Group>
              </div>
            </Card>
            
            <Card mt="md">
              <CardSection withBorder p="md">
                <Text preset="heading4">Button States</Text>
              </CardSection>
              <div style={{ padding: 'var(--spacing-md)' }}>
                <Group gap="md" mb="md">
                  <Button>Normal</Button>
                  <Button disabled>Disabled</Button>
                  <Button loading>Loading</Button>
                </Group>
              </div>
            </Card>
          </div>
        )}
        
        {/* Cards */}
        {shouldShow('cards') && (
          <div className="flx-showcase-section">
            <Text preset="heading2" mb="md">Cards</Text>
            
            <Grid columns={2} gutter="md">
              <Grid.Col span={1}>
                <Card variant="default" title="Default Card">
                  <div style={{ padding: 'var(--spacing-md)' }}>
                    <Text>This is a default card with a title section.</Text>
                  </div>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={1}>
                <Card variant="elevated" title="Elevated Card">
                  <div style={{ padding: 'var(--spacing-md)' }}>
                    <Text>This is an elevated card with more shadow.</Text>
                  </div>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={1}>
                <Card variant="outlined" title="Outlined Card">
                  <div style={{ padding: 'var(--spacing-md)' }}>
                    <Text>This is an outlined card with a border.</Text>
                  </div>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={1}>
                <Card variant="filled" title="Filled Card">
                  <div style={{ padding: 'var(--spacing-md)' }}>
                    <Text>This is a filled card with a background color.</Text>
                  </div>
                </Card>
              </Grid.Col>
            </Grid>
            
            <Card mt="md">
              <CardSection withBorder p="md">
                <Text preset="heading4">Card Animations</Text>
              </CardSection>
              <div style={{ padding: 'var(--spacing-md)' }}>
                <Grid columns={3} gutter="md">
                  <Grid.Col span={1}>
                    <Card animationType="hover" title="Hover Animation">
                      <div style={{ padding: 'var(--spacing-md)' }}>
                        <Text>Hover over this card to see it lift up.</Text>
                      </div>
                    </Card>
                  </Grid.Col>
                  
                  <Grid.Col span={1}>
                    <Card animationType="shadow" title="Shadow Animation">
                      <div style={{ padding: 'var(--spacing-md)' }}>
                        <Text>Hover over this card to see the shadow grow.</Text>
                      </div>
                    </Card>
                  </Grid.Col>
                  
                  <Grid.Col span={1}>
                    <Card animationType="tilt" title="Tilt Animation">
                      <div style={{ padding: 'var(--spacing-md)' }}>
                        <Text>Hover over this card to see it tilt slightly.</Text>
                      </div>
                    </Card>
                  </Grid.Col>
                </Grid>
              </div>
            </Card>
          </div>
        )}
        
        {/* Layout */}
        {shouldShow('layout') && (
          <div className="flx-showcase-section">
            <Text preset="heading2" mb="md">Layout Components</Text>
            
            <Card>
              <CardSection withBorder p="md">
                <Text preset="heading4">Container Sizes</Text>
              </CardSection>
              <div style={{ padding: 'var(--spacing-md)' }}>
                <Stack gap="md">
                  <div style={{ backgroundColor: 'var(--color-primary-100)', padding: 'var(--spacing-xs)', textAlign: 'center' }}>
                    <Text>Container sizes adjust responsive padding automatically</Text>
                  </div>
                </Stack>
              </div>
            </Card>
            
            <Card mt="md">
              <CardSection withBorder p="md">
                <Text preset="heading4">Grid System</Text>
              </CardSection>
              <div style={{ padding: 'var(--spacing-md)' }}>
                <Grid gutter="md">
                  <Grid.Col span={12}>
                    <div style={{ backgroundColor: 'var(--color-primary-100)', padding: 'var(--spacing-xs)', textAlign: 'center' }}>
                      <Text>Grid - 12 columns</Text>
                    </div>
                  </Grid.Col>
                  
                  <Grid.Col span={6}>
                    <div style={{ backgroundColor: 'var(--color-primary-100)', padding: 'var(--spacing-xs)', textAlign: 'center' }}>
                      <Text>6 columns</Text>
                    </div>
                  </Grid.Col>
                  
                  <Grid.Col span={6}>
                    <div style={{ backgroundColor: 'var(--color-primary-100)', padding: 'var(--spacing-xs)', textAlign: 'center' }}>
                      <Text>6 columns</Text>
                    </div>
                  </Grid.Col>
                  
                  <Grid.Col span={4}>
                    <div style={{ backgroundColor: 'var(--color-primary-100)', padding: 'var(--spacing-xs)', textAlign: 'center' }}>
                      <Text>4 columns</Text>
                    </div>
                  </Grid.Col>
                  
                  <Grid.Col span={4}>
                    <div style={{ backgroundColor: 'var(--color-primary-100)', padding: 'var(--spacing-xs)', textAlign: 'center' }}>
                      <Text>4 columns</Text>
                    </div>
                  </Grid.Col>
                  
                  <Grid.Col span={4}>
                    <div style={{ backgroundColor: 'var(--color-primary-100)', padding: 'var(--spacing-xs)', textAlign: 'center' }}>
                      <Text>4 columns</Text>
                    </div>
                  </Grid.Col>
                  
                  <Grid.Col span={3}>
                    <div style={{ backgroundColor: 'var(--color-primary-100)', padding: 'var(--spacing-xs)', textAlign: 'center' }}>
                      <Text>3 cols</Text>
                    </div>
                  </Grid.Col>
                  
                  <Grid.Col span={3}>
                    <div style={{ backgroundColor: 'var(--color-primary-100)', padding: 'var(--spacing-xs)', textAlign: 'center' }}>
                      <Text>3 cols</Text>
                    </div>
                  </Grid.Col>
                  
                  <Grid.Col span={3}>
                    <div style={{ backgroundColor: 'var(--color-primary-100)', padding: 'var(--spacing-xs)', textAlign: 'center' }}>
                      <Text>3 cols</Text>
                    </div>
                  </Grid.Col>
                  
                  <Grid.Col span={3}>
                    <div style={{ backgroundColor: 'var(--color-primary-100)', padding: 'var(--spacing-xs)', textAlign: 'center' }}>
                      <Text>3 cols</Text>
                    </div>
                  </Grid.Col>
                </Grid>
              </div>
            </Card>
            
            <Card mt="md">
              <CardSection withBorder p="md">
                <Text preset="heading4">Stack & Group</Text>
              </CardSection>
              <div style={{ padding: 'var(--spacing-md)' }}>
                <Grid columns={2} gutter="md">
                  <Grid.Col span={1}>
                    <Card>
                      <CardSection withBorder p="xs">
                        <Text preset="label">Stack - Vertical</Text>
                      </CardSection>
                      <div style={{ padding: 'var(--spacing-md)' }}>
                        <Stack gap="md">
                          <div style={{ backgroundColor: 'var(--color-primary-100)', padding: 'var(--spacing-xs)', textAlign: 'center' }}>
                            <Text>Item 1</Text>
                          </div>
                          <div style={{ backgroundColor: 'var(--color-primary-100)', padding: 'var(--spacing-xs)', textAlign: 'center' }}>
                            <Text>Item 2</Text>
                          </div>
                          <div style={{ backgroundColor: 'var(--color-primary-100)', padding: 'var(--spacing-xs)', textAlign: 'center' }}>
                            <Text>Item 3</Text>
                          </div>
                        </Stack>
                      </div>
                    </Card>
                  </Grid.Col>
                  
                  <Grid.Col span={1}>
                    <Card>
                      <CardSection withBorder p="xs">
                        <Text preset="label">Group - Horizontal</Text>
                      </CardSection>
                      <div style={{ padding: 'var(--spacing-md)' }}>
                        <Group gap="md">
                          <div style={{ backgroundColor: 'var(--color-primary-100)', padding: 'var(--spacing-xs)', textAlign: 'center', flex: '1' }}>
                            <Text>Item 1</Text>
                          </div>
                          <div style={{ backgroundColor: 'var(--color-primary-100)', padding: 'var(--spacing-xs)', textAlign: 'center', flex: '1' }}>
                            <Text>Item 2</Text>
                          </div>
                          <div style={{ backgroundColor: 'var(--color-primary-100)', padding: 'var(--spacing-xs)', textAlign: 'center', flex: '1' }}>
                            <Text>Item 3</Text>
                          </div>
                        </Group>
                      </div>
                    </Card>
                  </Grid.Col>
                </Grid>
              </div>
            </Card>
          </div>
        )}
        
        {/* Forms */}
        {shouldShow('forms') && (
          <div className="flx-showcase-section">
            <Text preset="heading2" mb="md">Form Components</Text>
            
            <Card>
              <CardSection withBorder p="md">
                <Text preset="heading4">Form Fields</Text>
              </CardSection>
              <div style={{ padding: 'var(--spacing-md)' }}>
                <Stack gap="md">
                  <FormField
                    label="Name"
                    type="text"
                    required
                    description="Enter your full name"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  />
                  
                  <FormField
                    label="Biography"
                    type="textarea"
                    description="Tell us about yourself"
                    value={bio}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
                  />
                  
                  <FormField
                    label="Category"
                    type="select"
                    description="Select a category"
                    options={[
                      { value: 'technology', label: 'Technology' },
                      { value: 'design', label: 'Design' },
                      { value: 'business', label: 'Business' },
                      { value: 'marketing', label: 'Marketing' },
                    ]}
                    value={category}
                    onChange={(value: string) => setCategory(value)}
                  />
                  
                  <FormField
                    label="Enable notifications"
                    type="switch"
                    description="Receive notifications about updates"
                    value={notifications}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotifications(e.target.checked)}
                  />
                  
                  <FormField
                    label="Email"
                    type="text"
                    required
                    error="Please enter a valid email address"
                    description="This will be your username"
                    value="invalid-email"
                  />
                </Stack>
              </div>
            </Card>
          </div>
        )}
        
        {/* Feedback */}
        {shouldShow('feedback') && (
          <div className="flx-showcase-section">
            <Text preset="heading2" mb="md">Feedback Components</Text>
            
            <Card>
              <CardSection withBorder p="md">
                <Text preset="heading4">Alerts</Text>
              </CardSection>
              <div style={{ padding: 'var(--spacing-md)' }}>
                <Stack gap="md">
                  <Alert color="info" title="Information">
                    This is an information alert with a title.
                  </Alert>
                  
                  <Alert color="success" title="Success">
                    This is a success alert with a title.
                  </Alert>
                  
                  <Alert color="warning" title="Warning">
                    This is a warning alert with a title.
                  </Alert>
                  
                  <Alert color="error" title="Error">
                    This is an error alert with a title.
                  </Alert>
                  
                  <Alert color="primary" variant="filled" title="Filled Alert">
                    This is a filled alert with the primary color.
                  </Alert>
                  
                  <Alert color="error" variant="outline" title="Outlined Alert">
                    This is an outlined alert with the error color.
                  </Alert>
                  
                  <Alert color="success" withCloseButton title="Closable Alert">
                    This alert can be closed by clicking the X button.
                  </Alert>
                </Stack>
              </div>
            </Card>
          </div>
        )}
        
        {/* Agent Components */}
        {shouldShow('agent') && (
          <div className="flx-showcase-section">
            <Text preset="heading2" mb="md">Agent Components</Text>
            
            <Card>
              <CardSection withBorder p="md">
                <Text preset="heading4">Agent Messages</Text>
              </CardSection>
              <div style={{ padding: 'var(--spacing-md)' }}>
                <Stack gap="md">
                  <AgentMessage
                    type="user"
                    timestamp={new Date()}
                    content="Can you help me optimize my product listings for marketplace sales?"
                  />
                  
                  <AgentMessage
                    type="agent"
                    timestamp={new Date()}
                    state="complete"
                    confidence="high"
                    showTools
                    tools={[
                      { name: 'MarketplaceAPI', count: 1 },
                      { name: 'ProductAnalyzer', count: 2 },
                    ]}
                    content="I've analyzed your current listings and found several optimization opportunities. The main issues are in your product titles and images. Titles should include key search terms and images should highlight product benefits. I can help you create a template that follows marketplace best practices."
                  />
                  
                  <AgentMessage
                    type="agent"
                    timestamp={new Date()}
                    state="thinking"
                    confidence="medium"
                    content="Analyzing your inventory data..."
                  />
                  
                  <AgentMessage
                    type="system"
                    timestamp={new Date()}
                    content="The connection was temporarily interrupted. Reconnected successfully."
                  />
                  
                  <AgentMessage
                    type="error"
                    timestamp={new Date()}
                    content="Unable to access the marketplace API. Please check your credentials and try again."
                  />
                </Stack>
              </div>
            </Card>
          </div>
        )}
      </Stack>
    </Container>
  );
}