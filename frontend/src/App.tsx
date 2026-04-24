import { useState, useEffect, useCallback } from 'react';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import FilterSort from './components/FilterSort';
import CategorySummary from './components/CategorySummary';
import ErrorBanner from './components/ErrorBanner';
import { apiService } from './services/api';
import type { Expense, ExpenseFormData, ApiError } from './types/expense';

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortOrder, setSortOrder] = useState('date_desc');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getExpenses(
        selectedCategory || undefined,
        sortOrder || undefined
      );
      setExpenses(data);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to load expenses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, sortOrder]);

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await apiService.getCategories();
      setCategories(cats);
    } catch {
      // Non-critical - filter dropdown just won't populate
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddExpense = async (data: ExpenseFormData, idempotencyKey: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiService.createExpense(data, idempotencyKey);
      await Promise.all([fetchExpenses(), fetchCategories()]);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.details && apiErr.details.length > 0) {
        const messages = apiErr.details.map((d) => `${d.field}: ${d.message}`).join(', ');
        setError(`Validation error: ${messages}`);
      } else {
        setError(apiErr.message || 'Failed to add expense. Please try again.');
      }
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Expense Tracker</h1>
          <p className="text-gray-600 mt-1">Record and review your personal expenses</p>
        </header>

        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        <ExpenseForm onSubmit={handleAddExpense} isSubmitting={isSubmitting} />

        <CategorySummary expenses={expenses} />

        <FilterSort
          categories={categories}
          selectedCategory={selectedCategory}
          sortOrder={sortOrder}
          onCategoryChange={setSelectedCategory}
          onSortChange={setSortOrder}
        />

        <ExpenseList expenses={expenses} isLoading={isLoading} />
      </div>
    </div>
  );
}
