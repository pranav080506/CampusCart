import React from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { ShoppingBag, RefreshCw } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  onQuickView: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onResetFilters: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  onQuickView,
  onSelectProduct,
  onResetFilters
}) => {
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 text-ink-secondary">
        <RefreshCw className="w-8 h-8 animate-spin text-brand mb-3" />
        <span className="text-sm font-semibold">Loading verified campus listings...</span>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-surface-dark-card rounded-2xl border border-surface-border dark:border-surface-dark-border shadow-card">
        <div className="w-16 h-16 rounded-full bg-brand-light dark:bg-emerald-950 text-brand dark:text-emerald-300 flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h3 className="font-heading font-bold text-lg text-ink-primary dark:text-white">
          No Approved Products Found
        </h3>
        <p className="text-xs text-ink-secondary dark:text-gray-400 mt-1 max-w-sm">
          No listings matched your active filter criteria. Unapproved, pending, or sold items are strictly excluded from the public campus marketplace.
        </p>
        <button
          onClick={onResetFilters}
          className="mt-5 px-5 py-2 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors shadow-sm"
        >
          Reset All Filters
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1">
      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onQuickView={onQuickView}
            onClick={onSelectProduct}
          />
        ))}
      </div>
    </div>
  );
};
