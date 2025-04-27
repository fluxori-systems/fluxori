"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import { ServiceProvider } from "../../shared/providers/service-provider";
import {
  registerAnimationService,
  registerConnectionService,
} from "../../shared/services/service-registry";
import { MotionMode } from "../../shared/types/motion-types";
import { defaultAnimationService } from "../services/animation-service.impl";
import { defaultConnectionService } from "../services/connection-service.impl";

// Register default service implementations
registerAnimationService(defaultAnimationService);
registerConnectionService(defaultConnectionService);

// Motion context props
export interface MotionContextProps {
  motionMode: MotionMode;
  setMotionMode: (mode: MotionMode) => void;
  isDataSaver: boolean;
  prefersReducedMotion?: boolean;
  isLowBandwidth?: boolean;
}

// Create the context
export const MotionContext = createContext<MotionContextProps | undefined>(
  undefined,
);

// Motion provider props
interface MotionProviderProps {
  children: ReactNode;
  initialMode?: MotionMode;
}

/**
 * Provider component for motion settings
 * Handles motion preferences and data saver mode
 */
export function MotionProvider({
  children,
  initialMode = "full",
}: MotionProviderProps) {
  const [motionMode, setMotionMode] = useState<MotionMode>(initialMode);
  const [isDataSaver, setIsDataSaver] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] =
    useState<boolean>(false);
  const [isLowBandwidth, setIsLowBandwidth] = useState<boolean>(false);

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(query.matches);

      // Listen for changes
      const handleReducedMotionChange = (event: MediaQueryListEvent) => {
        setPrefersReducedMotion(event.matches);
      };

      query.addEventListener("change", handleReducedMotionChange);
      return () => {
        query.removeEventListener("change", handleReducedMotionChange);
      };
    }
  }, []);

  // Check for data saver mode and network conditions
  useEffect(() => {
    const connection = (navigator as any).connection;
    if (connection) {
      // Initial check
      setIsDataSaver(!!connection.saveData);

      // Check if bandwidth is limited
      const checkBandwidth = () => {
        if (connection.downlink !== undefined) {
          setIsLowBandwidth(connection.downlink < 1.0); // Less than 1 Mbps
        } else if (connection.effectiveType) {
          setIsLowBandwidth(
            ["slow-2g", "2g", "slow-3g"].includes(connection.effectiveType),
          );
        }
      };

      checkBandwidth();

      // Listen for changes
      const handleConnectionChange = () => {
        setIsDataSaver(!!connection.saveData);
        checkBandwidth();
      };

      connection.addEventListener("change", handleConnectionChange);
      return () => {
        connection.removeEventListener("change", handleConnectionChange);
      };
    }
  }, []);

  // Update services when motion mode changes
  useEffect(() => {
    if ("setMotionMode" in defaultAnimationService) {
      (defaultAnimationService as any).setMotionMode(motionMode);
    }

    if ("setMotionMode" in defaultConnectionService) {
      (defaultConnectionService as any).setMotionMode(motionMode);
    }
  }, [motionMode]);

  // Context value
  const contextValue: MotionContextProps = {
    motionMode,
    setMotionMode,
    isDataSaver,
    prefersReducedMotion,
    isLowBandwidth,
  };

  return (
    <ServiceProvider
      animationService={defaultAnimationService}
      connectionService={defaultConnectionService}
    >
      <MotionContext.Provider value={contextValue}>
        {children}
      </MotionContext.Provider>
    </ServiceProvider>
  );
}

/**
 * Hook to access the motion context
 * @returns Motion context
 */
export function useMotion(): MotionContextProps {
  const context = useContext(MotionContext);

  if (!context) {
    throw new Error("useMotion must be used within a MotionProvider");
  }

  return context;
}
