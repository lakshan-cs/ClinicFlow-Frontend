'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  TextInput,
  PasswordInput,
  Checkbox,
  Button,
  Paper,
  Title,
  Text,
  Stack,
  Group,
  Anchor,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { loginUser, saveUser } from '../../services/authService';
import type { AxiosError } from 'axios';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Email is invalid'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

export default function Login() {
  const router = useRouter();
  const [rememberMe, setRememberMe] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const userData = await loginUser({ email: data.email, password: data.password });
      saveUser(userData);
      notifications.show({
        title: 'Success',
        message: 'Login successful!',
        color: 'green',
      });
      router.push('/dashboard');
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      console.error('Login error:', error.response?.data);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Login failed. Please try again.';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    }
  };

  const handleForgotPassword = () => {
    alert('Forgot password functionality would be implemented here');
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center p-5 font-sans">
      <Paper
        shadow="sm"
        radius="lg"
        p={40}
        className="w-full max-w-[500px]"
        style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}
      >
        <Stack gap={32} align="center">
          <div className="text-center">
            <Title order={1} className="text-[#222] font-bold text-3xl mb-2">
              Login
            </Title>
            <Text c="dimmed" size="md" fw={500}>
              Welcome back. Please sign in to continue.
            </Text>
          </div>

          <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
            <Stack gap={18}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label="Email"
                    type="email"
                    placeholder="Enter your email"
                    error={errors.email?.message}
                    disabled={isSubmitting}
                    size="md"
                    styles={{
                      input: {
                        backgroundColor: '#f7f8fa',
                        borderColor: errors.email ? '#C51B1B' : '#e0e0e0',
                        fontWeight: 500,
                      },
                      label: { fontWeight: 500, color: '#444', marginBottom: 6 },
                    }}
                  />
                )}
              />

              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <PasswordInput
                    {...field}
                    label="Password"
                    placeholder="Enter your password"
                    error={errors.password?.message}
                    disabled={isSubmitting}
                    size="md"
                    styles={{
                      input: {
                        backgroundColor: '#f7f8fa',
                        borderColor: errors.password ? '#C51B1B' : '#e0e0e0',
                        fontWeight: 500,
                      },
                      label: { fontWeight: 500, color: '#444', marginBottom: 6 },
                    }}
                  />
                )}
              />

              <Group justify="space-between" mt={10}>
                <Checkbox
                  label="Remember me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.currentTarget.checked)}
                  disabled={isSubmitting}
                  size="sm"
                  styles={{ label: { fontWeight: 500, color: '#444', cursor: 'pointer' } }}
                />
                <Anchor
                  component="button"
                  type="button"
                  onClick={handleForgotPassword}
                  size="sm"
                  fw={500}
                  c="#6c63ff"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Forgot Password?
                </Anchor>
              </Group>

              <Button
                type="submit"
                fullWidth
                size="md"
                mt={8}
                loading={isSubmitting}
                disabled={isSubmitting}
                style={{
                  backgroundColor: '#0d6efd',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: '1.08rem',
                  boxShadow: '0 2px 8px rgba(13, 110, 253, 0.3)',
                }}
              >
                {isSubmitting ? 'Logging in...' : 'Login'}
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </div>
  );
}
