interface FilterSortProps {
  categories: string[];
  selectedCategory: string;
  sortOrder: string;
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: string) => void;
}

export default function FilterSort({
  categories,
  selectedCategory,
  sortOrder,
  onCategoryChange,
  onSortChange,
}: FilterSortProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-1">
        <label htmlFor="filter-category" className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Filter by:
        </label>
        <select
          id="filter-category"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Sort Toggle */}
      <div className="flex items-center gap-2">
        <label htmlFor="sort-order" className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Sort by:
        </label>
        <button
          id="sort-order"
          onClick={() => onSortChange(sortOrder === 'date_desc' ? '' : 'date_desc')}
          className={`flex items-center gap-1 px-3 py-1.5 border rounded-md text-sm transition-colors ${
            sortOrder === 'date_desc'
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Date
          <svg
            className={`w-4 h-4 transition-transform ${sortOrder === 'date_desc' ? '' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-xs text-gray-500">
            {sortOrder === 'date_desc' ? '(Newest first)' : '(Oldest first)'}
          </span>
        </button>
      </div>
    </div>
  );
}
