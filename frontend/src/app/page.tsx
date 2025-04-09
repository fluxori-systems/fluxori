'use client';

import { Text, Stack, Button, SimpleGrid } from '@/lib/ui';
import { IconShoppingCart, IconChartLine, IconBrandShopee } from '@tabler/icons-react';

export default function HomePage() {
  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <Stack gap="xl">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Text fz="4rem" fw={800} style={{ marginBottom: '16px' }}>Fluxori</Text>
          <Text fz="xl" c="dimmed" style={{ maxWidth: '600px', margin: '0 auto' }}>
            A comprehensive e-commerce operations platform for South African sellers
          </Text>
          
          <div style={{ marginTop: '32px' }}>
            <Button 
              component="a" 
              href="/login" 
              size="lg" 
              leftSection={<IconShoppingCart size={20} />}
              color="blue"
            >
              Get Started
            </Button>
            
            <Button 
              component="a" 
              href="/dashboard" 
              size="lg" 
              leftSection={<IconChartLine size={20} />}
              variant="outline"
              style={{ marginLeft: '16px' }}
            >
              Dashboard
            </Button>
          </div>
        </div>
        
        <Text fz="2rem" fw={700} ta="center" style={{ marginTop: '40px', marginBottom: '20px' }}>
          Why Choose Fluxori?
        </Text>
        
        <SimpleGrid
          cols={{ base: 1, sm: 2, md: 3 }}
          spacing="md"
        >
          <FeatureCard
            title="Multi-Channel Management"
            description="Manage inventory, orders and listings across all major South African marketplaces."
            icon={<IconShoppingCart size={32} />}
          />
          
          <FeatureCard
            title="Advanced Analytics"
            description="Make data-driven decisions with comprehensive reporting and performance metrics."
            icon={<IconChartLine size={32} />}
          />
          
          <FeatureCard
            title="Local Marketplace Integration"
            description="Seamless integration with Takealot, Bidorbuy, and other SA marketplaces."
            icon={<IconBrandShopee size={32} />}
          />
        </SimpleGrid>
        
        <div style={{ textAlign: 'center', marginTop: '60px' }}>
          <Button 
            size="lg" 
            color="blue" 
            leftSection={<IconShoppingCart size={20} />}
            fullWidth
            style={{ maxWidth: '300px' }}
          >
            Start Free Trial
          </Button>
        </div>
      </Stack>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <div style={{ 
      padding: '24px', 
      borderRadius: '8px', 
      border: '1px solid #eaeaea',
      height: '100%'
    }}>
      <div style={{ marginBottom: '16px', color: '#228be6' }}>{icon}</div>
      <Text fw={700} fz="xl" style={{ marginBottom: '8px' }}>{title}</Text>
      <Text c="dimmed">{description}</Text>
    </div>
  );
}