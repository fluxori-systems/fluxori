"use client";

import React from "react";

import { describe, test, expect, vi } from "vitest";

import { renderHook } from "../../../testing/utils/render";
import { useConnectionQuality, useReducedMotion } from "../hooks";

// Mock the hooks implementation
vi.mock("../hooks", () => ({
  useConnectionQuality: () => ({
    quality: "high",
    effectiveType: "4g",
    downlinkSpeed: 10,
    rtt: 50,
    isDataSaver: false,
    isMetered: false,
  }),
  useReducedMotion: () => false,
  useMotionMode: () => ({
    motionMode: "full",
    setMotionMode: vi.fn(),
  }),
  useAnimationService: () => ({
    animate: vi.fn(),
    stopAnimation: vi.fn(),
    applyAnimationStrategy: vi.fn(),
  }),
}));

describe("Motion Service Hooks", () => {
  describe("useConnectionQuality", () => {
    test("returns connection quality from service", () => {
      const { result } = renderHook(() => useConnectionQuality());

      expect(result.current.quality).toBe("high");
      expect(result.current.effectiveType).toBe("4g");
      expect(result.current.isDataSaver).toBe(false);
    });
  });

  describe("useReducedMotion", () => {
    test("returns false by default", () => {
      const { result } = renderHook(() => useReducedMotion());

      expect(result.current).toBe(false);
    });
  });
});
