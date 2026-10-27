import React from 'react';
import { Category } from '../types';
import {
  Compass,
  Calculator,
  PenTool,
  BookOpen,
  FlaskConical,
  Backpack,
  ShoppingBag,
  Layers
} from 'lucide-react';

interface CategoryNavProps {
  categories: Category[];
  selectedCategorySlug: string;
  onSelectCategory: (slug: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Compass: <Compass className="w-4 h-4" />,
  Calculator: <Calculator className="w-4 h-4" />,
  PenTool: <PenTool className="w-4 h-4" />,
  BookOpen: <BookOpen className="w-4 h-4" />,
  FlaskConical: <FlaskConical className="w-4 h-4" />,
  Backpack: <Backpack className="w-4 h-4" />,
  ShoppingBag: <ShoppingBag className="w-4 h-4" />
};

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  selectedCategorySlug,
  onSelectCategory
}) => {
  return (
    <div className="bg-white dark:bg-surface-dark-card border-b border-surface-border dark:border-surface-dark-border sticky top-[105px] sm:top-[93px] z-30 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto py-2.5 no-scrollbar">
          {/* All Categories Option */}
          <button
            onClick={() => onSelectCategory('')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategorySlug === ''
                ? 'bg-ink-primary dark:bg-white text-white dark:text-ink-primary shadow-sm'
                : 'bg-surface-subtle dark:bg-surface-dark-subtle text-ink-primary dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            All Products
          </button>

          {/* Admin Controlled Categories */}
          {categories.map((cat) => {
            const isSelected = selectedCategorySlug === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-brand text-white shadow-sm'
                    : 'bg-surface-subtle dark:bg-surface-dark-subtle text-ink-primary dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-brand dark:hover:text-emerald-400'
                }`}
              >
                {iconMap[cat.iconName] || <ShoppingBag className="w-3.5 h-3.5" />}
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
