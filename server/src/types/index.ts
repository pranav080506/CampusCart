export type ProductCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';

export type ProductStatus =
  | 'DRAFT'
  | 'PENDING_AI_CHECK'
  | 'AI_FLAGGED'
  | 'PENDING_COLLEGE_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'NEEDS_MORE_INFORMATION'
  | 'SUSPENDED'
  | 'SOLD';

export type UserRole = 'STUDENT' | 'COLLEGE_ADMIN' | 'SUPER_ADMIN';

export interface College {
  id: string;
  name: string;
  shortCode: string;
  domain: string;
  state: string;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  collegeId: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  isApproved: boolean;
  displayOrder: number;
}

export interface User {
  id: string;
  collegeId: string;
  email: string;
  fullName: string;
  studentId: string;
  role: UserRole;
  isIdVerified: boolean;
  createdAt: string;
  department?: string;
  phone?: string;
  hostel?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  categoryId: string;
  collegeId: string;
  sellerId: string;
  sellerName?: string;
  sellerDeclaredCondition: ProductCondition;
  aiSuggestedCondition?: ProductCondition;
  status: ProductStatus;
  images: string[];
  isAiInspected: boolean;
  isCollegeApproved: boolean;
  collegeApprovedAt?: string;
  collegeApprovedBy?: string;
  rejectionReason?: string;
  adminNotes?: string;
  viewsCount: number;
  wishlistCount: number;
  preferredMeetupHubs?: string[];
  availableTimings?: string;
  createdAt: string;
  updatedAt: string;
  verificationResult?: AIVerificationResult;
}

export interface CampusMeetupHub {
  id: string;
  collegeId: string;
  name: string;
  landmark: string;
  securityCCTV: boolean;
  openHours: string;
  description: string;
}

export type MeetupStatus =
  | 'PROPOSED_BY_BUYER'
  | 'PROPOSED_BY_SELLER'
  | 'MUTUALLY_AGREED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface MeetupHistoryEntry {
  id: string;
  timestamp: string;
  actor: 'BUYER' | 'SELLER';
  actorName: string;
  action: 'PROPOSED' | 'COUNTERED' | 'CONFIRMED' | 'COMPLETED';
  hubLocation: string;
  meetingDate: string;
  timeSlot: string;
  note?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'BUYER' | 'SELLER';
  text: string;
  timestamp: string;
}

export interface MeetupSession {
  id: string;
  orderId?: string;
  productId: string;
  productTitle: string;
  productImage?: string;
  productPrice: number;
  buyerId: string;
  buyerName: string;
  buyerContact?: {
    email: string;
    phone?: string;
    hostel?: string;
  };
  sellerId: string;
  sellerName: string;
  sellerContact?: {
    email: string;
    phone?: string;
    hostel?: string;
  };
  hubLocation: string;
  hubLandmark?: string;
  meetingDate: string;
  timeSlot: string;
  proposedBy: 'BUYER' | 'SELLER';
  buyerAgreed: boolean;
  sellerAgreed: boolean;
  status: MeetupStatus;
  buyerNotes?: string;
  sellerNotes?: string;
  handoverCode: string;
  createdAt: string;
  updatedAt: string;
  history: MeetupHistoryEntry[];
  messages: ChatMessage[];
}

export interface AIVerificationResult {
  id: string;
  productId: string;
  modelProvider: string;
  modelVersion: string;
  predictedCategory: string;
  categoryMatch: boolean;
  imageQuality: 'acceptable' | 'high' | 'poor' | 'insufficient_lighting' | 'blurry';
  descriptionConsistency: 'likely_consistent' | 'inconsistent' | 'uncertain';
  suggestedCondition: ProductCondition;
  visibleIssues: string[];
  restrictedContentDetected: boolean;
  confidence: number;
  recommendedAction: 'approve' | 'manual_review' | 'reject' | 'needs_more_info';
  limitations: string[];
  createdAt: string;
}

export interface ModerationAuditLog {
  id: string;
  productId: string;
  adminId: string;
  adminName: string;
  action: 'APPROVED' | 'REJECTED' | 'REQUESTED_INFO' | 'SUSPENDED';
  previousStatus: ProductStatus;
  newStatus: ProductStatus;
  reason?: string;
  createdAt: string;
}

export interface RestrictedPolicy {
  id: string;
  collegeId: string;
  ruleName: string;
  description: string;
  keywords: string[];
  severity: 'HIGH' | 'CRITICAL' | 'MEDIUM';
  isActive: boolean;
}

export type BargainStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'EXPIRED';

export interface BargainHistoryEntry {
  id: string;
  actor: 'BUYER' | 'SELLER';
  actorName: string;
  action: 'OFFER_MADE' | 'OFFER_RAISED' | 'COUNTERED' | 'ACCEPTED' | 'REJECTED';
  price: number;
  message?: string;
  timestamp: string;
}

export interface BargainOffer {
  id: string;
  productId: string;
  productTitle: string;
  productImage?: string;
  originalListingPrice: number;
  offeredPrice: number;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  status: BargainStatus;
  buyerMessage?: string;
  counterPrice?: number;
  sellerMessage?: string;
  aiAcceptanceProbability?: number;
  aiDealFeedback?: string;
  createdAt: string;
  updatedAt: string;
  history?: BargainHistoryEntry[];
  previousOfferedPrice?: number;
  raisedCount?: number;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  product?: Product;
  agreedPrice?: number;
  bargainOfferId?: string;
}
