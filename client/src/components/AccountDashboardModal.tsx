import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  Package,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Lock,
  Tag,
  PlusCircle,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Users,
  Copy,
  Check,
  Handshake,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { MeetupSession, Product, BargainOffer } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface AccountDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMeetupCoordination: (meetupId?: string) => void;
  onOpenSellModal: () => void;
  initialTab?: 'buyer' | 'seller' | 'bargains';
}

export const AccountDashboardModal: React.FC<AccountDashboardModalProps> = ({
  isOpen,
  onClose,
  onOpenMeetupCoordination,
  onOpenSellModal,
  initialTab = 'buyer'
}) => {
  const { user, college, availableUsers, switchUser } = useAuth();
  const { addToCart, setIsCartOpen } = useCart();
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller' | 'bargains'>(initialTab);

  const [buyerMeetups, setBuyerMeetups] = useState<MeetupSession[]>([]);
  const [sellerMeetups, setSellerMeetups] = useState<MeetupSession[]>([]);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [incomingOffers, setIncomingOffers] = useState<BargainOffer[]>([]);
  const [outgoingOffers, setOutgoingOffers] = useState<BargainOffer[]>([]);
  const [counterInput, setCounterInput] = useState<Record<string, number>>({});
  const [counterNote, setCounterNote] = useState<Record<string, string>>({});
  const [showCounterRow, setShowCounterRow] = useState<Record<string, boolean>>({});
  const [showRaiseRow, setShowRaiseRow] = useState<Record<string, boolean>>({});
  const [raiseInput, setRaiseInput] = useState<Record<string, number>>({});
  const [raiseNote, setRaiseNote] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [verifyCodeInputs, setVerifyCodeInputs] = useState<Record<string, string>>({});
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchAccountData = async () => {
    try {
      setIsLoading(true);
      const [summaryRes, productsRes, bargainRes] = await Promise.all([
        api.getAccountSummary(),
        api.getProducts({ collegeApprovedOnly: false }),
        api.getBargainOffers()
      ]);

      if (summaryRes.success) {
        setBuyerMeetups(summaryRes.buyerMeetups);
        setSellerMeetups(summaryRes.sellerMeetups);
      }

      if (productsRes.success && user) {
        const mine = productsRes.products.filter(p => p.sellerId === user.id);
        setSellerProducts(mine);
      }

      if (bargainRes.success) {
        setIncomingOffers(bargainRes.incoming);
        setOutgoingOffers(bargainRes.outgoing);
      }
    } catch (err) {
      console.error('Failed to load account data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSellerRespond = async (
    offerId: string,
    action: 'ACCEPT' | 'REJECT' | 'COUNTER',
    counterPrice?: number,
    sellerMessage?: string
  ) => {
    try {
      const res = await api.respondToBargainOffer({
        offerId,
        action,
        counterPrice,
        sellerMessage
      });
      if (res.success) {
        setActionMsg({ text: res.message, type: 'success' });
        fetchAccountData();
      } else {
        setActionMsg({ text: res.error || 'Failed to update offer.', type: 'error' });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Error updating offer.', type: 'error' });
    }
  };

  const handleBuyerAcceptCounter = async (offerId: string) => {
    try {
      const res = await api.acceptBargainCounter(offerId);
      if (res.success) {
        setActionMsg({ text: res.message, type: 'success' });
        fetchAccountData();
      } else {
        setActionMsg({ text: res.error || 'Failed to accept counter-offer.', type: 'error' });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Error accepting counter.', type: 'error' });
    }
  };

  const handleBuyerRaiseOffer = async (offer: BargainOffer) => {
    try {
      const price = raiseInput[offer.id];
      if (!price || price <= offer.offeredPrice) {
        setActionMsg({
          text: `Please enter a raised price higher than ₹${offer.offeredPrice.toLocaleString('en-IN')}.`,
          type: 'error'
        });
        return;
      }
      if (offer.counterPrice && price > offer.counterPrice) {
        setActionMsg({
          text: `Raised offer cannot exceed seller's counter-offer of ₹${offer.counterPrice.toLocaleString('en-IN')}.`,
          type: 'error'
        });
        return;
      }
      if (price >= offer.originalListingPrice) {
        setActionMsg({
          text: `Offer must be less than listed price of ₹${offer.originalListingPrice.toLocaleString('en-IN')}.`,
          type: 'error'
        });
        return;
      }

      const note = raiseNote[offer.id] || '';
      const res = await api.raiseBargainOffer({
        offerId: offer.id,
        raisedPrice: price,
        message: note
      });
      if (res.success) {
        setActionMsg({ text: res.message, type: 'success' });
        setShowRaiseRow(prev => ({ ...prev, [offer.id]: false }));
        fetchAccountData();
      } else {
        setActionMsg({ text: res.error || 'Failed to raise offer.', type: 'error' });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Error raising offer.', type: 'error' });
    }
  };

  const handleBuyBargain = async (offer: BargainOffer) => {
    try {
      await addToCart(offer.productId, 1, offer.offeredPrice, offer.id);
      onClose();
      setIsCartOpen(true);
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Failed to add bargain item to cart.', type: 'error' });
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAccountData();
      setActionMsg(null);
      // Auto-set tab based on role or data if initialTab isn't forced
      if (initialTab) {
        setActiveTab(initialTab);
      } else if (user?.id === 'usr-student-2') {
        setActiveTab('seller');
      } else {
        setActiveTab('buyer');
      }
    }
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleVerifyCode = async (meetupId: string) => {
    const code = verifyCodeInputs[meetupId];
    if (!code || !code.trim()) return;

    try {
      setVerifyingId(meetupId);
      const res = await api.verifyMeetupCode(meetupId, code.trim());
      if (res.success) {
        setActionMsg({
          text: 'Buyer code verified successfully! Handover marked complete and funds released.',
          type: 'success'
        });
        setVerifyCodeInputs(prev => ({ ...prev, [meetupId]: '' }));
        await fetchAccountData();
      } else {
        setActionMsg({ text: res.message || 'Invalid handover code', type: 'error' });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Verification failed', type: 'error' });
    } finally {
      setVerifyingId(null);
    }
  };

  const totalSellerEarnings = sellerMeetups
    .filter(m => m.status === 'COMPLETED' || m.status === 'MUTUALLY_AGREED')
    .reduce((sum, m) => sum + m.productPrice, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white dark:bg-surface-dark-card w-full max-w-4xl rounded-2xl shadow-2xl border border-surface-border dark:border-surface-dark-border overflow-hidden animate-fade-in my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-surface-border dark:border-surface-dark-border bg-surface-subtle dark:bg-surface-dark-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand text-white flex items-center justify-center shadow-md font-bold text-lg">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-lg text-ink-primary dark:text-white">
                  {user?.fullName}
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                  Verified Student ID
                </span>
              </div>
              <p className="text-xs text-ink-secondary dark:text-gray-400">
                {user?.studentId} • {college?.name || 'G.L. Bajaj Institute of Technology and Management'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-ink-secondary hover:text-ink-primary dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation: Private Buyer vs Private Seller */}
        <div className="px-6 pt-3 border-b border-surface-border dark:border-surface-dark-border flex gap-4 bg-surface dark:bg-surface-dark-card">
          <button
            onClick={() => setActiveTab('buyer')}
            className={`pb-3 px-2 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'buyer'
                ? 'border-brand text-brand dark:text-emerald-400'
                : 'border-transparent text-ink-secondary hover:text-ink-primary dark:hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            🎓 Buyer Account (My Orders & Pickups)
            {buyerMeetups.length > 0 && (
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {buyerMeetups.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('seller')}
            className={`pb-3 px-2 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'seller'
                ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                : 'border-transparent text-ink-secondary hover:text-ink-primary dark:hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            💼 Seller Account (My Studio & Handovers)
            {sellerMeetups.length > 0 && (
              <span className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {sellerMeetups.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('bargains')}
            className={`pb-3 px-2 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'bargains'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-ink-secondary hover:text-ink-primary dark:hover:text-white'
            }`}
          >
            <Handshake className="w-4 h-4" />
            🤝 Bargains &amp; Negotiations
            {(incomingOffers.length + outgoingOffers.length) > 0 && (
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {incomingOffers.length + outgoingOffers.length}
              </span>
            )}
          </button>
        </div>

        {/* Action Alert Banner */}
        {actionMsg && (
          <div className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{actionMsg.text}</span>
            </div>
            <button onClick={() => setActionMsg(null)} className="font-bold">×</button>
          </div>
        )}

        {/* Modal Scroll Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: BUYER ACCOUNT VIEW */}
          {activeTab === 'buyer' && (
            <div className="space-y-5 animate-fade-in">
              {/* Buyer Overview Banner */}
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                    🔒 Private Buyer Account Portal
                  </span>
                  <h4 className="font-heading font-extrabold text-sm text-ink-primary dark:text-white mt-0.5">
                    Your Campus Purchases & Handover Verification Passes
                  </h4>
                  <p className="text-xs text-ink-secondary dark:text-gray-400 mt-0.5">
                    Orders placed under your account ({user?.fullName}). Your Handover Passes are kept private from everyone until you meet the seller.
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-surface-dark-card border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300 shadow-2xs">
                  {buyerMeetups.length} Purchase{buyerMeetups.length === 1 ? '' : 's'}
                </div>
              </div>

              {buyerMeetups.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-surface-border dark:border-surface-dark-border rounded-xl">
                  <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <h4 className="font-heading font-bold text-sm text-ink-primary dark:text-white">
                    No purchases yet on your Buyer account
                  </h4>
                  <p className="text-xs text-ink-secondary dark:text-gray-400 mt-1 max-w-sm mx-auto">
                    Explore verified textbooks, mini drafters, and calculators listed by fellow students.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 rounded-lg bg-brand text-white font-bold text-xs uppercase tracking-wider hover:bg-brand-hover shadow-sm transition-all"
                  >
                    Browse Campus Marketplace
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {buyerMeetups.map((m) => {
                    const isAgreed = m.status === 'MUTUALLY_AGREED';
                    const isCompleted = m.status === 'COMPLETED';

                    return (
                      <div
                        key={m.id}
                        className="p-4 rounded-xl border border-surface-border dark:border-surface-dark-border bg-surface dark:bg-surface-dark-card shadow-xs space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <img
                              src={m.productImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'}
                              alt={m.productTitle}
                              className="w-16 h-16 rounded-xl object-cover bg-white shrink-0 border border-surface-border dark:border-surface-dark-border"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-semibold text-ink-muted">
                                  {m.orderId}
                                </span>
                                {isCompleted ? (
                                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                                    Handover Complete
                                  </span>
                                ) : isAgreed ? (
                                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                                    Mutually Agreed
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                                    Awaiting Seller Confirmation
                                  </span>
                                )}
                              </div>
                              <h4 className="font-heading font-extrabold text-sm text-ink-primary dark:text-white mt-1">
                                {m.productTitle}
                              </h4>
                              <span className="text-sm font-black text-brand dark:text-emerald-400 block mt-0.5">
                                ₹{m.productPrice.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          {/* Secret Handover Code Box (Private to Buyer) */}
                          <div className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 p-2.5 rounded-xl self-start sm:self-auto min-w-[200px]">
                            <div className="flex items-center justify-between text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">
                              <span className="flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Buyer Security Code
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono font-extrabold text-base text-ink-primary dark:text-white tracking-widest">
                                {m.handoverCode}
                              </span>
                              <button
                                onClick={() => handleCopyCode(m.handoverCode)}
                                className="p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 transition-colors"
                                title="Copy code"
                              >
                                {copiedCode === m.handoverCode ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <span className="text-[9px] text-ink-secondary dark:text-gray-400 block mt-0.5">
                              Give to seller only after inspecting item
                            </span>
                          </div>
                        </div>

                        {/* Meeting Location & Seller Details */}
                        <div className="p-3 bg-surface-subtle dark:bg-surface-dark-subtle rounded-xl border border-surface-border dark:border-surface-dark-border grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-ink-secondary block">
                              Handover Location & Time
                            </span>
                            <div className="flex items-center gap-1.5 font-semibold text-ink-primary dark:text-white mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                              <span className="truncate">{m.hubLocation}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-ink-secondary dark:text-gray-400 mt-0.5">
                              <span>{m.meetingDate}</span>
                              <span>•</span>
                              <span>{m.timeSlot}</span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase text-ink-secondary block">
                              Verified Seller Details
                            </span>
                            <span className="font-semibold text-ink-primary dark:text-white block mt-0.5">
                              {m.sellerName}
                            </span>
                            <div className="text-[11px] text-ink-secondary dark:text-gray-400 mt-0.5">
                              {m.sellerContact?.hostel || 'Campus Hostel'} • {m.sellerContact?.email}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-ink-secondary dark:text-gray-400">
                            Status: <strong>{m.status.replace(/_/g, ' ')}</strong>
                          </span>
                          <button
                            onClick={() => {
                              onClose();
                              onOpenMeetupCoordination(m.id);
                            }}
                            className="px-4 py-2 rounded-lg bg-brand text-white font-bold text-xs uppercase tracking-wider hover:bg-brand-hover shadow-xs transition-all flex items-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Coordinate Meetup & Chat
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SELLER ACCOUNT VIEW */}
          {activeTab === 'seller' && (
            <div className="space-y-5 animate-fade-in">
              {/* Seller Overview Banner */}
              <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/60 dark:bg-purple-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                    🔒 Private Seller Studio
                  </span>
                  <h4 className="font-heading font-extrabold text-sm text-ink-primary dark:text-white mt-0.5">
                    Your Campus Listings, Handover Requests & Earnings
                  </h4>
                  <p className="text-xs text-ink-secondary dark:text-gray-400 mt-0.5">
                    Manage incoming student orders, approve handover timings, verify buyer codes, and collect 100% direct student payout.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-surface-dark-card border border-purple-200 dark:border-purple-800 text-xs font-bold text-purple-800 dark:text-purple-300 shadow-2xs">
                    ₹{totalSellerEarnings.toLocaleString('en-IN')} Earned
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSellModal();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> List Item
                  </button>
                </div>
              </div>

              {/* Incoming Handover Requests */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-heading font-bold text-xs uppercase tracking-wider text-ink-primary dark:text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-600" />
                    Incoming Handover Requests ({sellerMeetups.length})
                  </h5>
                  <span className="text-[11px] text-ink-secondary dark:text-gray-400">
                    Direct handovers on campus
                  </span>
                </div>

                {sellerMeetups.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-surface-border dark:border-surface-dark-border rounded-xl">
                    <Package className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-ink-primary dark:text-white">
                      No incoming orders right now
                    </p>
                    <p className="text-[11px] text-ink-secondary dark:text-gray-400 mt-1">
                      When students buy your listings, handover proposals appear here for your review and timing confirmation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sellerMeetups.map((m) => {
                      const isCompleted = m.status === 'COMPLETED';

                      return (
                        <div
                          key={m.id}
                          className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-surface dark:bg-surface-dark-card shadow-xs space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <img
                                src={m.productImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'}
                                alt={m.productTitle}
                                className="w-14 h-14 rounded-xl object-cover bg-white shrink-0 border border-surface-border dark:border-surface-dark-border"
                              />
                              <div>
                                <span className="text-[10px] font-mono text-ink-muted block">{m.orderId}</span>
                                <h4 className="font-heading font-extrabold text-sm text-ink-primary dark:text-white mt-0.5">
                                  {m.productTitle}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs font-black text-brand dark:text-emerald-400">
                                    ₹{m.productPrice.toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-[10px] text-ink-secondary">•</span>
                                  <span className="text-xs font-medium text-ink-secondary dark:text-gray-300">
                                    Buyer: <strong>{m.buyerName}</strong> ({m.buyerContact?.hostel || 'Hostel'})
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Status Indicator */}
                            <div className="self-start sm:self-auto">
                              {isCompleted ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Completed & Paid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded-full">
                                  <Clock className="w-3 h-3 text-purple-600" />
                                  Handover Action
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Meeting Hub & Landmark Details */}
                          <div className="p-3 bg-purple-50/40 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-purple-800 dark:text-purple-300 block">
                                Requested Hub & Window
                              </span>
                              <div className="font-semibold text-ink-primary dark:text-white mt-0.5 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-purple-600" />
                                {m.hubLocation}
                              </div>
                              <div className="text-[11px] text-ink-secondary dark:text-gray-400 mt-0.5">
                                {m.meetingDate} • {m.timeSlot}
                              </div>
                            </div>

                            {/* Seller Verification Box */}
                            {!isCompleted && (
                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                <input
                                  type="text"
                                  placeholder="Buyer's Code"
                                  value={verifyCodeInputs[m.id] || ''}
                                  onChange={(e) =>
                                    setVerifyCodeInputs(prev => ({
                                      ...prev,
                                      [m.id]: e.target.value.toUpperCase()
                                    }))
                                  }
                                  className="w-28 px-2.5 py-1.5 text-xs font-mono font-bold uppercase rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-surface-dark-card"
                                />
                                <button
                                  onClick={() => handleVerifyCode(m.id)}
                                  disabled={verifyingId === m.id || !verifyCodeInputs[m.id]?.trim()}
                                  className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider shadow-2xs disabled:opacity-50 transition-colors"
                                >
                                  {verifyingId === m.id ? 'Verifying...' : 'Verify'}
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => {
                                onClose();
                                onOpenMeetupCoordination(m.id);
                              }}
                              className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all flex items-center gap-1.5"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              Review, Confirm or Counter-Propose
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* My Active Listings */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-heading font-bold text-xs uppercase tracking-wider text-ink-primary dark:text-white flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-brand" />
                    My Listed Products ({sellerProducts.length})
                  </h5>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSellModal();
                    }}
                    className="text-xs text-brand hover:underline font-bold flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> List New Item
                  </button>
                </div>

                {sellerProducts.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-surface-border dark:border-surface-dark-border rounded-xl">
                    <Tag className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-ink-primary dark:text-white">
                      No products listed under this student account
                    </p>
                    <p className="text-[11px] text-ink-secondary dark:text-gray-400 mt-1">
                      Have engineering drafters, lab equipment, or textbooks? List them on campus.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sellerProducts.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl border border-surface-border dark:border-surface-dark-border bg-surface dark:bg-surface-dark-card flex items-start gap-2.5"
                      >
                        <img
                          src={p.images[0] || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'}
                          alt={p.title}
                          className="w-14 h-14 rounded-lg object-cover bg-white shrink-0 border border-surface-border dark:border-surface-dark-border"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-heading font-bold text-xs text-ink-primary dark:text-white truncate">
                            {p.title}
                          </h4>
                          <span className="text-xs font-extrabold text-brand dark:text-emerald-400 block mt-0.5">
                            ₹{p.price.toLocaleString('en-IN')}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                              {p.status}
                            </span>
                            {p.isAiInspected && (
                              <span className="text-[10px] font-medium text-ink-secondary dark:text-gray-400 flex items-center gap-0.5">
                                <ShieldCheck className="w-3 h-3 text-brand" /> AI Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: BARGAINS & PRICE NEGOTIATIONS VIEW */}
          {activeTab === 'bargains' && (
            <div className="space-y-6 animate-fade-in">
              {/* Overview Banner */}
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <Handshake className="w-3.5 h-3.5" />
                    Campus Peer-to-Peer Price Negotiation
                  </span>
                  <h4 className="font-heading font-extrabold text-sm text-ink-primary dark:text-white mt-0.5">
                    Active Bargains, Incoming Offers &amp; Counter-Deals
                  </h4>
                  <p className="text-xs text-ink-secondary dark:text-gray-400 mt-0.5">
                    Bargain directly with students. Once an offer is accepted by both parties, buy at the agreed discounted price.
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-surface-dark-card border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-2xs">
                    {incomingOffers.length} Incoming
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-surface-dark-card border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300 shadow-2xs">
                    {outgoingOffers.length} Outgoing
                  </div>
                </div>
              </div>

              {/* Section 1: Incoming Offers on Your Listings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-heading font-bold text-ink-secondary dark:text-gray-400 uppercase tracking-wider block">
                    Incoming Buyer Offers on Your Items ({incomingOffers.length})
                  </span>
                  <span className="text-[10px] text-ink-secondary dark:text-gray-400">
                    Offers made by campus peers for your listings
                  </span>
                </div>

                {incomingOffers.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-surface-border dark:border-surface-dark-border rounded-xl">
                    <Handshake className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-ink-primary dark:text-white">
                      No incoming offers on your listed items currently
                    </p>
                    <p className="text-[11px] text-ink-secondary dark:text-gray-400 mt-0.5">
                      When buyers propose a bargain on your listings, they will appear here with accept and counter options.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incomingOffers.map(offer => {
                      const discountPct = Math.round(
                        ((offer.originalListingPrice - offer.offeredPrice) / offer.originalListingPrice) * 100
                      );
                      const isCounterOpen = showCounterRow[offer.id] || false;
                      const inputPrice = counterInput[offer.id] ?? Math.round((offer.originalListingPrice + offer.offeredPrice) / 2);
                      const inputMsg = counterNote[offer.id] ?? '';

                      return (
                        <div
                          key={offer.id}
                          className="p-4 rounded-xl border border-surface-border dark:border-surface-dark-border bg-surface dark:bg-surface-dark-card shadow-xs space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {offer.productImage && (
                                <img
                                  src={offer.productImage}
                                  alt={offer.productTitle}
                                  className="w-12 h-12 rounded-lg object-cover border border-surface-border dark:border-surface-dark-border shrink-0"
                                />
                              )}
                              <div>
                                <h5 className="font-heading font-bold text-xs text-ink-primary dark:text-white">
                                  {offer.productTitle}
                                </h5>
                                <p className="text-[11px] text-ink-secondary dark:text-gray-400 mt-0.5">
                                  Offered by: <strong>{offer.buyerName}</strong> ({offer.buyerEmail})
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                offer.status === 'ACCEPTED'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                                  : offer.status === 'COUNTERED'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                                  : offer.status === 'REJECTED'
                                  ? 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300'
                                  : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                              }`}>
                                {offer.status}
                              </span>
                              {offer.raisedCount && offer.raisedCount > 0 && (
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.2 rounded border border-amber-300">
                                  🚀 Buyer Raised Offer
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Price Comparison */}
                          <div className="p-2.5 rounded-lg bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-baseline gap-2">
                              <span className="text-[11px] text-ink-secondary dark:text-gray-400">Buyer Offers:</span>
                              <span className="font-heading font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                                ₹{offer.offeredPrice.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[11px] line-through text-ink-secondary">
                                ₹{offer.originalListingPrice.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                                {discountPct}% below listing
                              </span>
                              {offer.previousOfferedPrice && (
                                <span className="text-[10px] text-gray-400">
                                  (Was: ₹{offer.previousOfferedPrice.toLocaleString('en-IN')})
                                </span>
                              )}
                            </div>

                            {offer.aiDealFeedback && (
                              <span className="text-[10px] text-brand dark:text-emerald-300 flex items-center gap-1 font-medium">
                                <Sparkles className="w-3 h-3 shrink-0" />
                                {offer.aiDealFeedback}
                              </span>
                            )}
                          </div>

                          {/* Buyer Note */}
                          {offer.buyerMessage && (
                            <p className="text-xs text-ink-secondary dark:text-gray-300 italic bg-white/60 dark:bg-black/30 p-2 rounded-md border border-gray-100 dark:border-gray-800">
                              "{offer.buyerMessage}"
                            </p>
                          )}

                          {/* Negotiation History Log */}
                          {offer.history && offer.history.length > 1 && (
                            <div className="p-2 rounded-lg bg-gray-50/80 dark:bg-black/20 border border-gray-200 dark:border-gray-800 text-[11px] space-y-1">
                              <span className="font-bold text-ink-secondary dark:text-gray-400 block text-[10px] uppercase">
                                💬 Negotiation Activity:
                              </span>
                              {offer.history.slice(0, 3).map((h, i) => (
                                <div key={h.id || i} className="flex items-center justify-between text-ink-secondary dark:text-gray-400 text-[10px]">
                                  <span>
                                    {h.actor === 'BUYER' ? '🎓 Buyer' : '💼 Seller'} {h.action.replace('_', ' ').toLowerCase()}: <strong className="text-ink-primary dark:text-white">₹{h.price.toLocaleString('en-IN')}</strong>
                                    {h.message && ` - "${h.message}"`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Seller Action Buttons */}
                          {offer.status === 'PENDING' && (
                            <div className="space-y-2 pt-1 border-t border-surface-border dark:border-surface-dark-border">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSellerRespond(offer.id, 'ACCEPT')}
                                  className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Accept Deal at ₹{offer.offeredPrice.toLocaleString('en-IN')}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowCounterRow(prev => ({ ...prev, [offer.id]: !prev[offer.id] }))
                                  }
                                  className="py-1.5 px-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <TrendingUp className="w-3.5 h-3.5" />
                                  {isCounterOpen ? 'Cancel Counter' : 'Counter-Offer'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSellerRespond(offer.id, 'REJECT')}
                                  className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-lg transition-colors ml-auto"
                                >
                                  Decline
                                </button>
                              </div>

                              {/* Inline Counter Proposal Drawer */}
                              {isCounterOpen && (
                                <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2 animate-fade-in">
                                  <div className="flex items-center gap-3">
                                    <label className="text-xs font-bold text-amber-900 dark:text-amber-200 shrink-0">
                                      Your Counter Price (₹):
                                    </label>
                                    <input
                                      type="number"
                                      min={offer.offeredPrice + 1}
                                      max={offer.originalListingPrice - 1}
                                      value={inputPrice}
                                      onChange={e =>
                                        setCounterInput(prev => ({
                                          ...prev,
                                          [offer.id]: Number(e.target.value)
                                        }))
                                      }
                                      className="w-28 px-2 py-1 bg-white dark:bg-slate-900 border border-amber-300 rounded font-bold text-xs"
                                    />
                                    <span className="text-[11px] text-amber-700 dark:text-amber-300">
                                      Suggested midpoint: ₹{Math.round((offer.originalListingPrice + offer.offeredPrice) / 2)}
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Optional note (e.g. Can meet at Canteen right now, will include bill)..."
                                    value={inputMsg}
                                    onChange={e =>
                                      setCounterNote(prev => ({
                                        ...prev,
                                        [offer.id]: e.target.value
                                      }))
                                    }
                                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 rounded text-xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSellerRespond(offer.id, 'COUNTER', inputPrice, inputMsg)
                                    }
                                    className="py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-md shadow-xs transition-colors"
                                  >
                                    Send Counter-Offer of ₹{inputPrice.toLocaleString('en-IN')} →
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {offer.status === 'COUNTERED' && (
                            <div className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
                              <span>You proposed a counter-price of <strong>₹{offer.counterPrice?.toLocaleString('en-IN')}</strong>. Waiting for {offer.buyerName} to accept or raise.</span>
                            </div>
                          )}

                          {offer.status === 'ACCEPTED' && (
                            <div className="text-xs text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                              <span>Deal accepted at <strong>₹{offer.offeredPrice.toLocaleString('en-IN')}</strong>. Handover coordination ready.</span>
                              <span className="text-[10px] font-bold text-emerald-700 uppercase">Confirmed</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 2: Outgoing Offers You Made */}
              <div className="space-y-3 pt-4 border-t border-surface-border dark:border-surface-dark-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-heading font-bold text-ink-secondary dark:text-gray-400 uppercase tracking-wider block">
                    Your Bargain Offers to Sellers ({outgoingOffers.length})
                  </span>
                  <span className="text-[10px] text-ink-secondary dark:text-gray-400">
                    Offers you proposed to fellow campus students
                  </span>
                </div>

                {outgoingOffers.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-surface-border dark:border-surface-dark-border rounded-xl">
                    <ShoppingBag className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-ink-primary dark:text-white">
                      You haven't proposed any bargain offers yet
                    </p>
                    <p className="text-[11px] text-ink-secondary dark:text-gray-400 mt-0.5">
                      Click "Bargain / Make Offer" on any product to negotiate fair prices with student sellers!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {outgoingOffers.map(offer => {
                      const isRaiseOpen = showRaiseRow[offer.id] || false;
                      const defaultRaise = offer.counterPrice
                        ? Math.round((offer.offeredPrice + offer.counterPrice) / 2)
                        : Math.min(offer.originalListingPrice - 10, offer.offeredPrice + 50);
                      const currentRaisePrice = raiseInput[offer.id] ?? defaultRaise;
                      const currentRaiseNote = raiseNote[offer.id] ?? '';

                      return (
                        <div
                          key={offer.id}
                          className="p-4 rounded-xl border border-surface-border dark:border-surface-dark-border bg-surface dark:bg-surface-dark-card shadow-xs space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {offer.productImage && (
                                <img
                                  src={offer.productImage}
                                  alt={offer.productTitle}
                                  className="w-12 h-12 rounded-lg object-cover border border-surface-border dark:border-surface-dark-border shrink-0"
                                />
                              )}
                              <div>
                                <h5 className="font-heading font-bold text-xs text-ink-primary dark:text-white">
                                  {offer.productTitle}
                                </h5>
                                <p className="text-[11px] text-ink-secondary dark:text-gray-400 mt-0.5">
                                  Seller: <strong>{offer.sellerName}</strong>
                                </p>
                              </div>
                            </div>

                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                              offer.status === 'ACCEPTED'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                                : offer.status === 'COUNTERED'
                                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                            }`}>
                              {offer.status}
                            </span>
                          </div>

                          {/* Price Details */}
                          <div className="p-2.5 rounded-lg bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-baseline gap-2">
                              <span className="text-[11px] text-ink-secondary dark:text-gray-400">Your Current Offer:</span>
                              <span className="font-heading font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                                ₹{offer.offeredPrice.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[11px] line-through text-ink-secondary">
                                ₹{offer.originalListingPrice.toLocaleString('en-IN')}
                              </span>
                              {offer.previousOfferedPrice && (
                                <span className="text-[10px] text-gray-400">
                                  (Raised from: ₹{offer.previousOfferedPrice.toLocaleString('en-IN')})
                                </span>
                              )}
                            </div>

                            {offer.status === 'PENDING' && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                  Waiting for {offer.sellerName} to review
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRaiseInput(prev => ({ ...prev, [offer.id]: prev[offer.id] || defaultRaise }));
                                    setShowRaiseRow(prev => ({ ...prev, [offer.id]: !prev[offer.id] }));
                                  }}
                                  className="py-1 px-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/70 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-1 transition-colors"
                                >
                                  <TrendingUp className="w-3.5 h-3.5" />
                                  {isRaiseOpen ? 'Cancel' : '🚀 Raise Offer'}
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Negotiation History Log for Buyer */}
                          {offer.history && offer.history.length > 1 && (
                            <div className="p-2 rounded-lg bg-gray-50/80 dark:bg-black/20 border border-gray-200 dark:border-gray-800 text-[11px] space-y-1">
                              <span className="font-bold text-ink-secondary dark:text-gray-400 block text-[10px] uppercase">
                                💬 Negotiation Activity:
                              </span>
                              {offer.history.slice(0, 3).map((h, i) => (
                                <div key={h.id || i} className="flex items-center justify-between text-ink-secondary dark:text-gray-400 text-[10px]">
                                  <span>
                                    {h.actor === 'BUYER' ? '🎓 You' : '💼 Seller'} {h.action.replace('_', ' ').toLowerCase()}: <strong className="text-ink-primary dark:text-white">₹{h.price.toLocaleString('en-IN')}</strong>
                                    {h.message && ` - "${h.message}"`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Counter-Offer Action */}
                          {offer.status === 'COUNTERED' && offer.counterPrice && (
                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-amber-900 dark:text-amber-200">
                                  Seller Counter-Offer: ₹{offer.counterPrice.toLocaleString('en-IN')}
                                </span>
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                                  Save ₹{(offer.originalListingPrice - offer.counterPrice).toLocaleString('en-IN')}
                                </span>
                              </div>
                              {offer.sellerMessage && (
                                <p className="text-[11px] text-amber-800 dark:text-amber-300 italic">
                                  "{offer.sellerMessage}"
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleBuyerAcceptCounter(offer.id)}
                                  className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Accept Counter (₹{offer.counterPrice.toLocaleString('en-IN')})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRaiseInput(prev => ({ ...prev, [offer.id]: prev[offer.id] || defaultRaise }));
                                    setShowRaiseRow(prev => ({ ...prev, [offer.id]: !prev[offer.id] }));
                                  }}
                                  className="py-2 px-3 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/70 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-xs rounded-lg border border-purple-200 dark:border-purple-800 flex items-center gap-1 transition-colors"
                                >
                                  <TrendingUp className="w-3.5 h-3.5" />
                                  {isRaiseOpen ? 'Cancel' : '🚀 Counter-Raise Offer'}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Inline Buyer Raise Offer Drawer */}
                          {isRaiseOpen && (
                            <div className="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2.5 animate-fade-in">
                              <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-200">
                                <span>Raise Your Bargain Offer:</span>
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                                  Must be &gt; ₹{offer.offeredPrice.toLocaleString('en-IN')}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <label className="text-xs font-bold text-ink-primary dark:text-gray-200 shrink-0">
                                  New Offer (₹):
                                </label>
                                <input
                                  type="number"
                                  min={offer.offeredPrice + 1}
                                  max={(offer.counterPrice || offer.originalListingPrice) - 1}
                                  value={currentRaisePrice}
                                  onChange={e =>
                                    setRaiseInput(prev => ({
                                      ...prev,
                                      [offer.id]: Number(e.target.value)
                                    }))
                                  }
                                  className="w-28 px-2 py-1 bg-white dark:bg-slate-900 border border-blue-300 rounded font-bold text-xs text-ink-primary dark:text-white"
                                />

                                {/* Increment Pills */}
                                <div className="flex flex-wrap items-center gap-1">
                                  {[25, 50, 100].map(inc => {
                                    const targetPrice = offer.offeredPrice + inc;
                                    const maxCap = (offer.counterPrice || offer.originalListingPrice) - 1;
                                    if (targetPrice > maxCap) return null;
                                    return (
                                      <button
                                        key={inc}
                                        type="button"
                                        onClick={() => setRaiseInput(prev => ({ ...prev, [offer.id]: targetPrice }))}
                                        className="text-[10px] py-0.5 px-1.5 rounded bg-white dark:bg-slate-800 border border-blue-200 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-semibold"
                                      >
                                        +₹{inc}
                                      </button>
                                    );
                                  })}
                                  {offer.counterPrice && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setRaiseInput(prev => ({
                                          ...prev,
                                          [offer.id]: Math.round((offer.offeredPrice + offer.counterPrice!) / 2)
                                        }))
                                      }
                                      className="text-[10px] py-0.5 px-1.5 rounded bg-purple-100 dark:bg-purple-900 border border-purple-200 text-purple-800 dark:text-purple-200 hover:bg-purple-200 font-semibold"
                                    >
                                      Meet in Middle (₹{Math.round((offer.offeredPrice + offer.counterPrice) / 2)})
                                    </button>
                                  )}
                                </div>
                              </div>

                              <input
                                type="text"
                                placeholder="Optional message to seller (e.g. Can meet at Canteen right now, cash ready)..."
                                value={currentRaiseNote}
                                onChange={e =>
                                  setRaiseNote(prev => ({
                                    ...prev,
                                    [offer.id]: e.target.value
                                  }))
                                }
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-blue-300 rounded text-xs text-ink-primary dark:text-white"
                              />

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleBuyerRaiseOffer(offer)}
                                  className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1"
                                >
                                  <TrendingUp className="w-3.5 h-3.5" />
                                  Submit Raised Offer of ₹{currentRaisePrice.toLocaleString('en-IN')} →
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowRaiseRow(prev => ({ ...prev, [offer.id]: false }))}
                                  className="py-1.5 px-2.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Accepted Deal Action */}
                          {offer.status === 'ACCEPTED' && (
                            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3">
                              <div>
                                <p className="font-bold text-xs text-emerald-900 dark:text-emerald-200">
                                  🎉 Offer Accepted at ₹{offer.offeredPrice.toLocaleString('en-IN')}!
                                </p>
                                <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                                  Bargain price locked in. Add to cart to proceed with on-campus pickup.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleBuyBargain(offer)}
                                className="py-2 px-3 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md active:scale-95 shrink-0"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                Buy at ₹{offer.offeredPrice} →
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer: Authentic Account Persona Switcher */}
        {availableUsers && availableUsers.length > 0 && (
          <div className="p-4 border-t border-surface-border dark:border-surface-dark-border bg-surface-subtle dark:bg-surface-dark-subtle">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-ink-secondary dark:text-gray-400">
                <Users className="w-4 h-4 text-brand" />
                <span>
                  Switch Account Persona:
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {availableUsers.map((u) => {
                  const isSelected = user?.id === u.id;
                  const isAdmin = u.role === 'COLLEGE_ADMIN' || u.role === 'SUPER_ADMIN';

                  return (
                    <button
                      key={u.id}
                      onClick={() => switchUser(u.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-brand text-white border-brand shadow-xs'
                          : 'bg-white dark:bg-surface-dark-card text-ink-primary dark:text-gray-200 border-surface-border dark:border-surface-dark-border hover:border-gray-400'
                      }`}
                    >
                      {isAdmin ? '🛡️' : '🎓'}
                      <span>{u.fullName.split(' ')[0]}</span>
                      <span className="text-[10px] font-normal opacity-85">
                        ({isAdmin ? 'Admin' : u.department || 'Student'})
                      </span>
                      {isSelected && <UserCheck className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
