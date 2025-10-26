import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

describe('Card components', () => {
  describe('Card', () => {
    it('should render card element', () => {
      render(<Card data-testid="card">Card content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('data-slot', 'card');
    });

    it('should accept custom className', () => {
      render(<Card className="custom-card" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-card');
    });
  });

  describe('CardHeader', () => {
    it('should render card header', () => {
      render(<CardHeader data-testid="header">Header content</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toHaveAttribute('data-slot', 'card-header');
    });

    it('should accept custom className', () => {
      render(<CardHeader className="custom-header" data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('CardTitle', () => {
    it('should render card title', () => {
      render(<CardTitle>My Card Title</CardTitle>);
      expect(screen.getByText('My Card Title')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title).toHaveAttribute('data-slot', 'card-title');
    });

    it('should accept custom className', () => {
      render(<CardTitle className="custom-title" data-testid="title">Title</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title).toHaveClass('custom-title');
    });
  });

  describe('CardDescription', () => {
    it('should render card description', () => {
      render(<CardDescription>Card description text</CardDescription>);
      expect(screen.getByText('Card description text')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>);
      const desc = screen.getByTestId('desc');
      expect(desc).toHaveAttribute('data-slot', 'card-description');
    });

    it('should accept custom className', () => {
      render(<CardDescription className="custom-desc" data-testid="desc">Description</CardDescription>);
      const desc = screen.getByTestId('desc');
      expect(desc).toHaveClass('custom-desc');
    });
  });

  describe('CardAction', () => {
    it('should render card action', () => {
      render(<CardAction data-testid="action">Action button</CardAction>);
      const action = screen.getByTestId('action');
      expect(action).toBeInTheDocument();
      expect(screen.getByText('Action button')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<CardAction data-testid="action">Action</CardAction>);
      const action = screen.getByTestId('action');
      expect(action).toHaveAttribute('data-slot', 'card-action');
    });

    it('should accept custom className', () => {
      render(<CardAction className="custom-action" data-testid="action">Action</CardAction>);
      const action = screen.getByTestId('action');
      expect(action).toHaveClass('custom-action');
    });
  });

  describe('CardContent', () => {
    it('should render card content', () => {
      render(<CardContent data-testid="content">Main content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toBeInTheDocument();
      expect(screen.getByText('Main content')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveAttribute('data-slot', 'card-content');
    });

    it('should accept custom className', () => {
      render(<CardContent className="custom-content" data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-content');
    });
  });

  describe('CardFooter', () => {
    it('should render card footer', () => {
      render(<CardFooter data-testid="footer">Footer content</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveAttribute('data-slot', 'card-footer');
    });

    it('should accept custom className', () => {
      render(<CardFooter className="custom-footer" data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('custom-footer');
    });
  });

  describe('Card composition', () => {
    it('should render complete card with all components', () => {
      render(
        <Card data-testid="card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
            <CardAction>Action</CardAction>
          </CardHeader>
          <CardContent>Main content here</CardContent>
          <CardFooter>Footer content</CardFooter>
        </Card>
      );

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Description')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('Main content here')).toBeInTheDocument();
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });
  });
});
