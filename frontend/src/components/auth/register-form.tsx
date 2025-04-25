'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { TextInput, PasswordInput, Paper, Title, Container, Button, Text, Divider, Group, Anchor, Stack, Checkbox } from '@mantine/core';

import { useForm } from 'react-hook-form';

import { useFirebase } from '../../contexts/firebase-context';
import { RegistrationData } from '../../types/user/user.types';

interface RegisterFormProps {
  onRegisterSuccess?: () => void;
  redirectUrl?: string;
}

export default function RegisterForm({ onRegisterSuccess, redirectUrl }: RegisterFormProps) {
  const { register: registerUser, isLoading } = useFirebase();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegistrationData & { confirmPassword: string; createOrganization: boolean }>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      organizationName: '',
      createOrganization: false,
    },
  });
  
  const createOrganization = watch('createOrganization');
  
  const onSubmit = async (data: RegistrationData & { confirmPassword: string; createOrganization: boolean }) => {
    try {
      setError(null);
      
      // Make sure passwords match
      if (data.password !== data.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      // Register the user
      await registerUser(
        data.email, 
        data.password, 
        data.name, 
        data.createOrganization ? data.organizationName : undefined
      );
      
      if (onRegisterSuccess) {
        onRegisterSuccess();
      } else if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Handle Firebase auth errors
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please try logging in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.');
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  };
  
  return (
    <Container size="xs" my="xl">
      <Paper radius="md" p="xl" withBorder>
        <Title order={2} ta="center" mt="md" mb="md">
          Create an account
        </Title>
        
        <Text c="dimmed" size="sm" ta="center" mb="md">
          Get started with Fluxori today
        </Text>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack>
            <TextInput
              label="Full Name"
              placeholder="John Doe"
              withAsterisk
              error={errors.name?.message}
              {...register('name', { 
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
              })}
            />
            
            <TextInput
              label="Email"
              placeholder="hello@example.com"
              withAsterisk
              error={errors.email?.message}
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
            
            <PasswordInput
              label="Password"
              placeholder="Create a password"
              withAsterisk
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
              })}
            />
            
            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm your password"
              withAsterisk
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === watch('password') || 'Passwords do not match',
              })}
            />
            
            <Checkbox
              label="I want to create a new organization"
              {...register('createOrganization')}
            />
            
            {createOrganization && (
              <TextInput
                label="Organization Name"
                placeholder="Your Company Ltd"
                withAsterisk={createOrganization}
                error={errors.organizationName?.message}
                {...register('organizationName', { 
                  required: createOrganization ? 'Organization name is required' : false,
                })}
              />
            )}
            
            {error && (
              <Text c="red" size="sm">
                {error}
              </Text>
            )}
            
            <Button type="submit" fullWidth mt="xl" loading={isLoading}>
              Create account
            </Button>
          </Stack>
        </form>
        
        <Text ta="center" mt="md">
          Already have an account?{' '}
          <Anchor href="/login" fw={700}>
            Sign in
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
}