import React from 'react';
import { AIVerificationResult, Product } from '../types';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  HelpCircle,
  FileCheck,
  Camera,
  Layers
} from 'lucide-react';

interface VerificationExplainablePanelProps {
  product: Product;
}

export const VerificationExplainablePanel: React.FC<VerificationExplainablePanelProps> = ({
  product
}) => {
  const result = product.verificationResult;

  // Format understandable labels
  const getCategoryLabel = () => {
    if (!result) return 'Not Evaluated';
    return result.categoryMatch ? 'Looks Consistent' : 'Potential Mismatch';
  };

  const getImageQualityLabel = () => {
    if (!result) return 'Not Evaluated';
    if (result.imageQuality === 'high' || result.imageQuality === 'acceptable') return 'Good';
    if (result.imageQuality === 'blurry') return 'Blurry / Motion Detected';
    if (result.imageQuality === 'insufficient_lighting') return 'Insufficient Lighting';
    return 'More Evidence Needed';
  };

  const getDescriptionLabel = () => {
    if (!result) return 'Not Evaluated';
    if (result.descriptionConsistency === 'likely_consistent') return 'Likely Consistent';
    if (result.descriptionConsistency === 'inconsistent') return 'Potential Discrepancy';
    return 'More Evidence Needed';
  };

  const getConditionLabel = () => {
    if (!result) return product.sellerDeclaredCondition;
    return `${result.suggestedCondition} (AI Assessed)`;
  };

  const getRestrictedLabel = () => {
    if (!result) return 'Screened';
    return result.restrictedContentDetected ? 'Potential Policy Concern Flagged' : 'No Issue Detected';
  };

  const getCollegeApprovalLabel = () => {
    if (product.isCollegeApproved) return 'Approved by College Administration';
    if (product.status === 'PENDING_COLLEGE_REVIEW') return 'Pending College Review';
    if (product.status === 'AI_FLAGGED') return 'Flagged for Moderator Review';
    if (product.status === 'NEEDS_MORE_INFORMATION') return 'More Information Requested';
    return 'Under Evaluation';
  };

  return (
    <div className="bg-surface-subtle dark:bg-surface-dark-page rounded-xl border border-surface-border dark:border-surface-dark-border p-4 sm:p-5 text-sm">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-surface-border dark:border-surface-dark-border pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm text-ink-primary dark:text-white">
              AI-Assisted Inspection & Institutional Verification
            </h4>
            <p className="text-[11px] text-ink-secondary dark:text-gray-400">
              Explainable multi-point check performed prior to college moderator review
            </p>
          </div>
        </div>

        {/* Calibrated Confidence Metric (Documented) */}
        {result && (
          <div className="text-right">
            <div className="text-[10px] uppercase font-semibold text-ink-secondary dark:text-gray-400">Calibrated Confidence</div>
            <div className="font-heading font-bold text-sm text-brand dark:text-emerald-400">
              {Math.round(result.confidence * 100)}%
            </div>
          </div>
        )}
      </div>

      {/* Grid of Separate Verification Checks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
        {/* Category Match */}
        <div className="p-2.5 rounded-lg bg-white dark:bg-surface-dark-card border border-surface-border dark:border-surface-dark-border flex items-start gap-2.5">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-[11px] text-ink-secondary dark:text-gray-400 block">Category Match:</span>
            <span className="font-semibold text-ink-primary dark:text-gray-200">
              {getCategoryLabel()}
            </span>
            {result && !result.categoryMatch && (
              <span className="text-[10px] text-amber-600 block mt-0.5">Predicted: {result.predictedCategory}</span>
            )}
          </div>
        </div>

        {/* Image Quality */}
        <div className="p-2.5 rounded-lg bg-white dark:bg-surface-dark-card border border-surface-border dark:border-surface-dark-border flex items-start gap-2.5">
          <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-[11px] text-ink-secondary dark:text-gray-400 block">Image Quality:</span>
            <span className="font-semibold text-ink-primary dark:text-gray-200">
              {getImageQualityLabel()}
            </span>
          </div>
        </div>

        {/* Description Match */}
        <div className="p-2.5 rounded-lg bg-white dark:bg-surface-dark-card border border-surface-border dark:border-surface-dark-border flex items-start gap-2.5">
          <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-[11px] text-ink-secondary dark:text-gray-400 block">Description Match:</span>
            <span className="font-semibold text-ink-primary dark:text-gray-200">
              {getDescriptionLabel()}
            </span>
          </div>
        </div>

        {/* Visible Condition */}
        <div className="p-2.5 rounded-lg bg-white dark:bg-surface-dark-card border border-surface-border dark:border-surface-dark-border flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-[11px] text-ink-secondary dark:text-gray-400 block">Visible Condition:</span>
            <span className="font-semibold text-ink-primary dark:text-gray-200">
              {getConditionLabel()}
            </span>
          </div>
        </div>

        {/* Restricted Content */}
        <div className="p-2.5 rounded-lg bg-white dark:bg-surface-dark-card border border-surface-border dark:border-surface-dark-border flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-brand dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-[11px] text-ink-secondary dark:text-gray-400 block">Restricted Content:</span>
            <span className="font-semibold text-ink-primary dark:text-gray-200">
              {getRestrictedLabel()}
            </span>
          </div>
        </div>

        {/* College Approval Status */}
        <div className="p-2.5 rounded-lg bg-white dark:bg-surface-dark-card border border-surface-border dark:border-surface-dark-border flex items-start gap-2.5">
          <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${product.isCollegeApproved ? 'text-emerald-600' : 'text-amber-500'}`} />
          <div>
            <span className="text-[11px] text-ink-secondary dark:text-gray-400 block">College Approval:</span>
            <span className="font-semibold text-ink-primary dark:text-gray-200">
              {getCollegeApprovalLabel()}
            </span>
          </div>
        </div>
      </div>

      {/* Visible Observations / Issues */}
      {result && result.visibleIssues.length > 0 && (
        <div className="mb-3 p-3 bg-white dark:bg-surface-dark-card rounded-lg border border-surface-border dark:border-surface-dark-border text-xs">
          <div className="font-semibold text-ink-primary dark:text-white mb-1.5 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            Visible Surface Observations:
          </div>
          <ul className="list-disc list-inside space-y-1 text-ink-secondary dark:text-gray-300">
            {result.visibleIssues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Institutional Distinct Verification Badges */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-border dark:border-surface-dark-border">
        {product.isAiInspected && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Sparkles className="w-3.5 h-3.5" />
            AI Inspected
          </span>
        )}

        {product.isCollegeApproved && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950 text-brand dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            College Approved
          </span>
        )}

        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-brand" />
          Seller Identity Verified
        </span>
      </div>

      {/* Mandatory Regulatory Disclaimer */}
      <div className="mt-3 text-[11px] text-ink-secondary dark:text-gray-400 bg-amber-50/60 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-900/30 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <strong>Notice:</strong> AI visual inspection assists with category consistency and surface condition checking. It does not certify internal electronic circuits, battery health, or brand OEM authenticity. Physical verification occurs during the safe on-campus handover.
        </p>
      </div>
    </div>
  );
};
