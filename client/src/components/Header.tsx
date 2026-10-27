import React, { useState } from 'react';
import {
  ShoppingBag,
  Heart,
  Search,
  PlusCircle,
  ShieldCheck,
  Moon,
  Sun,
  UserCheck,
  ChevronDown,
  Bell,
  Settings,
  Sparkles,
  CheckCircle2,
  MapPin,
  GraduationCap,
  KeyRound,
  UserPlus,
  LogOut,
  Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenSellModal: () => void;
  onOpenModeration: () => void;
  onOpenCollegeConfig: () => void;
  onOpenMeetupCoordination?: () => void;
  onOpenAccountModal?: (tab?: 'buyer' | 'seller') => void;
  onOpenAuthModal?: (mode?: 'signup' | 'login') => void;
  onOpenSidebar?: () => void;
  activeMeetupCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenSellModal,
  onOpenModeration,
  onOpenCollegeConfig,
  onOpenMeetupCoordination,
  onOpenAccountModal,
  onOpenAuthModal,
  onOpenSidebar,
  activeMeetupCount = 1
}) => {
  const { user, college, availableUsers, switchUser, logout, isDarkMode, toggleDarkMode } = useAuth();
  const { cartCount, setIsCartOpen } = useCart();
  const { wishlistCount, setIsWishlistOpen } = useWishlist();

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const notifications = [
    { id: 1, title: 'AI Verification Completed', text: 'Mini Drafter Set was reviewed by AI and sent to college queue.', time: '10m ago' },
    { id: 2, title: 'College Approval Granted', text: 'Casio fx-991CW was approved by College Admin.', time: '1h ago' },
    { id: 3, title: 'Campus Handover Scheduled', text: 'Buyer accepted meetup at Student Activity Center.', time: '3h ago' }
  ];

  const isSellerAccount = user?.id === 'usr-student-2';

  return (
    <header className="sticky top-0 z-40 bg-surface dark:bg-surface-dark-card border-b border-surface-border dark:border-surface-dark-border transition-colors">
      {/* Top Banner: College Verification Indicator */}
      <div className="bg-brand-light dark:bg-emerald-950/60 border-b border-emerald-100 dark:border-emerald-900/40 text-xs px-4 py-1.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-brand animate-pulse"></span>
            <span className="font-semibold text-brand dark:text-emerald-300">
              {college?.name || 'G.L. Bajaj Institute of Technology and Management'}
            </span>
            <span className="hidden sm:inline text-ink-secondary dark:text-gray-400">
              • Official Student Marketplace
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-white dark:bg-emerald-900 text-brand dark:text-emerald-200 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3 h-3 text-brand dark:text-emerald-400" />
              Verified Campus
            </span>
          </div>

          <div className="flex items-center gap-4 text-ink-secondary dark:text-gray-300">
            {user?.role === 'COLLEGE_ADMIN' ? (
              <button
                onClick={onOpenCollegeConfig}
                className="hover:text-brand dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
                title="Configure college settings"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Admin Settings</span>
              </button>
            ) : null}

            <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
              Zero Commission • Direct Student Handovers
            </span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3 gap-4">
          {/* Logo & Marketplace Identity + Sidebar Menu Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onOpenSidebar}
              className="p-2 sm:px-3 rounded-xl bg-surface-subtle dark:bg-surface-dark-page hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-ink-primary dark:text-white hover:text-brand dark:hover:text-emerald-400 border border-surface-border dark:border-surface-dark-border hover:border-emerald-300 dark:hover:border-emerald-800 transition-all flex items-center gap-1.5 shadow-2xs group"
              title="Open Navigation Menu (Sell, Meetups, Sign Up)"
              aria-label="Open Sidebar Menu"
            >
              <Menu className="w-5 h-5 text-brand group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold hidden sm:inline">Menu</span>
            </button>

            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-10 h-10 rounded-lg bg-brand flex items-center justify-center text-white shadow-sm group-hover:bg-brand-hover transition-colors">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-extrabold text-2xl tracking-tight text-ink-primary dark:text-white leading-none">
                  CAMPUS<span className="text-brand dark:text-emerald-400">CART</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-ink-secondary dark:text-gray-400 mt-0.5">
                  Verified College Marketplace
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-ink-secondary dark:text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search calculators, drafters, engineering books, lab coats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border rounded-full focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-ink-primary dark:text-gray-100 placeholder-ink-secondary dark:placeholder-gray-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-ink-secondary hover:text-ink-primary dark:hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Action Navigation */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Moderation Dashboard Button (For Admins) */}
            {user?.role === 'COLLEGE_ADMIN' && (
              <button
                onClick={onOpenModeration}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-emerald-100 dark:bg-emerald-950 text-brand dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-200 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Moderation Queue</span>
                <span className="lg:hidden">Admin</span>
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-ink-secondary dark:text-gray-300 hover:text-ink-primary dark:hover:text-white rounded-full hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle transition-colors"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setIsNotifOpen(!isNotifOpen); setIsAccountOpen(false); }}
                className="p-2 text-ink-secondary dark:text-gray-300 hover:text-ink-primary dark:hover:text-white rounded-full hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle relative transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full ring-2 ring-white dark:ring-surface-dark-card" />
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-surface-dark-card rounded-lg shadow-dropdown border border-surface-border dark:border-surface-border dark:border-surface-dark-border py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-surface-border dark:border-surface-dark-border flex items-center justify-between">
                    <span className="font-semibold text-xs uppercase tracking-wider text-ink-primary dark:text-white">Campus Notifications</span>
                    <span className="text-[10px] text-brand font-medium">3 unread</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-surface-border dark:divide-surface-dark-border">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-3 hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle transition-colors">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-ink-primary dark:text-white">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand" />
                          {n.title}
                        </div>
                        <p className="text-[11px] text-ink-secondary dark:text-gray-400 mt-0.5">{n.text}</p>
                        <span className="text-[10px] text-ink-muted mt-1 block">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dedicated Private Account Badge Button (Buyer vs Seller) */}
            <button
              onClick={() => onOpenAccountModal?.(isSellerAccount ? 'seller' : 'buyer')}
              className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all ${
                isSellerAccount
                  ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800 hover:bg-purple-200'
                  : 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800 hover:bg-blue-200'
              }`}
              title="Open Private Account Dashboard"
            >
              <span className="text-xs">{isSellerAccount ? '💼' : '🎓'}</span>
              <span className="hidden sm:inline">
                {isSellerAccount ? 'Seller Studio' : 'Buyer Orders'}
              </span>
            </button>

            {/* Wishlist Icon */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="p-2 text-ink-secondary dark:text-gray-300 hover:text-ink-primary dark:hover:text-white rounded-full hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle relative transition-colors"
              title="Saved Items"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Icon */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2 text-ink-secondary dark:text-gray-300 hover:text-ink-primary dark:hover:text-white rounded-full hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle relative transition-colors"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Account / Persona Menu */}
            <div className="relative">
              <button
                onClick={() => { setIsAccountOpen(!isAccountOpen); setIsNotifOpen(false); }}
                className="flex items-center gap-1.5 pl-2 py-1 pr-1 rounded-full border border-surface-border dark:border-surface-dark-border hover:border-brand dark:hover:border-emerald-500 transition-colors"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isSellerAccount
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                    : 'bg-brand-light text-brand dark:bg-emerald-950 dark:text-emerald-300'
                }`}>
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-semibold text-ink-primary dark:text-white leading-tight">
                    {user?.fullName?.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-ink-secondary dark:text-gray-400 leading-tight">
                    {user?.role === 'COLLEGE_ADMIN' ? 'College Admin' : isSellerAccount ? 'Seller Account' : 'Buyer Account'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-ink-secondary dark:text-gray-400" />
              </button>

              {isAccountOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-surface-dark-card rounded-lg shadow-dropdown border border-surface-border dark:border-surface-dark-border py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-surface-border dark:border-surface-dark-border">
                    <p className="text-xs text-ink-secondary dark:text-gray-400">Signed in to</p>
                    <p className="text-sm font-bold text-ink-primary dark:text-white">{user?.fullName}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                        isSellerAccount
                          ? 'text-purple-800 bg-purple-100 dark:bg-purple-950 dark:text-purple-300'
                          : 'text-brand bg-brand-light dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {user?.role === 'COLLEGE_ADMIN'
                          ? 'Authorized College Admin'
                          : isSellerAccount
                          ? 'Verified Student Seller'
                          : 'Verified Student Buyer'}
                      </span>
                    </div>
                  </div>

                  {/* Private Portals Direct Access */}
                  <div className="py-1 border-b border-surface-border dark:border-surface-dark-border">
                    <button
                      onClick={() => {
                        setIsAccountOpen(false);
                        onOpenAccountModal?.('buyer');
                      }}
                      className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle transition-colors text-ink-primary dark:text-gray-200"
                    >
                      <ShoppingBag className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-semibold">My Buyer Orders & Passes</div>
                        <div className="text-[10px] text-ink-secondary dark:text-gray-400">Private pickup codes & scheduled meetups</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsAccountOpen(false);
                        onOpenAccountModal?.('seller');
                      }}
                      className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle transition-colors text-ink-primary dark:text-gray-200"
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <div>
                        <div className="font-semibold">My Seller Studio & Handovers</div>
                        <div className="text-[10px] text-ink-secondary dark:text-gray-400">Incoming buyer orders & code verification</div>
                      </div>
                    </button>
                  </div>

                  <div className="py-1">
                    <div className="px-4 py-1 text-[11px] font-semibold uppercase text-ink-secondary dark:text-gray-400">
                      Switch Student / Admin Persona
                    </div>
                    {availableUsers.map((u) => {
                      const isRohan = u.id === 'usr-student-1';
                      const isAnanya = u.id === 'usr-student-2';

                      return (
                        <button
                          key={u.id}
                          onClick={() => { switchUser(u.id); setIsAccountOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle transition-colors ${
                            user?.id === u.id ? 'font-bold text-brand dark:text-emerald-400' : 'text-ink-primary dark:text-gray-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>{isRohan ? '🎓' : isAnanya ? '💼' : '🛡️'}</span>
                              <span>{u.fullName}</span>
                            </div>
                            <div className="text-[10px] text-ink-secondary dark:text-gray-400">
                              {isRohan ? 'Buyer Account (Mechanical Eng)' : isAnanya ? 'Seller Account (Computer Science)' : 'College Admin Persona'}
                            </div>
                          </div>
                          {user?.id === u.id && <UserCheck className="w-4 h-4 text-brand" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Create Account & Login */}
                  <div className="py-1 border-b border-surface-border dark:border-surface-dark-border">
                    <button
                      onClick={() => {
                        setIsAccountOpen(false);
                        onOpenAuthModal?.('signup');
                      }}
                      className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle transition-colors text-emerald-600 dark:text-emerald-400 font-semibold"
                    >
                      <UserPlus className="w-4 h-4" />
                      <div>
                        <div>Create Student Account (Sign Up)</div>
                        <div className="text-[10px] text-ink-secondary dark:text-gray-400 font-normal">Requires @glbitm.ac.in email</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsAccountOpen(false);
                        onOpenAuthModal?.('login');
                      }}
                      className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle transition-colors text-ink-primary dark:text-gray-200"
                    >
                      <KeyRound className="w-4 h-4 text-brand" />
                      <div>
                        <div className="font-semibold">Log In with College Email</div>
                        <div className="text-[10px] text-ink-secondary dark:text-gray-400 font-normal">Access your saved listings & orders</div>
                      </div>
                    </button>
                  </div>

                  {user?.role === 'COLLEGE_ADMIN' && (
                    <div className="border-t border-surface-border dark:border-surface-dark-border pt-1">
                      <button
                        onClick={() => { onOpenModeration(); setIsAccountOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-brand dark:text-emerald-400 hover:bg-brand-light dark:hover:bg-emerald-950 transition-colors flex items-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4" />
                        AI Moderation Dashboard
                      </button>
                    </div>
                  )}

                  {/* Log Out Option */}
                  <div className="border-t border-surface-border dark:border-surface-dark-border pt-1">
                    <button
                      onClick={() => {
                        logout();
                        sessionStorage.removeItem('glb_entered');
                        setIsAccountOpen(false);
                        onOpenAuthModal?.('signup');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out & Lock Gate</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-secondary" />
            <input
              type="text"
              placeholder="Search calculators, books, lab coats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border rounded-full focus:outline-none focus:border-brand text-ink-primary dark:text-gray-100"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
