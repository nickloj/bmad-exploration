import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TodoInput } from './TodoInput';

describe('TodoInput', () => {
  it('renders input field and submit button', () => {
    render(<TodoInput onAdd={vi.fn()} />);
    expect(screen.getByPlaceholderText('Add a new task...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('calls onAdd with input value on submit', () => {
    const onAdd = vi.fn();
    render(<TodoInput onAdd={onAdd} />);

    fireEvent.change(screen.getByPlaceholderText('Add a new task...'), {
      target: { value: 'Buy milk' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(onAdd).toHaveBeenCalledWith('Buy milk');
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('clears input after submit', () => {
    render(<TodoInput onAdd={vi.fn()} />);
    const input = screen.getByPlaceholderText('Add a new task...') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Buy milk' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(input.value).toBe('');
  });

  it('does not call onAdd when input is empty', () => {
    const onAdd = vi.fn();
    render(<TodoInput onAdd={onAdd} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('does not call onAdd when input is only whitespace', () => {
    const onAdd = vi.fn();
    render(<TodoInput onAdd={onAdd} />);

    fireEvent.change(screen.getByPlaceholderText('Add a new task...'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(onAdd).not.toHaveBeenCalled();
  });
});
