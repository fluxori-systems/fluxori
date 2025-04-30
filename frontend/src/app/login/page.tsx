"use client";

import { useEffect, useState, Suspense } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Divider,
  Group,
  Stack,
  Alert,
  TextInput,
  PasswordInput,
  Checkbox,
  Anchor,
  Center,
  Box,
  LoadingOverlay,
  Loader,
} from "@mantine/core";

import { IconAlertCircle, IconBrandGoogle } from "@tabler/icons-react";
import { useForm } from "react-hook-form";

import { useFirebase } from "../../lib/firebase/firebase-context";
import { LoginCredentials } from "../../types/user/user.types";

/**
 * Login content component
 * Handles user login with email/password and Google OAuth
 */
function LoginContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "reset">("login");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get redirect URL and error codes from query params
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const sessionExpired = searchParams.get("session_expired") === "true";
  const emailVerification =
    searchParams.get("email_verification") === "success";

  // Get Firebase auth context
  const {
    login,
    loginWithGoogle,
    resetPassword,
    isLoading: authLoading,
  } = useFirebase();

  // Form validation with React Hook Form
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginCredentials>({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  // Reset password form
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors },
    reset: resetResetForm,
  } = useForm<{ email: string }>({
    defaultValues: {
      email: "",
    },
  });

  // Handle successful login redirect
  const handleLoginSuccess = () => {
    router.push(redirectTo);
  };

  // Handle login form submission
  const handleLogin = async (data: LoginCredentials) => {
    setLoading(true);
    setError(null);

    try {
      await login(data.email, data.password);
      handleLoginSuccess();
    } catch (err) {
      console.error("Login error:", err);

      // Handle specific error messages
      if (err instanceof Error) {
        if (
          err.message.includes("user-not-found") ||
          err.message.includes("wrong-password")
        ) {
          setError("Invalid email or password. Please try again.");
        } else if (err.message.includes("too-many-requests")) {
          setError(
            "Too many failed login attempts. Please try again later or reset your password.",
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("An unknown error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async (data: { email: string }) => {
    setLoading(true);
    setError(null);

    try {
      await resetPassword(data.email);
      setAuthMode("login");
      resetResetForm();

      // Show success message
      setError("Password reset email sent. Please check your inbox.");
    } catch (err) {
      console.error("Password reset error:", err);

      if (err instanceof Error) {
        if (err.message.includes("user-not-found")) {
          setError("No account found with that email address.");
        } else {
          setError(err.message);
        }
      } else {
        setError("An unknown error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      await loginWithGoogle();
      handleLoginSuccess();
    } catch (err) {
      console.error("Google login error:", err);

      // Error is already set in the Firebase context
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle auth mode change
  const toggleAuthMode = () => {
    setAuthMode(authMode === "login" ? "reset" : "login");
    setError(null);
  };

  return (
    <Container size="xs" py="xl">
      <Box pos="relative">
        <LoadingOverlay visible={loading || authLoading} />

        <Paper radius="md" p="xl" withBorder>
          <Center mb="md">
            <Box w={180}>
              {/* Replace with your logo */}
              <Title order={2} ta="center">
                Fluxori
              </Title>
            </Box>
          </Center>

          <Title order={3} ta="center" mt="md" mb="md">
            {authMode === "login" ? "Welcome back" : "Reset your password"}
          </Title>

          <Text c="dimmed" size="sm" ta="center" mb="md">
            {authMode === "login"
              ? "Sign in to your Fluxori account"
              : "Enter your email to receive a password reset link"}
          </Text>

          {/* Session expired message */}
          {sessionExpired && (
            <Alert c="yellow" icon={<IconAlertCircle size={16} />} mb="md">
              Your session has expired. Please log in again.
            </Alert>
          )}

          {/* Email verification success message */}
          {emailVerification && (
            <Alert c="green" icon={<IconAlertCircle size={16} />} mb="md">
              Email verified successfully. You can now log in.
            </Alert>
          )}

          {/* Error message */}
          {error && (
            <Alert
              c={error.includes("sent") ? "green" : "red"}
              icon={<IconAlertCircle size={16} />}
              mb="md"
            >
              {error}
            </Alert>
          )}

          {authMode === "login" ? (
            <form onSubmit={handleLoginSubmit(handleLogin)}>
              <Stack>
                <TextInput
                  required
                  label="Email"
                  placeholder="hello@example.com"
                  {...registerLogin("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  error={loginErrors.email?.message}
                />

                <PasswordInput
                  required
                  label="Password"
                  placeholder="Your password"
                  {...registerLogin("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password should be at least 6 characters",
                    },
                  })}
                  error={loginErrors.password?.message}
                />

                <Group justify="space-between" mt="md">
                  <Checkbox
                    label="Remember me"
                    {...registerLogin("rememberMe")}
                  />

                  <Anchor
                    component="button"
                    type="button"
                    size="sm"
                    onClick={toggleAuthMode}
                  >
                    Forgot password?
                  </Anchor>
                </Group>

                <Button fullWidth mt="xl" type="submit" loading={loading}>
                  Sign in
                </Button>
              </Stack>
            </form>
          ) : (
            <form onSubmit={handleResetSubmit(handleResetPassword)}>
              <Stack>
                <TextInput
                  required
                  label="Email"
                  placeholder="hello@example.com"
                  {...registerReset("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  error={resetErrors.email?.message}
                />

                <Button fullWidth mt="xl" type="submit" loading={loading}>
                  Send reset link
                </Button>

                <Anchor
                  component="button"
                  type="button"
                  size="sm"
                  onClick={toggleAuthMode}
                  ta="center"
                  display="block"
                  mt="sm"
                >
                  Back to login
                </Anchor>
              </Stack>
            </form>
          )}

          {authMode === "login" && (
            <>
              <Divider
                label="Or continue with"
                labelPosition="center"
                my="lg"
              />

              <Group grow mb="md" mt="md">
                <Button variant="outline" onClick={handleGoogleLogin}>
                  <Group gap="xs">
                    <IconBrandGoogle size={16} />
                    <span>Google</span>
                  </Group>
                </Button>
              </Group>

              <Text ta="center" mt="md">
                Don&apos;t have an account?{" "}
                <Anchor component={Link} href="/register">
                  Sign up
                </Anchor>
              </Text>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

/**
 * Login page component
 * Wraps the login content in a suspense boundary
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Container size="xs" py="xl">
          <Paper radius="md" p="xl" withBorder>
            <Center>
              <Loader size="xl" />
            </Center>
            <Text ta="center" mt="md">
              Loading...
            </Text>
          </Paper>
        </Container>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
