export type Page = 'home' | 'browse' | 'novel' | 'reader' | 'store' | 'cart' | 'checkout' | 'plans' | 'library' | 'admin' | 'login';
export type Language = 'ar' | 'en';

export interface ChapterSummaryItem {
  id: string;
  number: number;
  title: string;
  titleEn?: string;
  isFree: boolean;
}

export type RatingDisplayMode = 'visitor' | 'editorial' | 'custom' | 'combined' | 'blended';

export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface AdminRatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface NovelRatingSummary {
  mode: RatingDisplayMode;
  average: number | null;
  displayAverage: string; // formatted to 1 decimal place, or "—"
  totalCount: number;
  hasRatings: boolean;
  // Genuine reader statistics
  visitorCount: number;
  visitorAverage: number | null;
  visitorDistribution: RatingDistribution;
  // Administrative statistics
  adminCount: number;
  adminAverage: number | null;
  adminPoints: number;
  adminDistribution: AdminRatingDistribution;
  adminEnabled: boolean;
  // Editorial
  editorialRating: number | null;
  editorialReview?: string;
  // Custom
  customRating: number | null;
  // Modes & flags
  isCombined: boolean;
  isEditorial: boolean;
  isCustom: boolean;
  isVisitorOnly: boolean;
  ratingsEnabled: boolean;
}

export interface Novel {
  id: string;
  title: string;
  titleEn?: string;
  author: string;
  authorEn?: string;
  genre: string; // primary genre (first of `genres`), kept for older data/code
  genreEn?: string;
  genres?: string[]; // all genres of the novel (canonical Arabic keys)
  status: 'مستمرة' | 'مكتملة';
  description: string;
  descriptionEn?: string;
  coverUrl?: string;
  color: string;
  accent: string;
  novelPrice: number; // in EGP (ج.م)
  bookPrice: number | null; // in EGP (ج.م), null if no digital book edition
  bookFileUrl?: string;
  freeChapters: number; // e.g. first N chapters free
  chaptersCount: number;
  published: boolean;
  featured?: boolean;
  rating?: string; // legacy displayed rating
  // Genuine Visitor Ratings
  visitorRatingAverage?: number;
  visitorRatingCount?: number;
  ratingDistribution?: RatingDistribution;
  // Administrative Rating Controls & Managed Statistics
  editorialRating?: number | null;
  editorialReview?: string;
  customRating?: number | null;
  customRatingWeight?: number; // Legacy editorial seed weight
  adminRatingDistribution?: AdminRatingDistribution;
  adminRatingCount?: number;
  adminRatingAverage?: number;
  adminRatingPoints?: number;
  adminRatingEnabled?: boolean;
  ratingDisplayMode?: RatingDisplayMode;
  ratingsEnabled?: boolean; // toggle ratings for this novel
  chaptersSummary?: ChapterSummaryItem[]; // PUBLISHED chapters only
  createdAt?: unknown;
  updatedAt?: unknown;
  createdAtMs?: number;
}

/**
 * Light catalog novel item stored inside catalog/home document.
 * Keeps Firestore document reads to 1 per visitor session for public browsing.
 */
export interface CatalogNovel {
  id: string;
  title: string;
  titleEn?: string;
  author: string;
  authorEn?: string;
  genre: string; // primary genre (first of `genres`), kept for older data/code
  genreEn?: string;
  genres?: string[]; // all genres of the novel (canonical Arabic keys)
  status: 'مستمرة' | 'مكتملة';
  description: string; // trimmed to 300 characters
  descriptionEn?: string;
  coverUrl?: string;
  color: string;
  accent: string;
  novelPrice: number;
  bookPrice: number | null;
  chaptersCount: number;
  rating?: string;
  visitorRatingAverage?: number;
  visitorRatingCount?: number;
  ratingDistribution?: RatingDistribution;
  editorialRating?: number | null;
  editorialReview?: string;
  customRating?: number | null;
  customRatingWeight?: number;
  adminRatingDistribution?: AdminRatingDistribution;
  adminRatingCount?: number;
  adminRatingAverage?: number;
  adminRatingPoints?: number;
  adminRatingEnabled?: boolean;
  ratingDisplayMode?: RatingDisplayMode;
  ratingsEnabled?: boolean;
  featured?: boolean;
  freeChapters?: number;
  createdAtMs?: number;
}

export interface CatalogDoc {
  novels: CatalogNovel[];
  updatedAt: unknown;
}

export interface ChapterMeta {
  id: string;
  novelId: string;
  number: number;
  title: string;
  titleEn?: string;
  isFree: boolean;
  published: boolean;
  publishAt?: string | null;
  createdAt?: unknown;
}

export interface ChapterContent {
  id: string;
  novelId: string;
  isFree?: boolean;
  body: string;
}

export interface BookFile {
  novelId: string;
  fileUrl: string; // secure https download link
  fileName?: string;
  updatedAt: unknown;
}

export type BillingPeriod = 'monthly' | 'yearly';

export interface UserSubscription {
  planId: string; // 'admin_grant' = manual admin grant that unlocks every novel
  planName?: string;
  period?: BillingPeriod;
  expiresAt: number; // timestamp ms
}

export type AccountStatus = 'active' | 'restricted' | 'deactivated';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  createdAt: unknown;
  subscription?: UserSubscription | null;
  status?: AccountStatus;
  restrictedReason?: string;
  restrictedAt?: unknown;
  reviewCount?: number;
  ratingCount?: number;
  orderCount?: number;
}

export interface Entitlement {
  id: string;
  novelId: string;
  type: 'novel' | 'book';
  grantedAt: unknown;
  orderId?: string;
}

export interface UserLibraryItem {
  novelId: string;
  lastChapter: number;
  bookmarked: boolean;
  updatedAt: unknown;
  novel?: Novel | CatalogNovel;
}

export interface Plan {
  id: string;
  name: string;
  priceMonthly: number; // in EGP
  priceYearly: number;  // in EGP
  description: string;
  active: boolean;
  books: string[]; // display text only (marketing bullets); NOT used for access
  novelIds?: string[]; // novels this plan unlocks (enforced by firestore.rules)
  accessAll?: boolean; // true = plan unlocks every novel
  featured?: boolean;
}

export interface CartItem {
  id: string;
  type: 'novel' | 'book' | 'plan';
  refId: string; // novelId or planId
  title: string;
  author?: string;
  price: number;
  period?: BillingPeriod; // plan items only
  coverColor?: string;
  coverAccent?: string;
  coverUrl?: string;
}

export type PaymentMethod = 'vodafone_cash' | 'instapay';
export type OrderStatus = 'pending' | 'approved' | 'rejected';

export interface OrderItem {
  type: 'novel' | 'book' | 'plan';
  refId: string;
  title: string;
  price: number;
  period?: BillingPeriod; // plan items only
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  items: OrderItem[];
  total: number;
  couponCode?: string | null;
  discount?: number;
  paymentMethod: PaymentMethod;
  senderPhone: string;
  transactionRef: string;
  note?: string;
  receiptUrl?: string; // for legacy orders
  status: OrderStatus;
  createdAt: unknown;
  reviewedAt?: unknown;
  adminNote?: string;
}

export interface Coupon {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  active: boolean;
  expiresAt: string | null;
  maxUses: number;
  usedCount: number;
}

export interface Comment {
  id: string;
  novelId: string;
  chapterId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: unknown;
  hidden: boolean;
}

export type ReviewStatus = 'published' | 'hidden';

export interface Review {
  id: string; // composite key: `${novelId}_${userId}`
  novelId: string;
  novelTitle?: string;
  userId: string;
  userName: string;
  /** @deprecated Legacy field; no longer stored (reviews are publicly readable). */
  userEmail?: string;
  rating: number; // 1 | 2 | 3 | 4 | 5
  reviewText?: string;
  status: ReviewStatus;
  moderationReason?: string;
  moderatedAt?: unknown;
  moderatedBy?: string;
  reportCount?: number;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface ModerationReport {
  id: string;
  reviewId: string;
  novelId: string;
  novelTitle?: string;
  reportedUserId: string;
  reportedUserName?: string;
  reporterUid: string;
  reporterName: string;
  reason: 'spam' | 'harassment' | 'unlawful' | 'other';
  details?: string;
  reviewExcerpt?: string;
  reviewRating?: number;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: unknown;
  resolvedAt?: unknown;
  resolutionNote?: string;
}

export interface AuditLogEntry {
  id: string;
  adminUid: string;
  adminEmail: string;
  action:
    | 'restrict_user'
    | 'restore_user'
    | 'deactivate_user'
    | 'activate_user'
    | 'delete_user'
    | 'hide_review'
    | 'publish_review'
    | 'delete_review'
    | 'update_rating_settings'
    | 'update_editorial_rating'
    | 'resolve_report';
  targetType: 'user' | 'review' | 'novel' | 'report' | 'settings';
  targetId: string;
  targetLabel?: string;
  details?: Record<string, unknown> | string;
  timestamp: unknown;
}

export interface SiteSettings {
  siteName: string;
  logoText: string;
  vodafoneCashNumber: string;
  instapayHandle: string;
  paymentInstructions: string;
  contactEmail: string;
  // Visitor & Rating Settings
  ratingsRequireAuth?: boolean;
  globalRatingsEnabled?: boolean;
  maxReviewsPerDayPerUser?: number;
  minReviewLength?: number;
  maxReviewLength?: number;
}

export interface ReaderSettings {
  fontSize: number;
  theme: 'light' | 'warm' | 'dark';
  width: 'narrow' | 'medium' | 'wide';
}
