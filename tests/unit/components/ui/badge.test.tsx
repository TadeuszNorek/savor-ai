import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge component', () => {
  it('should render badge with text', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    render(<Badge data-testid="badge">Badge</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('data-slot', 'badge');
  });

  it('should accept custom className', () => {
    render(<Badge className="custom-badge" data-testid="badge">Badge</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('custom-badge');
  });

  it('should render as span by default', () => {
    render(<Badge data-testid="badge">Badge</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge.tagName).toBe('SPAN');
  });

  describe('variants', () => {
    it('should render with default variant', () => {
      render(<Badge data-testid="badge">Default</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
    });

    it('should render with secondary variant', () => {
      render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
    });

    it('should render with destructive variant', () => {
      render(<Badge variant="destructive" data-testid="badge">Destructive</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
    });

    it('should render with outline variant', () => {
      render(<Badge variant="outline" data-testid="badge">Outline</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('asChild prop', () => {
    it('should render as child component when asChild is true', () => {
      render(
        <Badge asChild data-testid="badge">
          <button>Button Badge</button>
        </Badge>
      );
      const badge = screen.getByTestId('badge');
      expect(badge.tagName).toBe('BUTTON');
      expect(screen.getByText('Button Badge')).toBeInTheDocument();
    });

    it('should render as span when asChild is false', () => {
      render(<Badge asChild={false} data-testid="badge">Normal Badge</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge.tagName).toBe('SPAN');
    });
  });

  it('should accept aria-invalid attribute', () => {
    render(<Badge aria-invalid="true" data-testid="badge">Invalid</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('aria-invalid', 'true');
  });

  it('should render with icon inside', () => {
    render(
      <Badge data-testid="badge">
        <svg data-testid="icon" />
        <span>With Icon</span>
      </Badge>
    );
    expect(screen.getByTestId('badge')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('With Icon')).toBeInTheDocument();
  });
});
