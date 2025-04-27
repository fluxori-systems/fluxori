/**
 * Service Registry and Interface Tests
 *
 * This file tests that the service interfaces and registry work correctly with
 * proper TypeScript typing.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Import interface types directly to ensure we're testing against the actual interfaces
import { ANIMATION_SERVICE_KEY } from "../services/animation-service.interface";
import { CONNECTION_SERVICE_KEY } from "../services/connection-service.interface";
import {
  SERVICE_KEYS,
  ServiceRegistry,
  registerAnimationService,
  registerConnectionService,
  getAnimationService,
  getConnectionService,
} from "../services/service-registry";

import type {
  IAnimationService,
  ComponentAnimationConfig,
  PerformanceMonitoringSettings,
  AnimationFrameRecord,
  PerformanceAnalysisResult,
} from "../services/animation-service.interface";
import type {
  IConnectionService,
  ConnectionQualityResult,
} from "../services/connection-service.interface";
import type { AnimationStrategyConfig } from "../types/motion-types";

// Type for animation parameters
interface AnimationParams {
  enabled: boolean;
  durationMultiplier: number;
  useSimpleEasings: boolean;
  reduceComplexity: boolean;
  maxActiveAnimations: number;
  disableStaggering: boolean;
  scaleMultiplier: number;
}

// Create a fully typed mock ConnectionService implementation
class MockConnectionService implements IConnectionService {
  getConnectionQuality(): ConnectionQualityResult {
    return {
      quality: "medium",
      isDataSaver: false,
      isMetered: false,
    } as ConnectionQualityResult;
  }

  subscribeToConnectionChanges(
    callback: (quality: ConnectionQualityResult) => void,
  ): () => void {
    callback({
      quality: "medium",
      isDataSaver: false,
      isMetered: false,
    } as ConnectionQualityResult);
    return () => {}; // Return cleanup function
  }

  isDataSaverEnabled(): boolean {
    return false;
  }

  isConnectionMetered(): boolean {
    return false;
  }
}

// Create a fully typed mock AnimationService implementation
class MockAnimationService implements IAnimationService {
  animateComponent(config: ComponentAnimationConfig): () => void {
    return () => {}; // Return cleanup function
  }

  getAnimationStrategy(config: AnimationStrategyConfig): AnimationParams {
    return {
      enabled: true,
      durationMultiplier: 1.0,
      useSimpleEasings: false,
      reduceComplexity: false,
      maxActiveAnimations: Infinity,
      disableStaggering: false,
      scaleMultiplier: 1.0,
    };
  }

  shouldReduceMotion(): boolean {
    return false;
  }

  getMotionMode(): string {
    return "full";
  }

  // Add missing methods required by IAnimationService
  startPerformanceMonitoring(settings: PerformanceMonitoringSettings): number {
    return 1;
  }

  recordAnimationFrame(record: AnimationFrameRecord): void {
    // No-op implementation
  }

  stopPerformanceMonitoring(settings: PerformanceMonitoringSettings): void {
    // No-op implementation
  }

  getPerformanceAnalysis(
    settings: PerformanceMonitoringSettings,
  ): PerformanceAnalysisResult | null {
    return {
      hasIssues: false,
      severityLevel: 0,
      averageFrameTime: 16,
      maxFrameTime: 33,
      dropRate: 0,
    };
  }
}

// Tests for the service registry pattern
describe("Service Registry", () => {
  beforeEach(() => {
    // Clear registry before each test
    (ServiceRegistry as any)["services"] = new Map();
  });

  it("should register and retrieve services", () => {
    const mockConnectionService = new MockConnectionService();
    const mockAnimationService = new MockAnimationService();

    // Register services
    ServiceRegistry.register(
      SERVICE_KEYS.CONNECTION_SERVICE,
      mockConnectionService,
    );
    ServiceRegistry.register(
      SERVICE_KEYS.ANIMATION_SERVICE,
      mockAnimationService,
    );

    // Check registration
    expect(ServiceRegistry.has(SERVICE_KEYS.CONNECTION_SERVICE)).toBe(true);
    expect(ServiceRegistry.has(SERVICE_KEYS.ANIMATION_SERVICE)).toBe(true);

    // Retrieve services
    const retrievedConnectionService = ServiceRegistry.get<IConnectionService>(
      SERVICE_KEYS.CONNECTION_SERVICE,
    );
    const retrievedAnimationService = ServiceRegistry.get<IAnimationService>(
      SERVICE_KEYS.ANIMATION_SERVICE,
    );

    // Check retrieval
    expect(retrievedConnectionService).toBe(mockConnectionService);
    expect(retrievedAnimationService).toBe(mockAnimationService);
  });

  it("should use helper functions to register and retrieve services", () => {
    const mockConnectionService = new MockConnectionService();
    const mockAnimationService = new MockAnimationService();

    // Register using helper functions
    registerConnectionService(mockConnectionService);
    registerAnimationService(mockAnimationService);

    // Retrieve using helper functions
    const retrievedConnectionService = getConnectionService();
    const retrievedAnimationService = getAnimationService();

    // Check retrieval
    expect(retrievedConnectionService).toBe(mockConnectionService);
    expect(retrievedAnimationService).toBe(mockAnimationService);
  });

  it("should throw an error when retrieving an unregistered service", () => {
    // Attempt to retrieve unregistered service
    expect(() => {
      ServiceRegistry.get<IConnectionService>(SERVICE_KEYS.CONNECTION_SERVICE);
    }).toThrow();
  });

  it("should correctly verify registration with has() method", () => {
    // Initially no services registered
    expect(ServiceRegistry.has(SERVICE_KEYS.CONNECTION_SERVICE)).toBe(false);

    // Register connection service
    const mockConnectionService = new MockConnectionService();
    registerConnectionService(mockConnectionService);

    // Now should be registered
    expect(ServiceRegistry.has(SERVICE_KEYS.CONNECTION_SERVICE)).toBe(true);

    // Animation service still not registered
    expect(ServiceRegistry.has(SERVICE_KEYS.ANIMATION_SERVICE)).toBe(false);
  });

  it("should maintain TypeScript interface compliance", () => {
    // This test validates at compile-time that our interfaces match implementation
    const mockConnectionService = new MockConnectionService();
    const mockAnimationService = new MockAnimationService();

    // These lines will fail TypeScript compilation if interfaces don't match
    const connectionService: IConnectionService = mockConnectionService;
    const animationService: IAnimationService = mockAnimationService;

    // Register services
    registerConnectionService(connectionService);
    registerAnimationService(animationService);

    // Type assertions
    const retrievedConnectionService: IConnectionService =
      getConnectionService();
    const retrievedAnimationService: IAnimationService = getAnimationService();

    // Simple runtime check
    expect(retrievedConnectionService).toBe(mockConnectionService);
    expect(retrievedAnimationService).toBe(mockAnimationService);

    // Call methods to verify typing
    const connectionQuality = retrievedConnectionService.getConnectionQuality();
    expect(connectionQuality).toHaveProperty("quality");

    const cleanup = retrievedAnimationService.animateComponent({
      ref: { current: null },
      enabled: true,
      mode: "appear",
      properties: { opacity: 1 },
    });
    expect(typeof cleanup).toBe("function");
  });
});
