import React, { useState, useEffect } from 'react';
import { Product, ModerationAuditLog, Category } from '../types';
import { api } from '../services/api';
import {
  X,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Camera,
  Layers,
  FileText,
  User,
  History,
  AlertOctagon,
  Eye,
  RefreshCw
} from 'lucide-react';
import { VerificationExplainablePanel } from './VerificationExplainablePanel';

interface AdminModerationDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onListingUpdated: () => void;
}

type TabType =
  | 'pending'
  | 'flagged'
  | 'mismatches'
  | 'low_quality'
  | 'condition_discrepancies'
  | 'approved'
  | 'audit';

export const AdminModerationDashboard: React.FC<AdminModerationDashboardProps> = ({
  isOpen,
  onClose,
  onListingUpdated
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [queueData, setQueueData] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [auditLogs, setAuditLogs] = useState<ModerationAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Moderation Action State
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED' | 'REQUESTED_INFO' | 'SUSPENDED' | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  const [actionError, setActionError] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const fetchQueue = async () => {
    try {
      setIsLoading(true);
      const res = await api.getModerationQueue();
      if (res.success) {
        setQueueData(res.queue);
        setAuditLogs(res.auditLogs || []);

        // Keep current selected product updated if open
        if (selectedProduct) {
          const updated = res.queue.allModerationItems.find((p: Product) => p.id === selectedProduct.id);
          if (updated) setSelectedProduct(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load moderation queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchQueue();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Action Execution
  const handleExecuteAction = async () => {
    if (!selectedProduct || !actionType) return;

    if (actionType !== 'APPROVED' && (!reasonInput || reasonInput.trim().length === 0)) {
      setActionError(`A documented reason is mandatory when executing action '${actionType}'.`);
      return;
    }

    try {
      setIsSubmittingAction(true);
      setActionError('');
      const res = await api.performModerationAction(selectedProduct.id, actionType, reasonInput);
      if (res.success) {
        setActionType(null);
        setReasonInput('');
        await fetchQueue();
        onListingUpdated();
      } else {
        setActionError(res.product?.rejectionReason || 'Action failed');
      }
    } catch (err: any) {
      setActionError(err.message || 'Moderation action execution failed');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Tab Filtering
  const getTabProducts = (): Product[] => {
    if (!queueData) return [];
    switch (activeTab) {
      case 'pending':
        return queueData.pendingCollegeApprovals;
      case 'flagged':
        return queueData.aiFlagged;
      case 'mismatches':
        return queueData.categoryMismatches;
      case 'low_quality':
        return queueData.lowQualityPhotos;
      case 'condition_discrepancies':
        return queueData.conditionDiscrepancies;
      case 'approved':
        return queueData.recentlyApproved;
      default:
        return queueData.pendingCollegeApprovals;
    }
  };

  const currentProducts = getTabProducts();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-white dark:bg-surface-dark-card w-full max-w-6xl rounded-2xl shadow-2xl border border-surface-border dark:border-surface-dark-border overflow-hidden animate-fade-in my-4 max-h-[95vh] flex flex-col">
        {/* Top Bar */}
        <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-lg text-white flex items-center gap-2">
                College Administration Moderation Dashboard
              </h2>
              <p className="text-xs text-emerald-300">
                AI assists the administrator. Only authorized college approval publishes listings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchQueue}
              className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 text-xs flex items-center gap-1 transition-colors"
              title="Refresh queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-emerald-300 hover:text-white hover:bg-emerald-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div className="bg-surface-subtle dark:bg-surface-dark-page border-b border-surface-border dark:border-surface-dark-border px-6 flex space-x-2 overflow-x-auto text-xs py-2 no-scrollbar">
          <button
            onClick={() => { setActiveTab('pending'); setSelectedProduct(null); }}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'pending'
                ? 'bg-brand text-white shadow-xs'
                : 'text-ink-secondary hover:text-ink-primary dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending College Review ({queueData?.pendingCollegeApprovals?.length || 0})
          </button>

          <button
            onClick={() => { setActiveTab('flagged'); setSelectedProduct(null); }}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'flagged'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-ink-secondary hover:text-ink-primary dark:hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            AI-Flagged ({queueData?.aiFlagged?.length || 0})
          </button>

          <button
            onClick={() => { setActiveTab('mismatches'); setSelectedProduct(null); }}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'mismatches'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-ink-secondary hover:text-ink-primary dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Category Mismatches ({queueData?.categoryMismatches?.length || 0})
          </button>

          <button
            onClick={() => { setActiveTab('low_quality'); setSelectedProduct(null); }}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'low_quality'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-ink-secondary hover:text-ink-primary dark:hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Low-Quality Photos ({queueData?.lowQualityPhotos?.length || 0})
          </button>

          <button
            onClick={() => { setActiveTab('condition_discrepancies'); setSelectedProduct(null); }}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'condition_discrepancies'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-ink-secondary hover:text-ink-primary dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Condition Discrepancies ({queueData?.conditionDiscrepancies?.length || 0})
          </button>

          <button
            onClick={() => { setActiveTab('approved'); setSelectedProduct(null); }}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'approved'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-ink-secondary hover:text-ink-primary dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved ({queueData?.recentlyApproved?.length || 0})
          </button>

          <button
            onClick={() => { setActiveTab('audit'); setSelectedProduct(null); }}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'audit'
                ? 'bg-gray-800 text-white shadow-xs'
                : 'text-ink-secondary hover:text-ink-primary dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Audit Logs ({auditLogs.length})
          </button>
        </div>

        {/* Dashboard Main Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Column: Queue Listing List */}
          <div className="w-full md:w-5/12 border-r border-surface-border dark:border-surface-dark-border overflow-y-auto p-4 space-y-3 max-h-[70vh]">
            {activeTab === 'audit' ? (
              <div className="space-y-3">
                <span className="text-xs font-bold text-ink-primary dark:text-gray-300 uppercase tracking-wider block">
                  Protected Decision Audit Trail
                </span>
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-white dark:bg-surface-dark-card rounded-xl border border-surface-border dark:border-surface-dark-border text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        log.action === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        log.action === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {log.action}
                      </span>
                      <span className="text-[10px] text-ink-secondary">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="font-semibold text-ink-primary dark:text-white">Admin: {log.adminName}</div>
                    <div className="text-ink-secondary dark:text-gray-400">
                      Product ID: <span className="font-mono">{log.productId}</span>
                    </div>
                    <div className="text-ink-secondary dark:text-gray-300 bg-surface-subtle dark:bg-surface-dark-page p-2 rounded text-[11px] mt-1">
                      Reason: {log.reason}
                    </div>
                  </div>
                ))}
              </div>
            ) : currentProducts.length === 0 ? (
              <div className="text-center py-12 text-ink-secondary">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-medium">All items cleared in this queue!</p>
              </div>
            ) : (
              currentProducts.map((prod) => {
                const isSelected = selectedProduct?.id === prod.id;
                return (
                  <div
                    key={prod.id}
                    onClick={() => setSelectedProduct(prod)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-brand bg-brand-light/40 dark:bg-emerald-950/40 shadow-xs'
                        : 'border-surface-border dark:border-surface-dark-border bg-white dark:bg-surface-dark-card hover:border-gray-400'
                    }`}
                  >
                    <div className="flex gap-3">
                      <img
                        src={prod.images[0]}
                        alt={prod.title}
                        className="w-14 h-14 rounded-lg object-cover bg-gray-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            prod.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            prod.status === 'AI_FLAGGED' ? 'bg-amber-100 text-amber-800' :
                            prod.status === 'NEEDS_MORE_INFORMATION' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {prod.status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-ink-secondary">₹{prod.price}</span>
                        </div>
                        <h4 className="font-heading font-semibold text-xs text-ink-primary dark:text-white truncate">
                          {prod.title}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] text-ink-secondary dark:text-gray-400 mt-1">
                          <span>Seller: {prod.sellerName?.split(' ')[0]}</span>
                          <span>Declared: <strong>{prod.sellerDeclaredCondition}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Detailed Product Inspection View */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[70vh]">
            {selectedProduct ? (
              <div className="space-y-4">
                {/* Product Overview Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-subtle dark:bg-surface-dark-page p-4 rounded-xl border border-surface-border dark:border-surface-dark-border">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedProduct.images[0]}
                      alt="Zoomed"
                      className="w-20 h-20 rounded-xl object-cover border border-surface-border shadow-xs"
                    />
                    <div>
                      <h3 className="font-heading font-bold text-base text-ink-primary dark:text-white">
                        {selectedProduct.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-secondary dark:text-gray-400 mt-1">
                        <span>Price: <strong>₹{selectedProduct.price}</strong></span>
                        <span>•</span>
                        <span>Seller: <strong>{selectedProduct.sellerName}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase font-bold text-ink-secondary">Current Status</span>
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-brand text-white">
                      {selectedProduct.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Condition Comparison Grid (Section 3 Requirement) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white dark:bg-surface-dark-card rounded-lg border border-surface-border dark:border-surface-dark-border text-xs">
                    <span className="text-[10px] uppercase text-ink-secondary font-bold block">Seller-Declared Condition</span>
                    <span className="font-heading font-bold text-sm text-ink-primary dark:text-white mt-1 block">
                      {selectedProduct.sellerDeclaredCondition}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-surface-dark-card rounded-lg border border-surface-border dark:border-surface-dark-border text-xs">
                    <span className="text-[10px] uppercase text-ink-secondary font-bold block">AI-Assessed Condition</span>
                    <span className="font-heading font-bold text-sm text-brand dark:text-emerald-400 mt-1 block">
                      {selectedProduct.aiSuggestedCondition || 'Good'}
                    </span>
                  </div>
                </div>

                {/* Explainable Verification Panel Component */}
                <VerificationExplainablePanel product={selectedProduct} />

                {/* Full Description */}
                <div className="p-4 bg-white dark:bg-surface-dark-card rounded-xl border border-surface-border dark:border-surface-dark-border text-xs">
                  <span className="font-bold uppercase text-ink-primary dark:text-white block mb-1">Seller Stated Details:</span>
                  <p className="text-ink-secondary dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {selectedProduct.description}
                  </p>
                </div>

                {/* Action Execution Tray (Requirement 6) */}
                <div className="p-4 bg-surface-subtle dark:bg-surface-dark-page rounded-xl border border-surface-border dark:border-surface-dark-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-xs uppercase tracking-wider text-ink-primary dark:text-white">
                      College Administrator Decision
                    </span>
                    <span className="text-[11px] text-ink-secondary">Mandatory reason required for rejections & suspensions</span>
                  </div>

                  {actionError && (
                    <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{actionError}</span>
                    </div>
                  )}

                  {/* Reason Text Input when non-approval action selected */}
                  {actionType && actionType !== 'APPROVED' && (
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="block text-xs font-bold text-ink-primary dark:text-gray-200">
                        Reason for {actionType.replace(/_/g, ' ')} (Audit Recorded) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Category mismatch detected; please list under appropriate category."
                        value={reasonInput}
                        onChange={(e) => setReasonInput(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-surface-dark-card border border-surface-border dark:border-surface-dark-border rounded-lg text-ink-primary dark:text-white focus:outline-none focus:border-brand"
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {actionType ? (
                      <div className="flex items-center gap-2 w-full">
                        <button
                          type="button"
                          onClick={handleExecuteAction}
                          disabled={isSubmittingAction}
                          className="flex-1 py-2 px-4 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand-hover shadow-sm"
                        >
                          {isSubmittingAction ? 'Recording Audit...' : `Confirm: ${actionType}`}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setActionType(null); setReasonInput(''); setActionError(''); }}
                          className="py-2 px-3 rounded-lg bg-gray-200 dark:bg-gray-800 text-ink-secondary text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setActionType('APPROVED');
                            setReasonInput('Approved after authorized college verification check.');
                          }}
                          className="py-2 px-4 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand-hover flex items-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve Listing
                        </button>

                        <button
                          type="button"
                          onClick={() => setActionType('REJECTED')}
                          className="py-2 px-3 rounded-lg bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs font-semibold hover:bg-red-200 flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject Listing
                        </button>

                        <button
                          type="button"
                          onClick={() => setActionType('REQUESTED_INFO')}
                          className="py-2 px-3 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold hover:bg-blue-200 flex items-center gap-1"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          Request More Info
                        </button>

                        <button
                          type="button"
                          onClick={() => setActionType('SUSPENDED')}
                          className="py-2 px-3 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-200 flex items-center gap-1"
                        >
                          <AlertOctagon className="w-3.5 h-3.5" />
                          Suspend
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-ink-secondary text-center">
                <Eye className="w-8 h-8 mb-2 opacity-50" />
                <h4 className="font-heading font-bold text-sm text-ink-primary dark:text-white">Select a listing to inspect</h4>
                <p className="text-xs text-ink-secondary mt-1">
                  View full image evidence, AI condition suggestions, and execute college publication actions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
