import {
  College,
  Category,
  User,
  Product,
  AIVerificationResult,
  ModerationAuditLog,
  RestrictedPolicy,
  CartItem,
  ProductStatus,
  CampusMeetupHub,
  MeetupSession,
  MeetupHistoryEntry,
  MeetupStatus,
  ChatMessage
} from '../types';
import { seedColleges, seedCategories, seedUsers, seedProducts, seedAuditLogs } from './seedData';

export const seedCampusHubs: CampusMeetupHub[] = [
  {
    id: 'hub-btech-canteen',
    collegeId: 'col-glbajaj',
    name: 'B.Tech Canteen',
    landmark: 'B.Tech Food Court & Indoor Cafeteria Hall',
    securityCCTV: true,
    openHours: '08:30 AM - 09:30 PM',
    description: 'Central student indoor cafeteria with dining counters, bright lighting, and high footfall.'
  },
  {
    id: 'hub-stationery-shop',
    collegeId: 'col-glbajaj',
    name: 'Stationery Shop',
    landmark: 'Campus Stationery & Photocopy Center',
    securityCCTV: true,
    openHours: '08:30 AM - 08:00 PM',
    description: 'Convenient academic spot right next to the campus book and stationery store.'
  },
  {
    id: 'hub-gate-1',
    collegeId: 'col-glbajaj',
    name: 'Near Gate No. 1',
    landmark: 'Main Security Gate No. 1 & Entrance Plaza',
    securityCCTV: true,
    openHours: '07:00 AM - 10:30 PM',
    description: 'Prominent, secure gate area with active 24/7 security guard post and CCTV.'
  },
  {
    id: 'hub-ctm-block',
    collegeId: 'col-glbajaj',
    name: 'CTM Block',
    landmark: 'CTM Block (AI, AIML & DS Branches) Ground Floor Foyer',
    securityCCTV: true,
    openHours: '08:00 AM - 07:30 PM',
    description: 'Academic block for AI, AIML & Data Science branches; convenient ground floor atrium between lecture breaks.'
  },
  {
    id: 'hub-mba-canteen',
    collegeId: 'col-glbajaj',
    name: 'MBA Canteen',
    landmark: 'MBA Block Lawn & Shaded Canteen Tables',
    securityCCTV: true,
    openHours: '09:00 AM - 08:30 PM',
    description: 'Quiet outdoor and indoor seating area next to management block.'
  }
];

class DatabaseStore {
  private colleges: College[] = [...seedColleges];
  private categories: Category[] = [...seedCategories];
  private users: User[] = [...seedUsers];
  private products: Product[] = [...seedProducts];
  private verificationResults: AIVerificationResult[] = seedProducts
    .filter(p => p.verificationResult)
    .map(p => p.verificationResult!);
  private auditLogs: ModerationAuditLog[] = [...seedAuditLogs];
  private wishlist: Map<string, Set<string>> = new Map(); // userId -> Set of productIds
  private cart: Map<string, CartItem[]> = new Map(); // userId -> CartItem[]
  private campusHubs: CampusMeetupHub[] = [...seedCampusHubs];
  private meetupSessions: MeetupSession[] = [
    {
      id: 'meet-seed-1',
      orderId: 'ORD-CAMPUS-9421',
      productId: 'prod-1',
      productTitle: 'Omega Deluxe Mini Drafter Set with Protractor Head',
      productImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      productPrice: 650,
      buyerId: 'usr-student-1',
      buyerName: 'Rohan Sharma',
      buyerContact: {
        email: 'rohan.sharma@glbitm.ac.in',
        phone: '+91 98765 12045',
        hostel: 'Boys Hostel Block B (Room 214)'
      },
      sellerId: 'usr-student-2',
      sellerName: 'Ananya Iyer',
      sellerContact: {
        email: 'ananya.iyer@glbitm.ac.in',
        phone: '+91 98111 88421',
        hostel: 'Girls Hostel Block A (Room 108)'
      },
      hubLocation: 'B.Tech Canteen',
      hubLandmark: 'B.Tech Food Court & Indoor Cafeteria Hall',
      meetingDate: 'Tomorrow (28 Oct)',
      timeSlot: '05:00 PM - 05:30 PM',
      proposedBy: 'BUYER',
      buyerAgreed: true,
      sellerAgreed: true,
      status: 'MUTUALLY_AGREED',
      buyerNotes: 'I finish workshop at 4:45 PM. Will be waiting by the steps in dark blue jacket.',
      sellerNotes: 'Sounds great! I will bring the original storage bag and clips.',
      handoverCode: 'CC-SAC-8392',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      history: [
        {
          id: 'hist-1',
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          actor: 'BUYER',
          actorName: 'Rohan Sharma',
          action: 'PROPOSED',
          hubLocation: 'B.Tech Canteen',
          meetingDate: 'Tomorrow (28 Oct)',
          timeSlot: '05:00 PM - 05:30 PM',
          note: 'Proposed initial B.Tech Canteen meetup after workshop'
        },
        {
          id: 'hist-2',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          actor: 'SELLER',
          actorName: 'Ananya Iyer',
          action: 'CONFIRMED',
          hubLocation: 'B.Tech Canteen',
          meetingDate: 'Tomorrow (28 Oct)',
          timeSlot: '05:00 PM - 05:30 PM',
          note: 'Confirmed! Mutually agreed by both parties.'
        }
      ],
      messages: [
        {
          id: 'msg-1',
          senderId: 'usr-student-1',
          senderName: 'Rohan Sharma',
          senderRole: 'BUYER',
          text: 'Hi Ananya! I finish my mechanical workshop at 4:45 PM. Can we meet near B.Tech Canteen?',
          timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
        },
        {
          id: 'msg-2',
          senderId: 'usr-student-2',
          senderName: 'Ananya Iyer',
          senderRole: 'SELLER',
          text: 'Hey Rohan, yes B.Tech Canteen works great for me! I will bring the original box and drawing clips too.',
          timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString()
        },
        {
          id: 'msg-3',
          senderId: 'usr-student-1',
          senderName: 'Rohan Sharma',
          senderRole: 'BUYER',
          text: 'Awesome, thank you! I will be wearing a navy blue GL Bajaj hoodie.',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
        }
      ]
    }
  ];
  private activeCollegeId: string = 'col-glbajaj';
  private currentUserId: string = 'usr-student-1'; // Default active user (Rohan)

  constructor() {
    // Initial wishlist seeds
    this.wishlist.set('usr-student-1', new Set(['prod-2', 'prod-4']));
    this.cart.set('usr-student-1', [
      { id: 'cart-1', userId: 'usr-student-1', productId: 'prod-5', quantity: 1 }
    ]);
  }

  // --- College Operations ---
  public getColleges(): College[] {
    return this.colleges;
  }

  public getActiveCollege(): College {
    const col = this.colleges.find(c => c.id === this.activeCollegeId);
    return col || this.colleges[0];
  }

  public setActiveCollege(collegeId: string): College {
    const col = this.colleges.find(c => c.id === collegeId);
    if (col) {
      this.activeCollegeId = col.id;
      return col;
    }
    return this.getActiveCollege();
  }

  public updateCollegeConfig(collegeId: string, updates: Partial<College>): College {
    const idx = this.colleges.findIndex(c => c.id === collegeId);
    if (idx !== -1) {
      this.colleges[idx] = { ...this.colleges[idx], ...updates };
      return this.colleges[idx];
    }
    throw new Error('College not found');
  }

  // --- Category Operations ---
  public getCategories(collegeId?: string): Category[] {
    const colId = collegeId || this.activeCollegeId;
    return this.categories
      .filter(c => c.collegeId === colId && c.isApproved)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public createCategory(category: Category): Category {
    this.categories.push(category);
    return category;
  }

  // --- User Operations ---
  public getCurrentUser(): User {
    const u = this.users.find(usr => usr.id === this.currentUserId);
    return u || this.users[0];
  }

  public getUsers(): User[] {
    return this.users;
  }

  public findUserByEmail(email: string): User | undefined {
    const clean = email.toLowerCase().trim();
    const prefix = clean.split('@')[0].replace(/[^a-z0-9]/g, '');
    return this.users.find(u => {
      const uEmail = u.email.toLowerCase();
      const uPrefix = uEmail.split('@')[0].replace(/[^a-z0-9]/g, '');
      const uStudentId = (u.studentId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return uEmail === clean || 
             uPrefix === prefix || 
             (prefix && uStudentId && (prefix === uStudentId || uStudentId.includes(prefix) || prefix.includes(uStudentId)));
    });
  }

  public createUser(userData: Partial<User>): User {
    const newUser: User = {
      id: `usr-student-${Date.now()}`,
      collegeId: userData.collegeId || this.activeCollegeId,
      email: (userData.email || '').toLowerCase().trim(),
      fullName: userData.fullName || 'GL Bajaj Student',
      studentId: userData.studentId || `GLB-${Date.now().toString().slice(-6)}`,
      role: userData.role || 'STUDENT',
      isIdVerified: true,
      createdAt: new Date().toISOString(),
      department: userData.department || 'AI / AIML / DS',
      phone: userData.phone || '',
      hostel: userData.hostel || 'Day Scholar'
    };
    this.users.push(newUser);
    this.currentUserId = newUser.id;
    return newUser;
  }

  public setCurrentUser(userId: string): User {
    const u = this.users.find(usr => usr.id === userId);
    if (u) {
      this.currentUserId = u.id;
      return u;
    }
    return this.getCurrentUser();
  }

  // --- Product Operations ---
  /**
   * Retrieves public marketplace products.
   * Requirement 1 & 5: Only approved, available products appear in the public marketplace!
   */
  public getPublicProducts(filters: {
    categorySlug?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    aiInspectedOnly?: boolean;
    collegeApprovedOnly?: boolean;
    search?: string;
    sortBy?: 'price_asc' | 'price_desc' | 'recently_added' | 'trending';
  }): Product[] {
    let result = this.products.filter(p =>
      p.collegeId === this.activeCollegeId &&
      p.status === 'APPROVED' // Strict publication rule!
    );

    if (filters.categorySlug) {
      const cat = this.categories.find(c => c.slug === filters.categorySlug);
      if (cat) {
        result = result.filter(p => p.categoryId === cat.id);
      }
    }

    if (filters.condition) {
      result = result.filter(p => p.sellerDeclaredCondition === filters.condition);
    }

    if (filters.minPrice !== undefined) {
      result = result.filter(p => p.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      result = result.filter(p => p.price <= filters.maxPrice!);
    }

    if (filters.aiInspectedOnly) {
      result = result.filter(p => p.isAiInspected);
    }

    if (filters.collegeApprovedOnly) {
      result = result.filter(p => p.isCollegeApproved);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    // Attach latest verification result
    result = result.map(p => ({
      ...p,
      verificationResult: this.verificationResults.find(v => v.productId === p.id)
    }));

    // Sorting
    if (filters.sortBy === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (filters.sortBy === 'trending') {
      result.sort((a, b) => (b.viewsCount + b.wishlistCount * 2) - (a.viewsCount + a.wishlistCount * 2));
    } else {
      // Default: recently_added
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }

  public getProductById(id: string): Product | undefined {
    const prod = this.products.find(p => p.id === id);
    if (!prod) return undefined;
    return {
      ...prod,
      verificationResult: this.verificationResults.find(v => v.productId === prod.id)
    };
  }

  public createProduct(product: Product): Product {
    this.products.unshift(product);
    return product;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');

    this.products[index] = {
      ...this.products[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.products[index];
  }

  public incrementProductViews(id: string): void {
    const prod = this.products.find(p => p.id === id);
    if (prod) {
      prod.viewsCount += 1;
    }
  }

  // --- AI Verification Results Operations ---
  public saveVerificationResult(result: AIVerificationResult): AIVerificationResult {
    const existingIndex = this.verificationResults.findIndex(r => r.productId === result.productId);
    if (existingIndex !== -1) {
      this.verificationResults[existingIndex] = result;
    } else {
      this.verificationResults.push(result);
    }

    // Sync with product object
    const prod = this.products.find(p => p.id === result.productId);
    if (prod) {
      prod.verificationResult = result;
      prod.isAiInspected = true;
      prod.aiSuggestedCondition = result.suggestedCondition;
    }

    return result;
  }

  public getVerificationResult(productId: string): AIVerificationResult | undefined {
    return this.verificationResults.find(r => r.productId === productId);
  }

  // --- Moderation Operations (Admin Dashboard) ---
  public getModerationQueue(tab?: string): {
    pendingCollegeApprovals: Product[];
    aiFlagged: Product[];
    categoryMismatches: Product[];
    lowQualityPhotos: Product[];
    conditionDiscrepancies: Product[];
    recentlyApproved: Product[];
    allModerationItems: Product[];
  } {
    const all = this.products.map(p => ({
      ...p,
      verificationResult: this.verificationResults.find(v => v.productId === p.id)
    }));

    const pendingCollegeApprovals = all.filter(p => p.status === 'PENDING_COLLEGE_REVIEW');
    const aiFlagged = all.filter(p => p.status === 'AI_FLAGGED');
    const categoryMismatches = all.filter(p => p.verificationResult && !p.verificationResult.categoryMatch);
    const lowQualityPhotos = all.filter(p =>
      p.verificationResult &&
      (p.verificationResult.imageQuality === 'poor' || p.verificationResult.imageQuality === 'blurry' || p.status === 'NEEDS_MORE_INFORMATION')
    );
    const conditionDiscrepancies = all.filter(p =>
      p.aiSuggestedCondition && p.sellerDeclaredCondition && p.aiSuggestedCondition !== p.sellerDeclaredCondition
    );
    const recentlyApproved = all.filter(p => p.status === 'APPROVED');

    return {
      pendingCollegeApprovals,
      aiFlagged,
      categoryMismatches,
      lowQualityPhotos,
      conditionDiscrepancies,
      recentlyApproved,
      allModerationItems: all
    };
  }

  public recordModerationAction(params: {
    productId: string;
    adminId: string;
    adminName: string;
    action: 'APPROVED' | 'REJECTED' | 'REQUESTED_INFO' | 'SUSPENDED';
    reason: string;
  }): { product: Product; auditLog: ModerationAuditLog } {
    const prod = this.products.find(p => p.id === params.productId);
    if (!prod) throw new Error('Product not found in database');

    const previousStatus = prod.status;
    let newStatus: ProductStatus = prod.status;

    if (params.action === 'APPROVED') {
      newStatus = 'APPROVED';
      prod.isCollegeApproved = true;
      prod.collegeApprovedAt = new Date().toISOString();
      prod.collegeApprovedBy = params.adminId;
      prod.rejectionReason = undefined;
    } else if (params.action === 'REJECTED') {
      newStatus = 'REJECTED';
      prod.isCollegeApproved = false;
      prod.rejectionReason = params.reason;
    } else if (params.action === 'REQUESTED_INFO') {
      newStatus = 'NEEDS_MORE_INFORMATION';
      prod.isCollegeApproved = false;
      prod.adminNotes = params.reason;
    } else if (params.action === 'SUSPENDED') {
      newStatus = 'SUSPENDED';
      prod.isCollegeApproved = false;
      prod.rejectionReason = params.reason;
    }

    prod.status = newStatus;
    prod.updatedAt = new Date().toISOString();

    const auditLog: ModerationAuditLog = {
      id: `aud-${Date.now()}`,
      productId: params.productId,
      adminId: params.adminId,
      adminName: params.adminName,
      action: params.action,
      previousStatus,
      newStatus,
      reason: params.reason,
      createdAt: new Date().toISOString()
    };

    this.auditLogs.unshift(auditLog);

    return { product: prod, auditLog };
  }

  public getAuditLogs(productId?: string): ModerationAuditLog[] {
    if (productId) {
      return this.auditLogs.filter(a => a.productId === productId);
    }
    return this.auditLogs;
  }

  // --- Wishlist Operations ---
  public getWishlist(userId: string): Product[] {
    const ids = this.wishlist.get(userId) || new Set();
    return this.products
      .filter(p => ids.has(p.id) && p.status === 'APPROVED')
      .map(p => ({
        ...p,
        verificationResult: this.verificationResults.find(v => v.productId === p.id)
      }));
  }

  public toggleWishlist(userId: string, productId: string): { inWishlist: boolean; count: number } {
    let userSet = this.wishlist.get(userId);
    if (!userSet) {
      userSet = new Set();
      this.wishlist.set(userId, userSet);
    }

    const prod = this.products.find(p => p.id === productId);
    let inWishlist = false;

    if (userSet.has(productId)) {
      userSet.delete(productId);
      if (prod && prod.wishlistCount > 0) prod.wishlistCount -= 1;
      inWishlist = false;
    } else {
      userSet.add(productId);
      if (prod) prod.wishlistCount += 1;
      inWishlist = true;
    }

    return { inWishlist, count: prod ? prod.wishlistCount : userSet.size };
  }

  // --- Cart Operations ---
  public getCart(userId: string): CartItem[] {
    const items = this.cart.get(userId) || [];
    return items.map(item => ({
      ...item,
      product: this.getProductById(item.productId)
    })).filter(item => item.product && item.product.status === 'APPROVED');
  }

  public addToCart(userId: string, productId: string, quantity: number = 1): CartItem[] {
    let items = this.cart.get(userId) || [];
    const existing = items.find(i => i.productId === productId);

    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        userId,
        productId,
        quantity
      });
    }

    this.cart.set(userId, items);
    return this.getCart(userId);
  }

  public updateCartItem(userId: string, cartItemId: string, quantity: number): CartItem[] {
    let items = this.cart.get(userId) || [];
    if (quantity <= 0) {
      items = items.filter(i => i.id !== cartItemId);
    } else {
      const item = items.find(i => i.id === cartItemId);
      if (item) item.quantity = quantity;
    }
    this.cart.set(userId, items);
    return this.getCart(userId);
  }

  public clearCart(userId: string): void {
    this.cart.set(userId, []);
  }

  // --- Meetup Operations (Manually Decided by Both Parties) ---
  public getCampusHubs(collegeId?: string): CampusMeetupHub[] {
    const colId = collegeId || this.activeCollegeId;
    return this.campusHubs.filter(h => h.collegeId === colId);
  }

  public getMeetups(userId?: string): MeetupSession[] {
    const uid = userId || this.currentUserId;
    return this.meetupSessions
      .filter(m => m.buyerId === uid || m.sellerId === uid)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getMeetupById(id: string): MeetupSession | undefined {
    return this.meetupSessions.find(m => m.id === id);
  }

  public createMeetupSession(params: {
    orderId?: string;
    productId: string;
    buyerId?: string;
    hubLocation: string;
    hubLandmark?: string;
    meetingDate: string;
    timeSlot: string;
    buyerNotes?: string;
  }): MeetupSession {
    const product = this.getProductById(params.productId);
    if (!product) {
      throw new Error('Product not found for meetup proposal.');
    }

    const buyer = params.buyerId ? this.users.find(u => u.id === params.buyerId) || this.getCurrentUser() : this.getCurrentUser();
    const seller = this.users.find(u => u.id === product.sellerId) || {
      id: product.sellerId,
      fullName: product.sellerName || 'Campus Seller',
      email: 'seller@campus.edu'
    };

    const newMeetup: MeetupSession = {
      id: `meet-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 4)}`,
      orderId: params.orderId || `ORD-CAMPUS-${Date.now().toString().slice(-6)}`,
      productId: product.id,
      productTitle: product.title,
      productImage: product.images[0] || '',
      productPrice: product.price,
      buyerId: buyer.id,
      buyerName: buyer.fullName,
      buyerContact: {
        email: buyer.email || 'rohan.sharma@glbitm.ac.in',
        phone: '+91 98765 12045',
        hostel: 'Boys Hostel Block B (Room 214)'
      },
      sellerId: seller.id,
      sellerName: seller.fullName,
      sellerContact: {
        email: seller.email || 'ananya.iyer@glbitm.ac.in',
        phone: '+91 98111 88421',
        hostel: 'Girls Hostel Block A (Room 108)'
      },
      hubLocation: params.hubLocation,
      hubLandmark: params.hubLandmark || '',
      meetingDate: params.meetingDate,
      timeSlot: params.timeSlot,
      proposedBy: 'BUYER',
      buyerAgreed: true,
      sellerAgreed: false, // Seller must manually review & agree!
      status: 'PROPOSED_BY_BUYER',
      buyerNotes: params.buyerNotes,
      handoverCode: `CC-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: `hist-${Date.now()}-1`,
          timestamp: new Date().toISOString(),
          actor: 'BUYER',
          actorName: buyer.fullName,
          action: 'PROPOSED',
          hubLocation: params.hubLocation,
          meetingDate: params.meetingDate,
          timeSlot: params.timeSlot,
          note: params.buyerNotes || 'Proposed meetup location and timing during checkout.'
        }
      ],
      messages: params.buyerNotes ? [
        {
          id: `msg-${Date.now()}`,
          senderId: buyer.id,
          senderName: buyer.fullName,
          senderRole: 'BUYER',
          text: params.buyerNotes,
          timestamp: new Date().toISOString()
        }
      ] : []
    };

    this.meetupSessions.unshift(newMeetup);
    return newMeetup;
  }

  public respondToMeetupSession(params: {
    meetupId: string;
    actor: 'BUYER' | 'SELLER';
    action: 'CONFIRM' | 'COUNTER' | 'COMPLETE';
    hubLocation?: string;
    hubLandmark?: string;
    meetingDate?: string;
    timeSlot?: string;
    note?: string;
  }): MeetupSession {
    const session = this.meetupSessions.find(m => m.id === params.meetupId);
    if (!session) {
      throw new Error('Meetup session not found.');
    }

    const actorUser = params.actor === 'BUYER'
      ? this.users.find(u => u.id === session.buyerId) || { fullName: session.buyerName }
      : this.users.find(u => u.id === session.sellerId) || { fullName: session.sellerName };

    const actorName = actorUser.fullName;

    if (params.action === 'CONFIRM') {
      if (params.actor === 'BUYER') {
        session.buyerAgreed = true;
      } else {
        session.sellerAgreed = true;
      }

      if (session.buyerAgreed && session.sellerAgreed) {
        session.status = 'MUTUALLY_AGREED';
      }

      session.history.unshift({
        id: `hist-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: params.actor,
        actorName,
        action: 'CONFIRMED',
        hubLocation: session.hubLocation,
        meetingDate: session.meetingDate,
        timeSlot: session.timeSlot,
        note: params.note || `${actorName} confirmed the proposed hub and timing. Mutually agreed!`
      });
    } else if (params.action === 'COUNTER') {
      // Either party can propose a different hub or timing
      if (params.hubLocation) session.hubLocation = params.hubLocation;
      if (params.hubLandmark !== undefined) session.hubLandmark = params.hubLandmark;
      if (params.meetingDate) session.meetingDate = params.meetingDate;
      if (params.timeSlot) session.timeSlot = params.timeSlot;

      if (params.actor === 'BUYER') {
        session.proposedBy = 'BUYER';
        session.buyerAgreed = true;
        session.sellerAgreed = false; // Seller must now confirm
        session.status = 'PROPOSED_BY_BUYER';
        if (params.note) session.buyerNotes = params.note;
      } else {
        session.proposedBy = 'SELLER';
        session.sellerAgreed = true;
        session.buyerAgreed = false; // Buyer must now confirm
        session.status = 'PROPOSED_BY_SELLER';
        if (params.note) session.sellerNotes = params.note;
      }

      session.history.unshift({
        id: `hist-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: params.actor,
        actorName,
        action: 'COUNTERED',
        hubLocation: session.hubLocation,
        meetingDate: session.meetingDate,
        timeSlot: session.timeSlot,
        note: params.note || `${actorName} suggested an alternative hub or time.`
      });
    } else if (params.action === 'COMPLETE') {
      session.status = 'COMPLETED';
      session.history.unshift({
        id: `hist-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: params.actor,
        actorName,
        action: 'COMPLETED',
        hubLocation: session.hubLocation,
        meetingDate: session.meetingDate,
        timeSlot: session.timeSlot,
        note: params.note || 'In-person campus handover verified and completed successfully.'
      });
    }

    session.updatedAt = new Date().toISOString();
    return session;
  }

  // --- Meetup Direct Chat Operations ---
  public getMeetupMessages(meetupId: string): ChatMessage[] {
    const session = this.meetupSessions.find(m => m.id === meetupId);
    return session ? (session.messages || []) : [];
  }

  public addMeetupMessage(params: {
    meetupId: string;
    senderRole: 'BUYER' | 'SELLER';
    text: string;
  }): ChatMessage {
    const session = this.meetupSessions.find(m => m.id === params.meetupId);
    if (!session) {
      throw new Error('Meetup session not found.');
    }

    const senderId = params.senderRole === 'BUYER' ? session.buyerId : session.sellerId;
    const senderName = params.senderRole === 'BUYER' ? session.buyerName : session.sellerName;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      senderId,
      senderName,
      senderRole: params.senderRole,
      text: params.text,
      timestamp: new Date().toISOString()
    };

    if (!session.messages) {
      session.messages = [];
    }
    session.messages.push(newMsg);
    session.updatedAt = new Date().toISOString();
    return newMsg;
  }
}

export const db = new DatabaseStore();
