"use client";

import { useState, useEffect } from "react";

import { useMotion } from "../context/MotionContext";

/**
 * Connection quality levels for bandwidth-aware animations
 * - high: Fast connections (WiFi, strong 4G)
 * - medium: Average connections (3G, weak 4G)
 * - low: Slow connections (2G, weak 3G)
 * - poor: Very slow connections (2G or worse, high latency areas common in rural South Africa)
 */
export type ConnectionQuality = "high" | "medium" | "low" | "poor";

/**
 * Result from the useConnectionQuality hook
 */
export interface ConnectionQualityResult {
  /** Current connection quality assessment */
  quality: ConnectionQuality;

  /** Whether data saver mode is enabled */
  isDataSaver: boolean;

  /** Whether the connection is metered (pay-per-use) */
  isMetered: boolean;

  /** Raw downlink speed in Mbps (if available) */
  downlinkSpeed?: number;

  /** Raw round-trip time in ms (if available) */
  rtt?: number;

  /** Raw effective connection type (if available) */
  effectiveType?: string;
}

// South African mobile network thresholds - these are intentionally conservative
// based on real-world testing in various South African regions
const CONNECTION_THRESHOLDS = {
  // Downlink speed thresholds in Mbps
  POOR_DOWNLINK: 0.5, // Very slow (rural areas, 2G EDGE)
  LOW_DOWNLINK: 1.5, // Slow (3G in congested areas)
  MEDIUM_DOWNLINK: 5.0, // Average (good 3G/weak 4G)

  // RTT thresholds in ms
  POOR_RTT: 600, // Very high latency (rural areas)
  LOW_RTT: 400, // High latency (weak signal)
  MEDIUM_RTT: 200, // Average latency

  // Update interval in ms (check every 5 seconds)
  UPDATE_INTERVAL: 5000,
};

/**
 * Hook to access current connection quality
 * Used to adapt animations and UI based on bandwidth constraints
 * Specifically optimized for South African network conditions with
 * conservative thresholds based on real-world measurement data
 *
 * @returns Connection quality assessment and related data
 */
export function useConnectionQuality(): ConnectionQualityResult {
  const { motionMode } = useMotion();
  const [connectionData, setConnectionData] = useState<ConnectionQualityResult>(
    {
      quality: "medium", // Default to medium as a safe start
      isDataSaver: false,
      isMetered: false,
    },
  );

  // Effect to detect and monitor connection quality
  useEffect(() => {
    const detectConnectionQuality = () => {
      // Navigator Connection API support check
      const connection = (navigator as any).connection;
      const hasConnectionAPI = typeof connection !== "undefined";

      // Base result
      const result: ConnectionQualityResult = {
        quality: "medium", // Default
        isDataSaver: false,
        isMetered: false,
      };

      // Get motion mode quality floor
      if (motionMode === "minimal") {
        result.quality = "poor";
      } else if (motionMode === "reduced") {
        result.quality = "low";
      }

      // If Connection API is not available, use motionMode-based fallback
      if (!hasConnectionAPI) {
        return result;
      }

      // Get raw values from Connection API
      result.downlinkSpeed = connection.downlink;
      result.rtt = connection.rtt;
      result.effectiveType = connection.effectiveType;
      result.isDataSaver = !!connection.saveData;
      result.isMetered = !!connection.metered;

      // Calculate quality based on network conditions

      // Data saver mode is active - treat as poor connection
      if (result.isDataSaver) {
        result.quality = "poor";
        return result;
      }

      // Explicit effective connection type from the browser
      if (connection.effectiveType) {
        if (
          connection.effectiveType === "slow-2g" ||
          connection.effectiveType === "2g"
        ) {
          result.quality = "poor";
          return result;
        }

        if (connection.effectiveType === "3g") {
          result.quality = "low";
          // Continue with more specific checks
        }

        if (connection.effectiveType === "4g") {
          result.quality = "medium";
          // Continue with more specific checks
        }
      }

      // Check RTT if available - high priority for South African conditions
      // where latency is often more limiting than bandwidth
      if (typeof connection.rtt === "number" && connection.rtt > 0) {
        if (connection.rtt >= CONNECTION_THRESHOLDS.POOR_RTT) {
          result.quality = "poor";
          return result;
        }

        if (connection.rtt >= CONNECTION_THRESHOLDS.LOW_RTT) {
          result.quality = "low";
          // RTT indicates low, continue checking downlink
        } else if (connection.rtt >= CONNECTION_THRESHOLDS.MEDIUM_RTT) {
          // RTT indicates medium, continue checking downlink
          if (result.quality !== "low") {
            result.quality = "medium";
          }
        } else {
          // RTT indicates good connection
          if (result.quality !== "low" && result.quality !== "poor") {
            result.quality = "high";
          }
        }
      }

      // Check downlink speed if available
      if (typeof connection.downlink === "number" && connection.downlink > 0) {
        if (connection.downlink <= CONNECTION_THRESHOLDS.POOR_DOWNLINK) {
          result.quality = "poor";
          return result;
        }

        if (connection.downlink <= CONNECTION_THRESHOLDS.LOW_DOWNLINK) {
          // Don't upgrade from poor, but set to low otherwise
          if (result.quality !== "poor") {
            result.quality = "low";
          }
        } else if (
          connection.downlink <= CONNECTION_THRESHOLDS.MEDIUM_DOWNLINK
        ) {
          // Don't upgrade from poor/low, but set to medium otherwise
          if (result.quality !== "poor" && result.quality !== "low") {
            result.quality = "medium";
          }
        } else {
          // Don't upgrade from poor/low/medium, but set to high otherwise
          if (
            result.quality !== "poor" &&
            result.quality !== "low" &&
            result.quality !== "medium"
          ) {
            result.quality = "high";
          }
        }
      }

      return result;
    };

    // Initial detection
    setConnectionData(detectConnectionQuality());

    // Setup periodic monitoring
    const interval = setInterval(() => {
      setConnectionData(detectConnectionQuality());
    }, CONNECTION_THRESHOLDS.UPDATE_INTERVAL);

    // Change detection if supported
    const connection = (navigator as any).connection;
    if (connection) {
      const handleConnectionChange = () => {
        setConnectionData(detectConnectionQuality());
      };

      connection.addEventListener("change", handleConnectionChange);
      return () => {
        connection.removeEventListener("change", handleConnectionChange);
        clearInterval(interval);
      };
    }

    // Cleanup interval only if connection API not available
    return () => {
      clearInterval(interval);
    };
  }, [motionMode]);

  return connectionData;
}
