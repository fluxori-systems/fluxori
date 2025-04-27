"use client";

/**
 * App Provider
 *
 * This component provides all application-level context providers.
 */

import React, { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { ThemeProvider } from "@/lib/design-system/theme/ThemeContext";
import { MotionProvider } from "@/lib/motion";
import { AppProvider as SharedAppProvider } from "@/lib/shared/providers/app-provider";
import { SouthAfricanMarketProvider } from "@/lib/shared/providers/south-african-market-provider";

import { FirebaseProvider } from "../contexts/firebase-context";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: process.env.NODE_ENV === "production",
    },
  },
});

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SharedAppProvider>
          <MotionProvider>
            <SouthAfricanMarketProvider>
              <FirebaseProvider>{children}</FirebaseProvider>
            </SouthAfricanMarketProvider>
          </MotionProvider>
        </SharedAppProvider>
      </ThemeProvider>
      {process.env.NODE_ENV !== "production" && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
