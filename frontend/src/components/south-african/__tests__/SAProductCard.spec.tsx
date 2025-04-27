/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";

import { SAProductCard } from "../SAProductCard";

import "@testing-library/jest-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Custom expect helper for DOM assertions
const customExpect = (element: HTMLElement) => ({
  ...expect(element),
  toBeInTheDocument: () => expect(element).not.toBeNull(),
  toHaveAttribute: (attr: string, value?: string) =>
    value
      ? expect(element.getAttribute(attr)).toBe(value)
      : expect(element.hasAttribute(attr)).toBe(true),
});

describe("SAProductCard", () => {
  // Mock props matching the actual component interface
  const mockProps = {
    title: "Test Product",
    price: 199.99,
    discountPercentage: 15,
    originalPrice: 235.28,
    imageUrl: "/test-image.jpg",
    rating: 4.5,
    reviewCount: 42,
    stockStatus: "in_stock" as const,
    shippingMethods: ["standard", "express"] as Array<
      "standard" | "express" | "collection"
    >,
    estimatedDeliveryDays: 3,
    freeShipping: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock navigator.connection for tests
    Object.defineProperty(navigator, "connection", {
      value: {
        effectiveType: "4g",
        downlink: 10,
        rtt: 50,
        saveData: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      },
      configurable: true,
      writable: true,
    });
  });

  it("renders product details correctly", () => {
    render(<SAProductCard {...mockProps} />);

    // Check standard product details
    expect(screen.getByText("Test Product")).toBeDefined();
    expect(screen.getByText("R199.99")).toBeDefined();
    expect(screen.getByText("(42)")).toBeDefined();

    // Check discount info is visible
    expect(screen.getByText("15% OFF")).toBeDefined();
    expect(screen.getByText("R235.28")).toBeDefined();
  });

  it("shows optimized UI for slow connections", () => {
    // Mock a slow connection
    Object.defineProperty(navigator, "connection", {
      value: {
        effectiveType: "2g",
        downlink: 0.5,
        rtt: 600,
        saveData: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      },
      configurable: true,
      writable: true,
    });

    render(<SAProductCard {...mockProps} />);

    // Check for simplified card
    const simplifiedCard = document.querySelector(
      ".sa-product-card-simplified",
    );
    expect(simplifiedCard).toBeDefined();

    // Check essential info is still present
    expect(screen.getByText("Test Product")).toBeDefined();
    expect(screen.getByText("R199.99")).toBeDefined();
  });

  it('shows "Out of Stock" for out of stock products', () => {
    render(<SAProductCard {...mockProps} stockStatus="out_of_stock" />);

    // Check out of stock message
    expect(screen.getByText("Out of Stock")).toBeDefined();
  });

  it('shows "Low Stock" for low stock products', () => {
    render(<SAProductCard {...mockProps} stockStatus="low_stock" />);

    // Check low stock message
    expect(screen.getByText("Low Stock")).toBeDefined();
  });

  it("applies network-aware optimizations in data saver mode", () => {
    // Mock a connection with data saver enabled
    Object.defineProperty(navigator, "connection", {
      value: {
        effectiveType: "3g",
        downlink: 1.0,
        rtt: 300,
        saveData: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      },
      configurable: true,
      writable: true,
    });

    // Force data saver mode
    render(<SAProductCard {...mockProps} forceDataSaver={true} />);

    // Check for simplified card which appears in data saver mode
    const simplifiedCard = document.querySelector(
      ".sa-product-card-simplified",
    );
    expect(simplifiedCard).toBeDefined();
    expect(simplifiedCard?.getAttribute("data-simplified")).toBe("true");
  });

  it("displays shipping methods appropriately", () => {
    render(<SAProductCard {...mockProps} />);

    // Check shipping info is displayed
    expect(
      screen.getByText("Free Standard, Express Shipping (3 days)"),
    ).toBeDefined();
  });
});
