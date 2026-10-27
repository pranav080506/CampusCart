import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MessageSquare,
  Users,
  Repeat,
  Sparkles,
  ChevronRight,
  Send,
  Camera,
  Check,
  Phone,
  Mail,
  Home,
  MessageCircle,
  ExternalLink,
  Lock,
  UserCheck
} from 'lucide-react';
import { MeetupSession, CampusMeetupHub, ChatMessage } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface MeetupCoordinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMeetupId?: string;
  initialTab?: 'coordination' | 'chat';
}

export const MeetupCoordinationModal: React.FC<MeetupCoordinationModalProps> = ({
  isOpen,
  onClose,
  initialMeetupId,
  initialTab = 'coordination'
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'coordination' | 'chat'>(initialTab);
  const [meetups, setMeetups] = useState<MeetupSession[]>([]);
  const [selectedMeetupId, setSelectedMeetupId] = useState<string | null>(null);
  const [hubs, setHubs] = useState<CampusMeetupHub[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Counter proposal state
  const [isCountering, setIsCountering] = useState(false);
  const [counterHub, setCounterHub] = useState('');
  const [customHub, setCustomHub] = useState('');
  const [counterDate, setCounterDate] = useState('Tomorrow');
  const [counterTime, setCounterTime] = useState('05:00 PM - 05:30 PM');
  const [counterNote, setCounterNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Seller code verification state
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  // Direct In-App Chat State
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const fetchMeetups = async () => {
    try {
      setIsLoading(true);
      const res = await api.getMeetups();
      if (res.success) {
        setMeetups(res.meetups);
        if (initialMeetupId) {
          setSelectedMeetupId(initialMeetupId);
        } else if (res.meetups.length > 0 && !selectedMeetupId) {
          setSelectedMeetupId(res.meetups[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load meetups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHubs = async () => {
    try {
      const res = await api.getCampusHubs();
      if (res.success) {
        setHubs(res.hubs);
      }
    } catch (err) {
      console.error('Failed to load hubs:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMeetups();
      fetchHubs();
      setIsCountering(false);
      setFeedbackMsg(null);
      setVerifyCodeInput('');
      if (initialTab) setActiveTab(initialTab);
    }
  }, [isOpen, user?.id]);

  useEffect(() => {
    if (activeTab === 'chat') {
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [activeTab, selectedMeetupId, meetups]);

  if (!isOpen) return null;

  const currentMeetup = meetups.find(m => m.id === selectedMeetupId) || meetups[0];

  // Strictly authenticate role based on currently logged-in user
  const isSeller = Boolean(user && currentMeetup && user.id === currentMeetup.sellerId);
  const isBuyer = Boolean(user && currentMeetup && user.id === currentMeetup.buyerId);
  const isAdmin = user?.role === 'COLLEGE_ADMIN';
  const currentRole: 'BUYER' | 'SELLER' = isSeller ? 'SELLER' : 'BUYER';

  // Has current user confirmed?
  const hasActorAgreed = isSeller ? currentMeetup?.sellerAgreed : currentMeetup?.buyerAgreed;

  // Counterparty info
  const otherPartyName = isSeller ? currentMeetup?.buyerName : currentMeetup?.sellerName;
  const otherPartyRole = isSeller ? 'Buyer' : 'Seller';
  const otherPartyContact = isSeller ? currentMeetup?.buyerContact : currentMeetup?.sellerContact;

  // Does current user have action rights right now?
  const isWaitingForOtherParty =
    (currentMeetup?.status === 'PROPOSED_BY_BUYER' && isBuyer) ||
    (currentMeetup?.status === 'PROPOSED_BY_SELLER' && isSeller);

  const canConfirmNow =
    (currentMeetup?.status === 'PROPOSED_BY_BUYER' && (isSeller || isAdmin)) ||
    (currentMeetup?.status === 'PROPOSED_BY_SELLER' && (isBuyer || isAdmin));

  const handleConfirmAgreement = async () => {
    if (!currentMeetup) return;
    try {
      setIsSubmitting(true);
      const res = await api.respondToMeetup(currentMeetup.id, {
        action: 'CONFIRM'
      });

      if (res.success) {
        setFeedbackMsg({
          text: `You (${isSeller ? 'Seller' : 'Buyer'}) confirmed the meetup hub & timing!`,
          type: 'success'
        });
        await fetchMeetups();
      }
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Failed to confirm meetup', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendCounterProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMeetup) return;

    const chosenLocation = counterHub === 'custom' ? customHub : counterHub || currentMeetup.hubLocation;

    if (!chosenLocation) {
      setFeedbackMsg({ text: 'Please specify a meetup hub location.', type: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.respondToMeetup(currentMeetup.id, {
        action: 'COUNTER',
        hubLocation: chosenLocation,
        meetingDate: counterDate,
        timeSlot: counterTime,
        note: counterNote
      });

      if (res.success) {
        setFeedbackMsg({
          text: `Proposed new meetup hub & timing as ${isSeller ? 'Seller' : 'Buyer'}. Waiting for ${otherPartyName} to confirm.`,
          type: 'success'
        });
        setIsCountering(false);
        setCounterNote('');
        await fetchMeetups();
      }
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Failed to submit proposal', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyHandoverCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMeetup || !verifyCodeInput.trim()) return;

    try {
      setIsVerifyingCode(true);
      const res = await api.verifyMeetupCode(currentMeetup.id, verifyCodeInput.trim());
      if (res.success) {
        setFeedbackMsg({
          text: 'Handover Code verified successfully! In-person handover completed and payout unlocked.',
          type: 'success'
        });
        setVerifyCodeInput('');
        await fetchMeetups();
      } else {
        setFeedbackMsg({ text: res.message || 'Invalid Handover Code.', type: 'error' });
      }
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Verification failed. Please check the code.', type: 'error' });
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleSendChatMessage = async (e?: React.FormEvent, presetText?: string) => {
    if (e) e.preventDefault();
    const textToSend = presetText || chatInput;
    if (!textToSend.trim() || !currentMeetup) return;

    try {
      setIsSendingChat(true);
      const res = await api.sendMeetupMessage(currentMeetup.id, {
        text: textToSend.trim()
      });

      if (res.success) {
        setChatInput('');
        setMeetups(prev =>
          prev.map(m =>
            m.id === currentMeetup.id
              ? { ...m, messages: res.allMessages }
              : m
          )
        );
      }
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Failed to send message', type: 'error' });
    } finally {
      setIsSendingChat(false);
    }
  };

  const buyerQuickReplies = [
    "I'm waiting outside B.Tech Canteen right now!",
    "Can we meet near the Stationery Shop?",
    "I'm near Gate No. 1 by the security entrance.",
    "Can we delay by 15 mins? Class running slightly late.",
    "Does 5:15 PM work for you?"
  ];

  const sellerQuickReplies = [
    "I have arrived at the meetup hub with the item!",
    "I'm carrying the original packaging and accessories.",
    "Please check and inspect the item thoroughly.",
    "Could you share your 6-character Handover Code?",
    "Thank you! Handover complete."
  ];

  const quickChatChips = isSeller ? sellerQuickReplies : buyerQuickReplies;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white dark:bg-surface-dark-card w-full max-w-4xl rounded-2xl shadow-2xl border border-surface-border dark:border-surface-dark-border overflow-hidden animate-fade-in my-6 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-surface-border dark:border-surface-dark-border bg-surface-subtle dark:bg-surface-dark-subtle">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-md ${
              isSeller ? 'bg-purple-700' : 'bg-brand'
            }`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-lg text-ink-primary dark:text-white">
                  Campus Handover Hub
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-brand dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Mutual Decision by Both
                </span>
              </div>
              <p className="text-xs text-ink-secondary dark:text-gray-400">
                Safe campus handovers decided collaboratively between student buyer and seller.
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

        {/* Private Account Identity Banner */}
        <div className={`border-b px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs transition-colors ${
          isSeller
            ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/50 text-purple-950 dark:text-purple-200'
            : isBuyer
            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50 text-blue-950 dark:text-blue-200'
            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-950 dark:text-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-4 h-4 shrink-0 ${isSeller ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`} />
            <div>
              <span className="font-bold">
                {isSeller ? '🔒 Private Seller Account' : isBuyer ? '🔒 Private Buyer Account' : '🛡️ Campus Moderation Hub'}
              </span>
              <span className="ml-1.5 opacity-90">
                • Authenticated as <strong>{user?.fullName}</strong> ({user?.studentId || 'Verified Campus Account'})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
              isSeller
                ? 'bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200'
                : 'bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200'
            }`}>
              {isSeller ? 'Seller Portal' : 'Buyer Portal'}
            </span>
            <span className="text-[11px] opacity-75 hidden sm:inline">
              {isSeller
                ? `Counterparty: ${currentMeetup?.buyerName} (Buyer)`
                : `Counterparty: ${currentMeetup?.sellerName} (Seller)`}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Meetups List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-bold text-ink-secondary dark:text-gray-400 uppercase tracking-wider">
                My Scheduled Meetups ({meetups.length})
              </span>
              <button
                onClick={fetchMeetups}
                className="text-[11px] text-brand hover:underline font-semibold flex items-center gap-1"
              >
                <Repeat className="w-3 h-3" /> Refresh
              </button>
            </div>

            {meetups.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-surface-border dark:border-surface-dark-border rounded-xl">
                <MapPin className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-ink-primary dark:text-white">No active meetups</p>
                <p className="text-[11px] text-ink-secondary dark:text-gray-400 mt-1">
                  Place an order as Buyer or receive a request as Seller to see meetups here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {meetups.map((m) => {
                  const isSelected = m.id === (currentMeetup?.id || selectedMeetupId);
                  const isAgreed = m.status === 'MUTUALLY_AGREED';
                  const isCompleted = m.status === 'COMPLETED';
                  const isUserSellerForThis = user?.id === m.sellerId;

                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedMeetupId(m.id);
                        setIsCountering(false);
                        setFeedbackMsg(null);
                        setVerifyCodeInput('');
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? isUserSellerForThis
                            ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/40 shadow-xs'
                            : 'border-brand bg-brand-light/40 dark:bg-emerald-950/40 shadow-xs'
                          : 'border-surface-border dark:border-surface-dark-border hover:border-gray-300 dark:hover:border-gray-700 bg-surface dark:bg-surface-dark-card'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <img
                          src={m.productImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'}
                          alt={m.productTitle}
                          className="w-12 h-12 rounded-lg object-cover bg-white shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                              isUserSellerForThis
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              {isUserSellerForThis ? 'You Sell' : 'You Bought'}
                            </span>
                            <span className="text-xs font-extrabold text-brand dark:text-emerald-400">
                              ₹{m.productPrice.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <h4 className="font-heading font-bold text-xs text-ink-primary dark:text-white truncate mt-0.5">
                            {m.productTitle}
                          </h4>

                          <div className="flex items-center gap-1 mt-1.5">
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 px-1.5 py-0.5 rounded">
                                <CheckCircle2 className="w-3 h-3 text-blue-600" /> Completed
                              </span>
                            ) : isAgreed ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Mutually Agreed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 rounded">
                                <Clock className="w-3 h-3 text-amber-600" /> Action Required
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Coordination & Chat Workspace */}
          {currentMeetup ? (
            <div className="lg:col-span-2 space-y-4">
              {/* Workspace Navigation Tabs */}
              <div className="flex border-b border-surface-border dark:border-surface-dark-border gap-2">
                <button
                  onClick={() => setActiveTab('coordination')}
                  className={`pb-2.5 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
                    activeTab === 'coordination'
                      ? 'border-brand text-brand dark:text-emerald-400'
                      : 'border-transparent text-ink-secondary hover:text-ink-primary dark:hover:text-white'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  Hub & Timing Decision
                </button>

                <button
                  onClick={() => setActiveTab('chat')}
                  className={`pb-2.5 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
                    activeTab === 'chat'
                      ? 'border-brand text-brand dark:text-emerald-400'
                      : 'border-transparent text-ink-secondary hover:text-ink-primary dark:hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Direct Chat with {otherPartyRole}
                  {(currentMeetup.messages?.length || 0) > 0 && (
                    <span className="bg-brand text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {currentMeetup.messages?.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Feedback Alert */}
              {feedbackMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between animate-fade-in ${
                    feedbackMsg.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-800 dark:text-emerald-200'
                      : 'bg-red-50 dark:bg-red-950/60 border-red-300 text-red-800 dark:text-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{feedbackMsg.text}</span>
                  </div>
                  <button onClick={() => setFeedbackMsg(null)} className="font-bold text-ink-secondary">
                    ×
                  </button>
                </div>
              )}

              {/* TAB 1: Hub & Timing Coordination */}
              {activeTab === 'coordination' && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div
                    className={`p-4 rounded-xl border ${
                      currentMeetup.status === 'MUTUALLY_AGREED'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                        : currentMeetup.status === 'COMPLETED'
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
                        : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-semibold text-ink-secondary uppercase tracking-wider block">
                          Handover Agreement Status
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {currentMeetup.status === 'MUTUALLY_AGREED' ? (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              <h4 className="font-heading font-extrabold text-base text-emerald-900 dark:text-emerald-200">
                                Mutually Agreed by Both Student Parties
                              </h4>
                            </>
                          ) : currentMeetup.status === 'COMPLETED' ? (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-blue-600" />
                              <h4 className="font-heading font-extrabold text-base text-blue-900 dark:text-blue-200">
                                In-Person Handover Completed & Verified
                              </h4>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-5 h-5 text-amber-600" />
                              <h4 className="font-heading font-extrabold text-base text-amber-900 dark:text-amber-200">
                                {isWaitingForOtherParty
                                  ? `Waiting for ${otherPartyName} to Confirm`
                                  : 'Your Confirmation or Counter-Proposal Needed'}
                              </h4>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Role-Specific Handover Code Badge */}
                      <div className="bg-white dark:bg-surface-dark-card px-3 py-1.5 rounded-lg border border-surface-border dark:border-surface-dark-border flex items-center gap-2 self-start sm:self-center">
                        <Lock className="w-4 h-4 text-brand" />
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-ink-secondary block">
                            {isBuyer ? 'Your Buyer Pass' : 'Security Pass'}
                          </span>
                          <span className="font-mono font-bold text-xs text-ink-primary dark:text-white">
                            {isBuyer ? currentMeetup.handoverCode : 'Required from Buyer'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mutual Confirmation Status Grid */}
                    <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10 grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                            currentMeetup.buyerAgreed ? 'bg-emerald-600' : 'bg-gray-400'
                          }`}
                        >
                          {currentMeetup.buyerAgreed ? '✓' : '...'}
                        </div>
                        <div>
                          <span className="text-ink-secondary block text-[10px]">Buyer Confirmation</span>
                          <span className="font-semibold text-ink-primary dark:text-white">
                            {currentMeetup.buyerName} {currentMeetup.buyerAgreed ? '(Agreed)' : '(Pending)'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                            currentMeetup.sellerAgreed ? 'bg-emerald-600' : 'bg-gray-400'
                          }`}
                        >
                          {currentMeetup.sellerAgreed ? '✓' : '...'}
                        </div>
                        <div>
                          <span className="text-ink-secondary block text-[10px]">Seller Confirmation</span>
                          <span className="font-semibold text-ink-primary dark:text-white">
                            {currentMeetup.sellerName} {currentMeetup.sellerAgreed ? '(Agreed)' : '(Pending)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Private Buyer / Seller Security Pass Card */}
                  {isBuyer && (
                    <div className="p-4 rounded-xl border border-blue-300 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          Secret Buyer Handover Pass
                        </span>
                        <span className="text-[10px] bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full font-bold">
                          Private to You (Buyer)
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-white dark:bg-surface-dark-card p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-ink-secondary block">
                            6-Character Verification Code
                          </span>
                          <span className="font-mono font-black text-xl text-brand dark:text-emerald-400 tracking-widest">
                            {currentMeetup.handoverCode}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(currentMeetup.handoverCode);
                            setFeedbackMsg({ text: 'Handover code copied to clipboard!', type: 'success' });
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-brand bg-brand-light rounded-lg hover:bg-emerald-100 dark:bg-emerald-950 transition-colors"
                        >
                          Copy Code
                        </button>
                      </div>
                      <p className="text-[11px] text-blue-900 dark:text-blue-200 leading-relaxed">
                        🔒 <strong>Safety Rule:</strong> Give this code to seller <strong>{currentMeetup.sellerName}</strong> ONLY after you physically meet at the campus hub and thoroughly inspect the item.
                      </p>
                    </div>
                  )}

                  {isSeller && (
                    <div className="p-4 rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-950/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          Seller Handover Verification & Payout Release
                        </span>
                        <span className="text-[10px] bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full font-bold">
                          Private to You (Seller)
                        </span>
                      </div>
                      {currentMeetup.status === 'COMPLETED' ? (
                        <div className="bg-emerald-100 dark:bg-emerald-950/80 p-3 rounded-lg text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Buyer Code verified! Handover completed and ₹{currentMeetup.productPrice.toLocaleString('en-IN')} payout released.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[11px] text-purple-900 dark:text-purple-200">
                            At the meetup hub, allow buyer <strong>{currentMeetup.buyerName}</strong> to examine the item. Once satisfied, request their 6-character Handover Code:
                          </p>
                          <form onSubmit={handleVerifyHandoverCode} className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Enter Buyer Code (e.g. CC-9421)"
                              value={verifyCodeInput}
                              onChange={(e) => setVerifyCodeInput(e.target.value.toUpperCase())}
                              maxLength={10}
                              className="flex-1 px-3 py-2 font-mono font-bold uppercase text-xs rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-surface-dark-card focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                            <button
                              type="submit"
                              disabled={isVerifyingCode || !verifyCodeInput.trim()}
                              className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider shadow-xs disabled:opacity-50 transition-colors"
                            >
                              {isVerifyingCode ? 'Verifying...' : 'Verify & Unlock Payout'}
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Current Proposed Meetup Details */}
                  {!isCountering ? (
                    <div className="bg-surface-subtle dark:bg-surface-dark-subtle p-4 rounded-xl border border-surface-border dark:border-surface-dark-border space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-surface-border dark:border-surface-dark-border">
                        <span className="font-heading font-extrabold text-xs text-ink-primary dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-brand" />
                          Handover Location & Window
                        </span>
                        <span className="text-[11px] font-semibold text-brand">
                          Proposed by {currentMeetup.proposedBy === 'BUYER' ? 'Buyer' : 'Seller'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-ink-secondary block text-[10px] font-bold uppercase">Campus Hub</span>
                          <span className="font-bold text-ink-primary dark:text-white block mt-0.5">
                            {currentMeetup.hubLocation}
                          </span>
                          {currentMeetup.hubLandmark && (
                            <span className="text-[11px] text-ink-secondary dark:text-gray-400 block mt-0.5">
                              Landmark: {currentMeetup.hubLandmark}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-ink-secondary block text-[10px] font-bold uppercase">Agreed Timing</span>
                          <span className="font-bold text-ink-primary dark:text-white block mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-brand" />
                            {currentMeetup.meetingDate}
                          </span>
                          <span className="text-[11px] text-ink-secondary dark:text-gray-400 block mt-0.5 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-brand" />
                            {currentMeetup.timeSlot}
                          </span>
                        </div>
                      </div>

                      {/* Buyer Notes */}
                      {currentMeetup.buyerNotes && (
                        <div className="p-2.5 rounded-lg bg-white dark:bg-surface-dark-card border border-surface-border dark:border-surface-dark-border text-xs">
                          <span className="text-[10px] font-bold text-ink-secondary block">
                            Note from Buyer ({currentMeetup.buyerName}):
                          </span>
                          <p className="text-ink-primary dark:text-gray-200 italic mt-0.5">
                            "{currentMeetup.buyerNotes}"
                          </p>
                        </div>
                      )}

                      {/* Seller Notes */}
                      {currentMeetup.sellerNotes && (
                        <div className="p-2.5 rounded-lg bg-white dark:bg-surface-dark-card border border-surface-border dark:border-surface-dark-border text-xs">
                          <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 block">
                            Note from Seller ({currentMeetup.sellerName}):
                          </span>
                          <p className="text-ink-primary dark:text-gray-200 italic mt-0.5">
                            "{currentMeetup.sellerNotes}"
                          </p>
                        </div>
                      )}

                      {/* Action Buttons - Strictly tailored to authenticated user */}
                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        {canConfirmNow && currentMeetup.status !== 'COMPLETED' && (
                          <button
                            onClick={handleConfirmAgreement}
                            disabled={isSubmitting}
                            className={`flex-1 py-2.5 px-4 rounded-lg text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 ${
                              isSeller ? 'bg-purple-700 hover:bg-purple-800' : 'bg-brand hover:bg-brand-hover'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                            Confirm & Accept (as {isSeller ? 'Seller' : 'Buyer'})
                          </button>
                        )}

                        {isWaitingForOtherParty && currentMeetup.status !== 'MUTUALLY_AGREED' && currentMeetup.status !== 'COMPLETED' && (
                          <div className="flex-1 p-2 bg-amber-100/60 dark:bg-amber-950/40 rounded-lg border border-amber-300/50 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Waiting for {otherPartyName} ({otherPartyRole}) to review your proposed meetup.</span>
                          </div>
                        )}

                        {/* Suggest Different Hub/Time Button */}
                        {currentMeetup.status !== 'COMPLETED' && (
                          <button
                            onClick={() => {
                              setIsCountering(true);
                              setCounterHub(currentMeetup.hubLocation);
                              setCounterDate(currentMeetup.meetingDate);
                              setCounterTime(currentMeetup.timeSlot);
                            }}
                            disabled={isSubmitting}
                            className="py-2.5 px-4 rounded-lg bg-surface border border-surface-border dark:border-surface-dark-border hover:bg-gray-100 dark:hover:bg-gray-800 text-ink-primary dark:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                          >
                            <Repeat className="w-3.5 h-3.5 text-brand" />
                            Suggest Different Spot or Timing
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Counter Proposal Form */
                    <form
                      onSubmit={handleSendCounterProposal}
                      className="bg-surface-subtle dark:bg-surface-dark-subtle p-4 rounded-xl border border-brand/50 space-y-4 animate-fade-in"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-surface-border dark:border-surface-dark-border">
                        <h5 className="font-heading font-extrabold text-sm text-ink-primary dark:text-white flex items-center gap-2">
                          <Repeat className="w-4 h-4 text-brand" />
                          Propose Different Hub or Timing (as {isSeller ? 'Seller' : 'Buyer'})
                        </h5>
                        <button
                          type="button"
                          onClick={() => setIsCountering(false)}
                          className="text-xs text-ink-secondary hover:text-ink-primary"
                        >
                          Cancel
                        </button>
                      </div>

                      {/* 1. Hub Selection */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-ink-primary dark:text-white block">
                          Choose Meetup Hub:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {hubs.map((hub) => (
                            <div
                              key={hub.id}
                              onClick={() => setCounterHub(hub.name)}
                              className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                counterHub === hub.name
                                  ? 'border-brand bg-brand-light dark:bg-emerald-950 font-bold text-brand dark:text-emerald-300'
                                  : 'border-surface-border dark:border-surface-dark-border bg-white dark:bg-surface-dark-card hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                                <span className="truncate">{hub.name}</span>
                              </div>
                              <span className="text-[10px] text-ink-secondary dark:text-gray-400 block mt-0.5 truncate">
                                {hub.landmark}
                              </span>
                            </div>
                          ))}

                          {/* Custom spot option */}
                          <div
                            onClick={() => setCounterHub('custom')}
                            className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                              counterHub === 'custom'
                                ? 'border-brand bg-brand-light dark:bg-emerald-950 font-bold text-brand dark:text-emerald-300'
                                : 'border-surface-border dark:border-surface-dark-border bg-white dark:bg-surface-dark-card hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-brand" />
                              <span>+ Custom Campus Spot</span>
                            </div>
                          </div>
                        </div>

                        {counterHub === 'custom' && (
                          <input
                            type="text"
                            placeholder="e.g. Outside Textile Dept Lawn, LHC Block 2 Foyer..."
                            value={customHub}
                            onChange={(e) => setCustomHub(e.target.value)}
                            className="w-full mt-2 px-3 py-2 rounded-lg border border-surface-border dark:border-surface-dark-border text-xs bg-white dark:bg-surface-dark-card"
                            required
                          />
                        )}
                      </div>

                      {/* 2. Timing Selection */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-ink-primary dark:text-white block mb-1">
                            Proposed Day:
                          </label>
                          <select
                            value={counterDate}
                            onChange={(e) => setCounterDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-surface-border dark:border-surface-dark-border text-xs bg-white dark:bg-surface-dark-card font-medium"
                          >
                            <option value="Today">Today</option>
                            <option value="Tomorrow">Tomorrow</option>
                            <option value="In 2 Days">In 2 Days</option>
                            <option value="This Friday">This Friday</option>
                            <option value="This Weekend">This Weekend</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-ink-primary dark:text-white block mb-1">
                            Proposed Time Window:
                          </label>
                          <select
                            value={counterTime}
                            onChange={(e) => setCounterTime(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-surface-border dark:border-surface-dark-border text-xs bg-white dark:bg-surface-dark-card font-medium"
                          >
                            <option value="12:30 PM - 01:30 PM (Lunch Break)">12:30 PM - 01:30 PM (Lunch)</option>
                            <option value="04:30 PM - 05:30 PM (Post-Lectures)">04:30 PM - 05:30 PM (Post-Lectures)</option>
                            <option value="05:30 PM - 06:30 PM (Evening)">05:30 PM - 06:30 PM (Evening)</option>
                            <option value="07:00 PM - 08:00 PM (Hostel Hour)">07:00 PM - 08:00 PM (Hostel Hour)</option>
                          </select>
                        </div>
                      </div>

                      {/* Note to the other party */}
                      <div>
                        <label className="text-xs font-bold text-ink-primary dark:text-white block mb-1">
                          Message to {otherPartyRole} ({otherPartyName}):
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., I have tutorials till 5 PM, so 5:30 PM works much better for me."
                          value={counterNote}
                          onChange={(e) => setCounterNote(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-surface-border dark:border-surface-dark-border text-xs bg-white dark:bg-surface-dark-card"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsCountering(false)}
                          className="px-4 py-2 rounded-lg text-xs font-bold text-ink-secondary hover:text-ink-primary"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-5 py-2 rounded-lg bg-brand text-white font-bold text-xs uppercase tracking-wider hover:bg-brand-hover shadow-md transition-all flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {isSubmitting ? 'Sending Proposal...' : 'Send Counter Proposal'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Negotiation Timeline */}
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-heading font-bold text-ink-secondary uppercase tracking-wider block">
                      Negotiation History ({currentMeetup.history?.length || 0})
                    </span>

                    <div className="bg-surface-subtle dark:bg-surface-dark-subtle p-3 rounded-xl border border-surface-border dark:border-surface-dark-border divide-y divide-surface-border dark:divide-surface-dark-border">
                      {(currentMeetup.history || []).map((h) => (
                        <div key={h.id} className="py-2.5 first:pt-0 last:pb-0 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold text-ink-primary dark:text-white">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  h.action === 'CONFIRMED'
                                    ? 'bg-emerald-500'
                                    : h.action === 'COUNTERED'
                                    ? 'bg-amber-500'
                                    : 'bg-brand'
                                }`}
                              />
                              <span>{h.actorName}</span>
                              <span className="text-[10px] font-normal text-ink-secondary">
                                ({h.actor === 'BUYER' ? 'Buyer' : 'Seller'})
                              </span>
                            </div>
                            <span className="text-[10px] text-ink-muted">
                              {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="mt-1 pl-3.5 text-ink-secondary dark:text-gray-300">
                            <span className="font-semibold text-ink-primary dark:text-gray-200">
                              {h.action === 'CONFIRMED'
                                ? 'Confirmed meetup at: '
                                : h.action === 'COUNTERED'
                                ? 'Counter-proposed: '
                                : 'Initially proposed: '}
                            </span>
                            {h.hubLocation} on {h.meetingDate} ({h.timeSlot})
                            {h.note && (
                              <p className="text-[11px] italic text-ink-secondary dark:text-gray-400 mt-0.5">
                                "{h.note}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Direct Chat */}
              {activeTab === 'chat' && (
                <div className="space-y-4 animate-fade-in flex flex-col h-[520px]">
                  {/* Verified Student Contact Card */}
                  <div className="p-3.5 bg-brand-light/50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary block">
                          Verified Student Contact ({otherPartyRole})
                        </span>
                        <h4 className="font-heading font-extrabold text-sm text-ink-primary dark:text-white mt-0.5">
                          {otherPartyName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-ink-secondary dark:text-gray-300">
                          {otherPartyContact?.email && (
                            <a
                              href={`mailto:${otherPartyContact.email}`}
                              className="flex items-center gap-1 text-brand hover:underline font-medium"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              {otherPartyContact.email}
                            </a>
                          )}
                          {otherPartyContact?.phone && (
                            <a
                              href={`tel:${otherPartyContact.phone}`}
                              className="flex items-center gap-1 text-brand hover:underline font-medium"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              {otherPartyContact.phone}
                            </a>
                          )}
                          {otherPartyContact?.hostel && (
                            <span className="flex items-center gap-1 text-ink-secondary dark:text-gray-400">
                              <Home className="w-3.5 h-3.5" />
                              {otherPartyContact.hostel}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* WhatsApp Quick Action */}
                      {otherPartyContact?.phone && (
                        <a
                          href={`https://wa.me/${otherPartyContact.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(otherPartyName || '')},%20regarding%20the%20CampusCart%20item:%20${encodeURIComponent(currentMeetup.productTitle)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Chat on WhatsApp
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Chat Message Scroll Area */}
                  <div className="flex-1 overflow-y-auto p-3 bg-surface-subtle dark:bg-surface-dark-page rounded-xl border border-surface-border dark:border-surface-dark-border space-y-3">
                    {(!currentMeetup.messages || currentMeetup.messages.length === 0) ? (
                      <div className="py-12 text-center text-ink-secondary dark:text-gray-400">
                        <MessageSquare className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-xs font-semibold">No messages yet</p>
                        <p className="text-[11px] mt-1">
                          Say hi to {otherPartyName} or coordinate meetup timings.
                        </p>
                      </div>
                    ) : (
                      currentMeetup.messages.map((msg) => {
                        const isFromMe = msg.senderId === user?.id || (isSeller && msg.senderRole === 'SELLER') || (isBuyer && msg.senderRole === 'BUYER');

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isFromMe ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-ink-secondary dark:text-gray-400">
                              <span className="font-semibold text-ink-primary dark:text-gray-200">
                                {isFromMe ? `You (${isSeller ? 'Seller' : 'Buyer'})` : `${msg.senderName} (${msg.senderRole === 'BUYER' ? 'Buyer' : 'Seller'})`}
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                                isFromMe
                                  ? isSeller
                                    ? 'bg-purple-700 text-white rounded-br-xs'
                                    : 'bg-brand text-white rounded-br-xs'
                                  : 'bg-white dark:bg-surface-dark-card text-ink-primary dark:text-gray-100 border border-surface-border dark:border-surface-dark-border rounded-bl-xs'
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Quick Smart Replies Chips */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary block">
                      Quick Replies (as {isSeller ? 'Seller' : 'Buyer'}):
                    </span>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
                      {quickChatChips.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendChatMessage(undefined, chip)}
                          className="px-2.5 py-1 rounded-full bg-surface dark:bg-surface-dark-card border border-surface-border dark:border-surface-dark-border text-ink-secondary hover:text-brand dark:hover:text-emerald-300 hover:border-brand shrink-0 transition-colors"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chat Input Field */}
                  <form onSubmit={(e) => handleSendChatMessage(e)} className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder={`Type a private message to ${otherPartyName} as ${isSeller ? 'Seller' : 'Buyer'}...`}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 text-xs bg-white dark:bg-surface-dark-card border border-surface-border dark:border-surface-dark-border rounded-xl focus:outline-none focus:border-brand text-ink-primary dark:text-white shadow-2xs"
                    />
                    <button
                      type="submit"
                      disabled={isSendingChat || !chatInput.trim()}
                      className={`p-2.5 rounded-xl text-white font-bold disabled:opacity-50 shadow-md transition-all shrink-0 ${
                        isSeller ? 'bg-purple-700 hover:bg-purple-800' : 'bg-brand hover:bg-brand-hover'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
