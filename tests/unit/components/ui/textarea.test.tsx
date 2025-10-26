import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '@/components/ui/textarea';

describe('Textarea component', () => {
  it('should render textarea element', () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('data-slot', 'textarea');
  });

  it('should accept custom className', () => {
    render(<Textarea className="custom-textarea" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('custom-textarea');
  });

  it('should render with placeholder', () => {
    render(<Textarea placeholder="Enter your message" />);
    const textarea = screen.getByPlaceholderText('Enter your message');
    expect(textarea).toBeInTheDocument();
  });

  it('should handle value and onChange', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Textarea value="" onChange={handleChange} />);
    const textarea = screen.getByRole('textbox');

    await user.type(textarea, 'Hello');
    expect(handleChange).toHaveBeenCalled();
  });

  it('should render as disabled', () => {
    render(<Textarea disabled />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  it('should apply aria-invalid styling when invalid', () => {
    render(<Textarea aria-invalid="true" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
  });

  it('should accept rows attribute', () => {
    render(<Textarea rows={5} data-testid="textarea" />);
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('should accept standard textarea attributes', () => {
    render(
      <Textarea
        name="message"
        maxLength={500}
        required
        data-testid="textarea"
      />
    );
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveAttribute('name', 'message');
    expect(textarea).toHaveAttribute('maxLength', '500');
    expect(textarea).toBeRequired();
  });
});
