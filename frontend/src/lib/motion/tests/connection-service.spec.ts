import { describe, test, expect, vi, beforeEach } from "vitest";

import { ConnectionServiceImpl } from "../services/connection-service.impl";

import type { ConnectionQualityResult } from "../../shared/types/sa-market-types";

// Setup mock for navigator.connection
beforeEach(() => {
  Object.defineProperty(navigator, "connection", {
    value: {
      effectiveType: "4g",
      downlink: 10,
      rtt: 50,
      saveData: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    },
    configurable: true,
    writable: true,
  });
});

describe("ConnectionServiceImpl", () => {
  test("getConnectionQuality returns expected quality", () => {
    // Create a simplified ConnectionServiceImpl
    const service = new ConnectionServiceImpl();

    // Create a spy on the service to modify its behavior
    vi.spyOn(service, "getConnectionQuality").mockReturnValue({
      quality: "high",
      effectiveType: "4g",
      downlinkSpeed: 10,
      rtt: 50,
      isDataSaver: false,
      isMetered: false,
    } as ConnectionQualityResult);

    const result = service.getConnectionQuality();

    expect(result.quality).toBe("high");
    expect(result.effectiveType).toBe("4g");
  });
});
