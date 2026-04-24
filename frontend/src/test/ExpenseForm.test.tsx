import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpenseForm from '../components/ExpenseForm';

describe('ExpenseForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockReset();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  it('renders all form fields', () => {
    render(<ExpenseForm onSubmit={mockOnSubmit} isSubmitting={false} />);

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', async () => {
    render(<ExpenseForm onSubmit={mockOnSubmit} isSubmitting={false} />);

    // Clear the default date value
    const dateInput = screen.getByLabelText(/date/i);
    await userEvent.clear(dateInput);

    fireEvent.click(screen.getByRole('button', { name: /add expense/i }));

    await waitFor(() => {
      expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
      expect(screen.getByText(/category is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows error for negative amount', async () => {
    render(<ExpenseForm onSubmit={mockOnSubmit} isSubmitting={false} />);

    const amountInput = screen.getByLabelText(/amount/i);
    // Use fireEvent.change for number input to set negative value directly
    fireEvent.change(amountInput, { target: { value: '-10' } });

    // Wait for state to settle, then submit
    await waitFor(() => {
      expect(amountInput).toHaveValue(-10);
    });

    fireEvent.submit(screen.getByRole('button', { name: /add expense/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/amount must be greater than zero/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits valid form data with idempotency key', async () => {
    render(<ExpenseForm onSubmit={mockOnSubmit} isSubmitting={false} />);

    await userEvent.type(screen.getByLabelText(/amount/i), '150.50');
    await userEvent.selectOptions(screen.getByLabelText(/category/i), 'Food');
    await userEvent.type(screen.getByLabelText(/description/i), 'Lunch');

    fireEvent.click(screen.getByRole('button', { name: /add expense/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    const [formData, idempotencyKey] = mockOnSubmit.mock.calls[0];
    expect(formData.amount).toBe('150.5');
    expect(formData.category).toBe('Food');
    expect(formData.description).toBe('Lunch');
    expect(idempotencyKey).toBeTruthy();
    expect(typeof idempotencyKey).toBe('string');
  });

  it('disables submit button when isSubmitting is true', () => {
    render(<ExpenseForm onSubmit={mockOnSubmit} isSubmitting={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText(/adding/i)).toBeInTheDocument();
  });

  it('clears form after successful submission', async () => {
    render(<ExpenseForm onSubmit={mockOnSubmit} isSubmitting={false} />);

    await userEvent.type(screen.getByLabelText(/amount/i), '100');
    await userEvent.selectOptions(screen.getByLabelText(/category/i), 'Food');
    await userEvent.type(screen.getByLabelText(/description/i), 'Test');

    fireEvent.click(screen.getByRole('button', { name: /add expense/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/amount/i)).toHaveValue(null);
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
    });
  });
});
