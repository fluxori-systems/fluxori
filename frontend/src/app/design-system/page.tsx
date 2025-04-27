"use client";

import { useState } from "react";

import { Tabs } from "@mantine/core";

// Import design system components
import { ThemeProvider } from "@/lib/design-system";
import {
  ThemeShowcase,
  DesignSystemDocs,
} from "@/lib/design-system/components";

/**
 * Design System showcase page
 * Demonstrates all design tokens and provides documentation
 */
export default function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState<string | null>("showcase");

  return (
    <ThemeProvider>
      <Tabs value={activeTab} onChange={setActiveTab} w="100%">
        <Tabs.List w="100%">
          <Tabs.Tab value="showcase">Design System Showcase</Tabs.Tab>
          <Tabs.Tab value="docs">Documentation</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="showcase" py="md">
          <ThemeShowcase />
        </Tabs.Panel>

        <Tabs.Panel value="docs" py="md">
          <DesignSystemDocs />
        </Tabs.Panel>
      </Tabs>
    </ThemeProvider>
  );
}
