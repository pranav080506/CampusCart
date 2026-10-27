import React from 'react';
import { Upload, Sparkles, ShieldCheck, ShoppingBag, ArrowRight } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Upload Photographs',
      desc: 'Snap clear photos of your college equipment. The server validates formats, resolution, and security.',
      icon: Upload
    },
    {
      num: '02',
      title: 'AI Verification',
      desc: 'Vision models analyze category consistency, surface scratches, blurriness, and policy compliance.',
      icon: Sparkles
    },
    {
      num: '03',
      title: 'College Approval',
      desc: 'Authorized campus administrators audit each listing before granting institutional publication approval.',
      icon: ShieldCheck
    },
    {
      num: '04',
      title: 'Safe Campus Buy',
      desc: 'Students connect directly for in-person handovers at SAC, hostel gates, or library with zero shipping fees.',
      icon: ShoppingBag
    }
  ];

  return (
    <section className="my-14 bg-white dark:bg-surface-dark-card border border-surface-border dark:border-surface-dark-border rounded-2xl p-6 sm:p-10 shadow-card">
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="text-[11px] font-bold text-brand uppercase tracking-widest bg-brand-light dark:bg-emerald-950 px-2.5 py-1 rounded-full">
          Institutional Trust Architecture
        </span>
        <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-ink-primary dark:text-white mt-2">
          How CampusCart Works
        </h2>
        <p className="text-xs sm:text-sm text-ink-secondary dark:text-gray-400 mt-1">
          A 4-step institutional publication workflow that guarantees student authenticity and prevents spam.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((st, i) => {
          const IconComp = st.icon;
          return (
            <div key={i} className="relative flex flex-col p-5 rounded-xl bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border group hover:border-brand transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="font-heading font-extrabold text-2xl text-brand/30 dark:text-emerald-500/20">
                  {st.num}
                </span>
                <div className="w-10 h-10 rounded-lg bg-brand-light dark:bg-emerald-950 text-brand dark:text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <IconComp className="w-5 h-5" />
                </div>
              </div>

              <h4 className="font-heading font-bold text-sm sm:text-base text-ink-primary dark:text-white mb-1.5">
                {st.title}
              </h4>
              <p className="text-xs text-ink-secondary dark:text-gray-400 leading-relaxed">
                {st.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
