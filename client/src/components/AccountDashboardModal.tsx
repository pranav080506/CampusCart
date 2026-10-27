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
  Check
} from 'lucide-react';
import { MeetupSession, Product } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AccountDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMeetupCoordination: (meetupId?: string) => void;
  onOpenSellModal: () => void;
  initialTab?: 'buyer' | 'seller';
}

export const AccountDashboardModal: React.FC<AccountDashboardModalProps> = ({
  isOpen,
  onClose,
  onOpenMeetupCoordination,
  onOpenSellModal,
  initialTab = 'buyer'
}) => {
  const { user, college, availableUsers, switchUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>(initialTab);

  const [buyerMeetups, setBuyerMeetups] = useState<MeetupSession[]>([]);
  const [sellerMeetups, setSellerMeetups] = useState<MeetupSession[]>([]);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [verifyCodeInputs, setVerifyCodeInputs] = useState<Record<string, string>>({});
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchAccountData = async () => {
    try {
      setIsLoading(true);
      const [summaryRes, productsRes] = await Promise.all([
        api.getAccountSummary(),
        api.getProducts({ collegeApprovedOnly: false })
      ]);

      if (summaryRes.success) {
        setBuyerMeetups(summaryRes.buyerMeetups);
        setSellerMeetups(summaryRes.sellerMeetups);
      }

      if (productsRes.success && user) {
        // Find products listed by this user
        const mine = productsRes.products.filter(p => p.sellerId === user.id);
        setSellerProducts(mine);
      }
    } catch (err) {
      console.error('Failed to load account data:', err);
    } finally {
      setIsLoading(false);
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
        </div>

        {/* Footer: Authentic Account Persona Switcher */}
        <div className="p-4 border-t border-surface-border dark:border-surface-dark-border bg-surface-subtle dark:bg-surface-dark-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-ink-secondary dark:text-gray-400">
              <Users className="w-4 h-4 text-brand" />
              <span>
                Switch Authentic Account Persona:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {availableUsers.map((u) => {
                const isSelected = user?.id === u.id;
                const isRohan = u.id === 'usr-student-1';
                const isAnanya = u.id === 'usr-student-2';

                return (
                  <button
                    key={u.id}
                    onClick={() => switchUser(u.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? isAnanya
                          ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                          : 'bg-brand text-white border-brand shadow-xs'
                        : 'bg-white dark:bg-surface-dark-card text-ink-primary dark:text-gray-200 border-surface-border dark:border-surface-dark-border hover:border-gray-400'
                    }`}
                  >
                    {isRohan ? '🎓' : isAnanya ? '💼' : '🛡️'}
                    <span>{u.fullName.split(' ')[0]}</span>
                    <span className="text-[10px] font-normal opacity-85">
                      ({isRohan ? 'Buyer' : isAnanya ? 'Seller' : 'Admin'})
                    </span>
                    {isSelected && <UserCheck className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
