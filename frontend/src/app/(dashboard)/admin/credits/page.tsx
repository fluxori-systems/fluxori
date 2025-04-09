import React from 'react';
import { 
  Container, 
  Title,
  Card,
  Text,
  Stack,
  Group,
  Button,
  Table
} from '@/lib/ui';

/**
 * Admin Credits Management Page
 */
export default function AdminCreditsPage() {
  // Sample data for organizations and their credit allocations
  const organizations = [
    { id: '1', name: 'Acme Corp', plan: 'Enterprise', status: 'active' },
    { id: '2', name: 'Globex Inc', plan: 'Professional', status: 'active' },
    { id: '3', name: 'Initech', plan: 'Standard', status: 'active' },
    { id: '4', name: 'Umbrella Corp', plan: 'Enterprise', status: 'active' },
    { id: '5', name: 'Stark Industries', plan: 'Professional', status: 'inactive' },
  ];
  
  const allotments = [
    { organizationId: '1', organizationName: 'Acme Corp', monthlyLimit: 50000, currentUsage: 12340, resetDate: '2023-04-01' },
    { organizationId: '2', organizationName: 'Globex Inc', monthlyLimit: 25000, currentUsage: 18750, resetDate: '2023-04-01' },
    { organizationId: '3', organizationName: 'Initech', monthlyLimit: 10000, currentUsage: 9800, resetDate: '2023-04-01' },
    { organizationId: '4', organizationName: 'Umbrella Corp', monthlyLimit: 50000, currentUsage: 24680, resetDate: '2023-04-01' },
    { organizationId: '5', organizationName: 'Stark Industries', monthlyLimit: 25000, currentUsage: 0, resetDate: '2023-04-01' },
  ];

  const handleUpdateAllotment = (organizationId: string) => {
    // This would update the credit allotment in a real app
    alert(`Updating allotment for organization ${organizationId}`);
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Title order={1}>Credit Management</Title>
        <Text c="dimmed">Manage AI credit allocations for organizations.</Text>
        
        <Card shadow="sm" p="lg" withBorder>
          <Title order={3} size="h4" mb="xl">Organization Credit Allotments</Title>
          
          <Table striped highlightOnHover>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Plan</th>
                <th>Monthly Limit</th>
                <th>Current Usage</th>
                <th>Usage %</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allotments.map((allotment) => {
                const org = organizations.find((o) => o.id === allotment.organizationId);
                const usagePercent = Math.round((allotment.currentUsage / allotment.monthlyLimit) * 100);
                
                return (
                  <tr key={allotment.organizationId}>
                    <td>{allotment.organizationName}</td>
                    <td>{org?.plan || 'N/A'}</td>
                    <td>{allotment.monthlyLimit.toLocaleString()}</td>
                    <td>{allotment.currentUsage.toLocaleString()}</td>
                    <td>{usagePercent}%</td>
                    <td>
                      <Button 
                        size="xs"
                        onClick={() => handleUpdateAllotment(allotment.organizationId)}
                      >
                        Update
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
        
        <Card shadow="sm" p="lg" withBorder>
          <Title order={3} size="h4" mb="md">Add New Organization Allotment</Title>
          
          <Text mb="lg">
            Create a new credit allotment for an organization that doesn't have one yet.
          </Text>
          
          <Button>Add New Allotment</Button>
        </Card>
      </Stack>
    </Container>
  );
}