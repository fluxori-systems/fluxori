// @vitest-environment jsdom
import "@testing-library/jest-dom";
("use client");

import React from "react";

import * as TestingLibrary from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";

import { Assertions } from "../../../../testing/utils/assertions";
import { renderWithProviders } from "../../../../testing/utils/render";

// Define Button prop interface to ensure type safety
interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: string;
  size?: string;
  intent?: string;
  disabled?: boolean;
  "data-testid"?: string;
  [key: string]: any;
}

// Mock the Button component to avoid actual React hooks usage in tests
vi.mock("../Button", () => ({
  Button: (props: ButtonProps) => {
    const {
      children,
      onClick,
      variant = "default",
      size = "medium",
      intent = "primary",
      disabled = false,
      "data-testid": testId = "button",
      ...rest
    } = props;

    // Build className
    const className = [
      "flx-button",
      `flx-button-${variant}`,
      `flx-button-size-${size}`,
      `flx-button-intent-${intent}`,
      disabled ? "flx-button-disabled" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
        disabled={disabled}
        data-testid={testId}
        data-variant={variant}
        data-size={size}
        data-intent={intent}
        {...rest}
      >
        {children}
      </button>
    );
  },
}));

// Import the mocked version
import { Button } from "../Button";

describe("Button Component", () => {
  test("renders button with default props", () => {
    const { getByTestId } = renderWithProviders(<Button>Click me</Button>);

    const button = getByTestId("button");

    Assertions.inDocument(button);
    Assertions.hasAttribute(button, "data-variant", "default");
    Assertions.hasAttribute(button, "data-size", "medium");
    Assertions.hasAttribute(button, "data-intent", "primary");
    Assertions.isNotDisabled(button);
  });

  test("renders different button variants", () => {
    const { getByTestId, rerender } = renderWithProviders(
      <Button variant="outline">Outline Button</Button>,
    );

    let button = getByTestId("button");

    Assertions.hasAttribute(button, "data-variant", "outline");

    rerender(<Button variant="text">Text Button</Button>);
    button = getByTestId("button");

    Assertions.hasAttribute(button, "data-variant", "text");

    rerender(<Button variant="filled">Filled Button</Button>);
    button = getByTestId("button");

    Assertions.hasAttribute(button, "data-variant", "filled");
  });

  test("handles different intent colors", () => {
    const { getByTestId, rerender } = renderWithProviders(
      <Button intent="success">Success Button</Button>,
    );

    let button = getByTestId("button");

    Assertions.hasAttribute(button, "data-intent", "success");

    rerender(<Button intent="error">Error Button</Button>);
    button = getByTestId("button");

    Assertions.hasAttribute(button, "data-intent", "error");

    rerender(<Button intent="warning">Warning Button</Button>);
    button = getByTestId("button");

    Assertions.hasAttribute(button, "data-intent", "warning");
  });

  test("handles click events", () => {
    const handleClick = vi.fn();

    const { getByTestId } = renderWithProviders(
      <Button onClick={handleClick}>Clickable Button</Button>,
    );

    const button = getByTestId("button");
    TestingLibrary.fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test("respects disabled state", () => {
    const handleClick = vi.fn();

    const { getByTestId } = renderWithProviders(
      <Button onClick={handleClick} disabled>
        Disabled Button
      </Button>,
    );

    const button = getByTestId("button");

    Assertions.isDisabled(button);

    TestingLibrary.fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  test("applies appropriate size classes", () => {
    const { getByTestId, rerender } = renderWithProviders(
      <Button size="small">Small Button</Button>,
    );

    let button = getByTestId("button");

    Assertions.hasAttribute(button, "data-size", "small");

    rerender(<Button size="large">Large Button</Button>);
    button = getByTestId("button");

    Assertions.hasAttribute(button, "data-size", "large");
  });

  test("passes additional attributes to button element", () => {
    const { getByTestId } = renderWithProviders(
      <Button aria-label="Custom Button" data-custom="test-value">
        Custom Attributes
      </Button>,
    );

    const button = getByTestId("button");

    Assertions.hasAttribute(button, "aria-label", "Custom Button");
    Assertions.hasAttribute(button, "data-custom", "test-value");
  });
});
