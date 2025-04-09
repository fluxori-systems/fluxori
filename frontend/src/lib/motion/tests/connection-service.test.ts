import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConnectionServiceImpl } from '../services/connection-service.impl';
import type { ConnectionQualityResult, MotionMode } from '../../shared/types/motion-types';

// Properly typed navigator connection mock
type NavigatorConnectionMock = {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  metered?: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
};

// Create a properly typed navigator connection mock
const createNavigatorConnectionMock = (
  config: Partial<NavigatorConnectionMock> = {}
): NavigatorConnectionMock & { reset: () => void } => {
  // Store original navigator object
  const originalNavigator = global.navigator;
  
  // Create mock with default values
  const mock: NavigatorConnectionMock = {
    effectiveType: config.effectiveType || '4g',
    downlink: config.downlink !== undefined ? config.downlink : 10,
    rtt: config.rtt !== undefined ? config.rtt : 100,
    saveData: config.saveData !== undefined ? config.saveData : false,
    metered: config.metered !== undefined ? config.metered : false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  // Apply mock
  Object.defineProperty(global, 'navigator', {
    value: { connection: mock },
    writable: true,
  });
  
  // Return mock with reset function
  return {
    ...mock,
    reset: () => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
    }
  };
};

describe('ConnectionServiceImpl', () => {
  let connectionService: ConnectionServiceImpl;
  let resetNavigator: () => void;
  
  beforeEach(() => {
    // Create default navigator mock
    const mock = createNavigatorConnectionMock();
    resetNavigator = mock.reset;
    
    // Create connection service
    connectionService = new ConnectionServiceImpl();
    
    // Mock setInterval and clearInterval
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    // Restore navigator
    resetNavigator();
    
    // Restore timers
    vi.resetAllMocks();
    vi.useRealTimers();
  });
  
  it('should initialize with default values', () => {
    const connectionData = connectionService.getConnectionQuality();
    
    expect(connectionData).toEqual(
      expect.objectContaining({
        quality: 'medium',
        isDataSaver: false,
        isMetered: false,
      })
    );
  });
  
  it('should detect high quality connection', () => {
    // Reset navigator with high quality values
    resetNavigator();
    createNavigatorConnectionMock({
      effectiveType: '4g',
      downlink: 20,
      rtt: 50,
    });
    
    // Force update connection quality
    (connectionService as any).updateConnectionQuality();
    
    const connectionData = connectionService.getConnectionQuality();
    expect(connectionData.quality).toBe('high');
  });
  
  it('should detect poor quality connection', () => {
    // Reset navigator with poor quality values
    resetNavigator();
    createNavigatorConnectionMock({
      effectiveType: '2g',
      downlink: 0.3,
      rtt: 700,
    });
    
    // Force update connection quality
    (connectionService as any).updateConnectionQuality();
    
    const connectionData = connectionService.getConnectionQuality();
    expect(connectionData.quality).toBe('poor');
  });
  
  it('should detect data saver mode', () => {
    // Reset navigator with data saver enabled
    resetNavigator();
    createNavigatorConnectionMock({
      saveData: true,
    });
    
    // Force update connection quality
    (connectionService as any).updateConnectionQuality();
    
    const connectionData = connectionService.getConnectionQuality();
    expect(connectionData.isDataSaver).toBe(true);
    expect(connectionData.quality).toBe('poor'); // Data saver forces poor quality
  });
  
  it('should respect motion mode quality floor', () => {
    // Set to minimal motion mode which forces poor quality
    connectionService.setMotionMode('minimal' as MotionMode);
    
    // Even with good connection values
    resetNavigator();
    createNavigatorConnectionMock({
      effectiveType: '4g',
      downlink: 50,
      rtt: 50, 
    });
    
    // Force update connection quality
    (connectionService as any).updateConnectionQuality();
    
    const connectionData = connectionService.getConnectionQuality();
    expect(connectionData.quality).toBe('poor');
  });
  
  it('should prioritize RTT over downlink for South African conditions', () => {
    // Reset navigator with good downlink but poor RTT (common in South Africa)
    resetNavigator();
    createNavigatorConnectionMock({
      effectiveType: '4g',
      downlink: 10, // Good
      rtt: 600, // Poor
    });
    
    // Force update connection quality
    (connectionService as any).updateConnectionQuality();
    
    const connectionData = connectionService.getConnectionQuality();
    expect(connectionData.quality).toBe('poor');
  });
  
  it('should notify subscribers when connection quality changes', () => {
    // Properly typed subscriber function
    const subscriber = vi.fn<[ConnectionQualityResult], void>();
    
    // Subscribe to changes
    const unsubscribe = connectionService.subscribeToConnectionChanges(subscriber);
    
    // Should call immediately with current state
    expect(subscriber).toHaveBeenCalledTimes(1);
    
    // Change connection quality
    resetNavigator();
    createNavigatorConnectionMock({
      effectiveType: '2g',
    });
    
    // Force update
    (connectionService as any).updateConnectionQuality();
    
    // Should call again with new state
    expect(subscriber).toHaveBeenCalledTimes(2);
    
    // Unsubscribe
    unsubscribe();
    
    // Change again
    resetNavigator();
    createNavigatorConnectionMock({
      effectiveType: '4g',
    });
    
    // Force update
    (connectionService as any).updateConnectionQuality();
    
    // Should not call again
    expect(subscriber).toHaveBeenCalledTimes(2);
  });
  
  it('should handle missing Navigator Connection API', () => {
    // Remove connection API
    resetNavigator();
    Object.defineProperty(global, 'navigator', {
      value: {},
      writable: true,
    });
    
    // Force update connection quality
    (connectionService as any).updateConnectionQuality();
    
    const connectionData = connectionService.getConnectionQuality();
    
    // Should fall back to default values
    expect(connectionData).toEqual(
      expect.objectContaining({
        quality: 'medium',
        isDataSaver: false,
        isMetered: false,
      })
    );
  });
});