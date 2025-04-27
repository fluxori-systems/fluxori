"use client";

import React, { useEffect, useState } from "react";

import { defaultConnectionService } from "../services/connection-service.impl";

import type { ConnectionQuality } from "../../shared/types/sa-market-types";

// Simulator modes
type SimulatorMode = "auto" | "manual";

// Network profiles for simulation
const networkProfiles = {
  "south-africa-rural": {
    quality: "poor" as ConnectionQuality,
    effectiveType: "2g",
    downlink: 0.3,
    rtt: 800,
    saveData: false,
    description: "Rural South Africa (2G/EDGE)",
  },
  "south-africa-township": {
    quality: "low" as ConnectionQuality,
    effectiveType: "3g",
    downlink: 1.2,
    rtt: 450,
    saveData: false,
    description: "Township Areas (3G)",
  },
  "south-africa-urban": {
    quality: "medium" as ConnectionQuality,
    effectiveType: "4g",
    downlink: 5,
    rtt: 150,
    saveData: false,
    description: "Urban Areas (4G)",
  },
  "south-africa-fiber": {
    quality: "high" as ConnectionQuality,
    effectiveType: "4g",
    downlink: 20,
    rtt: 50,
    saveData: false,
    description: "Fiber Connection (Urban)",
  },
  "data-saver": {
    quality: "poor" as ConnectionQuality,
    effectiveType: "4g",
    downlink: 10,
    rtt: 100,
    saveData: true,
    description: "Data Saver Mode",
  },
};

type NetworkProfile = keyof typeof networkProfiles;

interface ConnectionQualitySimulatorProps {
  /**
   * Initial network profile to simulate
   * @default 'south-africa-urban'
   */
  initialProfile?: NetworkProfile;

  /**
   * Whether to show the simulator controls
   * @default true
   */
  showControls?: boolean;

  /**
   * Simulation mode - auto cycles through profiles
   * @default 'manual'
   */
  mode?: SimulatorMode;

  /**
   * Interval between auto-switching profiles (in ms)
   * @default 5000
   */
  autoSwitchInterval?: number;

  /**
   * CSS class name for the simulator
   */
  className?: string;

  /**
   * Children to render inside simulator
   */
  children?: React.ReactNode;
}

/**
 * Component to simulate different network conditions for testing
 * Especially useful for South African market optimization testing
 */
export function ConnectionQualitySimulator({
  initialProfile = "south-africa-urban",
  showControls = true,
  mode = "manual",
  autoSwitchInterval = 5000,
  className = "",
  children,
}: ConnectionQualitySimulatorProps) {
  const [currentProfile, setCurrentProfile] =
    useState<NetworkProfile>(initialProfile);
  const [expanded, setExpanded] = useState(true);

  // Mock the navigator connection API
  useEffect(() => {
    // Save the original connection object
    const originalConnection = (navigator as any).connection;

    // Get profile settings
    const profile = networkProfiles[currentProfile];

    // Create mock connection object
    const mockConnection = {
      effectiveType: profile.effectiveType,
      downlink: profile.downlink,
      rtt: profile.rtt,
      saveData: profile.saveData,
      // Add event listeners for API compatibility
      addEventListener: originalConnection?.addEventListener || (() => {}),
      removeEventListener:
        originalConnection?.removeEventListener || (() => {}),
    };

    // Override navigator.connection
    Object.defineProperty(navigator, "connection", {
      value: mockConnection,
      configurable: true,
      writable: true,
    });

    // Force the connection service to update
    if ("updateConnectionQuality" in defaultConnectionService) {
      (defaultConnectionService as any).updateConnectionQuality();
    }

    // Restore original connection on cleanup
    return () => {
      Object.defineProperty(navigator, "connection", {
        value: originalConnection,
        configurable: true,
        writable: true,
      });
    };
  }, [currentProfile]);

  // Set up auto-switching if enabled
  useEffect(() => {
    if (mode !== "auto") return;

    const profiles = Object.keys(networkProfiles) as NetworkProfile[];
    let currentIndex = profiles.indexOf(currentProfile);

    const intervalId = setInterval(() => {
      currentIndex = (currentIndex + 1) % profiles.length;
      setCurrentProfile(profiles[currentIndex]);
    }, autoSwitchInterval);

    return () => clearInterval(intervalId);
  }, [mode, autoSwitchInterval, currentProfile]);

  // Handle profile change
  const handleProfileChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentProfile(event.target.value as NetworkProfile);
  };

  if (!showControls) {
    return <>{children}</>;
  }

  return (
    <div className={`connection-simulator ${className}`}>
      <div
        className="simulator-controls bg-zinc-800 text-white p-3 rounded-lg shadow-lg fixed bottom-4 right-4 z-50 max-w-xs"
        style={{ fontSize: "14px" }}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Network Simulator</h3>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            {expanded ? "▼" : "▲"}
          </button>
        </div>

        {expanded && (
          <>
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="network-profile" className="text-zinc-300 mr-2">
                  Network Profile:
                </label>
                <span
                  className={`inline-block w-3 h-3 rounded-full ml-2 ${
                    networkProfiles[currentProfile].quality === "high"
                      ? "bg-green-500"
                      : networkProfiles[currentProfile].quality === "medium"
                        ? "bg-blue-500"
                        : networkProfiles[currentProfile].quality === "low"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                  }`}
                />
              </div>
              <select
                id="network-profile"
                value={currentProfile}
                onChange={handleProfileChange}
                className="w-full bg-zinc-700 text-white border border-zinc-600 rounded px-2 py-1"
              >
                {Object.entries(networkProfiles).map(([key, profile]) => (
                  <option key={key} value={key}>
                    {profile.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-zinc-400 mb-2">
              Current settings:
              <span className="text-zinc-300">
                {" "}
                {networkProfiles[currentProfile].effectiveType},{" "}
                {networkProfiles[currentProfile].downlink} Mbps,{" "}
                {networkProfiles[currentProfile].rtt} ms RTT
                {networkProfiles[currentProfile].saveData && ", Data Saver"}
              </span>
            </div>

            <div className="flex justify-between">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  checked={mode === "manual"}
                  onChange={() =>
                    mode !== "manual" && setCurrentProfile(currentProfile)
                  }
                  className="form-radio mr-1"
                />
                <span className="text-xs">Manual</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  checked={mode === "auto"}
                  onChange={() => {}}
                  className="form-radio mr-1"
                />
                <span className="text-xs">Auto-cycle</span>
              </label>
            </div>
          </>
        )}
      </div>

      {children}
    </div>
  );
}
