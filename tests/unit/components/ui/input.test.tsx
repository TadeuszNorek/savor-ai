import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "@/components/ui/input";

describe("Input component", () => {
  it("should render input element", () => {
    render(<Input />);
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
  });

  it("should have data-slot attribute", () => {
    render(<Input />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("data-slot", "input");
  });

  it("should accept custom className", () => {
    render(<Input className="custom-class" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("custom-class");
  });

  it("should render with different input types", () => {
    const { rerender } = render(<Input type="email" />);
    let input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("type", "email");

    rerender(<Input type="password" data-testid="password-input" />);
    input = screen.getByTestId("password-input");
    expect(input).toHaveAttribute("type", "password");

    rerender(<Input type="number" />);
    input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("type", "number");
  });

  it("should handle value and onChange", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Input value="" onChange={handleChange} />);
    const input = screen.getByRole("textbox");

    await user.type(input, "test");
    expect(handleChange).toHaveBeenCalled();
  });

  it("should render as disabled", () => {
    render(<Input disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("should render with placeholder", () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
  });

  it("should apply aria-invalid styling when invalid", () => {
    render(<Input aria-invalid="true" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("should accept other standard input attributes", () => {
    render(<Input name="username" autoComplete="username" required maxLength={50} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("name", "username");
    expect(input).toHaveAttribute("autocomplete", "username");
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("maxLength", "50");
  });
});
