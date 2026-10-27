import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';
import { api } from '../services/api';

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateCartItem: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  checkout: (payload?: {
    meetupHub?: string;
    hubLandmark?: string;
    meetingDate?: string;
    timeSlot?: string;
    buyerNotes?: string;
  }) => Promise<any>;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState<number>(0);
  const [cartSubtotal, setCartSubtotal] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshCart = async () => {
    try {
      const res = await api.getCart();
      if (res.success) {
        setCartItems(res.items);
        setCartCount(res.itemCount);
        setCartSubtotal(res.subtotal);
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const addToCart = async (productId: string, quantity: number = 1) => {
    try {
      setIsLoading(true);
      const res = await api.addToCart(productId, quantity);
      if (res.success) {
        setCartItems(res.items);
        setCartCount(res.itemCount);
        setCartSubtotal(res.subtotal);
        setIsCartOpen(true); // Open drawer on addition
      }
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCartItem = async (cartItemId: string, quantity: number) => {
    try {
      const res = await api.updateCartItem(cartItemId, quantity);
      if (res.success) {
        setCartItems(res.items);
        setCartCount(res.itemCount);
        setCartSubtotal(res.subtotal);
      }
    } catch (err) {
      console.error('Failed to update cart:', err);
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      const res = await api.removeFromCart(cartItemId);
      if (res.success) {
        setCartItems(res.items);
        setCartCount(res.itemCount);
        setCartSubtotal(res.subtotal);
      }
    } catch (err) {
      console.error('Failed to remove from cart:', err);
    }
  };

  const checkout = async (payload?: {
    meetupHub?: string;
    hubLandmark?: string;
    meetingDate?: string;
    timeSlot?: string;
    buyerNotes?: string;
  }) => {
    try {
      const res = await api.checkout(payload);
      if (res.success) {
        setCartItems([]);
        setCartCount(0);
        setCartSubtotal(0);
      }
      return res;
    } catch (err) {
      console.error('Checkout failed:', err);
      throw err;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartSubtotal,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateCartItem,
        removeFromCart,
        checkout,
        isLoading
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
