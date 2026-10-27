import React from 'react';
import { Category } from '../types';
import {
  Compass,
  Calculator,
  PenTool,
  BookOpen,
  FlaskConical,
  Backpack,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';

interface ShopByCategoryProps {
  categories: Category[];
  onSelectCategory: (slug: string) => void;
}

const categoryVisuals: Record<string, { image: string; icon: any; tagline: string }> = {
  'engineering-drawing': {
    image: 'https://images.unsplash.com/photo-1581291518655-9523c93269c3?auto=format&fit=crop&w=600&q=80',
    icon: Compass,
    tagline: 'Mini drafters, T-squares, compass sets'
  },
  'calculators': {
    image: 'https://images.unsplash.com/photo-1611125832047-1d7ad1e8e485?auto=format&fit=crop&w=600&q=80',
    icon: Calculator,
    tagline: 'ClassWiz, fx-991CW, graphing'
  },
  'stationery': {
    image: 'https://images.unsplash.com/photo-1585336261026-77874983a54b?auto=format&fit=crop&w=600&q=80',
    icon: PenTool,
    tagline: 'Rotring isographs, technical scales'
  },
  'academic-books': {
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    icon: BookOpen,
    tagline: 'Engineering math, CS textbooks, GATE'
  },
  'lab-accessories': {
    image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=600&q=80',
    icon: FlaskConical,
    tagline: 'Cotton lab coats, vernier calipers'
  },
  'college-essentials': {
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
    icon: Backpack,
    tagline: 'Study lamps, laptop stands, dorm gear'
  },
  'other-approved-products': {
    image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
    icon: ShoppingBag,
    tagline: 'Verified bicycles, instruments, gear'
  }
};

export const ShopByCategory: React.FC<ShopByCategoryProps> = ({
  categories,
  onSelectCategory
}) => {
  return (
    <section className="my-10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-ink-primary dark:text-white">
            Shop by Category
          </h2>
          <p className="text-xs text-ink-secondary dark:text-gray-400 mt-0.5">
            Curated college equipment verified for official curriculum standards
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {categories.slice(0, 6).map((cat) => {
          const visual = categoryVisuals[cat.slug] || {
            image: 'https://images.unsplash.com/photo-1581291518655-9523c93269c3?auto=format&fit=crop&w=600&q=80',
            icon: ShoppingBag,
            tagline: cat.description
          };
          const IconComp = visual.icon;

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className="group relative rounded-xl overflow-hidden border border-surface-border dark:border-surface-dark-border bg-white dark:bg-surface-dark-card shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={visual.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 text-white flex items-center gap-1.5">
                  <div className="p-1 rounded bg-brand/90 backdrop-blur-xs text-white">
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-heading font-bold text-xs truncate">
                    {cat.name}
                  </span>
                </div>
              </div>

              <div className="p-2.5">
                <p className="text-[10px] text-ink-secondary dark:text-gray-400 line-clamp-1">
                  {visual.tagline}
                </p>
                <div className="mt-1 flex items-center text-[10px] font-bold text-brand dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                  Explore <ArrowRight className="w-2.5 h-2.5 ml-1" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
