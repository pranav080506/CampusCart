import React from 'react';
import { Category, ProductCondition } from '../types';
import { Filter, RotateCcw, Check, Sparkles, ShieldCheck } from 'lucide-react';

interface FilterSidebarProps {
  categories: Category[];
  selectedCategorySlug: string;
  onSelectCategory: (slug: string) => void;
  selectedCondition: string;
  onSelectCondition: (cond: string) => void;
  minPrice: string;
  setMinPrice: (p: string) => void;
  maxPrice: string;
  setMaxPrice: (p: string) => void;
  aiInspectedOnly: boolean;
  setAiInspectedOnly: (v: boolean) => void;
  collegeApprovedOnly: boolean;
  setCollegeApprovedOnly: (v: boolean) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  onResetFilters: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  categories,
  selectedCategorySlug,
  onSelectCategory,
  selectedCondition,
  onSelectCondition,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  aiInspectedOnly,
  setAiInspectedOnly,
  collegeApprovedOnly,
  setCollegeApprovedOnly,
  sortBy,
  setSortBy,
  onResetFilters
}) => {
  const conditions: ProductCondition[] = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'];

  return (
    <aside className="w-full lg:w-64 space-y-6 bg-white dark:bg-surface-dark-card p-5 rounded-2xl border border-surface-border dark:border-surface-dark-border shadow-card h-fit">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-border dark:border-surface-dark-border pb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand" />
          <span className="font-heading font-bold text-sm text-ink-primary dark:text-white uppercase tracking-wider">
            Filters
          </span>
        </div>
        <button
          onClick={onResetFilters}
          className="text-xs text-ink-secondary hover:text-brand dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
          title="Reset all filters"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Sort By Filter */}
      <div>
        <label className="block text-xs font-bold text-ink-primary dark:text-gray-200 uppercase tracking-wider mb-2">
          Sort Products
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-3 py-2 text-xs bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border rounded-lg text-ink-primary dark:text-gray-200 focus:outline-none focus:border-brand"
        >
          <option value="recently_added">Recently Listed</option>
          <option value="trending">Trending on Campus</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {/* Categories Filter */}
      <div>
        <label className="block text-xs font-bold text-ink-primary dark:text-gray-200 uppercase tracking-wider mb-2">
          Category
        </label>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => onSelectCategory('')}
            className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-between ${
              selectedCategorySlug === ''
                ? 'bg-brand-light dark:bg-emerald-950 text-brand dark:text-emerald-300 font-bold'
                : 'text-ink-secondary dark:text-gray-300 hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle'
            }`}
          >
            <span>All Categories</span>
            {selectedCategorySlug === '' && <Check className="w-3 h-3 text-brand" />}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCategory(c.slug)}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-between ${
                selectedCategorySlug === c.slug
                  ? 'bg-brand-light dark:bg-emerald-950 text-brand dark:text-emerald-300 font-bold'
                  : 'text-ink-secondary dark:text-gray-300 hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle'
              }`}
            >
              <span className="truncate">{c.name}</span>
              {selectedCategorySlug === c.slug && <Check className="w-3 h-3 text-brand" />}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <label className="block text-xs font-bold text-ink-primary dark:text-gray-200 uppercase tracking-wider mb-2">
          Price Range (₹ INR)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-ink-secondary">₹</span>
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full pl-6 pr-2 py-1.5 text-xs bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border rounded-lg text-ink-primary dark:text-gray-200 focus:outline-none focus:border-brand"
            />
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-ink-secondary">₹</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full pl-6 pr-2 py-1.5 text-xs bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border rounded-lg text-ink-primary dark:text-gray-200 focus:outline-none focus:border-brand"
            />
          </div>
        </div>
      </div>

      {/* Condition Filter */}
      <div>
        <label className="block text-xs font-bold text-ink-primary dark:text-gray-200 uppercase tracking-wider mb-2">
          Condition
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onSelectCondition('')}
            className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors ${
              selectedCondition === ''
                ? 'bg-ink-primary dark:bg-white text-white dark:text-ink-primary'
                : 'bg-surface-subtle dark:bg-surface-dark-subtle text-ink-secondary hover:text-ink-primary'
            }`}
          >
            All
          </button>
          {conditions.map((cond) => (
            <button
              key={cond}
              onClick={() => onSelectCondition(selectedCondition === cond ? '' : cond)}
              className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors ${
                selectedCondition === cond
                  ? 'bg-brand text-white'
                  : 'bg-surface-subtle dark:bg-surface-dark-subtle text-ink-secondary hover:text-ink-primary'
              }`}
            >
              {cond}
            </button>
          ))}
        </div>
      </div>

      {/* Verification Filter Checkboxes */}
      <div className="border-t border-surface-border dark:border-surface-dark-border pt-4 space-y-2.5">
        <label className="block text-xs font-bold text-ink-primary dark:text-gray-200 uppercase tracking-wider mb-1">
          Verification Filters
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-xs text-ink-primary dark:text-gray-300">
          <input
            type="checkbox"
            checked={aiInspectedOnly}
            onChange={(e) => setAiInspectedOnly(e.target.checked)}
            className="rounded text-brand focus:ring-brand h-4 w-4 border-gray-300"
          />
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            AI Inspected Only
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-xs text-ink-primary dark:text-gray-300">
          <input
            type="checkbox"
            checked={collegeApprovedOnly}
            onChange={(e) => setCollegeApprovedOnly(e.target.checked)}
            className="rounded text-brand focus:ring-brand h-4 w-4 border-gray-300"
          />
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand" />
            College Approved Only
          </span>
        </label>
      </div>
    </aside>
  );
};
