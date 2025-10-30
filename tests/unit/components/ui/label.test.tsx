import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Label } from "@/components/ui/label";

describe("Label component", () => {
  it("should render label element with text", () => {
    render(<Label>Email</Label>);
    const label = screen.getByText("Email");
    expect(label).toBeInTheDocument();
  });

  it("should have data-slot attribute", () => {
    render(<Label>Username</Label>);
    const label = screen.getByText("Username");
    expect(label).toHaveAttribute("data-slot", "label");
  });

  it("should accept custom className", () => {
    render(<Label className="custom-label">Password</Label>);
    const label = screen.getByText("Password");
    expect(label).toHaveClass("custom-label");
  });

  it("should accept htmlFor attribute", () => {
    render(<Label htmlFor="email-input">Email Address</Label>);
    const label = screen.getByText("Email Address");
    expect(label).toHaveAttribute("for", "email-input");
  });

  it("should render with children elements", () => {
    render(
      <Label>
        <span>Required</span>
        <span>*</span>
      </Label>
    );
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
  });
});
