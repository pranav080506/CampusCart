import React, { useState, useEffect } from 'react';
import { Product, BargainOffer } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  X,
  Handshake,
  Sparkles,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  MessageSquare,
  Percent,
  Check
} from 'lucide-react';

interface BargainOfferModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onOfferSubmitted?: (offer: BargainOffer) => void;
}

export const BargainOfferModal: React.FC<BargainOfferModalProps> = ({
  product,
  isOpen,
  onClose,
  onOfferSubmitted
}) => {
  if (!isOpen || !product) return null;

  const { user } = useAuth();
  const { addToCart } = useCart();

  // Price & Offer State
  const originalPrice = product.price;
  const defaultOffer = Math.max(1, Math.round(originalPrice * 0.85)); // default 15% discount
  const [offeredPrice, setOfferedPrice] = useState<number>(defaultOffer);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Active / Existing Offer on this product
  const [existingOffer, setExistingOffer] = useState<BargainOffer | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState<boolean>(true);

  // Fetch any active offer by the current user on this product
  useEffect(() => {
    let isMounted = true;
    const fetchExisting = async () => {
      try {
        setIsLoadingExisting(true);
        const res = await api.getBargainOfferForProduct(product.id);
        if (isMounted && res.success && res.offer) {
          setExistingOffer(res.offer);
          setOfferedPrice(res.offer.offeredPrice);
          if (res.offer.buyerMessage) setCustomMessage(res.offer.buyerMessage);
        }
      } catch (err) {
        console.warn('Failed to load existing bargain offer:', err);
      } finally {
        if (isMounted) setIsLoadingExisting(false);
      }
    };

    fetchExisting();
    return () => {
      isMounted = false;
    };
  }, [product.id]);

  // Derived Calculations
  const discountAmount = Math.max(0, originalPrice - offeredPrice);
  const discountPercent = originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0;

  // AI Deal Evaluator & Probability Meter
  let dealCategory: 'EXCELLENT' | 'FAIR' | 'MODERATE' | 'AGGRESSIVE' = 'FAIR';
  let probability = 80;
  let dealTip = 'Great campus offer! Campus sellers frequently accept 10-15% discounts.';
  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700';

  if (discountPercent <= 10) {
    dealCategory = 'EXCELLENT';
    probability = 94;
    dealTip = 'Very high chance of immediate seller acceptance! Standard polite campus discount.';
    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300';
  } else if (discountPercent <= 20) {
    dealCategory = 'FAIR';
    probability = 82;
    dealTip = 'Balanced win-win deal. Most student sellers accept or counter slightly.';
    badgeColor = 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300';
  } else if (discountPercent <= 30) {
    dealCategory = 'MODERATE';
    probability = 58;
    dealTip = 'Moderate negotiation. Suggesting an immediate meetup spot increases acceptance.';
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300';
  } else {
    dealCategory = 'AGGRESSIVE';
    probability = 28;
    dealTip = 'Aggressive discount (>30% off). High chance seller counters or declines unless item has been listed for a while.';
    badgeColor = 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300';
  }

  // Quick Preset Discounts
  const presetDiscounts = [10, 15, 20, 25, 30];

  const handleApplyPreset = (percent: number) => {
    const calculated = Math.round(originalPrice * (1 - percent / 100));
    setOfferedPrice(Math.max(1, calculated));
    setErrorMessage('');
  };

  // Quick campus pitch phrases
  const campusPitches = [
    'Can pick up right now at B.Tech canteen!',
    'Immediate cash or instant UPI payment.',
    'Need it urgently for tomorrow\'s class / lab.',
    'Taking this course this semester, please consider student discount!'
  ];

  const handleSelectPitch = (pitch: string) => {
    if (!customMessage.includes(pitch)) {
      setCustomMessage(prev => (prev ? `${prev} ${pitch}` : pitch));
    }
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (offeredPrice <= 0) {
      setErrorMessage('Please enter an offer price greater than ₹0.');
      return;
    }

    if (offeredPrice >= originalPrice) {
      setErrorMessage(`Offer price must be lower than the listed price of ₹${originalPrice.toLocaleString('en-IN')}. If you want to buy at full price, use "Add to Cart".`);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.makeBargainOffer({
        productId: product.id,
        offeredPrice,
        message: customMessage.trim() || undefined,
        allowAutoCounter: true
      });

      if (res.success && res.offer) {
        setExistingOffer(res.offer);
        setSuccessMessage(res.message);
        onOfferSubmitted?.(res.offer);
      } else {
        setErrorMessage(res.error || 'Failed to submit offer.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting bargain offer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptCounter = async () => {
    if (!existingOffer) return;
    try {
      setIsSubmitting(true);
      const res = await api.acceptBargainCounter(existingOffer.id);
      if (res.success && res.offer) {
        setExistingOffer(res.offer);
        setSuccessMessage(res.message);
        onOfferSubmitted?.(res.offer);
      } else {
        setErrorMessage(res.error || 'Failed to accept counter-offer.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error accepting counter-offer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuyAcceptedDeal = async () => {
    if (!existingOffer || existingOffer.status !== 'ACCEPTED') return;
    try {
      setIsSubmitting(true);
      await addToCart(product.id, 1, existingOffer.offeredPrice, existingOffer.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add bargain deal to cart.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="relative bg-white dark:bg-surface-dark-card w-full max-w-lg rounded-2xl shadow-2xl border border-surface-border dark:border-surface-dark-border overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-surface-border dark:border-surface-dark-border flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-brand/10 to-teal-500/10 dark:from-emerald-950/40 dark:to-teal-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center shadow-md">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base sm:text-lg text-ink-primary dark:text-white flex items-center gap-1.5">
                Bargain &amp; Make an Offer
              </h3>
              <p className="text-[11px] text-ink-secondary dark:text-gray-400">
                Peer-to-peer campus price negotiation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-ink-secondary hover:text-ink-primary dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          
          {/* Target Product Summary Card */}
          <div className="p-3 rounded-xl bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border flex items-center gap-3">
            <img
              src={product.images?.[0] || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200'}
              alt={product.title}
              className="w-14 h-14 rounded-lg object-cover border border-surface-border dark:border-surface-dark-border shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-ink-primary dark:text-white truncate">
                {product.title}
              </h4>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-ink-secondary dark:text-gray-400">
                <span>Seller: <strong>{product.sellerName || 'Verified Peer'}</strong></span>
                <span>•</span>
                <span>Listed: <strong className="text-ink-primary dark:text-white">₹{originalPrice.toLocaleString('en-IN')}</strong></span>
              </div>
            </div>
          </div>

          {/* Alert / Notification Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ACTIVE OFFER STATUS BANNER (If user already has an offer) */}
          {existingOffer && (
            <div className={`p-3.5 rounded-xl border ${
              existingOffer.status === 'ACCEPTED'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100'
                : existingOffer.status === 'COUNTERED'
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100'
                : 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100'
            }`}>
              <div className="flex items-center justify-between font-bold text-xs mb-1">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Status: {existingOffer.status}
                </span>
                <span className="font-mono text-[11px] bg-white/80 dark:bg-black/40 px-2 py-0.5 rounded">
                  Offered: ₹{existingOffer.offeredPrice.toLocaleString('en-IN')}
                </span>
              </div>

              {existingOffer.status === 'PENDING' && (
                <p className="text-[11px] opacity-90">
                  Your offer is awaiting response from {existingOffer.sellerName}. You can update your offer below if desired.
                </p>
              )}

              {existingOffer.status === 'COUNTERED' && (
                <div className="mt-2 space-y-2">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-xs">
                    <p className="font-bold text-amber-800 dark:text-amber-300">
                      Seller Counter-Offer: ₹{existingOffer.counterPrice?.toLocaleString('en-IN')}
                    </p>
                    {existingOffer.sellerMessage && (
                      <p className="text-[11px] text-gray-600 dark:text-gray-300 italic mt-0.5">
                        "{existingOffer.sellerMessage}"
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAcceptCounter}
                    disabled={isSubmitting}
                    className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Accept Seller's Counter of ₹{existingOffer.counterPrice?.toLocaleString('en-IN')}
                  </button>
                </div>
              )}

              {existingOffer.status === 'ACCEPTED' && (
                <div className="mt-2 space-y-2">
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-200">
                    🎉 Deal finalized at <strong>₹{existingOffer.offeredPrice.toLocaleString('en-IN')}</strong>! {existingOffer.sellerMessage && `(${existingOffer.sellerMessage})`}
                  </p>
                  <button
                    type="button"
                    onClick={handleBuyAcceptedDeal}
                    disabled={isSubmitting}
                    className="w-full py-2 px-3 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Add to Cart at Bargain Price (₹{existingOffer.offeredPrice.toLocaleString('en-IN')})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MAIN OFFER FORM */}
          {(!existingOffer || existingOffer.status !== 'ACCEPTED') && (
            <form onSubmit={handleSendOffer} className="space-y-4">
              
              {/* Quick Discount Buttons */}
              <div>
                <label className="block text-[11px] font-bold text-ink-primary dark:text-white uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Quick Discount Presets:</span>
                  <span className="text-[10px] text-brand dark:text-emerald-400 font-semibold">1-Click Pick</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {presetDiscounts.map(pct => {
                    const priceForPct = Math.round(originalPrice * (1 - pct / 100));
                    const isSelected = offeredPrice === priceForPct;
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleApplyPreset(pct)}
                        className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center border ${
                          isSelected
                            ? 'bg-brand text-white border-brand shadow-sm scale-102'
                            : 'bg-surface-subtle dark:bg-surface-dark-page border-surface-border dark:border-surface-dark-border text-ink-primary dark:text-gray-300 hover:border-brand'
                        }`}
                      >
                        <div>-{pct}%</div>
                        <div className="text-[10px] font-normal opacity-80">₹{priceForPct}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Input & Interactive Slider */}
              <div className="p-3.5 rounded-xl bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold text-ink-primary dark:text-white">
                      Your Offer Price
                    </label>
                    <p className="text-[10px] text-ink-secondary dark:text-gray-400">
                      Listed at ₹{originalPrice}
                    </p>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">₹</span>
                    <input
                      type="number"
                      min={1}
                      max={originalPrice - 1}
                      value={offeredPrice}
                      onChange={e => setOfferedPrice(Number(e.target.value))}
                      className="w-32 pl-7 pr-3 py-1.5 bg-white dark:bg-slate-900 border-2 border-brand/60 focus:border-brand rounded-lg text-sm font-extrabold text-ink-primary dark:text-white text-right focus:outline-none"
                    />
                  </div>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min={Math.round(originalPrice * 0.4)}
                  max={originalPrice - 1}
                  step={5}
                  value={offeredPrice}
                  onChange={e => setOfferedPrice(Number(e.target.value))}
                  className="w-full accent-brand cursor-pointer"
                />

                {/* Savings Summary Pills */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-surface-border dark:border-surface-dark-border">
                  <span className="font-semibold text-ink-secondary dark:text-gray-400">
                    Discount: <strong className="text-brand dark:text-emerald-400 font-extrabold">{discountPercent}% OFF</strong>
                  </span>
                  <span className="font-semibold text-ink-secondary dark:text-gray-400">
                    You Save: <strong className="text-ink-primary dark:text-white font-extrabold">₹{discountAmount.toLocaleString('en-IN')}</strong>
                  </span>
                </div>
              </div>

              {/* AI DEAL METER & PROBABILITY */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-surface-border dark:border-surface-dark-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ink-primary dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand" />
                    AI Deal Acceptance Meter
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${badgeColor}`}>
                    {probability}% Acceptance Likelihood
                  </span>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      probability >= 80 ? 'bg-emerald-500' : probability >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${probability}%` }}
                  />
                </div>

                <p className="text-[11px] text-ink-secondary dark:text-gray-300 leading-snug">
                  {dealTip}
                </p>
              </div>

              {/* Quick Campus Pitch Chips */}
              <div>
                <label className="block text-[11px] font-bold text-ink-primary dark:text-white uppercase tracking-wider mb-1.5">
                  Add Quick Persuasion Note:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {campusPitches.map((pitch, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPitch(pitch)}
                      className="text-[10px] py-1 px-2 rounded-md bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border text-ink-secondary dark:text-gray-300 hover:border-brand hover:text-brand transition-colors text-left"
                    >
                      + {pitch}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  placeholder="Optional polite note to the seller (e.g. Can meet at B.Tech canteen at 4pm)..."
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-surface-border dark:border-surface-dark-border rounded-lg text-xs text-ink-primary dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-brand"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-brand hover:bg-brand-hover text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Handshake className="w-4 h-4" />
                <span>
                  {existingOffer ? 'Update Bargain Offer' : `Send Bargain Offer of ₹${offeredPrice.toLocaleString('en-IN')} →`}
                </span>
              </button>
            </form>
          )}

          {/* College Handover Guarantee */}
          <div className="pt-2 text-center text-[10px] text-ink-secondary dark:text-gray-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Zero shipping fees. Handover arranged at verified campus hubs (Canteen, Gate 1, CTM Block).</span>
          </div>

        </div>
      </div>
    </div>
  );
};
