import React from 'react';
import {
  X,
  PlusCircle,
  MapPin,
  GraduationCap,
  ShieldCheck,
  ShoppingBag,
  Package,
  Sparkles,
  School,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  ExternalLink,
  Clock,
  Layers,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavigationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSellModal: () => void;
  onOpenMeetupCoordination: () => void;
  onOpenAuthModal: (mode?: 'signup' | 'login') => void;
  onOpenAccountModal?: (tab?: 'buyer' | 'seller') => void;
  onOpenModeration?: () => void;
  activeMeetupCount?: number;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  isOpen,
  onClose,
  onOpenSellModal,
  onOpenMeetupCoordination,
  onOpenAuthModal,
  onOpenAccountModal,
  onOpenModeration,
  activeMeetupCount = 1
}) => {
  const { user, college, logout, isDarkMode, toggleDarkMode } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-out Sidebar Panel */}
      <div className="absolute inset-y-0 left-0 max-w-full flex">
        <div className="w-screen max-w-sm sm:max-w-md bg-white dark:bg-surface-dark-card shadow-2xl border-r border-surface-border dark:border-surface-dark-border flex flex-col justify-between overflow-y-auto transform transition-transform duration-300 ease-in-out">
          
          {/* Top Section: Header & Student Context */}
          <div>
            {/* Header Glow Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600" />

            <div className="p-5 border-b border-surface-border dark:border-surface-dark-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center font-bold shadow-sm">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-heading font-extrabold text-base text-ink-primary dark:text-white">
                      CampusCart
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      GLBITM
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-secondary dark:text-gray-400">
                    {college?.name || 'G.L. Bajaj Institute of Tech & Mgmt'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg text-ink-secondary hover:text-ink-primary dark:hover:text-white hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle transition-colors"
                title="Close Navigation Sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Authenticated Student Profile Card */}
            {user && (
              <div className="p-4 mx-4 mt-4 rounded-xl bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                      {user.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-ink-primary dark:text-white">
                        {user.fullName}
                      </div>
                      <div className="text-[10px] text-ink-secondary dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {user.role === 'COLLEGE_ADMIN' ? 'Admin' : 'Verified'}
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-surface-border dark:border-surface-dark-border flex items-center justify-between text-[10px] text-ink-secondary dark:text-gray-400">
                  <span>Dept: <strong>{user.department || 'AI, AIML & DS'}</strong></span>
                  <span>ID: <strong>{user.studentId || '2022CS10214'}</strong></span>
                </div>
              </div>
            )}

            {/* --- PRIMARY 3 ACTIONS REQUESTED: Sell an Item, Meetup, Sign Up/Login --- */}
            <div className="p-4 space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary dark:text-gray-400 px-1">
                Main Campus Actions
              </div>

              {/* 1. SELL AN ITEM */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSellModal();
                }}
                className="w-full p-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white text-left shadow-md hover:shadow-lg transition-all flex items-center justify-between group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-heading font-extrabold text-sm leading-tight flex items-center gap-1.5">
                      <span>Sell an Item</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/25 text-white">
                        AI Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-100/90 mt-0.5 leading-snug">
                      List calculators, drafters, books, or lab coats
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-200 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* 2. CAMPUS MEETUPS & HANDOVERS */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMeetupCoordination();
                }}
                className="w-full p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/70 text-left transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-ink-primary dark:text-white flex items-center gap-1.5">
                      <span>Campus Meetup Hubs</span>
                      {activeMeetupCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">
                          {activeMeetupCount}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ink-secondary dark:text-gray-400 mt-0.5">
                      B.Tech Canteen, Stationery Shop, CTM Block, etc.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-secondary group-hover:text-brand group-hover:translate-x-1 transition-transform" />
              </button>

              {/* 3. SEPARATE SIGN UP & LOG IN BUTTONS */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuthModal('signup');
                  }}
                  className="p-3 rounded-xl border border-surface-border dark:border-surface-dark-border bg-white dark:bg-surface-dark-card hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 text-left transition-all group shadow-2xs"
                  title="Open Floating Sign Up Page"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-ink-primary dark:text-white">Sign Up</span>
                  </div>
                  <p className="text-[10px] text-ink-secondary dark:text-gray-400 leading-tight">
                    New GLBITM registration
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuthModal('login');
                  }}
                  className="p-3 rounded-xl border border-surface-border dark:border-surface-dark-border bg-white dark:bg-surface-dark-card hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 text-left transition-all group shadow-2xs"
                  title="Open Floating Login Page"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-ink-primary dark:text-white">Log In</span>
                  </div>
                  <p className="text-[10px] text-ink-secondary dark:text-gray-400 leading-tight">
                    Sign in with credentials
                  </p>
                </button>
              </div>
            </div>

            {/* --- Secondary Student Portals --- */}
            <div className="p-4 pt-1 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary dark:text-gray-400 px-1 mb-2">
                Student Account Portals
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAccountModal?.('buyer');
                }}
                className="w-full p-2.5 rounded-lg hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle text-left text-xs font-semibold text-ink-primary dark:text-gray-200 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  <span>My Buyer Orders & Pickup Passes</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-ink-secondary" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAccountModal?.('seller');
                }}
                className="w-full p-2.5 rounded-lg hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle text-left text-xs font-semibold text-ink-primary dark:text-gray-200 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>My Seller Studio & Handover Codes</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-ink-secondary" />
              </button>

              {user?.role === 'COLLEGE_ADMIN' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenModeration?.();
                  }}
                  className="w-full p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-left text-xs font-bold text-brand dark:text-emerald-300 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-brand" />
                    <span>AI Moderation Queue (Admin)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-brand" />
                </button>
              )}
            </div>

            {/* Campus Meetup Hubs Mini Reference */}
            <div className="px-4 py-3 mx-4 rounded-xl bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border text-[11px]">
              <span className="font-bold text-ink-primary dark:text-white block mb-1">
                📍 5 Official GLBITM Meetup Hubs:
              </span>
              <ul className="space-y-1 text-ink-secondary dark:text-gray-400">
                <li>• B.Tech Canteen (Indoor Cafeteria)</li>
                <li>• Stationery Shop & Photocopy Center</li>
                <li>• Near Gate No. 1 (24/7 Security)</li>
                <li>• CTM Block (AI, AIML & DS Branches)</li>
                <li>• MBA Canteen (Management Block)</li>
              </ul>
            </div>
          </div>

          {/* Bottom Section: Theme & Logout */}
          <div className="p-4 border-t border-surface-border dark:border-surface-dark-border space-y-2 bg-surface-subtle/50 dark:bg-surface-dark-page/50">
            {/* Supabase Cloud Connection Indicator */}
            <div className="px-3 py-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-emerald-800 dark:text-emerald-300">Supabase Cloud</span>
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-medium">Storage Active</span>
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="w-full p-2 rounded-lg border border-surface-border dark:border-surface-dark-border bg-white dark:bg-surface-dark-card text-left text-xs font-semibold text-ink-primary dark:text-gray-200 flex items-center justify-between hover:border-brand transition-all"
            >
              <div className="flex items-center gap-2">
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                <span>{isDarkMode ? 'Light Campus Mode' : 'Dark Campus Mode'}</span>
              </div>
              <span className="text-[10px] text-ink-secondary dark:text-gray-400">Toggle</span>
            </button>

            {/* Logout / Switch */}
            <button
              type="button"
              onClick={() => {
                logout();
                sessionStorage.removeItem('glb_entered');
                onClose();
                onOpenAuthModal('signup');
              }}
              className="w-full p-2 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-left flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out & Lock Gateway</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
