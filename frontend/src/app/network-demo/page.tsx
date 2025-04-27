"use client";

import React, { useRef, useState } from "react";

import { ConnectionQualitySimulator } from "@/lib/motion/components/ConnectionQualitySimulator";
import { PerformanceDashboard } from "@/lib/motion/components/PerformanceDashboard";
import {
  useConnectionQuality,
  useMotionMode,
} from "@/lib/motion/hooks/useServices";
import type { ConnectionQuality } from "@/lib/shared/types/sa-market-types";
import { Button } from "@/lib/ui/components/Button";
import { FormField } from "@/lib/ui/components/FormField";
import { PerformanceButton } from "@/lib/ui/components/PerformanceButton";

const NetworkDemo = () => {
  const { quality, isDataSaver } = useConnectionQuality();
  const [motionMode, setMotionMode] = useMotionMode();

  const getQualityColor = (quality: ConnectionQuality) => {
    switch (quality) {
      case "high":
        return "var(--color-success-base)";
      case "medium":
        return "var(--color-info-base)";
      case "low":
        return "var(--color-warning-base)";
      case "poor":
        return "var(--color-error-base)";
      default:
        return "var(--color-info-base)";
    }
  };

  return (
    <ConnectionQualitySimulator initialProfile="south-africa-urban">
      <PerformanceDashboard
        title="South African Performance Monitor"
        initiallyExpanded={false}
        showDeviceCapabilities={true}
        minPriority="low"
      />
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Network-Aware UI Demo</h1>

        <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Current Network Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-md p-4">
              <p className="text-sm text-gray-500 mb-1">Connection Quality</p>
              <p className="font-medium flex items-center">
                <span
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: getQualityColor(quality) }}
                />
                {quality.charAt(0).toUpperCase() + quality.slice(1)}
              </p>
            </div>

            <div className="border rounded-md p-4">
              <p className="text-sm text-gray-500 mb-1">Data Saver Mode</p>
              <p className="font-medium">
                {isDataSaver ? "Enabled" : "Disabled"}
              </p>
            </div>

            <div className="border rounded-md p-4">
              <p className="text-sm text-gray-500 mb-1">Motion Preference</p>
              <p className="font-medium">
                {motionMode.charAt(0).toUpperCase() + motionMode.slice(1)}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Motion Settings</h2>
          <div className="flex flex-wrap gap-3">
            <Button
              intent={motionMode === "full" ? "primary" : "neutral"}
              onClick={() => setMotionMode("full")}
            >
              Full Motion
            </Button>
            <Button
              intent={motionMode === "reduced" ? "primary" : "neutral"}
              onClick={() => setMotionMode("reduced")}
            >
              Reduced Motion
            </Button>
            <Button
              intent={motionMode === "minimal" ? "primary" : "neutral"}
              onClick={() => setMotionMode("minimal")}
            >
              Minimal Motion
            </Button>
          </div>
        </div>

        <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            Network-Aware UI Components
          </h2>
          <p className="mb-4 text-gray-600">
            These components automatically adapt based on network conditions and
            motion preferences. Try changing the motion settings above and see
            how the components behave.
          </p>

          <div className="grid grid-cols-2 gap-6 mt-6">
            <div className="flex flex-col gap-3">
              <h3 className="font-medium mb-2">Buttons with Ripple Effect</h3>
              <Button>Default Button</Button>
              <Button intent="primary">Primary Button</Button>
              <Button intent="success">Success Button</Button>
              <Button intent="error">Error Button</Button>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="font-medium mb-2">
                Buttons with Different Animation Types
              </h3>
              <Button animationType="ripple">Ripple Animation</Button>
              <Button animationType="scale">Scale Animation</Button>
              <Button animationType="slide">Slide Animation</Button>
              <Button animationType="none">No Animation</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-8">
            <div className="flex flex-col gap-4">
              <h3 className="font-medium mb-2">
                Form Fields with Network Awareness
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                These form fields adapt to network conditions. On poor
                connections or with data saver enabled:
                <ul className="list-disc ml-6 mt-1">
                  <li>TextArea disables autosize</li>
                  <li>Select fields disable search functionality</li>
                  <li>Description text is hidden in data saver mode</li>
                  <li>Visual complexity is reduced</li>
                </ul>
              </p>

              <FormField
                type="text"
                label="Text Input"
                placeholder="Enter text"
                description="Regular text input with network optimizations"
              />

              <FormField
                type="textarea"
                label="Textarea"
                placeholder="Enter longer text"
                description="Disables autosize on poor connections to improve performance"
              />
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="font-medium mb-2">Interactive Form Fields</h3>

              <FormField
                type="select"
                label="Select Input"
                placeholder="Choose an option"
                description="Disables search on poor connections"
                options={[
                  { value: "option1", label: "Option 1" },
                  { value: "option2", label: "Option 2" },
                  { value: "option3", label: "Option 3" },
                  { value: "option4", label: "Option 4" },
                ]}
              />

              <FormField
                type="multiselect"
                label="Multi-Select Input"
                placeholder="Choose multiple options"
                description="Optimizes dropdown rendering on poor connections"
                options={[
                  { value: "option1", label: "Option 1" },
                  { value: "option2", label: "Option 2" },
                  { value: "option3", label: "Option 3" },
                  { value: "option4", label: "Option 4" },
                ]}
              />

              <FormField
                type="number"
                label="Number Input"
                placeholder="Enter a number"
                description="Optimizes increment/decrement on poor connections"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Performance Monitoring</h2>
          <p className="mb-4 text-gray-600">
            These buttons monitor their own performance and adapt animations
            based on device capabilities and network conditions. The buttons
            showing metrics display their animation duration in ms.
          </p>

          <div className="grid grid-cols-2 gap-6 mt-6">
            <div className="flex flex-col gap-3">
              <h3 className="font-medium mb-2">
                Performance Buttons (with metrics)
              </h3>
              <PerformanceButton
                showPerformanceMetrics={true}
                animationComplexity="high"
                animationType="hover"
              >
                High Complexity Button
              </PerformanceButton>

              <PerformanceButton
                showPerformanceMetrics={true}
                animationComplexity="medium"
                animationType="hover"
                intent="success"
              >
                Medium Complexity Button
              </PerformanceButton>

              <PerformanceButton
                showPerformanceMetrics={true}
                animationComplexity="low"
                animationType="hover"
                intent="error"
              >
                Low Complexity Button
              </PerformanceButton>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="font-medium mb-2">Auto-Adapting Buttons</h3>
              <PerformanceButton
                adaptToPerformance={true}
                animationType="ripple"
                intent="primary"
              >
                Auto-Adapting Ripple
              </PerformanceButton>

              <PerformanceButton
                adaptToPerformance={true}
                animationType="scale"
                intent="success"
              >
                Auto-Adapting Scale
              </PerformanceButton>

              <PerformanceButton
                adaptToPerformance={false}
                animationType="hover"
                intent="warning"
              >
                Non-Adapting Button
              </PerformanceButton>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            Network Adaptation Explained
          </h2>
          <div className="prose">
            <ul>
              <li>
                <strong>High Quality Connection:</strong> Full animations, rich
                effects, parallax scrolling
              </li>
              <li>
                <strong>Medium Quality Connection:</strong> Slightly reduced
                animation complexity, standard effects
              </li>
              <li>
                <strong>Low Quality Connection:</strong> Simplified animations,
                reduced motion, static backgrounds
              </li>
              <li>
                <strong>Poor Connection:</strong> Minimal animations, static UI,
                simplified layouts
              </li>
              <li>
                <strong>Data Saver Mode:</strong> Treated as poor connection
                with additional optimizations
              </li>
            </ul>
          </div>
        </div>
      </div>
    </ConnectionQualitySimulator>
  );
};

export default NetworkDemo;
