'use client';

import { useState } from 'react';
import { 
  Title, 
  Text, 
  Button, 
  Card, 
  Stack, 
  Group, 
  TextInput, 
  Select, 
  Divider, 
  Alert,
  Badge
} from '@mantine/core';
import { IconAlertCircle, IconUserPlus } from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/user/user.types';

/**
 * Organization Management Component
 * Simplified component to manage organizations and users
 */
export default function OrganizationManagement() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>(UserRole.USER);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Mock function to invite a user
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Mock successful operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(`Invitation sent to ${email}`);
      setEmail('');
    } catch (err) {
      setError('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack>
      <Card withBorder shadow="sm" padding="lg">
        <Title order={4} mb="md">Team Members</Title>
        
        {!user?.organizationId ? (
          <Alert color="blue" icon={<IconAlertCircle size={16} />}>
            You are not part of any organization.
          </Alert>
        ) : (
          <>
            <Text mb="md">
              You are a member of <strong>Organization ID: {user.organizationId}</strong>
            </Text>
            
            <Group>
              <Badge color={isAdmin ? 'red' : 'blue'}>
                {isAdmin ? 'Admin' : 'Member'}
              </Badge>
            </Group>
          </>
        )}
      </Card>
      
      {isAdmin && user?.organizationId && (
        <Card withBorder shadow="sm" padding="lg" mt="md">
          <Title order={4} mb="md">Invite Team Members</Title>
          
          {error && (
            <Alert color="red" icon={<IconAlertCircle size={16} />} mb="md">
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert color="green" icon={<IconAlertCircle size={16} />} mb="md">
              {success}
            </Alert>
          )}
          
          <form onSubmit={handleInviteUser}>
            <Stack>
              <TextInput
                required
                label="Email Address"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              
              <Select
                label="Role"
                data={[
                  { value: UserRole.ADMIN, label: 'Admin' },
                  { value: UserRole.MANAGER, label: 'Manager' },
                  { value: UserRole.USER, label: 'User' }
                ]}
                value={role}
                onChange={(value) => setRole(value || UserRole.USER)}
              />
              
              <Divider my="sm" />
              
              <Group justify="flex-end">
                <Button 
                  type="submit" 
                  loading={loading}
                  leftSection={<IconUserPlus size={16} />}
                >
                  Send Invitation
                </Button>
              </Group>
            </Stack>
          </form>
        </Card>
      )}
    </Stack>
  );
}