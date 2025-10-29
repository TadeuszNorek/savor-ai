import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

describe("Tooltip components", () => {
  describe("TooltipTrigger", () => {
    it("should render tooltip trigger", () => {
      render(
        <Tooltip>
          <TooltipTrigger data-testid="trigger">Hover me</TooltipTrigger>
        </Tooltip>
      );
      const trigger = screen.getByTestId("trigger");
      expect(trigger).toBeInTheDocument();
      expect(screen.getByText("Hover me")).toBeInTheDocument();
    });

    it("should have data-slot attribute", () => {
      render(
        <Tooltip>
          <TooltipTrigger data-testid="trigger">Hover</TooltipTrigger>
        </Tooltip>
      );
      const trigger = screen.getByTestId("trigger");
      expect(trigger).toHaveAttribute("data-slot", "tooltip-trigger");
    });
  });

  describe("TooltipContent", () => {
    it("should render tooltip content with text", () => {
      render(
        <Tooltip defaultOpen>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent data-testid="content">Tooltip text</TooltipContent>
        </Tooltip>
      );
      const content = screen.getByTestId("content");
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent("Tooltip text");
    });

    it("should have data-slot attribute", () => {
      render(
        <Tooltip defaultOpen>
          <TooltipTrigger>Hover</TooltipTrigger>
          <TooltipContent data-testid="content">Content</TooltipContent>
        </Tooltip>
      );
      const content = screen.getByTestId("content");
      expect(content).toHaveAttribute("data-slot", "tooltip-content");
    });

    it("should accept custom className", () => {
      render(
        <Tooltip defaultOpen>
          <TooltipTrigger>Hover</TooltipTrigger>
          <TooltipContent className="custom-content" data-testid="content">
            Content
          </TooltipContent>
        </Tooltip>
      );
      const content = screen.getByTestId("content");
      expect(content).toHaveClass("custom-content");
    });
  });

  describe("Tooltip composition", () => {
    it("should render complete tooltip with trigger and content", () => {
      render(
        <Tooltip defaultOpen>
          <TooltipTrigger data-testid="trigger">Hover me</TooltipTrigger>
          <TooltipContent data-testid="content">Helpful tooltip text</TooltipContent>
        </Tooltip>
      );

      const trigger = screen.getByTestId("trigger");
      const content = screen.getByTestId("content");

      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent("Hover me");
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent("Helpful tooltip text");
    });
  });
});
