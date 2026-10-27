import React from 'react';
import { ArrowRight, PlusCircle, ShieldCheck, Sparkles, CheckCircle, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeroBannerProps {
  onExplore: () => void;
  onSell: () => void;
  onSignUp?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onExplore, onSell, onSignUp }) => {
  const { college } = useAuth();

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-850 to-brand text-white my-4 mx-4 sm:mx-6 lg:mx-8 rounded-2xl shadow-xl">
      {/* Decorative campus background grid */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-10 sm:py-14 sm:px-10 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left Column: Headlines & Actions */}
        <div className="max-w-2xl text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-600/50 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            AI-Assisted Verification • {college?.shortCode || 'GL Bajaj'} Campus
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-heading leading-tight sm:leading-none text-white">
            Your Campus. Your Marketplace.
          </h1>

          <p className="mt-3 text-base sm:text-lg text-emerald-100/90 font-normal max-w-xl">
            Buy smarter. Sell what you no longer need.
          </p>

          <p className="text-xs text-emerald-200/75 mt-1 font-medium">
            Pre-owned technical drafters, ClassWiz calculators, verified textbooks, and lab gear from fellow students.
          </p>

          {/* Buttons: Explore Products & Sell an Item & Sign Up */}
          <div className="mt-6 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <button
              onClick={onExplore}
              className="px-6 py-3 rounded-lg bg-white text-ink-primary font-bold text-sm hover:bg-gray-100 active:scale-95 transition-all shadow-md flex items-center gap-2 group"
            >
              Explore Products
              <ArrowRight className="w-4 h-4 text-brand group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={onSell}
              className="px-6 py-3 rounded-lg bg-emerald-950/70 border border-emerald-400/40 text-white font-semibold text-sm hover:bg-emerald-900 active:scale-95 transition-all flex items-center gap-2 backdrop-blur-sm"
            >
              <PlusCircle className="w-4 h-4 text-emerald-300" />
              Sell an Item
            </button>

            {onSignUp && (
              <button
                onClick={onSignUp}
                className="px-5 py-3 rounded-lg bg-emerald-800/80 hover:bg-emerald-700/80 border border-emerald-400/50 text-white font-semibold text-sm transition-all flex items-center gap-1.5 backdrop-blur-sm"
              >
                <span>Sign Up with @glbitm.ac.in</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Trust & Verification Card */}
        <div className="w-full md:w-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 text-left max-w-sm shadow-2xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-white text-brand flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-brand" />
            </div>
            <div>
              <div className="font-heading font-bold text-sm text-white">Institutional Guarantee</div>
              <div className="text-[11px] text-emerald-200">{college?.name || 'Verified Institution'}</div>
            </div>
          </div>

          <div className="space-y-2 text-xs text-emerald-50">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
              <span><strong>AI Condition Assessment:</strong> Analyzes visible scratches, clarity, and category matching.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
              <span><strong>Mandatory College Approval:</strong> Every listing is reviewed by administrators before going live.</span>
            </div>
            <div className="flex items-start gap-2">
              <Award className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
              <span><strong>In-Person Handover:</strong> Meet securely at campus spots with zero delivery costs.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
