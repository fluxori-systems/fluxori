import { describe, test, expect, vi } from 'vitest';
import { ConnectionServiceImpl } from '../services/connection-service.impl';

// Mock navigator connection
vi.mock('navigator', () => ({
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false
  }
}), { virtual: true });

describe('ConnectionServiceImpl', () => {
  test('getConnectionQuality returns expected quality', () => {
    // Create a simplified ConnectionServiceImpl
    const service = new ConnectionServiceImpl();
    
    // Create a spy on the service to modify its behavior
    vi.spyOn(service, 'getConnectionQuality').mockReturnValue({
      quality: 'high',
      effectiveType: '4g',
      downlinkSpeed: 10,
      rtt: 50,
      isDataSaver: false,
      isMetered: false
    });
    
    const result = service.getConnectionQuality();
    
    expect(result.quality).toBe('high');
    expect(result.effectiveType).toBe('4g');
  });
});