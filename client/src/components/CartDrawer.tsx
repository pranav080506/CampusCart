import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  Users
} from 'lucide-react';

interface CartDrawerProps {
  onOpenMeetupCoordination?: (meetupId?: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOpenMeetupCoordination }) => {
  const {
    cartItems,
    cartCount,
    cartSubtotal,
    isCartOpen,
    setIsCartOpen,
    updateCartItem,
    removeFromCart,
    checkout,
    isLoading
  } = useCart();

  const [checkoutResult, setCheckoutResult] = useState<any>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Manual Meetup Hub & Timing state decided by buyer and seller
  const [selectedHub, setSelectedHub] = useState('B.Tech Canteen');
  const [customHub, setCustomHub] = useState('');
  const [selectedDate, setSelectedDate] = useState('Tomorrow');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('05:00 PM - 05:30 PM');
  const [buyerNotes, setBuyerNotes] = useState('');

  const campusHubOptions = [
    { name: 'B.Tech Canteen', landmark: 'B.Tech Food Court & Indoor Cafeteria Hall' },
    { name: 'Stationery Shop', landmark: 'Campus Stationery & Photocopy Center' },
    { name: 'Near Gate No. 1', landmark: 'Main Security Gate No. 1 & Entrance Plaza' },
    { name: 'CTM Block', landmark: 'CTM Block (AI, AIML & DS Branches) Ground Floor Foyer' },
    { name: 'MBA Canteen', landmark: 'MBA Block Lawn & Shaded Canteen Tables' }
  ];

  if (!isCartOpen) return null;

  const handleCheckout = async () => {
    try {
      setIsCheckingOut(true);
      const hubLocation = selectedHub === 'custom' ? customHub : selectedHub;
      const res = await checkout({
        meetupHub: hubLocation,
        meetingDate: selectedDate,
        timeSlot: selectedTimeSlot,
        buyerNotes
      });
      setCheckoutResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white dark:bg-surface-dark-card shadow-2xl flex flex-col h-full animate-fade-in border-l border-surface-border dark:border-surface-dark-border">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-surface-border dark:border-surface-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand" />
            <span className="font-heading font-extrabold text-base text-ink-primary dark:text-white">
              Campus Cart ({cartCount})
            </span>
          </div>
          <button
            onClick={() => {
              setIsCartOpen(false);
              setCheckoutResult(null);
            }}
            className="p-1 rounded-full text-ink-secondary hover:text-ink-primary dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {checkoutResult ? (
            /* Order Placed Success Confirmation */
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-brand dark:text-emerald-300 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-heading font-extrabold text-xl text-ink-primary dark:text-white">
                Meetup Proposal Sent!
              </h3>
              <p className="text-xs text-ink-secondary dark:text-gray-300 max-w-sm mx-auto">
                Handover hub & timing must be mutually confirmed by both parties before the exchange.
              </p>

              <div className="bg-surface-subtle dark:bg-surface-dark-page p-4 rounded-xl border border-surface-border dark:border-surface-dark-border text-left text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Order Reference:</span>
                  <span className="font-mono font-bold text-ink-primary dark:text-white">{checkoutResult.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Amount Payable on Handover:</span>
                  <span className="font-bold text-brand dark:text-emerald-400">
                    ₹{checkoutResult.totalAmount?.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="pt-2 border-t border-surface-border dark:border-surface-dark-border space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary">
                    Proposed Meetup Hub
                  </span>
                  <span className="font-semibold text-ink-primary dark:text-gray-200 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand" />
                    {checkoutResult.meetupLocation}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary block">
                      Proposed Timing
                    </span>
                    <span className="font-medium text-ink-primary dark:text-gray-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-brand" />
                      {checkoutResult.meetingDate} • {checkoutResult.timeSlot}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full">
                    Awaiting Seller Agreement
                  </span>
                </div>
              </div>

              {/* Coordination Action Button */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    if (onOpenMeetupCoordination) {
                      onOpenMeetupCoordination(checkoutResult.meetup?.id);
                    }
                  }}
                  className="w-full py-3 rounded-lg bg-brand text-white font-bold text-xs uppercase tracking-wider hover:bg-brand-hover shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Open Meetup Coordination Workspace
                </button>

                <button
                  onClick={() => {
                    setCheckoutResult(null);
                    setIsCartOpen(false);
                  }}
                  className="w-full py-2 text-xs font-semibold text-ink-secondary hover:text-ink-primary"
                >
                  Back to Marketplace
                </button>
              </div>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="py-16 text-center text-ink-secondary">
              <ShoppingBag className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <h4 className="font-heading font-bold text-sm text-ink-primary dark:text-white">Your Cart is Empty</h4>
              <p className="text-xs text-ink-secondary mt-1">Explore verified drafters, books, and calculators.</p>
            </div>
          ) : (
            <>
              {/* Cart Items List */}
              <div className="space-y-3">
                <span className="text-xs font-heading font-bold text-ink-secondary dark:text-gray-400 uppercase tracking-wider block">
                  Items to Purchase ({cartItems.length})
                </span>
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 bg-surface-subtle dark:bg-surface-dark-page rounded-xl border border-surface-border dark:border-surface-dark-border"
                  >
                    <img
                      src={item.product?.images[0]}
                      alt={item.product?.title}
                      className="w-16 h-16 rounded-lg object-cover bg-white shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-heading font-bold text-xs text-ink-primary dark:text-white truncate">
                          {item.product?.title}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {item.agreedPrice !== undefined ? (
                            <>
                              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                                ₹{item.agreedPrice.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] text-ink-secondary line-through">
                                ₹{(item.product?.price || 0).toLocaleString('en-IN')}
                              </span>
                              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 flex items-center gap-0.5">
                                🤝 Bargain Deal
                              </span>
                            </>
                          ) : (
                            <span className="text-xs font-bold text-ink-primary dark:text-white">
                              ₹{(item.product?.price || 0).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-surface-border dark:border-surface-dark-border rounded bg-white dark:bg-surface-dark-card text-xs">
                          <button
                            onClick={() => updateCartItem(item.id, item.quantity - 1)}
                            className="px-2 py-0.5 text-ink-secondary hover:text-ink-primary"
                          >
                            -
                          </button>
                          <span className="px-2 font-bold text-ink-primary dark:text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateCartItem(item.id, item.quantity + 1)}
                            className="px-2 py-0.5 text-ink-secondary hover:text-ink-primary"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mutual Handover Coordination Form (Decided Manually by Both) */}
              <div className="p-4 rounded-xl border border-brand/40 bg-brand-light/30 dark:bg-emerald-950/20 space-y-4">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-heading font-extrabold text-sm text-ink-primary dark:text-white">
                      Decide Meetup Hub & Timing
                    </h5>
                    <p className="text-[11px] text-ink-secondary dark:text-gray-400">
                      Mutual agreement required: propose your preferred campus spot & time slot for the seller to confirm.
                    </p>
                  </div>
                </div>

                {/* 1. Hub Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink-primary dark:text-white block">
                    Select Campus Meetup Hub:
                  </label>
                  <select
                    value={selectedHub}
                    onChange={(e) => setSelectedHub(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-surface-border dark:border-surface-dark-border text-xs bg-white dark:bg-surface-dark-card font-medium"
                  >
                    {campusHubOptions.map((h, idx) => (
                      <option key={idx} value={h.name}>
                        {h.name} ({h.landmark})
                      </option>
                    ))}
                    <option value="custom">+ Propose Custom Campus Location...</option>
                  </select>

                  {selectedHub === 'custom' && (
                    <input
                      type="text"
                      placeholder="e.g. LHC Atrium, outside Room 101, Textile Lawn..."
                      value={customHub}
                      onChange={(e) => setCustomHub(e.target.value)}
                      className="w-full mt-1.5 px-3 py-2 rounded-lg border border-surface-border dark:border-surface-dark-border text-xs bg-white dark:bg-surface-dark-card"
                    />
                  )}
                </div>

                {/* 2. Timing Selection */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-ink-primary dark:text-white block mb-1">
                      Preferred Day:
                    </label>
                    <select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-surface-border dark:border-surface-dark-border text-xs bg-white dark:bg-surface-dark-card font-medium"
                    >
                      <option value="Today">Today</option>
                      <option value="Tomorrow">Tomorrow</option>
                      <option value="In 2 Days">In 2 Days</option>
                      <option value="This Friday">This Friday</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-ink-primary dark:text-white block mb-1">
                      Time Slot:
                    </label>
                    <select
                      value={selectedTimeSlot}
                      onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-surface-border dark:border-surface-dark-border text-xs bg-white dark:bg-surface-dark-card font-medium"
                    >
                      <option value="12:30 PM - 01:30 PM (Lunch Break)">12:30 - 1:30 PM (Lunch)</option>
                      <option value="04:30 PM - 05:30 PM (Post-Lectures)">4:30 - 5:30 PM (Classes End)</option>
                      <option value="05:30 PM - 06:30 PM (Evening)">5:30 - 6:30 PM (Evening)</option>
                      <option value="07:00 PM - 08:00 PM (Hostel Hour)">7:00 - 8:00 PM (Hostel)</option>
                    </select>
                  </div>
                </div>

                {/* 3. Note for Seller */}
                <div>
                  <label className="text-xs font-bold text-ink-primary dark:text-white block mb-1">
                    Note for Seller (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. I have a tutorial till 4 PM, can meet right outside SAC."
                    value={buyerNotes}
                    onChange={(e) => setBuyerNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-surface-border dark:border-surface-dark-border text-xs bg-white dark:bg-surface-dark-card"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        {!checkoutResult && cartItems.length > 0 && (
          <div className="p-5 border-t border-surface-border dark:border-surface-dark-border bg-surface-subtle dark:bg-surface-dark-page space-y-3">
            <div className="flex items-center justify-between text-xs text-ink-secondary dark:text-gray-400">
              <span>Campus Handover Delivery</span>
              <span className="font-bold text-brand dark:text-emerald-400 uppercase">FREE (In-Person Hub)</span>
            </div>
            <div className="flex items-center justify-between text-base font-heading font-extrabold text-ink-primary dark:text-white pt-2 border-t border-surface-border dark:border-surface-dark-border">
              <span>Total Payable on Meetup</span>
              <span>₹{cartSubtotal.toLocaleString('en-IN')}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full py-3 rounded-lg bg-brand text-white font-bold text-xs uppercase tracking-wider hover:bg-brand-hover active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {isCheckingOut ? 'Scheduling Campus Handover...' : 'Propose Meetup & Place Order'}
            </button>
            <p className="text-[10px] text-center text-ink-secondary dark:text-gray-400">
              Zero upfront payments. Pay directly on campus once you inspect the item in person.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
