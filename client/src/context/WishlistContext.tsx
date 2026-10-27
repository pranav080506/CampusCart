import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { api } from '../services/api';

interface WishlistContextType {
  wishlistItems: Product[];
  wishlistCount: number;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  toggleWishlist: (productId: string) => Promise<boolean>;
  isInWishlist: (productId: string) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);

  const refreshWishlist = async () => {
    try {
      const res = await api.getWishlist();
      if (res.success) {
        setWishlistItems(res.items);
      }
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    }
  };

  useEffect(() => {
    refreshWishlist();
  }, []);

  const toggleWishlist = async (productId: string): Promise<boolean> => {
    try {
      const res = await api.toggleWishlist(productId);
      if (res.success) {
        await refreshWishlist();
        return res.inWishlist;
      }
      return false;
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
      return false;
    }
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlistItems.some(item => item.id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount: wishlistItems.length,
        isWishlistOpen,
        setIsWishlistOpen,
        toggleWishlist,
        isInWishlist,
        refreshWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
