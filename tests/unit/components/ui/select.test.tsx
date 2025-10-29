import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";

describe("Select components", () => {
  describe("Select", () => {
    it("should render select with trigger", () => {
      render(
        <Select>
          <SelectTrigger data-testid="trigger">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
        </Select>
      );
      expect(screen.getByTestId("trigger")).toBeInTheDocument();
    });

    it("should have data-slot attribute on trigger", () => {
      render(
        <Select>
          <SelectTrigger data-testid="trigger">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByTestId("trigger");
      expect(trigger).toHaveAttribute("data-slot", "select-trigger");
    });

    it("should display placeholder text", () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
        </Select>
      );
      expect(screen.getByText("Select option")).toBeInTheDocument();
    });
  });

  describe("SelectTrigger", () => {
    it("should accept custom className", () => {
      render(
        <Select>
          <SelectTrigger className="custom-trigger" data-testid="trigger">
            <SelectValue />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByTestId("trigger");
      expect(trigger).toHaveClass("custom-trigger");
    });

    it("should render with default size", () => {
      render(
        <Select>
          <SelectTrigger data-testid="trigger">
            <SelectValue />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByTestId("trigger");
      expect(trigger).toHaveAttribute("data-size", "default");
    });

    it("should render with small size", () => {
      render(
        <Select>
          <SelectTrigger size="sm" data-testid="trigger">
            <SelectValue />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByTestId("trigger");
      expect(trigger).toHaveAttribute("data-size", "sm");
    });

    it("should be disabled when disabled prop is true", () => {
      render(
        <Select disabled>
          <SelectTrigger data-testid="trigger">
            <SelectValue />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByTestId("trigger");
      expect(trigger).toBeDisabled();
    });
  });

  describe("SelectValue", () => {
    it("should render with placeholder", () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose an option" />
          </SelectTrigger>
        </Select>
      );
      expect(screen.getByText("Choose an option")).toBeInTheDocument();
    });

    it("should have data-slot attribute", () => {
      render(
        <Select>
          <SelectTrigger data-testid="trigger">
            <SelectValue placeholder="Test" data-testid="value" />
          </SelectTrigger>
        </Select>
      );
      const value = screen.getByTestId("value");
      expect(value).toHaveAttribute("data-slot", "select-value");
    });
  });
});
