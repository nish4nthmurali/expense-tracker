import type { Expense } from '../types/expense';

interface ExpenseListProps {
  expenses: Expense[];
  isLoading: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ExpenseList({ expenses, isLoading }: ExpenseListProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center items-center gap-2 text-gray-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading expenses...
        </div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
        <p className="text-lg">No expenses found</p>
        <p className="text-sm mt-1">Add your first expense using the form above.</p>
      </div>
    );
  }

  // Compute total using integer cents to avoid floating-point drift
  const totalCents = expenses.reduce((sum, exp) => sum + Math.round(exp.amount * 100), 0);
  const total = totalCents / 100;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Total Banner */}
      <div className="bg-blue-50 border-b border-blue-100 px-6 py-3 flex justify-between items-center">
        <span className="text-sm font-medium text-blue-700">
          {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
        </span>
        <span className="text-lg font-bold text-blue-800">
          Total: {formatCurrency(total)}
        </span>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDate(expense.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {expense.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                  {expense.description || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                  {formatCurrency(expense.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-gray-200">
        {expenses.map((expense) => (
          <div key={expense.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {expense.category}
                </span>
                <p className="text-sm text-gray-600 mt-1">{expense.description || '—'}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(expense.date)}</p>
              </div>
              <span className="text-sm font-bold text-gray-900">
                {formatCurrency(expense.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
