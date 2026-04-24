import type { Expense, ExpenseFormData, ApiError } from '../types/expense';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

class ApiService {
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const apiError: ApiError = errorBody || {
        timestamp: new Date().toISOString(),
        status: response.status,
        error: response.statusText,
        message: 'An error occurred',
      };
      throw apiError;
    }

    return response.json();
  }

  async createExpense(data: ExpenseFormData, idempotencyKey: string): Promise<Expense> {
    return this.request<Expense>('/expenses', {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        amount: parseFloat(data.amount),
        category: data.category.trim(),
        description: data.description.trim(),
        date: data.date,
      }),
    });
  }

  async getExpenses(category?: string, sort?: string): Promise<Expense[]> {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (sort) params.set('sort', sort);

    const query = params.toString();
    return this.request<Expense[]>(`/expenses${query ? `?${query}` : ''}`);
  }

  async getCategories(): Promise<string[]> {
    return this.request<string[]>('/expenses/categories');
  }
}

export const apiService = new ApiService();
