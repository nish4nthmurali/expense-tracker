import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExpenseList from '../components/ExpenseList';
import type { Expense } from '../types/expense';

const mockExpenses: Expense[] = [
  {
    id: '1',
    amount: 150.5,
    category: 'Food',
    description: 'Lunch at restaurant',
    date: '2026-04-20',
    createdAt: '2026-04-20T10:00:00Z',
  },
  {
    id: '2',
    amount: 1200.0,
    category: 'Rent',
    description: 'April rent',
    date: '2026-04-01',
    createdAt: '2026-04-01T08:00:00Z',
  },
  {
    id: '3',
    amount: 49.99,
    category: 'Food',
    description: 'Groceries',
    date: '2026-04-15',
    createdAt: '2026-04-15T12:00:00Z',
  },
];

describe('ExpenseList', () => {
  it('shows loading state', () => {
    render(<ExpenseList expenses={[]} isLoading={true} />);
    expect(screen.getByText(/loading expenses/i)).toBeInTheDocument();
  });

  it('shows empty state when no expenses', () => {
    render(<ExpenseList expenses={[]} isLoading={false} />);
    expect(screen.getByText(/no expenses found/i)).toBeInTheDocument();
  });

  it('displays expenses with correct data', () => {
    render(<ExpenseList expenses={mockExpenses} isLoading={false} />);

    // Elements appear in both desktop table and mobile cards
    expect(screen.getAllByText('Food').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Rent').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Lunch at restaurant').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('April rent').length).toBeGreaterThanOrEqual(1);
  });

  it('shows correct total', () => {
    render(<ExpenseList expenses={mockExpenses} isLoading={false} />);

    // Total: 150.50 + 1200.00 + 49.99 = 1400.49
    expect(screen.getByText(/₹1,400\.49/)).toBeInTheDocument();
  });

  it('shows expense count', () => {
    render(<ExpenseList expenses={mockExpenses} isLoading={false} />);
    expect(screen.getByText(/3 expenses/i)).toBeInTheDocument();
  });

  it('handles floating-point amounts correctly', () => {
    const tricky: Expense[] = [
      { id: '1', amount: 0.1, category: 'Test', description: '', date: '2026-04-20', createdAt: '' },
      { id: '2', amount: 0.2, category: 'Test', description: '', date: '2026-04-20', createdAt: '' },
    ];

    render(<ExpenseList expenses={tricky} isLoading={false} />);

    // Should be exactly 0.30, not 0.30000000000000004
    expect(screen.getByText(/₹0\.30/)).toBeInTheDocument();
  });
});
