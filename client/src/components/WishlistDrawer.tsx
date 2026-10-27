import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { Product } from '../types';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';

interface WishlistDrawerProps {
  onSelectProduct: (p: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({ onSelectProduct }) => {
  const { wishlistItems, wishlistCount, isWishlistOpen, setIsWishlistOpen, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (!isWishlistOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white dark:bg-surface-dark-card shadow-2xl flex flex-col h-full animate-fade-in border-l border-surface-border dark:border-surface-dark-border">
        {/* Header */}
        <div className="px-5 py-4 border-b border-surface-border dark:border-surface-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-current" />
            <span className="font-heading font-extrabold text-base text-ink-primary dark:text-white">
              Saved Products ({wishlistCount})
            </span>
          </div>
          <button
            onClick={() => setIsWishlistOpen(false)}
            className="p-1 rounded-full text-ink-secondary hover:text-ink-primary dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {wishlistItems.length === 0 ? (
            <div className="py-16 text-center text-ink-secondary">
              <Heart className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <h4 className="font-heading font-bold text-sm text-ink-primary dark:text-white">No Saved Items</h4>
              <p className="text-xs text-ink-secondary mt-1">Tap the heart icon on products to save them for later.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {wishlistItems.map((prod) => (
                <div
                  key={prod.id}
                  className="flex gap-3 p-3 bg-surface-subtle dark:bg-surface-dark-page rounded-xl border border-surface-border dark:border-surface-dark-border"
                >
                  <img
                    src={prod.images[0]}
                    alt={prod.title}
                    className="w-16 h-16 rounded-lg object-cover bg-white shrink-0 cursor-pointer"
                    onClick={() => {
                      onSelectProduct(prod);
                      setIsWishlistOpen(false);
                    }}
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4
                        className="font-heading font-bold text-xs text-ink-primary dark:text-white truncate cursor-pointer hover:text-brand"
                        onClick={() => {
                          onSelectProduct(prod);
                          setIsWishlistOpen(false);
                        }}
                      >
                        {prod.title}
                      </h4>
                      <span className="text-xs font-bold text-ink-primary dark:text-white">
                        ₹{prod.price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <button
                        onClick={() => {
                          addToCart(prod.id, 1);
                          toggleWishlist(prod.id);
                        }}
                        className="px-2.5 py-1 rounded bg-brand text-white text-[11px] font-semibold hover:bg-brand-hover flex items-center gap-1"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        Move to Cart
                      </button>

                      <button
                        onClick={() => toggleWishlist(prod.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
