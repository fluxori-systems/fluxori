'use client';

import { useState } from 'react';
import { TextInput, PasswordInput, Paper, Title, Container, Button, Text, Divider, Group, Anchor, Stack } from '@mantine/core';
import { useForm } from 'react-hook-form';
import { useFirebase } from '../../contexts/firebase-context';
import { LoginCredentials } from '../../types/user/user.types';

interface LoginFormProps {
  onLoginSuccess?: () => void;
  redirectUrl?: string;
}

export default function LoginForm({ onLoginSuccess, redirectUrl }: LoginFormProps) {
  const { login, isLoading } = useFirebase();
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginCredentials>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });
  
  const onSubmit = async (data: LoginCredentials) => {
    try {
      setError(null);
      await login(data.email, data.password);
      
      if (onLoginSuccess) {
        onLoginSuccess();
      } else if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid email or password. Please try again.');
    }
  };
  
  return (
    <Container size="xs" my="xl">
      <Paper radius="md" p="xl" withBorder>
        <Title order={2} ta="center" mt="md" mb="md">
          Welcome to Fluxori
        </Title>
        
        <Text c="dimmed" size="sm" ta="center" mb="md">
          Log in to manage your e-commerce operations
        </Text>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack>
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
              placeholder="Your password"
              withAsterisk
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
            />
            
            {error && (
              <Text c="red" size="sm">
                {error}
              </Text>
            )}
            
            <Button type="submit" fullWidth mt="xl" loading={isLoading}>
              Sign in
            </Button>
          </Stack>
        </form>
        
        <Text ta="center" mt="md">
          Don't have an account?{' '}
          <Anchor href="/register" fw={700}>
            Sign up
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
}