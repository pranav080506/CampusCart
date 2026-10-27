import { Product, Category, College, User, CartItem, ModerationAuditLog, AIVerificationResult, CampusMeetupHub, MeetupSession, ChatMessage } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
  // Products
  async getProducts(params?: {
    categorySlug?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    aiInspectedOnly?: boolean;
    collegeApprovedOnly?: boolean;
    search?: string;
    sortBy?: string;
  }): Promise<{ success: boolean; products: Product[]; totalCount: number; college: string }> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
    }
    const res = await fetch(`${BASE_URL}/products?${query.toString()}`);
    return res.json();
  },

  async getProductById(id: string): Promise<{ success: boolean; product: Product; auditLogs: ModerationAuditLog[] }> {
    const res = await fetch(`${BASE_URL}/products/${id}`);
    return res.json();
  },

  async createProduct(data: {
    title: string;
    description: string;
    price: number;
    originalPrice?: number;
    categoryId: string;
    sellerDeclaredCondition: string;
    images: string[];
    preferredMeetupHubs?: string[];
    availableTimings?: string;
  }): Promise<{ success: boolean; product?: Product; verification?: any; error?: string }> {
    const res = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Verification
  async uploadImage(file: File): Promise<{ success: boolean; imageUrl: string; fileInfo: any }> {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${BASE_URL}/verification/upload-image`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  async inspectDraft(data: {
    title: string;
    description: string;
    categoryId: string;
    sellerDeclaredCondition?: string;
    images: string[];
  }): Promise<{ success: boolean; assessment: any }> {
    const res = await fetch(`${BASE_URL}/verification/inspect-draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Moderation
  async getModerationQueue(): Promise<{
    success: boolean;
    college: string;
    counts: any;
    queue: {
      pendingCollegeApprovals: Product[];
      aiFlagged: Product[];
      categoryMismatches: Product[];
      lowQualityPhotos: Product[];
      conditionDiscrepancies: Product[];
      recentlyApproved: Product[];
      allModerationItems: Product[];
    };
    categories: Category[];
    auditLogs: ModerationAuditLog[];
  }> {
    const res = await fetch(`${BASE_URL}/moderation/queue`);
    return res.json();
  },

  async performModerationAction(productId: string, action: string, reason: string): Promise<{
    success: boolean;
    product: Product;
    auditLog: ModerationAuditLog;
  }> {
    const res = await fetch(`${BASE_URL}/moderation/${productId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason })
    });
    return res.json();
  },

  // Categories
  async getCategories(): Promise<{ success: boolean; categories: Category[] }> {
    const res = await fetch(`${BASE_URL}/categories`);
    return res.json();
  },

  // College
  async getCurrentCollege(): Promise<{ success: boolean; college: College }> {
    const res = await fetch(`${BASE_URL}/college/current`);
    return res.json();
  },

  async getAllColleges(): Promise<{ success: boolean; colleges: College[] }> {
    const res = await fetch(`${BASE_URL}/college/all`);
    return res.json();
  },

  async switchCollege(collegeId: string): Promise<{ success: boolean; college: College }> {
    const res = await fetch(`${BASE_URL}/college/switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collegeId })
    });
    return res.json();
  },

  async updateCollegeConfig(data: Partial<College>): Promise<{ success: boolean; college: College }> {
    const res = await fetch(`${BASE_URL}/college/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Cart
  async getCart(): Promise<{ success: boolean; items: CartItem[]; itemCount: number; subtotal: number }> {
    const res = await fetch(`${BASE_URL}/cart`);
    return res.json();
  },

  async addToCart(productId: string, quantity: number = 1): Promise<{ success: boolean; items: CartItem[]; itemCount: number; subtotal: number }> {
    const res = await fetch(`${BASE_URL}/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity })
    });
    return res.json();
  },

  async updateCartItem(cartItemId: string, quantity: number): Promise<{ success: boolean; items: CartItem[]; itemCount: number; subtotal: number }> {
    const res = await fetch(`${BASE_URL}/cart/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartItemId, quantity })
    });
    return res.json();
  },

  async removeFromCart(cartItemId: string): Promise<{ success: boolean; items: CartItem[]; itemCount: number; subtotal: number }> {
    const res = await fetch(`${BASE_URL}/cart/${cartItemId}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async checkout(payload?: {
    meetupHub?: string;
    hubLandmark?: string;
    meetingDate?: string;
    timeSlot?: string;
    buyerNotes?: string;
  }): Promise<{
    success: boolean;
    orderId: string;
    totalAmount: number;
    meetupLocation: string;
    meetingDate: string;
    timeSlot: string;
    itemsCount: number;
    meetup?: MeetupSession;
    message: string;
  }> {
    const res = await fetch(`${BASE_URL}/cart/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
    return res.json();
  },

  // Meetups (Decided Manually by Both Buyer & Seller)
  async getCampusHubs(): Promise<{ success: boolean; hubs: CampusMeetupHub[] }> {
    const res = await fetch(`${BASE_URL}/meetups/hubs`);
    return res.json();
  },

  async getMeetups(): Promise<{ success: boolean; meetups: MeetupSession[] }> {
    const res = await fetch(`${BASE_URL}/meetups`);
    return res.json();
  },

  async getMeetupById(id: string): Promise<{ success: boolean; meetup: MeetupSession }> {
    const res = await fetch(`${BASE_URL}/meetups/${id}`);
    return res.json();
  },

  async proposeMeetup(payload: {
    productId: string;
    hubLocation: string;
    hubLandmark?: string;
    meetingDate: string;
    timeSlot: string;
    buyerNotes?: string;
  }): Promise<{ success: boolean; message: string; meetup: MeetupSession }> {
    const res = await fetch(`${BASE_URL}/meetups/propose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async respondToMeetup(
    meetupId: string,
    payload: {
      action: 'CONFIRM' | 'COUNTER' | 'COMPLETE';
      actor?: 'BUYER' | 'SELLER';
      hubLocation?: string;
      hubLandmark?: string;
      meetingDate?: string;
      timeSlot?: string;
      note?: string;
    }
  ): Promise<{ success: boolean; message: string; meetup: MeetupSession }> {
    const res = await fetch(`${BASE_URL}/meetups/${meetupId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async verifyMeetupCode(
    meetupId: string,
    code: string
  ): Promise<{ success: boolean; message: string; meetup: MeetupSession }> {
    const res = await fetch(`${BASE_URL}/meetups/${meetupId}/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    return res.json();
  },

  async getAccountSummary(): Promise<{
    success: boolean;
    user: User;
    buyerMeetups: MeetupSession[];
    sellerMeetups: MeetupSession[];
    totalBuyerOrders: number;
    totalSellerSales: number;
  }> {
    const res = await fetch(`${BASE_URL}/meetups/account/summary`);
    return res.json();
  },

  async getMeetupMessages(meetupId: string): Promise<{ success: boolean; messages: ChatMessage[] }> {
    const res = await fetch(`${BASE_URL}/meetups/${meetupId}/messages`);
    return res.json();
  },

  async sendMeetupMessage(
    meetupId: string,
    payload: { text: string; senderRole?: 'BUYER' | 'SELLER' }
  ): Promise<{ success: boolean; message: ChatMessage; allMessages: ChatMessage[] }> {
    const res = await fetch(`${BASE_URL}/meetups/${meetupId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Wishlist
  async getWishlist(): Promise<{ success: boolean; items: Product[]; count: number }> {
    const res = await fetch(`${BASE_URL}/wishlist`);
    return res.json();
  },

  async toggleWishlist(productId: string): Promise<{ success: boolean; inWishlist: boolean; wishlistCount: number }> {
    const res = await fetch(`${BASE_URL}/wishlist/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });
    return res.json();
  },

  // Auth
  async getCurrentUser(): Promise<{ success: boolean; user: User; college: College }> {
    const res = await fetch(`${BASE_URL}/auth/me`);
    return res.json();
  },

  async getUsers(): Promise<{ success: boolean; users: User[] }> {
    const res = await fetch(`${BASE_URL}/auth/users`);
    return res.json();
  },

  async switchUser(userId: string): Promise<{ success: boolean; user: User; college: College; message: string }> {
    const res = await fetch(`${BASE_URL}/auth/switch-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return res.json();
  },

  async signup(data: {
    fullName: string;
    email: string;
    password: string;
    studentId?: string;
    department?: string;
    hostel?: string;
    phone?: string;
  }): Promise<{ success: boolean; user?: User; college?: College; message?: string; error?: string }> {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async login(data: {
    email: string;
    password: string;
  }): Promise<{ success: boolean; user?: User; college?: College; message?: string; error?: string }> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async loginWithGoogle(data: {
    email: string;
    fullName?: string;
    studentId?: string;
    department?: string;
  }): Promise<{ success: boolean; user?: User; college?: College; message?: string; error?: string }> {
    const res = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getSupabaseStatus(): Promise<{ success: boolean; data?: any; error?: string }> {
    const res = await fetch(`${BASE_URL}/supabase/status`);
    return res.json();
  }
};
