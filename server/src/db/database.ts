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
  ChatMessage,
  BargainOffer,
  BargainStatus
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
  private verificationResults: AIVerificationResult[] = [];
  private auditLogs: ModerationAuditLog[] = [...seedAuditLogs];
  private wishlist: Map<string, Set<string>> = new Map(); // userId -> Set of productIds
  private cart: Map<string, CartItem[]> = new Map(); // userId -> CartItem[]
  private campusHubs: CampusMeetupHub[] = [...seedCampusHubs];
  private bargainOffers: BargainOffer[] = [];
  private meetupSessions: MeetupSession[] = [];
  private activeCollegeId: string = 'col-glbajaj';
  private currentUserId: string | null = null;

  constructor() {
    // Initial collections start empty for authentic user data entry
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
  public getCurrentUser(): User | null {
    if (this.currentUserId) {
      const u = this.users.find(usr => usr.id === this.currentUserId);
      if (u) return u;
    }
    return this.users.length > 0 ? this.users[0] : null;
  }

  public getUsers(): User[] {
    return this.users;
  }

  public getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
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

  public setCurrentUser(userId: string): User | null {
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
      agreedPrice: item.agreedPrice,
      bargainOfferId: item.bargainOfferId,
      product: this.getProductById(item.productId)
    })).filter(item => item.product && item.product.status === 'APPROVED');
  }

  public addToCart(
    userId: string,
    productId: string,
    quantity: number = 1,
    agreedPrice?: number,
    bargainOfferId?: string
  ): CartItem[] {
    let items = this.cart.get(userId) || [];
    const existing = items.find(i => i.productId === productId);

    if (existing) {
      existing.quantity += quantity;
      if (agreedPrice !== undefined) existing.agreedPrice = agreedPrice;
      if (bargainOfferId) existing.bargainOfferId = bargainOfferId;
    } else {
      items.push({
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        userId,
        productId,
        quantity,
        agreedPrice,
        bargainOfferId
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
    if (!buyer) {
      throw new Error('Authentication required for meetup proposal.');
    }
    const seller = this.users.find(u => u.id === product.sellerId) || {
      id: product.sellerId,
      fullName: product.sellerName || 'Campus Seller',
      email: 'seller@campus.edu',
      phone: '',
      hostel: 'Campus Hostel'
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
        email: buyer.email || 'student@glbitm.ac.in',
        phone: buyer.phone || '',
        hostel: buyer.hostel || 'Campus Hostel'
      },
      sellerId: seller.id,
      sellerName: seller.fullName,
      sellerContact: {
        email: seller.email || 'seller@glbitm.ac.in',
        phone: (seller as any).phone || '',
        hostel: (seller as any).hostel || 'Campus Hostel'
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

  // --- Bargain & Negotiation Operations ---
  public getBargainOffers(userId?: string): { incoming: BargainOffer[]; outgoing: BargainOffer[] } {
    const uid = userId || this.currentUserId;
    const incoming = this.bargainOffers
      .filter(o => o.sellerId === uid)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const outgoing = this.bargainOffers
      .filter(o => o.buyerId === uid)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return { incoming, outgoing };
  }

  public getBargainOfferById(offerId: string): BargainOffer | undefined {
    return this.bargainOffers.find(o => o.id === offerId);
  }

  public getBargainOfferByProductAndBuyer(productId: string, buyerId: string): BargainOffer | undefined {
    return this.bargainOffers.find(
      o => o.productId === productId && o.buyerId === buyerId && o.status !== 'REJECTED' && o.status !== 'EXPIRED'
    );
  }

  public createBargainOffer(params: {
    productId: string;
    buyerId?: string;
    offeredPrice: number;
    buyerMessage?: string;
    allowAutoCounter?: boolean;
  }): BargainOffer {
    const product = this.getProductById(params.productId);
    if (!product) {
      throw new Error('Product not found.');
    }

    const buyer = params.buyerId ? this.getUserById(params.buyerId) : this.getCurrentUser();
    if (!buyer) {
      throw new Error('Buyer authentication required.');
    }

    if (buyer.id === product.sellerId) {
      throw new Error('You cannot bargain on your own listed product.');
    }

    if (params.offeredPrice <= 0 || params.offeredPrice >= product.price) {
      throw new Error(`Offered price must be greater than 0 and less than listed price of ₹${product.price}.`);
    }

    const discountPercent = Math.round(((product.price - params.offeredPrice) / product.price) * 100);
    let aiAcceptanceProbability = 85;
    let aiDealFeedback = 'Reasonable student offer. High likelihood of seller acceptance.';

    if (discountPercent <= 10) {
      aiAcceptanceProbability = 92;
      aiDealFeedback = 'Standard campus discount (<=10%). Very high likelihood of immediate seller acceptance!';
    } else if (discountPercent <= 20) {
      aiAcceptanceProbability = 78;
      aiDealFeedback = 'Moderate discount (11-20%). Most campus peers find this a win-win.';
    } else if (discountPercent <= 35) {
      aiAcceptanceProbability = 55;
      aiDealFeedback = 'Aggressive discount (21-35%). Seller may counter or request quick pickup.';
    } else {
      aiAcceptanceProbability = 28;
      aiDealFeedback = 'Heavy discount (>35%). Consider offering slightly more to prevent rejection.';
    }

    const seller = this.getUserById(product.sellerId);

    // Cancel existing pending/countered offer for this buyer & product
    const existing = this.bargainOffers.find(
      o => o.productId === product.id && o.buyerId === buyer.id && (o.status === 'PENDING' || o.status === 'COUNTERED')
    );
    if (existing) {
      existing.status = 'EXPIRED';
    }

    const newOffer: BargainOffer = {
      id: `off-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: product.id,
      productTitle: product.title,
      productImage: product.images?.[0],
      originalListingPrice: product.price,
      offeredPrice: params.offeredPrice,
      buyerId: buyer.id,
      buyerName: buyer.fullName,
      buyerEmail: buyer.email,
      sellerId: product.sellerId,
      sellerName: seller?.fullName || product.sellerName || 'Campus Seller',
      sellerEmail: seller?.email || 'seller@glbitm.ac.in',
      status: 'PENDING',
      buyerMessage: params.buyerMessage || 'Interested in buying! Would you accept this price?',
      aiAcceptanceProbability,
      aiDealFeedback,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: `hist-${Date.now()}-init`,
          actor: 'BUYER',
          actorName: buyer.fullName,
          action: 'OFFER_MADE',
          price: params.offeredPrice,
          message: params.buyerMessage || 'Proposed bargain offer to seller.',
          timestamp: new Date().toISOString()
        }
      ]
    };

    // User requirement: Seller must check the offer themselves and counter by their own choice!
    // Offer strictly starts as PENDING awaiting seller inspection.

    this.bargainOffers.unshift(newOffer);
    return newOffer;
  }

  public raiseBargainOffer(params: {
    offerId: string;
    buyerId?: string;
    raisedPrice: number;
    message?: string;
  }): BargainOffer {
    const offer = this.getBargainOfferById(params.offerId);
    if (!offer) {
      throw new Error('Bargain offer not found.');
    }

    const buyer = params.buyerId ? this.getUserById(params.buyerId) : this.getCurrentUser();
    if (buyer && buyer.id !== offer.buyerId && buyer.role !== 'SUPER_ADMIN') {
      throw new Error('Only the buyer can raise their bargain offer.');
    }

    if (offer.status !== 'PENDING' && offer.status !== 'COUNTERED') {
      throw new Error(`Cannot raise offer that is currently ${offer.status}.`);
    }

    if (params.raisedPrice <= offer.offeredPrice) {
      throw new Error(`Raised offer must be higher than your previous offer of ₹${offer.offeredPrice.toLocaleString('en-IN')}.`);
    }

    if (params.raisedPrice >= offer.originalListingPrice) {
      throw new Error(`Offer must be less than the original listed price of ₹${offer.originalListingPrice.toLocaleString('en-IN')}.`);
    }

    if (offer.counterPrice && params.raisedPrice > offer.counterPrice) {
      throw new Error(`Raised offer cannot exceed the seller's counter-offer of ₹${offer.counterPrice.toLocaleString('en-IN')}.`);
    }

    const previousPrice = offer.offeredPrice;
    offer.previousOfferedPrice = previousPrice;
    offer.offeredPrice = params.raisedPrice;
    offer.counterPrice = undefined; // Cleared so seller can counter on their own again
    offer.buyerMessage = params.message || `Raised offer to ₹${params.raisedPrice.toLocaleString('en-IN')}`;
    offer.sellerMessage = undefined;
    offer.status = 'PENDING'; // Back to seller for checking and manual counter
    offer.raisedCount = (offer.raisedCount || 0) + 1;
    offer.updatedAt = new Date().toISOString();

    // Recompute AI deal acceptance gauge
    const discountPercent = Math.round(((offer.originalListingPrice - params.raisedPrice) / offer.originalListingPrice) * 100);
    if (discountPercent <= 10) {
      offer.aiAcceptanceProbability = 94;
      offer.aiDealFeedback = 'Raised offer gives a very favorable deal to the seller (<=10% discount). Very high chance of acceptance!';
    } else if (discountPercent <= 20) {
      offer.aiAcceptanceProbability = 82;
      offer.aiDealFeedback = 'Revised fair offer (11-20% discount). Great balance for campus peer trade.';
    } else {
      offer.aiAcceptanceProbability = 62;
      offer.aiDealFeedback = 'Raised offer significantly improves seller margin. Awaiting seller response.';
    }

    if (!offer.history) offer.history = [];
    offer.history.unshift({
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      actor: 'BUYER',
      actorName: buyer?.fullName || offer.buyerName,
      action: 'OFFER_RAISED',
      price: params.raisedPrice,
      message: params.message || `Raised offer from ₹${previousPrice.toLocaleString('en-IN')} to ₹${params.raisedPrice.toLocaleString('en-IN')}.`,
      timestamp: new Date().toISOString()
    });

    return offer;
  }

  public respondToBargainOffer(params: {
    offerId: string;
    responderId?: string;
    action: 'ACCEPT' | 'REJECT' | 'COUNTER';
    counterPrice?: number;
    sellerMessage?: string;
  }): BargainOffer {
    const offer = this.getBargainOfferById(params.offerId);
    if (!offer) {
      throw new Error('Bargain offer not found.');
    }

    const responder = params.responderId ? this.getUserById(params.responderId) : this.getCurrentUser();
    if (responder && responder.id !== offer.sellerId && responder.role !== 'SUPER_ADMIN') {
      throw new Error('Only the seller of this product can respond to this offer.');
    }

    if (!offer.history) offer.history = [];

    if (params.action === 'ACCEPT') {
      offer.status = 'ACCEPTED';
      offer.sellerMessage = params.sellerMessage || `Accepted! Deal finalized at ₹${offer.offeredPrice.toLocaleString('en-IN')}.`;
      offer.history.unshift({
        id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        actor: 'SELLER',
        actorName: responder?.fullName || offer.sellerName,
        action: 'ACCEPTED',
        price: offer.offeredPrice,
        message: offer.sellerMessage,
        timestamp: new Date().toISOString()
      });
    } else if (params.action === 'REJECT') {
      offer.status = 'REJECTED';
      offer.sellerMessage = params.sellerMessage || 'Thank you for the offer, but I cannot sell at this price.';
      offer.history.unshift({
        id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        actor: 'SELLER',
        actorName: responder?.fullName || offer.sellerName,
        action: 'REJECTED',
        price: offer.offeredPrice,
        message: offer.sellerMessage,
        timestamp: new Date().toISOString()
      });
    } else if (params.action === 'COUNTER') {
      if (!params.counterPrice || params.counterPrice <= offer.offeredPrice || params.counterPrice >= offer.originalListingPrice) {
        throw new Error(`Counter-offer price must be between buyer's offer (₹${offer.offeredPrice}) and listed price (₹${offer.originalListingPrice}).`);
      }
      offer.status = 'COUNTERED';
      offer.counterPrice = params.counterPrice;
      offer.sellerMessage = params.sellerMessage || `How about ₹${params.counterPrice.toLocaleString('en-IN')}?`;
      offer.history.unshift({
        id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        actor: 'SELLER',
        actorName: responder?.fullName || offer.sellerName,
        action: 'COUNTERED',
        price: params.counterPrice,
        message: offer.sellerMessage,
        timestamp: new Date().toISOString()
      });
    }

    offer.updatedAt = new Date().toISOString();
    return offer;
  }

  public acceptCounterOffer(offerId: string, buyerId?: string): BargainOffer {
    const offer = this.getBargainOfferById(offerId);
    if (!offer) {
      throw new Error('Bargain offer not found.');
    }

    if (offer.status !== 'COUNTERED' || !offer.counterPrice) {
      throw new Error('No active counter-offer to accept.');
    }

    const buyer = buyerId ? this.getUserById(buyerId) : this.getCurrentUser();
    if (buyer && buyer.id !== offer.buyerId && buyer.role !== 'SUPER_ADMIN') {
      throw new Error('Only the original buyer can accept this counter-offer.');
    }

    const finalPrice = offer.counterPrice;
    offer.offeredPrice = finalPrice;
    offer.status = 'ACCEPTED';
    offer.updatedAt = new Date().toISOString();

    if (!offer.history) offer.history = [];
    offer.history.unshift({
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      actor: 'BUYER',
      actorName: buyer?.fullName || offer.buyerName,
      action: 'ACCEPTED',
      price: finalPrice,
      message: `Buyer accepted seller's counter-offer of ₹${finalPrice.toLocaleString('en-IN')}.`,
      timestamp: new Date().toISOString()
    });

    return offer;
  }
}

export const db = new DatabaseStore();
