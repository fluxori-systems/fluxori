import { describe, it, expect, vi } from 'vitest';
import type { 
  IConnectionService
} from '../services/connection-service.interface';
import { CONNECTION_SERVICE_KEY } from '../services/connection-service.interface';
import type {
  IAnimationService
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

// Mock service implementations
const createMockConnectionService = (): IConnectionService => ({
  getConnectionQuality: vi.fn().mockReturnValue({
    quality: 'medium',
    isDataSaver: false,
    isMetered: false,
  }),
  subscribeToConnectionChanges: vi.fn().mockImplementation((callback) => {
    callback({
      quality: 'medium',
      isDataSaver: false,
      isMetered: false,
    });
    return vi.fn();
  }),
  isDataSaverEnabled: vi.fn().mockReturnValue(false),
  isConnectionMetered: vi.fn().mockReturnValue(false),
});

const createMockAnimationService = (): IAnimationService => ({
  animateComponent: vi.fn(),
  getAnimationStrategy: vi.fn().mockReturnValue({
    enabled: true,
    durationMultiplier: 1.0,
    useSimpleEasings: false,
    reduceComplexity: false,
    maxActiveAnimations: Infinity,
    disableStaggering: false,
    scaleMultiplier: 1.0,
  }),
  shouldReduceMotion: vi.fn().mockReturnValue(false),
  getMotionMode: vi.fn().mockReturnValue('full'),
});

describe('Service Registry', () => {
  beforeEach(() => {
    // Clear registry before each test
    ServiceRegistry['services'] = new Map();
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