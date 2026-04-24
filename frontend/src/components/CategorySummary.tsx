import type { Expense } from '../types/expense';

interface CategorySummaryProps {
  expenses: Expense[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function CategorySummary({ expenses }: CategorySummaryProps) {
  if (expenses.length === 0) return null;

  const categoryTotals = expenses.reduce<Record<string, number>>((acc, exp) => {
    const cat = exp.category;
    acc[cat] = (acc[cat] || 0) + Math.round(exp.amount * 100);
    return acc;
  }, {});

  const sorted = Object.entries(categoryTotals)
    .map(([cat, cents]) => [cat, cents / 100] as [string, number])
    .sort(([, a], [, b]) => b - a);
  const grandTotalCents = expenses.reduce((sum, exp) => sum + Math.round(exp.amount * 100), 0);
  const grandTotal = grandTotalCents / 100;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold mb-3 text-gray-800">Category Summary</h2>
      <div className="space-y-2">
        {sorted.map(([category, total]) => {
          const percentage = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
          return (
            <div key={category} className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 w-28 truncate">{category}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 w-28 text-right">
                {formatCurrency(total)}
              </span>
              <span className="text-xs text-gray-500 w-12 text-right">
                {percentage.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
