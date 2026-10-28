import React, { useState } from 'react';
import { Product } from '../types';
import {
  X,
  Heart,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  MapPin,
  Clock,
  User,
  ArrowRight,
  MessageSquare,
  Handshake
} from 'lucide-react';
import { VerificationExplainablePanel } from './VerificationExplainablePanel';
import { BargainOfferModal } from './BargainOfferModal';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenMeetupCoordination?: (meetupId?: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onOpenMeetupCoordination
}) => {
  if (!isOpen || !product) return null;

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isBargainOpen, setIsBargainOpen] = useState(false);

  const isLiked = isInWishlist(product.id);
  const activeImage = product.images[selectedImgIndex] || product.images[0];

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white dark:bg-surface-dark-card w-full max-w-4xl rounded-2xl shadow-2xl border border-surface-border dark:border-surface-dark-border overflow-hidden animate-fade-in my-6 max-h-[92vh] flex flex-col">
        {/* Top Dismiss Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 dark:bg-black/70 text-ink-secondary hover:text-ink-primary dark:hover:text-white shadow-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Column: Image Gallery */}
            <div className="space-y-3">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-surface-border dark:border-surface-dark-border">
                <img
                  src={activeImage}
                  alt={product.title}
                  className="w-full h-full object-cover object-center"
                />
                {discountPercent > 0 && (
                  <span className="absolute top-3 left-3 px-2 py-1 rounded bg-brand text-white text-xs font-extrabold tracking-wide shadow-md">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImgIndex(idx)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                        selectedImgIndex === idx
                          ? 'border-brand shadow-sm'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* On-Campus Handover Assurance Card */}
              <div className="p-3.5 bg-brand-light/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-ink-secondary dark:text-gray-300 space-y-2">
                <div className="font-heading font-bold text-brand dark:text-emerald-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    Verified On-Campus Handover
                  </span>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-200 bg-white dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                    Decided by Both
                  </span>
                </div>
                <p>
                  Zero delivery costs. The exact campus meetup hub and timing are mutually coordinated and confirmed by buyer and seller.
                </p>

                {/* Seller Preferences */}
                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/60 space-y-1 text-[11px]">
                  <div>
                    <span className="font-bold text-ink-primary dark:text-white">Seller Preferred Hubs: </span>
                    <span className="text-brand dark:text-emerald-300 font-medium">
                      {product.preferredMeetupHubs?.join(', ') || 'B.Tech Canteen, Stationery Shop'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-ink-primary dark:text-white">Available Hours: </span>
                    <span className="text-ink-secondary dark:text-gray-300">
                      {product.availableTimings || 'Weekdays after 4:00 PM, or during lunch break'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Details & Actions */}
            <div className="flex flex-col justify-between space-y-4">
              <div>
                {/* Condition & Approvals */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-ink-primary dark:bg-white text-white dark:text-ink-primary">
                    Condition: {product.sellerDeclaredCondition}
                  </span>
                  {product.aiSuggestedCondition && (
                    <span className="text-xs text-ink-secondary dark:text-gray-400">
                      (AI Suggestion: {product.aiSuggestedCondition})
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="font-heading font-bold text-xl sm:text-2xl text-ink-primary dark:text-white leading-snug">
                  {product.title}
                </h2>

                {/* Seller & Campus Details */}
                <div className="flex items-center gap-2 mt-2 text-xs text-ink-secondary dark:text-gray-400">
                  <User className="w-3.5 h-3.5 text-brand" />
                  <span>Listed by <strong>{product.sellerName || 'Verified Student'}</strong></span>
                  <span>•</span>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Price Display */}
                <div className="mt-4 p-3 bg-surface-subtle dark:bg-surface-dark-page rounded-xl border border-surface-border dark:border-surface-dark-border flex items-baseline gap-3">
                  <span className="font-heading font-extrabold text-2xl sm:text-3xl text-ink-primary dark:text-white">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <>
                      <span className="text-sm text-ink-secondary line-through">
                        ₹{product.originalPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-bold text-brand dark:text-emerald-400">
                        Save ₹{(product.originalPrice - product.price).toLocaleString('en-IN')}
                      </span>
                    </>
                  )}
                </div>

                {/* Description */}
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-ink-primary dark:text-gray-200 uppercase tracking-wider mb-1">
                    Product Description
                  </h4>
                  <p className="text-sm text-ink-secondary dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              </div>

              {/* Add to Cart & Wishlist Actions */}
              <div className="pt-4 border-t border-surface-border dark:border-surface-dark-border space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-surface-border dark:border-surface-dark-border rounded-lg bg-surface-subtle dark:bg-surface-dark-page">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-sm font-bold text-ink-secondary hover:text-ink-primary"
                    >
                      -
                    </button>
                    <span className="px-2 text-sm font-bold text-ink-primary dark:text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 text-sm font-bold text-ink-secondary hover:text-ink-primary"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      addToCart(product.id, quantity);
                      onClose();
                    }}
                    className="flex-1 py-3 px-6 rounded-lg bg-brand text-white font-bold text-sm hover:bg-brand-hover active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Add to Cart • ₹{(product.price * quantity).toLocaleString('en-IN')}
                  </button>

                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={`p-3 rounded-lg border border-surface-border dark:border-surface-dark-border transition-colors ${
                      isLiked ? 'text-red-500 bg-red-50 dark:bg-red-950/40 border-red-200' : 'text-gray-600 dark:text-gray-300 hover:text-red-500'
                    }`}
                    title={isLiked ? 'Saved' : 'Wishlist'}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Bargain & Chat Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsBargainOpen(true)}
                    className="py-2.5 px-4 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs active:scale-[0.99]"
                  >
                    <Handshake className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>🤝 Bargain / Make Offer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenMeetupCoordination) {
                        onOpenMeetupCoordination();
                      }
                    }}
                    className="py-2.5 px-4 rounded-lg border border-brand text-brand dark:text-emerald-300 hover:bg-brand-light dark:hover:bg-emerald-950/60 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Chat With Seller</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Explainable Verification Panel Component */}
          <div className="mt-8 pt-6 border-t border-surface-border dark:border-surface-dark-border">
            <VerificationExplainablePanel product={product} />
          </div>
        </div>
      </div>

      {/* Bargain & Price Negotiation Modal */}
      <BargainOfferModal
        product={product}
        isOpen={isBargainOpen}
        onClose={() => setIsBargainOpen(false)}
      />
    </div>
  );
};
