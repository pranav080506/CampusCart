import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { Product, Category } from './types';
import { Header } from './components/Header';
import { CategoryNav } from './components/CategoryNav';
import { HeroBanner } from './components/HeroBanner';
import { ShopByCategory } from './components/ShopByCategory';
import { ProductGrid } from './components/ProductGrid';
import { ProductCard } from './components/ProductCard';
import { FilterSidebar } from './components/FilterSidebar';
import { ProductDetailModal } from './components/ProductDetailModal';
import { SellItemModal } from './components/SellItemModal';
import { AdminModerationDashboard } from './components/AdminModerationDashboard';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { HowItWorksSection } from './components/HowItWorksSection';
import { CollegeConfigModal } from './components/CollegeConfigModal';
import { MeetupCoordinationModal } from './components/MeetupCoordinationModal';
import { AccountDashboardModal } from './components/AccountDashboardModal';
import { AuthModal } from './components/AuthModal';
import { NavigationSidebar } from './components/NavigationSidebar';
import { useAuth } from './context/AuthContext';
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Tag,
  Clock,
  CheckCircle2,
  ChevronRight,
  Filter
} from 'lucide-react';

export const App: React.FC = () => {
  const { college } = useAuth();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [aiInspectedOnly, setAiInspectedOnly] = useState(false);
  const [collegeApprovedOnly, setCollegeApprovedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('recently_added');

  // Modals & Drawers
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isModerationOpen, setIsModerationOpen] = useState(false);
  const [isCollegeConfigOpen, setIsCollegeConfigOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMeetupModalOpen, setIsMeetupModalOpen] = useState(false);
  const [selectedMeetupId, setSelectedMeetupId] = useState<string | undefined>(undefined);
  const [activeMeetupCount, setActiveMeetupCount] = useState<number>(1);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState<'buyer' | 'seller'>('buyer');
  const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // URL Link Gateway Detection: e.g. /login, /signup, /?auth=login or /?auth=signup
  const [hasEntered, setHasEntered] = useState<boolean>(() => {
    const pathname = window.location.pathname.toLowerCase();
    if (pathname.includes('/login') || pathname.includes('/signup')) {
      return false; // Force open floating gateway for explicit auth route
    }
    const params = new URLSearchParams(window.location.search);
    const authParam = params.get('auth');
    if (authParam === 'login' || authParam === 'signup') {
      return false; // Force open floating gateway to requested page
    }
    return sessionStorage.getItem('glb_entered') === 'true';
  });

  const [authModalMode, setAuthModalMode] = useState<'signup' | 'login'>(() => {
    const pathname = window.location.pathname.toLowerCase();
    if (pathname.includes('/login')) return 'login';
    if (pathname.includes('/signup')) return 'signup';
    const params = new URLSearchParams(window.location.search);
    const authParam = params.get('auth');
    if (authParam === 'login') return 'login';
    return 'signup'; // Defaults to signup first as requested
  });

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await api.getCategories();
      if (res.success) {
        setCategories(res.categories);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  // Fetch Public Marketplace Products (Strictly Approved Only)
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await api.getProducts({
        categorySlug: selectedCategorySlug || undefined,
        condition: selectedCondition || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        aiInspectedOnly,
        collegeApprovedOnly,
        search: searchQuery || undefined,
        sortBy
      });

      if (res.success) {
        setProducts(res.products);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [
    selectedCategorySlug,
    selectedCondition,
    minPrice,
    maxPrice,
    aiInspectedOnly,
    collegeApprovedOnly,
    searchQuery,
    sortBy,
    college?.id
  ]);

  const handleResetFilters = () => {
    setSelectedCategorySlug('');
    setSelectedCondition('');
    setMinPrice('');
    setMaxPrice('');
    setAiInspectedOnly(false);
    setCollegeApprovedOnly(false);
    setSearchQuery('');
    setSortBy('recently_added');
  };

  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const handleOpenMeetupCoordination = (meetupId?: string) => {
    setSelectedMeetupId(meetupId);
    setIsMeetupModalOpen(true);
  };

  const handleOpenAccountModal = (tab: 'buyer' | 'seller' = 'buyer') => {
    setAccountModalTab(tab);
    setIsAccountModalOpen(true);
  };

  // Homepage Curated Slices (Using actual DB data, never fabricated!)
  const budgetFriendlyFinds = [...products].sort((a, b) => a.price - b.price).slice(0, 4);
  const verifiedPicks = products.filter(p => p.isCollegeApproved && p.isAiInspected).slice(0, 4);
  const trendingCampus = [...products].sort((a, b) => (b.viewsCount + b.wishlistCount * 2) - (a.viewsCount + a.wishlistCount * 2)).slice(0, 4);

  const hasActiveFilters = Boolean(
    selectedCategorySlug ||
    selectedCondition ||
    minPrice ||
    maxPrice ||
    aiInspectedOnly ||
    collegeApprovedOnly ||
    searchQuery
  );

  return (
    <div className="min-h-screen bg-surface-page dark:bg-surface-dark-page flex flex-col transition-colors">
      {/* 1. Premium AJIO-Inspired Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenSellModal={() => setIsSellModalOpen(true)}
        onOpenModeration={() => setIsModerationOpen(true)}
        onOpenCollegeConfig={() => setIsCollegeConfigOpen(true)}
        onOpenMeetupCoordination={() => handleOpenMeetupCoordination()}
        onOpenAccountModal={handleOpenAccountModal}
        onOpenAuthModal={(mode = 'signup') => {
          setAuthModalMode(mode);
          setHasEntered(false);
        }}
        onOpenSidebar={() => setIsNavSidebarOpen(true)}
        activeMeetupCount={activeMeetupCount}
      />

      {/* 2. Category Navigation */}
      <CategoryNav
        categories={categories}
        selectedCategorySlug={selectedCategorySlug}
        onSelectCategory={(slug) => {
          setSelectedCategorySlug(slug);
          window.scrollTo({ top: 380, behavior: 'smooth' });
        }}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-4">
        {/* If no search or category filter active, display Homepage Curations */}
        {!hasActiveFilters && (
          <>
            {/* Section 1: Hero Banner */}
            <HeroBanner
              onExplore={() => {
                const el = document.getElementById('marketplace-catalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onSell={() => setIsSellModalOpen(true)}
              onSignUp={() => {
                setAuthModalMode('signup');
                setHasEntered(false);
              }}
            />

            {/* Section 2: Shop by Category */}
            <ShopByCategory
              categories={categories}
              onSelectCategory={(slug) => {
                setSelectedCategorySlug(slug);
                const el = document.getElementById('marketplace-catalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Section 5: Verified Campus Picks */}
            {verifiedPicks.length > 0 && (
              <section className="my-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-brand dark:text-emerald-300">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-extrabold text-lg sm:text-xl text-ink-primary dark:text-white">
                        Verified Campus Picks
                      </h3>
                      <p className="text-xs text-ink-secondary dark:text-gray-400">
                        Approved by {college?.shortCode || 'GL Bajaj'} college administration with completed AI inspection
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {verifiedPicks.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      onQuickView={handleOpenProduct}
                      onClick={handleOpenProduct}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Section 4: Budget-Friendly Finds */}
            {budgetFriendlyFinds.length > 0 && (
              <section className="my-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-extrabold text-lg sm:text-xl text-ink-primary dark:text-white">
                        Budget-Friendly Finds
                      </h3>
                      <p className="text-xs text-ink-secondary dark:text-gray-400">
                        Top student deals sorted by lowest price first
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {budgetFriendlyFinds.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      onQuickView={handleOpenProduct}
                      onClick={handleOpenProduct}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Section 6: Trending on Campus (Based on Real Views & Wishlists) */}
            {trendingCampus.length > 0 && (
              <section className="my-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-extrabold text-lg sm:text-xl text-ink-primary dark:text-white">
                        Trending on Campus
                      </h3>
                      <p className="text-xs text-ink-secondary dark:text-gray-400">
                        Most viewed and saved items by fellow students
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {trendingCampus.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      onQuickView={handleOpenProduct}
                      onClick={handleOpenProduct}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Section 7: How CampusCart Works */}
            <HowItWorksSection />
          </>
        )}

        {/* Main Catalog & Filter View */}
        <div id="marketplace-catalog" className="pt-6">
          <div className="flex items-center justify-between pb-4 border-b border-surface-border dark:border-surface-dark-border mb-6">
            <div>
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-ink-primary dark:text-white">
                {selectedCategorySlug
                  ? categories.find(c => c.slug === selectedCategorySlug)?.name || 'Category Items'
                  : 'Marketplace Catalog'}
              </h2>
              <p className="text-xs text-ink-secondary dark:text-gray-400 mt-0.5">
                Showing {products.length} approved item{products.length === 1 ? '' : 's'} available at {college?.name}
              </p>
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="lg:hidden px-3.5 py-1.5 rounded-lg bg-white dark:bg-surface-dark-card border border-surface-border dark:border-surface-dark-border text-xs font-bold text-ink-primary dark:text-white flex items-center gap-1.5 shadow-xs"
            >
              <Filter className="w-3.5 h-3.5 text-brand" />
              Filters
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Desktop Filters */}
            <div className="hidden lg:block shrink-0">
              <FilterSidebar
                categories={categories}
                selectedCategorySlug={selectedCategorySlug}
                onSelectCategory={setSelectedCategorySlug}
                selectedCondition={selectedCondition}
                onSelectCondition={setSelectedCondition}
                minPrice={minPrice}
                setMinPrice={setMinPrice}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                aiInspectedOnly={aiInspectedOnly}
                setAiInspectedOnly={setAiInspectedOnly}
                collegeApprovedOnly={collegeApprovedOnly}
                setCollegeApprovedOnly={setCollegeApprovedOnly}
                sortBy={sortBy}
                setSortBy={setSortBy}
                onResetFilters={handleResetFilters}
              />
            </div>

            {/* Mobile Filters Drawer / Accordion */}
            {isMobileFilterOpen && (
              <div className="lg:hidden mb-4 animate-fade-in">
                <FilterSidebar
                  categories={categories}
                  selectedCategorySlug={selectedCategorySlug}
                  onSelectCategory={setSelectedCategorySlug}
                  selectedCondition={selectedCondition}
                  onSelectCondition={setSelectedCondition}
                  minPrice={minPrice}
                  setMinPrice={setMinPrice}
                  maxPrice={maxPrice}
                  setMaxPrice={setMaxPrice}
                  aiInspectedOnly={aiInspectedOnly}
                  setAiInspectedOnly={setAiInspectedOnly}
                  collegeApprovedOnly={collegeApprovedOnly}
                  setCollegeApprovedOnly={setCollegeApprovedOnly}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  onResetFilters={handleResetFilters}
                />
              </div>
            )}

            {/* Product Cards Grid */}
            <ProductGrid
              products={products}
              isLoading={isLoading}
              onQuickView={handleOpenProduct}
              onSelectProduct={handleOpenProduct}
              onResetFilters={handleResetFilters}
            />
          </div>
        </div>
      </main>

      {/* Footer - AJIO Inspired Clean Minimalist Design */}
      <footer className="mt-16 bg-white dark:bg-surface-dark-card border-t border-surface-border dark:border-surface-dark-border py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="font-heading font-extrabold text-xl text-ink-primary dark:text-white">
                CAMPUS<span className="text-brand">CART</span>
              </div>
              <p className="text-xs text-ink-secondary dark:text-gray-400 leading-relaxed">
                Premium, AI-enabled student shopping platform for verified college engineering instruments, books, and lab accessories.
              </p>
              <div className="text-[11px] font-bold text-brand bg-brand-light dark:bg-emerald-950 px-2 py-1 rounded inline-block">
                {college?.name}
              </div>
            </div>

            <div>
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-ink-primary dark:text-white mb-3">
                Core Categories
              </h4>
              <ul className="space-y-1.5 text-xs text-ink-secondary dark:text-gray-400">
                <li>Engineering Drawing Tools</li>
                <li>Scientific Calculators (fx-991CW)</li>
                <li>Technical Stationery & Rotring</li>
                <li>Academic Course Books</li>
                <li>Lab Apparel & Safety Wear</li>
              </ul>
            </div>

            <div>
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-ink-primary dark:text-white mb-3">
                Verification & Trust
              </h4>
              <ul className="space-y-1.5 text-xs text-ink-secondary dark:text-gray-400">
                <li>AI Surface Condition Analysis</li>
                <li>Mandatory College Moderator Review</li>
                <li>Protected Decision Audit Logs</li>
                <li>Verified Student Handover Spots</li>
              </ul>
            </div>

            <div>
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-ink-primary dark:text-white mb-3">
                Campus Handover Spots
              </h4>
              <p className="text-xs text-ink-secondary dark:text-gray-400 leading-relaxed">
                Designated safe exchange hubs: Student Activity Center (SAC), Main Central Library Gate, and Hostel Common Rooms. Zero commission.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-surface-border dark:border-surface-dark-border text-center text-xs text-ink-secondary dark:text-gray-500">
            © {new Date().getFullYear()} CampusCart Platform • Official Institutional Marketplace for {college?.name}
          </div>
        </div>
      </footer>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedProduct(null);
        }}
        onOpenMeetupCoordination={handleOpenMeetupCoordination}
      />

      {/* Sell an Item Modal */}
      <SellItemModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        categories={categories}
        onListingCreated={() => {
          fetchProducts();
        }}
      />

      {/* Admin Moderation Dashboard Modal */}
      <AdminModerationDashboard
        isOpen={isModerationOpen}
        onClose={() => setIsModerationOpen(false)}
        onListingUpdated={() => {
          fetchProducts();
        }}
      />

      {/* College Configuration Modal */}
      <CollegeConfigModal
        isOpen={isCollegeConfigOpen}
        onClose={() => setIsCollegeConfigOpen(false)}
      />

      {/* Cart Drawer */}
      <CartDrawer onOpenMeetupCoordination={handleOpenMeetupCoordination} />

      {/* Wishlist Drawer */}
      <WishlistDrawer onSelectProduct={handleOpenProduct} />

      {/* Campus Meetup Hub Coordination Modal (Manual Agreement by Both) */}
      <MeetupCoordinationModal
        isOpen={isMeetupModalOpen}
        onClose={() => setIsMeetupModalOpen(false)}
        initialMeetupId={selectedMeetupId}
      />

      {/* Private Student Account Dashboard (Buyer Orders vs Seller Studio) */}
      <AccountDashboardModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onOpenMeetupCoordination={handleOpenMeetupCoordination}
        onOpenSellModal={() => setIsSellModalOpen(true)}
        initialTab={accountModalTab}
      />

      {/* Floating Student Sign Up & Log In Modal / Gateway (No Cut Option when acting as Website Entrance Gateway) */}
      <AuthModal
        isOpen={!hasEntered || isAuthModalOpen}
        initialMode={authModalMode}
        isGateway={!hasEntered}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          sessionStorage.setItem('glb_entered', 'true');
          setHasEntered(true);
          setIsAuthModalOpen(false);
          // Clean up URL auth query param or /login /signup path if present without reloading
          if (window.location.search.includes('auth=') || window.location.pathname.includes('/login') || window.location.pathname.includes('/signup')) {
            window.history.replaceState({}, '', '/');
          }
          fetchProducts();
        }}
      />

      {/* Navigation Sidebar for Sell an Item, Meetups Hub, and Sign Up / Log In */}
      <NavigationSidebar
        isOpen={isNavSidebarOpen}
        onClose={() => setIsNavSidebarOpen(false)}
        onOpenSellModal={() => setIsSellModalOpen(true)}
        onOpenMeetupCoordination={() => handleOpenMeetupCoordination()}
        onOpenAuthModal={(mode = 'signup') => {
          setAuthModalMode(mode);
          setIsAuthModalOpen(true);
        }}
        onOpenAccountModal={handleOpenAccountModal}
        onOpenModeration={() => setIsModerationOpen(true)}
        activeMeetupCount={activeMeetupCount}
      />
    </div>
  );
};
