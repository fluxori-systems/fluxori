"use client";

import { useState, Suspense } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Anchor,
  Divider,
  Checkbox,
  Group,
  Alert,
  Center,
  Box,
  LoadingOverlay,
  Stepper,
  Select,
  Loader,
} from "@mantine/core";

import {
  IconAlertCircle,
  IconBrandGoogle,
  IconBuildingSkyscraper,
  IconCheck,
  IconUser,
} from "@tabler/icons-react";
import { useForm } from "react-hook-form";

import { useFirebase } from "../../contexts/firebase-context";
import { IndustrySector } from "../../types/organization/organization.types";

interface RegistrationData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  organizationName?: string;
  industry?: string;
  agreeToTerms: boolean;
}

/**
 * Registration content component
 * Handles new user registration with email/password and Google OAuth
 */
function RegisterContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [createOrg, setCreateOrg] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get redirect URL and invitation token from query params
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const inviteToken = searchParams.get("token") || "";

  // Get Firebase auth context
  const {
    register: registerUser,
    loginWithGoogle,
    checkEmailExists,
    isLoading: authLoading,
  } = useFirebase();

  // Form validation with React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isValid },
    setValue,
    getValues,
  } = useForm<RegistrationData>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      organizationName: "",
      industry: IndustrySector.RETAIL,
      agreeToTerms: false,
    },
    mode: "onChange",
  });

  const password = watch("password");

  // Check if we can move to the next step
  const canProceedToStep1 = () => {
    const fields = ["name", "email", "password", "confirmPassword"];
    return trigger(fields as any);
  };

  // Check email availability
  const checkEmail = async () => {
    const email = getValues("email");
    if (!email) return false;

    try {
      const exists = await checkEmailExists(email);
      if (exists) {
        setError(
          "This email is already registered. Please use a different email or log in.",
        );
        return false;
      }
      return true;
    } catch (err) {
      console.error("Error checking email:", err);
      return false;
    }
  };

  // Handle next step
  const handleNextStep = async () => {
    if (activeStep === 0) {
      const valid = await canProceedToStep1();
      if (valid && (await checkEmail())) {
        setActiveStep(1);
      }
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    setActiveStep(activeStep - 1);
  };

  // Handle form submission
  const handleRegister = async (data: RegistrationData) => {
    if (!data.agreeToTerms) {
      setError("You must agree to the terms and privacy policy to continue.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orgName = createOrg ? data.organizationName : undefined;
      const industry = createOrg ? data.industry : undefined;

      await registerUser(
        data.email,
        data.password,
        data.name,
        orgName,
        inviteToken || undefined,
      );
      router.push(redirectTo);
    } catch (err) {
      console.error("Registration error:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Google registration
  const handleGoogleRegister = async () => {
    setLoading(true);
    setError(null);

    try {
      await loginWithGoogle();
      router.push(redirectTo);
    } catch (err) {
      console.error("Google login error:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="md" py="xl">
      <Box pos="relative">
        <LoadingOverlay visible={loading || authLoading} />

        <Paper radius="md" p="xl" withBorder>
          <Center mb="md">
            <Box w={180}>
              <Title order={2} ta="center">
                Fluxori
              </Title>
            </Box>
          </Center>

          <Title order={3} ta="center" mb="xl">
            Create your account
          </Title>

          {/* Error message */}
          {error && (
            <Alert c="red" icon={<IconAlertCircle size={16} />} mb="md">
              {error}
            </Alert>
          )}

          {/* Invitation token message */}
          {inviteToken && (
            <Alert c="blue" icon={<IconAlertCircle size={16} />} mb="md">
              You've been invited to join an organization. Complete registration
              to accept.
            </Alert>
          )}

          <form onSubmit={handleSubmit(handleRegister)}>
            <Stepper
              active={activeStep}
              onStepClick={setActiveStep}
              allowNextStepsSelect={false}
            >
              <Stepper.Step
                label="Account"
                description="Create account"
                icon={<IconUser size={18} />}
              >
                <Stack mt="md">
                  <TextInput
                    label="Full Name"
                    placeholder="John Doe"
                    required
                    {...register("name", {
                      required: "Name is required",
                      minLength: {
                        value: 2,
                        message: "Name must be at least 2 characters",
                      },
                    })}
                    error={errors.name?.message}
                  />

                  <TextInput
                    label="Email Address"
                    placeholder="your@email.com"
                    required
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    error={errors.email?.message}
                  />

                  <Stack mt="md">
                    <PasswordInput
                      label="Password"
                      placeholder="Your password"
                      required
                      {...register("password", {
                        required: "Password is required",
                        minLength: {
                          value: 8,
                          message: "Password must be at least 8 characters",
                        },
                        pattern: {
                          value:
                            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                          message:
                            "Password must include uppercase, lowercase, number and special character",
                        },
                      })}
                      error={errors.password?.message}
                    />

                    <PasswordInput
                      label="Confirm Password"
                      placeholder="Confirm your password"
                      required
                      {...register("confirmPassword", {
                        required: "Please confirm your password",
                        validate: (value) =>
                          value === password || "Passwords do not match",
                      })}
                      error={errors.confirmPassword?.message}
                    />
                  </Stack>
                </Stack>
              </Stepper.Step>

              <Stepper.Step
                label="Organization"
                description="Setup organization"
                icon={<IconBuildingSkyscraper size={18} />}
              >
                <Stack mt="md">
                  {!inviteToken && (
                    <Checkbox
                      label="Create a new organization"
                      checked={createOrg}
                      onChange={(e) => setCreateOrg(e.currentTarget.checked)}
                      mt="md"
                    />
                  )}

                  {createOrg && !inviteToken && (
                    <>
                      <TextInput
                        label="Organization Name"
                        placeholder="Your Company Ltd"
                        required
                        {...register("organizationName", {
                          required: createOrg
                            ? "Organization name is required"
                            : false,
                          minLength: {
                            value: 2,
                            message: "Name must be at least 2 characters",
                          },
                        })}
                        error={errors.organizationName?.message}
                      />

                      <Select
                        label="Industry"
                        data={[
                          { value: IndustrySector.RETAIL, label: "Retail" },
                          {
                            value: IndustrySector.WHOLESALE,
                            label: "Wholesale",
                          },
                          {
                            value: IndustrySector.MANUFACTURING,
                            label: "Manufacturing",
                          },
                          { value: IndustrySector.SERVICES, label: "Services" },
                          {
                            value: IndustrySector.TECHNOLOGY,
                            label: "Technology",
                          },
                          { value: IndustrySector.OTHER, label: "Other" },
                        ]}
                        value={getValues("industry")}
                        onChange={(val) =>
                          setValue("industry", val || IndustrySector.RETAIL)
                        }
                      />
                    </>
                  )}

                  {inviteToken && (
                    <Alert c="green" icon={<IconCheck size={16} />}>
                      You'll be joining an existing organization via invitation.
                    </Alert>
                  )}

                  <Checkbox
                    mt="lg"
                    label={
                      <Text size="sm">
                        I agree to the{" "}
                        <Anchor href="#" target="_blank" size="sm">
                          Terms of Service
                        </Anchor>{" "}
                        and{" "}
                        <Anchor href="#" target="_blank" size="sm">
                          Privacy Policy
                        </Anchor>
                      </Text>
                    }
                    {...register("agreeToTerms", {
                      required:
                        "You must agree to the terms and privacy policy",
                    })}
                    error={errors.agreeToTerms?.message}
                  />
                </Stack>
              </Stepper.Step>

              <Stepper.Completed>
                <Stack mt="md" ta="center" gap="lg">
                  <IconCheck size={48} color="green" />
                  <Title order={3}>Ready to create your account</Title>
                  <Text ta="center">
                    Please review your information and click Register to create
                    your account.
                  </Text>
                </Stack>
              </Stepper.Completed>
            </Stepper>

            <Group justify="space-between" mt="xl">
              {activeStep > 0 && (
                <Button variant="default" onClick={handlePrevStep}>
                  Back
                </Button>
              )}

              {activeStep < 2 ? (
                <Button onClick={handleNextStep} ml="auto">
                  Next step
                </Button>
              ) : (
                <Button
                  type="submit"
                  c="green"
                  ml="auto"
                  disabled={!isValid || !getValues("agreeToTerms")}
                >
                  Register
                </Button>
              )}
            </Group>
          </form>

          {activeStep === 0 && (
            <>
              <Divider
                label="Or continue with"
                labelPosition="center"
                my="lg"
              />

              <Group grow mb="md">
                <Button
                  variant="outline"
                  onClick={handleGoogleRegister}
                  disabled={loading}
                >
                  <Group gap="xs">
                    <IconBrandGoogle size={16} />
                    <span>Google</span>
                  </Group>
                </Button>
              </Group>

              <Text ta="center" mt="md">
                Already have an account?{" "}
                <Anchor component={Link} href="/login">
                  Sign in
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
 * Registration page component
 * Wraps the registration content in a suspense boundary
 */
export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <Container size="md" py="xl">
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
      <RegisterContent />
    </Suspense>
  );
}
