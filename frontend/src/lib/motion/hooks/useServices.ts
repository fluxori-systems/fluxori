"use client";

import { useEffect, useState } from "react";

import {
  useService,
  useServiceContext,
} from "../../shared/providers/service-provider";
import {
  IAnimationService,
  useAnimationService as useSharedAnimationService,
} from "../../shared/services/animation-service.interface";
import {
  IConnectionService,
  useConnectionService as useSharedConnectionService,
  ConnectionQualityResult,
} from "../../shared/services/connection-service.interface";
import { SERVICE_KEYS } from "../../shared/services/service-registry";
import { MotionMode } from "../../shared/types/motion-types";
import { defaultAnimationService } from "../services/animation-service.impl";
import { defaultConnectionService } from "../services/connection-service.impl";

/**
 * Hook to access the animation service
 * Falls back to default implementation if not in context
 */
export function useAnimationService(): IAnimationService {
  try {
    // Try to get from context first
    return useSharedAnimationService();
  } catch (error) {
    // Fall back to default implementation
    return defaultAnimationService;
  }
}

/**
 * Hook to access the connection service
 * Falls back to default implementation if not in context
 */
export function useConnectionService(): IConnectionService {
  try {
    // Try to get from context first
    return useSharedConnectionService();
  } catch (error) {
    // Fall back to default implementation
    return defaultConnectionService;
  }
}

/**
 * Hook to get the current connection quality
 * @returns Connection quality data and functions to subscribe to changes
 */
export function useConnectionQuality(): ConnectionQualityResult {
  const connectionService = useConnectionService();
  const [quality, setQuality] = useState<ConnectionQualityResult>(
    connectionService.getConnectionQuality(),
  );

  useEffect(() => {
    // Subscribe to connection quality changes
    const unsubscribe = connectionService.subscribeToConnectionChanges(
      (newQuality) => setQuality(newQuality),
    );

    // Unsubscribe when component unmounts
    return unsubscribe;
  }, [connectionService]);

  return quality;
}

/**
 * Hook to check if animations should be reduced
 * @returns True if animations should be reduced
 */
export function useReducedMotion(): boolean {
  const animationService = useAnimationService();
  return animationService.shouldReduceMotion();
}

/**
 * Hook to get and set the motion mode
 * @returns Current motion mode and function to set it
 */
export function useMotionMode(): [MotionMode, (mode: MotionMode) => void] {
  const animationService = useAnimationService();
  const connectionService = useConnectionService();
  const [mode, setMode] = useState<MotionMode>(
    animationService.getMotionMode() as MotionMode,
  );

  const updateMode = (newMode: MotionMode) => {
    setMode(newMode);

    // Update services
    if ("setMotionMode" in animationService) {
      (animationService as any).setMotionMode(newMode);
    }

    if ("setMotionMode" in connectionService) {
      (connectionService as any).setMotionMode(newMode);
    }
  };

  return [mode, updateMode];
}
