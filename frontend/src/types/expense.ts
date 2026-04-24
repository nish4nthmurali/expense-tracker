export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface ExpenseFormData {
  amount: string;
  category: string;
  description: string;
  date: string;
}

export interface ValidationErrors {
  amount?: string;
  category?: string;
  date?: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message?: string;
  details?: Array<{ field: string; message: string }>;
}
