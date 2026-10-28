import React from 'react';
import { Product } from '../types';
import { Heart, Eye, ShoppingBag, ShieldCheck, Sparkles, CheckCircle2, Handshake } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onClick: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onClick
}) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const isLiked = isInWishlist(product.id);

  // Discount % calculation
  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Condition Badge styling
  const conditionColors: Record<string, { bg: string; text: string }> = {
    NEW: { bg: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300', text: 'NEW' },
    LIKE_NEW: { bg: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300', text: 'LIKE NEW' },
    GOOD: { bg: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300', text: 'GOOD' },
    FAIR: { bg: 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-300', text: 'FAIR' }
  };

  const conditionStyle = conditionColors[product.sellerDeclaredCondition] || conditionColors.GOOD;

  return (
    <div className="group relative bg-white dark:bg-surface-dark-card border border-surface-border dark:border-surface-dark-border rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col">
      {/* Product Image Container */}
      <div className="relative aspect-[4/4] overflow-hidden bg-gray-100 dark:bg-gray-900 cursor-pointer" onClick={() => onClick(product)}>
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1581291518655-9523c93269c3?auto=format&fit=crop&w=800&q=80'}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Condition Badge (Top Left) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase shadow-badge ${conditionStyle.bg}`}>
            {conditionStyle.text}
          </span>
          {discountPercent > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-brand text-white text-[10px] font-extrabold tracking-wide shadow-badge">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Wishlist Button (Top Right) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all shadow-sm z-10 ${
            isLiked
              ? 'bg-red-50 dark:bg-red-950/80 text-red-500'
              : 'bg-white/90 dark:bg-black/60 text-gray-600 dark:text-gray-300 hover:text-red-500 hover:bg-white'
          }`}
          title={isLiked ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-red-500' : ''}`} />
        </button>

        {/* Quick View Button (Reveals on Hover) */}
        <div className="absolute inset-x-0 bottom-2.5 px-3 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="w-full py-1.5 px-3 rounded-md bg-white/95 dark:bg-surface-dark-card/95 backdrop-blur-sm text-ink-primary dark:text-white text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 hover:bg-white dark:hover:bg-surface-dark-card transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            Quick View
          </button>
        </div>
      </div>

      {/* Product Content */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Dual Verification Badges: AI Inspected vs College Approved (Separate Indicators) */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {/* AI Inspected Badge */}
            {product.isAiInspected && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded badge-ai" title="AI analyzed photographs, category alignment, and surface condition">
                <Sparkles className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                AI Inspected
              </span>
            )}

            {/* College Approved Badge */}
            {product.isCollegeApproved ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded badge-college" title="Institutional approval granted by college administration">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                College Approved
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Approval Pending
              </span>
            )}

            {/* Bargain Negotiable Badge */}
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" title="Price is negotiable with campus seller">
              <Handshake className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
              Bargainable
            </span>
          </div>

          {/* Title */}
          <h3
            onClick={() => onClick(product)}
            className="font-heading font-semibold text-sm sm:text-base text-ink-primary dark:text-gray-100 line-clamp-2 hover:text-brand dark:hover:text-emerald-400 cursor-pointer transition-colors"
            title={product.title}
          >
            {product.title}
          </h3>

          {/* Seller line */}
          <p className="text-[11px] text-ink-secondary dark:text-gray-400 mt-1 line-clamp-1">
            {product.sellerName || 'Verified Student'}
          </p>
        </div>

        {/* Pricing & Actions */}
        <div className="mt-3 pt-3 border-t border-surface-border dark:border-surface-dark-border flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading font-bold text-base sm:text-lg text-ink-primary dark:text-white">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-ink-secondary line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Actions: Make Offer / Bargain + Add to Cart */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onClick(product)}
              className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors"
              title="Bargain / Make Offer"
            >
              <Handshake className="w-4 h-4" />
            </button>
            <button
              onClick={() => addToCart(product.id, 1)}
              className="p-2 rounded-lg bg-brand-light dark:bg-emerald-950 text-brand dark:text-emerald-300 hover:bg-brand hover:text-white dark:hover:bg-brand dark:hover:text-white transition-colors"
              title="Add to Cart"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
