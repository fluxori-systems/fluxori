import { describe, it, expect, vi } from 'vitest';
import type { 
  IConnectionService,
  ConnectionQualityResult
} from '../services/connection-service.interface';
import { CONNECTION_SERVICE_KEY } from '../services/connection-service.interface';
import type {
  IAnimationService,
  AnimationStrategyConfig,
  AnimationParams,
  ComponentAnimationConfig
} from '../services/animation-service.interface';
import { ANIMATION_SERVICE_KEY } from '../services/animation-service.interface';
import {
  SERVICE_KEYS,
  ServiceRegistry,
  registerAnimationService,
  registerConnectionService,
  getAnimationService,
  getConnectionService
} from '../services/service-registry';

// Mock service implementations with proper TypeScript types
const createMockConnectionService = (): IConnectionService => {
  // Create properly typed mock functions
  const getConnectionQuality = vi.fn<[], ConnectionQualityResult>().mockReturnValue({
    quality: 'medium',
    isDataSaver: false,
    isMetered: false,
  });
  
  const subscribeToConnectionChanges = vi.fn<
    [(quality: ConnectionQualityResult) => void], 
    () => void
  >().mockImplementation((callback) => {
    callback({
      quality: 'medium',
      isDataSaver: false,
      isMetered: false,
    });
    return vi.fn();
  });
  
  const isDataSaverEnabled = vi.fn<[], boolean>().mockReturnValue(false);
  const isConnectionMetered = vi.fn<[], boolean>().mockReturnValue(false);

  return {
    getConnectionQuality,
    subscribeToConnectionChanges,
    isDataSaverEnabled,
    isConnectionMetered,
  };
};

const createMockAnimationService = (): IAnimationService => {
  // Create properly typed mock functions
  const animateComponent = vi.fn<[ComponentAnimationConfig], () => void>().mockImplementation(() => {
    return () => {}; // Return cleanup function
  });
  
  const getAnimationStrategy = vi.fn<[AnimationStrategyConfig], AnimationParams>().mockReturnValue({
    enabled: true,
    durationMultiplier: 1.0,
    useSimpleEasings: false,
    reduceComplexity: false,
    maxActiveAnimations: Infinity,
    disableStaggering: false,
    scaleMultiplier: 1.0,
  });
  
  const shouldReduceMotion = vi.fn<[], boolean>().mockReturnValue(false);
  const getMotionMode = vi.fn<[], string>().mockReturnValue('full');

  return {
    animateComponent,
    getAnimationStrategy,
    shouldReduceMotion,
    getMotionMode,
  };
};

describe('Service Registry', () => {
  beforeEach(() => {
    // Clear registry before each test
    (ServiceRegistry as any)['services'] = new Map();
  });
  
  it('should register and retrieve services', () => {
    const mockConnectionService = createMockConnectionService();
    const mockAnimationService = createMockAnimationService();
    
    // Register services
    ServiceRegistry.register(SERVICE_KEYS.CONNECTION_SERVICE, mockConnectionService);
    ServiceRegistry.register(SERVICE_KEYS.ANIMATION_SERVICE, mockAnimationService);
    
    // Check registration
    expect(ServiceRegistry.has(SERVICE_KEYS.CONNECTION_SERVICE)).toBe(true);
    expect(ServiceRegistry.has(SERVICE_KEYS.ANIMATION_SERVICE)).toBe(true);
    
    // Retrieve services
    const retrievedConnectionService = ServiceRegistry.get<IConnectionService>(
      SERVICE_KEYS.CONNECTION_SERVICE
    );
    const retrievedAnimationService = ServiceRegistry.get<IAnimationService>(
      SERVICE_KEYS.ANIMATION_SERVICE
    );
    
    // Check retrieval
    expect(retrievedConnectionService).toBe(mockConnectionService);
    expect(retrievedAnimationService).toBe(mockAnimationService);
  });
  
  it('should use helper functions to register and retrieve services', () => {
    const mockConnectionService = createMockConnectionService();
    const mockAnimationService = createMockAnimationService();
    
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
  
  it('should throw an error when retrieving an unregistered service', () => {
    // Attempt to retrieve unregistered service
    expect(() => {
      ServiceRegistry.get<IConnectionService>(SERVICE_KEYS.CONNECTION_SERVICE);
    }).toThrow();
  });
  
  it('should correctly verify registration with has() method', () => {
    // Initially no services registered
    expect(ServiceRegistry.has(SERVICE_KEYS.CONNECTION_SERVICE)).toBe(false);
    
    // Register connection service
    const mockConnectionService = createMockConnectionService();
    registerConnectionService(mockConnectionService);
    
    // Now should be registered
    expect(ServiceRegistry.has(SERVICE_KEYS.CONNECTION_SERVICE)).toBe(true);
    
    // Animation service still not registered
    expect(ServiceRegistry.has(SERVICE_KEYS.ANIMATION_SERVICE)).toBe(false);
  });
  
  it('should maintain TypeScript interface compliance', () => {
    // This test validates at compile-time that our interfaces match implementation
    const mockConnectionService = createMockConnectionService();
    const mockAnimationService = createMockAnimationService();
    
    // These lines will fail TypeScript compilation if interfaces don't match
    const connectionService: IConnectionService = mockConnectionService;
    const animationService: IAnimationService = mockAnimationService;
    
    // Register services
    registerConnectionService(connectionService);
    registerAnimationService(animationService);
    
    // Type assertions
    const retrievedConnectionService: IConnectionService = getConnectionService();
    const retrievedAnimationService: IAnimationService = getAnimationService();
    
    // Simple runtime check
    expect(retrievedConnectionService).toBe(mockConnectionService);
    expect(retrievedAnimationService).toBe(mockAnimationService);
  });
});