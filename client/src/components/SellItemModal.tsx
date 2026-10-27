import React, { useState } from 'react';
import { Category, ProductCondition } from '../types';
import { api } from '../services/api';
import {
  X,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  RefreshCw,
  Camera,
  Image as ImageIcon,
  MapPin,
  Clock
} from 'lucide-react';

interface SellItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onListingCreated: () => void;
}

export const SellItemModal: React.FC<SellItemModalProps> = ({
  isOpen,
  onClose,
  categories,
  onListingCreated
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1581291518655-9523c93269c3?auto=format&fit=crop&w=800&q=80'
  ]);
  const [sellerDeclaredCondition, setSellerDeclaredCondition] = useState<ProductCondition>('GOOD');
  const [aiSuggestedCondition, setAiSuggestedCondition] = useState<ProductCondition | null>(null);
  const [isConditionAccepted, setIsConditionAccepted] = useState(false);
  const [preferredMeetupHubs, setPreferredMeetupHubs] = useState<string[]>([
    'B.Tech Canteen',
    'Stationery Shop'
  ]);
  const [availableTimings, setAvailableTimings] = useState('Weekdays after 4:00 PM, or lunch hour');
  const [isInspecting, setIsInspecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Run AI Inspection on draft
  const handleRunAiInspection = async () => {
    if (!title || images.length === 0) {
      setErrorMsg('Please enter a title and ensure at least one photograph is attached before AI inspection.');
      return;
    }

    try {
      setIsInspecting(true);
      setErrorMsg('');
      const res = await api.inspectDraft({
        title,
        description,
        categoryId: categoryId || categories[0]?.id,
        sellerDeclaredCondition,
        images
      });

      if (res.success && res.assessment) {
        setAssessmentResult(res.assessment);
        setAiSuggestedCondition(res.assessment.suggestedCondition);
        setIsConditionAccepted(false);
      }
    } catch (err: any) {
      setErrorMsg('AI inspection encountered a delay. You may still proceed with submission.');
    } finally {
      setIsInspecting(false);
    }
  };

  // Upload Photo File
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Photograph exceeds 5MB size limit. Please upload an optimized image.');
      return;
    }

    try {
      setIsInspecting(true);
      setErrorMsg('');
      const uploadRes = await api.uploadImage(file);
      if (uploadRes.success) {
        setImages(prev => [uploadRes.imageUrl, ...prev]);

        // Auto trigger AI draft assessment
        const res = await api.inspectDraft({
          title: title || file.name,
          description,
          categoryId: categoryId || categories[0]?.id,
          sellerDeclaredCondition,
          images: [uploadRes.imageUrl]
        });

        if (res.success && res.assessment) {
          setAssessmentResult(res.assessment);
          setAiSuggestedCondition(res.assessment.suggestedCondition);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload photo');
    } finally {
      setIsInspecting(false);
    }
  };

  // Submit Listing to Publication Pipeline
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price) {
      setErrorMsg('Please fill in title and price.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await api.createProduct({
        title,
        description,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        categoryId: categoryId || categories[0]?.id,
        sellerDeclaredCondition,
        images,
        preferredMeetupHubs,
        availableTimings
      });

      if (res.success && res.product) {
        setSuccessMsg(
          res.product.status === 'APPROVED'
            ? 'Listing Approved and Published!'
            : 'Listing submitted! Passed AI checks and entered College Approval Queue.'
        );
        setTimeout(() => {
          onListingCreated();
          onClose();
        }, 1500);
      } else {
        setErrorMsg(res.error || 'Failed to create listing');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-surface-dark-card w-full max-w-2xl rounded-2xl shadow-2xl border border-surface-border dark:border-surface-dark-border overflow-hidden animate-fade-in my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-border dark:border-surface-dark-border flex items-center justify-between bg-surface-subtle dark:bg-surface-dark-page">
          <div>
            <h2 className="font-heading font-bold text-lg text-ink-primary dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand" />
              Sell an Item on CampusCart
            </h2>
            <p className="text-xs text-ink-secondary dark:text-gray-400">
              AI-assisted condition inspection & mandatory college approval workflow
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-ink-secondary hover:text-ink-primary dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Photograph Upload & Evidence Inspection */}
          <div>
            <label className="block text-xs font-bold text-ink-primary dark:text-gray-200 uppercase tracking-wider mb-1.5">
              Product Photographs (Required for AI Inspection)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-lg border border-surface-border dark:border-surface-dark-border overflow-hidden bg-gray-50 dark:bg-gray-900 group">
                  <img src={img} alt="Product" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 text-[9px] bg-black/70 text-white px-1 rounded font-medium">
                    {i === 0 ? 'Primary' : `#${i + 1}`}
                  </span>
                </div>
              ))}

              <label className="border-2 border-dashed border-surface-border dark:border-surface-dark-border hover:border-brand dark:hover:border-emerald-500 rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer text-ink-secondary hover:text-brand transition-colors p-2 text-center bg-surface-subtle dark:bg-surface-dark-page">
                <UploadCloud className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-semibold">Upload Photo</span>
                <span className="text-[9px] text-ink-secondary">JPEG, PNG &lt; 5MB</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink-primary dark:text-gray-200 uppercase tracking-wider mb-1">
                Product Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Omega Mini Drafter ME101"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleRunAiInspection}
                className="w-full px-3.5 py-2 text-sm bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border rounded-lg focus:outline-none focus:border-brand text-ink-primary dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-primary dark:text-gray-200 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setTimeout(handleRunAiInspection, 100);
                }}
                className="w-full px-3.5 py-2 text-sm bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border rounded-lg focus:outline-none focus:border-brand text-ink-primary dark:text-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing in INR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink-primary dark:text-gray-200 uppercase tracking-wider mb-1">
                Selling Price (₹ INR) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-ink-secondary">₹</span>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="550"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2 text-sm bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border rounded-lg focus:outline-none focus:border-brand text-ink-primary dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-primary dark:text-gray-200 uppercase tracking-wider mb-1">
                Original Price (₹ Optional)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-ink-secondary">₹</span>
                <input
                  type="number"
                  min="0"
                  placeholder="1200"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2 text-sm bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border rounded-lg focus:outline-none focus:border-brand text-ink-primary dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-ink-primary dark:text-gray-200 uppercase tracking-wider mb-1">
              Description & Visible Details *
            </label>
            <textarea
              required
              rows={3}
              placeholder="State syllabus/course code, semester used, battery state, visible surface condition, or included accessories..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border rounded-lg focus:outline-none focus:border-brand text-ink-primary dark:text-white"
            />
          </div>

          {/* Section 3: AI Product Condition Assessment & Seller Interaction Card */}
          <div className="p-4 bg-brand-light/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand dark:text-emerald-400" />
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-brand dark:text-emerald-300">
                  AI-Assisted Condition Assessment
                </span>
              </div>
              <button
                type="button"
                onClick={handleRunAiInspection}
                disabled={isInspecting}
                className="text-[11px] font-semibold text-brand dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isInspecting ? 'animate-spin' : ''}`} />
                {isInspecting ? 'Analyzing...' : 'Re-run Analysis'}
              </button>
            </div>

            {aiSuggestedCondition ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-white dark:bg-surface-dark-card p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div>
                    <span className="text-xs text-ink-secondary dark:text-gray-400">AI-Suggested Condition:</span>
                    <span className="ml-2 font-heading font-extrabold text-sm text-brand dark:text-emerald-300">
                      {aiSuggestedCondition}
                    </span>
                  </div>

                  {/* Seller Interaction Buttons as mandated by Section 3 */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSellerDeclaredCondition(aiSuggestedCondition);
                        setIsConditionAccepted(true);
                      }}
                      className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                        sellerDeclaredCondition === aiSuggestedCondition
                          ? 'bg-brand text-white shadow-xs'
                          : 'bg-emerald-100 dark:bg-emerald-900 text-brand dark:text-emerald-200 hover:bg-emerald-200'
                      }`}
                    >
                      Accept Suggestion
                    </button>
                  </div>
                </div>

                {/* Visible Observations & Photo Requests */}
                {assessmentResult?.visibleIssues && (
                  <div className="text-xs text-ink-secondary dark:text-gray-300 space-y-1">
                    <span className="font-semibold text-ink-primary dark:text-white">Observations:</span>
                    <ul className="list-disc list-inside">
                      {assessmentResult.visibleIssues.map((v: string, idx: number) => (
                        <li key={idx}>{v}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Specific Category Close-up photo request */}
                <div className="text-[11px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 p-2 rounded text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                  <Camera className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    <strong>Verification tip:</strong> Ensure close-up photographs of hinge joints, LCD segments, or textbook spine are clear to expedite college admin approval.
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-ink-secondary dark:text-gray-400">
                Upload a photograph to trigger instant AI condition appraisal and verify category consistency.
              </p>
            )}

            {/* Seller Declared Condition Selection */}
            <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
              <label className="block text-xs font-bold text-ink-primary dark:text-gray-200 mb-1">
                Final Seller-Declared Condition:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'] as ProductCondition[]).map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setSellerDeclaredCondition(cond)}
                    className={`py-1.5 text-xs font-bold rounded border transition-all ${
                      sellerDeclaredCondition === cond
                        ? 'bg-ink-primary dark:bg-white text-white dark:text-ink-primary border-ink-primary dark:border-white shadow-xs'
                        : 'bg-white dark:bg-surface-dark-card border-surface-border dark:border-surface-dark-border text-ink-primary dark:text-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-ink-secondary dark:text-gray-400 mt-1">
                Both your declared condition and the AI-suggested condition will be stored for transparent college moderation.
              </p>
            </div>
          </div>

          {/* Handover Coordination: Seller's Preferred Meetup Hubs & Available Hours */}
          <div className="p-4 bg-surface-subtle dark:bg-surface-dark-page rounded-xl border border-surface-border dark:border-surface-dark-border space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand" />
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-ink-primary dark:text-white">
                Seller's Handover Preferences (Decided Manually by Both)
              </span>
            </div>
            <p className="text-[11px] text-ink-secondary dark:text-gray-400">
              CampusCart handovers take place in person. Buyers will coordinate with you to confirm the exact hub and time before the exchange.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-ink-primary dark:text-gray-200">
                Preferred Campus Meetup Spot(s):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'B.Tech Canteen',
                  'Stationery Shop',
                  'Near Gate No. 1',
                  'CTM Block',
                  'MBA Canteen'
                ].map((hubName) => {
                  const isChecked = preferredMeetupHubs.includes(hubName);
                  return (
                    <button
                      key={hubName}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setPreferredMeetupHubs(preferredMeetupHubs.filter((h) => h !== hubName));
                        } else {
                          setPreferredMeetupHubs([...preferredMeetupHubs, hubName]);
                        }
                      }}
                      className={`p-2 rounded-lg text-left text-xs border transition-all flex items-center justify-between ${
                        isChecked
                          ? 'border-brand bg-brand-light dark:bg-emerald-950 font-bold text-brand dark:text-emerald-300'
                          : 'border-surface-border dark:border-surface-dark-border bg-white dark:bg-surface-dark-card text-ink-secondary'
                      }`}
                    >
                      <span className="truncate">{hubName.split('(')[0]}</span>
                      <span className="text-[10px]">{isChecked ? '✓' : '+'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-primary dark:text-gray-200 mb-1">
                Your Available Timings / Days:
              </label>
              <input
                type="text"
                placeholder="e.g. Weekdays 4:30 PM - 7:00 PM, or between lectures"
                value={availableTimings}
                onChange={(e) => setAvailableTimings(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-surface-dark-card border border-surface-border dark:border-surface-dark-border rounded-lg text-ink-primary dark:text-white"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border dark:border-surface-dark-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-ink-secondary hover:text-ink-primary dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg bg-brand text-white font-bold text-xs uppercase tracking-wider hover:bg-brand-hover active:scale-95 transition-all shadow-md flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Verifying & Submitting...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Submit for College Verification
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
