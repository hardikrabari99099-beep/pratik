export type EventType =
  | "Traditional Garba"
  | "Premium Garba"
  | "Techno Garba"
  | "Dandiya"
  | "Live Music"
  | "Family Events"
  | "Celebrity Events"
  | "Other Navratri Events";

export type PassType = {
  id: string;
  name: string;
  price: number;
  desc: string;
  left: number;
  season?: boolean;
  vip?: boolean;
};

export type EventItem = {
  id: string;
  slug?: string;
  name: string;
  city: string;
  category: string;
  venue: string;
  address: string;
  area: string;
  dates: string;
  time: string;
  startTime: string;
  endTime: string;
  artist: string;
  artists?: { name: string; role?: string; image?: string }[];
  tag: string;
  eventType: EventType;
  about: string;
  highlights: string[];
  facilities: string[];
  dressCode: string;
  ageRestriction: string;
  rules: string[];
  terms: string[];
  organizer: string;
  sourceUrl?: string;
  sourceName?: string;
  mapUrl?: string;
  coverImage: string;
  galleryImages?: string[];
  nights: string[];
  passes: PassType[];
  active: boolean;
  sort: number;
  isFeatured?: boolean;
  isTrending?: boolean;
  isPopular?: boolean;
  isPromoted?: boolean;
  offerBadge?: string;
  isPreNavratri?: boolean;
  isSoldOut?: boolean;
  startingPrice?: number;
  rating?: number;
  syncStatus?: "approved" | "pending_review" | "draft";
  manuallyEdited?: boolean;
  lastSyncedAt?: string;
  created_at?: string;
};

export type SportActivity = {
  id: string;
  name: string;
  sportType: string;
  venue: string;
  area: string;
  city: string;
  pricePerHour: number;
  duration: string;
  rating: number;
  image: string;
  tag?: string;
  slots: string[];
  amenities: string[];
  address: string;
  about: string;
};

export type Coupon = {
  code: string;
  discountType: "percentage" | "flat";
  value: number;
  maxDiscount?: number;
  minOrder: number;
  desc: string;
};

export type Settings = {
  heroEyebrow: string;
  heroTitle: string;
  heroTitleAccent: string;
  heroText: string;
  featuredTitle: string;
  tagline: string;
  supportLine: string;
  steps: string[];
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  whatsapp: string;
  contactText: string;
  upiId: string;
  upiName: string;
  paymentNote: string;
  footerText: string;
};

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type OrderStatus =
  | "CREATED"
  | "PAYMENT_PENDING"
  | "PAYMENT_PROCESSING"
  | "CONFIRMED"
  | "FAILED"
  | "CANCELLED"
  | "REFUND_PENDING"
  | "REFUNDED"
  | "COMPLETED";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "USED"
  | "EXPIRED"
  | "REFUNDED";

export interface PaymentRecord {
  id: string;
  booking_id: string;
  order_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: string;
  upi_transaction_id?: string;
  email: string;
  phone: string;
  failure_reason?: string;
  refund_id?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderRecord {
  id: string;
  order_number: string;
  user_id: string;
  event_id: string;
  event_name: string;
  pass_id: string;
  pass_name: string;
  night: string;
  qty: number;
  unit_price: number;
  total_amount: number; // subtotal
  discount_amount: number;
  tax_amount: number;
  fee_amount: number;
  final_amount: number;
  currency: string;
  coupon_code?: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  razorpay_order_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  created_at: string;
  updated_at: string;
}

export interface BookingRecord {
  id: string;
  booking_id: string;
  order_id: string;
  user_id: string;
  event_id: string;
  event_name: string;
  pass_id: string;
  pass_name: string;
  qty: number;
  night: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  total: number;
  qr_code_data: string;
  status: BookingStatus;
  scanned_at?: string;
  created_at: string;
  updated_at: string;
}

export type Booking = BookingRecord & {
  name?: string;
  phone?: string;
  email?: string;
  coupon_code?: string | null;
  discount_amount?: number;
  convenience_fee?: number;
  utr?: string | null;
};

export interface FastTicketArtist {
  name: string;
  role: string;
  image: string;
  genre: string;
  showsCount?: number;
}

export interface FastTicketOrganizer {
  name: string;
  city: string;
  category: string;
  verified: boolean;
  eventsCount: number;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  source: string;
  status: "success" | "warning" | "error";
  eventsProcessed: number;
  newEventsAdded: number;
  eventsUpdated: number;
  duplicatesSkipped: number;
  soldOutDetected: number;
  errors: string[];
  details: {
    eventTitle: string;
    action: "added" | "updated" | "skipped_duplicate" | "manual_protect" | "sold_out";
    note?: string;
  }[];
}

export interface SyncSettings {
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
  autoApproveNew: boolean;
  overwriteManualEdits: boolean;
  lastSyncedAt: string | null;
  syncSource: string;
}
