import { FASTTICKET_SURAT_EVENTS, FASTTICKET_SPORTS } from "./fastticket-catalog";
import { LIVE_FASTTICKET_SURAT_CATALOG, convertSourceToEventItem } from "./fastticket-copier";
import type { EventItem, Booking, Settings, SyncLog, SyncSettings, SportActivity, Coupon } from "./types";

const STORAGE_EVENTS_KEY = "aapnopass.events";
const STORAGE_BOOKINGS_KEY = "aapnopass.bookings";
const STORAGE_SYNC_LOGS_KEY = "aapnopass.sync_logs";
const STORAGE_SYNC_SETTINGS_KEY = "aapnopass.sync_settings";
const STORAGE_SAVED_EVENTS_KEY = "aapnopass.saved_events";
const STORAGE_CITY_KEY = "aapnopass.city";

export const DEFAULT_SETTINGS: Settings = {
  heroEyebrow: "Surat Ni Navratri, Aapno Pass",
  heroTitle: "Dandiya Raas, Concerts & Passes in",
  heroTitleAccent: "Surat",
  heroText: "Discover Surat's finest Navratri Garba arenas, book genuine digital entry passes, and experience authentic Gujarati folklore with high-speed gate turnstile entry.",
  featuredTitle: "Trending Garba Mahotsavs in Surat",
  tagline: "Official Digital Passes • Verified Gate Entry • Surat's #1 Navratri Portal",
  supportLine: "Surat Helpline: +91 98250 49909 • WhatsApp: +91 98250 49909",
  steps: [
    "Choose your favorite Garba arena or concert in Surat",
    "Select your night (Single Day, Couple, or All 9 Nights Season Pass)",
    "Pay securely via any UPI App (Google Pay, PhonePe, Paytm, BHIM)",
    "Get instant digital QR pass with watermarked security code"
  ],
  contactPhone: "+91 98250 49909",
  contactEmail: "passes@aapnopass.live",
  contactAddress: "Ring Road Textile & Tech Hub, Surat, Gujarat 395002",
  whatsapp: "+919825049909",
  contactText: "Have questions regarding pass collection, bulk group passes, or organizer listing? Contact our Surat desk 24/7.",
  upiId: "aapnopass@upi",
  upiName: "AapnoPass Surat",
  paymentNote: "Pay exact pass amount with any UPI app. Pass QR code is issued immediately upon payment confirmation.",
  footerText: "© 2026 AapnoPass. All rights reserved. Surat's Premier Navratri Pass Booking Engine."
};

export const SURAT_AREAS = [
  "All",
  "Sarsana",
  "Vesu",
  "Adajan",
  "Piplod",
  "Althan",
  "Dumas Road",
  "Pal",
  "Citylight",
  "Katargam"
] as const;

export const CATEGORIES = [
  { id: "all", label: "All Surat Events", icon: "✨" },
  { id: "navratri", label: "Navratri Garba 2026", icon: "💃" },
  { id: "trending", label: "Trending Arenas", icon: "🔥" },
  { id: "sports", label: "Sports & Turfs", icon: "🏏" },
  { id: "concerts", label: "Live Concerts", icon: "🎤" },
  { id: "comedy", label: "Stand-up Comedy", icon: "😂" },
  { id: "parties", label: "DJ Parties & Nightlife", icon: "🎧" },
  { id: "kids", label: "Family & Kids", icon: "🎡" },
] as const;

export const AVAILABLE_COUPONS: Coupon[] = [
  {
    code: "SURAT15",
    discountType: "percentage",
    value: 15,
    maxDiscount: 500,
    minOrder: 800,
    desc: "15% discount up to ₹500 for Suratis",
  },
  {
    code: "NAVRATRI100",
    discountType: "flat",
    value: 100,
    minOrder: 499,
    desc: "Flat ₹100 instant cash discount on any pass",
  },
  {
    code: "AAPNOPASS",
    discountType: "percentage",
    value: 10,
    maxDiscount: 350,
    minOrder: 500,
    desc: "Special 10% festival discount",
  },
];

// Admin Authentication Config
export const ADMIN_CREDENTIALS = {
  email: "admin@indifunded.com",
  password: "Admin@1212",
};

const STORAGE_ADMIN_AUTH_KEY = "aapnopass.admin_authenticated";

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_ADMIN_AUTH_KEY) === "true";
  } catch {
    return false;
  }
}

export function loginAdmin(email: string, pass: string): boolean {
  if (
    email.trim().toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() &&
    pass === ADMIN_CREDENTIALS.password
  ) {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_ADMIN_AUTH_KEY, "true");
      window.dispatchEvent(new CustomEvent("admin_auth_changed", { detail: true }));
    }
    return true;
  }
  return false;
}

export function logoutAdmin(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_ADMIN_AUTH_KEY);
    window.dispatchEvent(new CustomEvent("admin_auth_changed", { detail: false }));
  }
}

// Initial seeded events: merging FastTicket live catalog + local rich events
function getInitialEvents(): EventItem[] {
  const convertedLive = LIVE_FASTTICKET_SURAT_CATALOG.map(convertSourceToEventItem);
  const existingIds = new Set(convertedLive.map(e => e.id));

  const catalogItems = (FASTTICKET_SURAT_EVENTS || []).filter(e => !existingIds.has(e.id));
  return [...convertedLive, ...catalogItems];
}

// Initial sample booking so user can immediately view/test "My Pass" and gate scanning
const SAMPLE_BOOKINGS: Booking[] = [
  {
    id: "AP-SURAT-8921",
    booking_id: "BK-SURAT-2026-8921",
    order_id: "ord_surat_init_001",
    user_id: "usr_guest_8921",
    event_id: "ft-kesariya-navratri-4",
    event_name: "Kesariya Navratri 4.0 - Surat",
    pass_id: "couple",
    pass_name: "Couple Pass (1 Night)",
    qty: 1,
    name: "Hardik Rabari",
    customer_name: "Hardik Rabari",
    phone: "+91 98250 49909",
    customer_phone: "+91 98250 49909",
    email: "hardik@example.com",
    customer_email: "hardik@example.com",
    night: "3 Oct 2026 (1st Night)",
    total: 960,
    coupon_code: "SURAT15",
    discount_amount: 165,
    utr: "428901847192",
    qr_code_data: JSON.stringify({
      bid: "BK-SURAT-2026-8921",
      event: "Kesariya Navratri 4.0 - Surat",
      holder: "Hardik Rabari",
      qty: 1,
      tier: "Couple Pass",
      sec: "SURAT-VERIFIED-GATE-PASS",
    }),
    status: "CONFIRMED",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "AP-SURAT-3420",
    booking_id: "BK-SURAT-2026-3420",
    order_id: "ord_surat_init_002",
    user_id: "usr_guest_3420",
    event_id: "ft-garvi-vaarso-surat",
    event_name: "Garvi Vaarso - Navratri 2026",
    pass_id: "season",
    pass_name: "Full 9 Nights Season Pass",
    qty: 1,
    name: "Pooja Patel",
    customer_name: "Pooja Patel",
    phone: "+91 98765 43210",
    customer_phone: "+91 98765 43210",
    email: "pooja.patel@example.com",
    customer_email: "pooja.patel@example.com",
    night: "All 9 Nights (3–11 Oct)",
    total: 5199,
    coupon_code: "NAVRATRI100",
    discount_amount: 100,
    utr: "428990172348",
    qr_code_data: JSON.stringify({
      bid: "BK-SURAT-2026-3420",
      event: "Garvi Vaarso - Navratri 2026",
      holder: "Pooja Patel",
      qty: 1,
      tier: "Full 9 Nights Season Pass",
      sec: "SURAT-VERIFIED-GATE-PASS",
    }),
    status: "CONFIRMED",
    created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 14).toISOString(),
  }
];

export function getStoredEvents(): EventItem[] {
  if (typeof window === "undefined") return getInitialEvents();
  try {
    const raw = localStorage.getItem(STORAGE_EVENTS_KEY);
    if (!raw) {
      const initial = getInitialEvents();
      localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.warn("Error reading stored events:", e);
  }
  const initial = getInitialEvents();
  localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(initial));
  return initial;
}

export function saveEvents(events: EventItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(events));
    window.dispatchEvent(new CustomEvent("events_updated", { detail: events }));
  } catch (e) {
    console.error("Error saving events to localStorage:", e);
  }
}

export function addOrUpdateEvent(event: EventItem): void {
  const current = getStoredEvents();
  const existingIdx = current.findIndex(e => e.id === event.id || (event.slug && e.slug === event.slug));
  let updated: EventItem[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = { ...current[existingIdx], ...event, manuallyEdited: true };
  } else {
    updated = [event, ...current];
  }
  saveEvents(updated);
}

export function deleteEvent(id: string): void {
  const current = getStoredEvents();
  const updated = current.filter(e => e.id !== id);
  saveEvents(updated);
}

export function getStoredBookings(): Booking[] {
  if (typeof window === "undefined") return SAMPLE_BOOKINGS;
  try {
    const raw = localStorage.getItem(STORAGE_BOOKINGS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(SAMPLE_BOOKINGS));
      return SAMPLE_BOOKINGS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.warn("Error reading stored bookings:", e);
  }
  localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(SAMPLE_BOOKINGS));
  return SAMPLE_BOOKINGS;
}

export function saveBooking(booking: Booking): void {
  const bookings = getStoredBookings();
  const updated = [booking, ...bookings.filter(b => b.id !== booking.id)];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(updated));
    // Also track user's own booking IDs
    const myIds = getMyBookingIds();
    if (!myIds.includes(booking.id)) {
      localStorage.setItem("aapnopass.myids", JSON.stringify([booking.id, ...myIds]));
    }
    window.dispatchEvent(new CustomEvent("bookings_updated", { detail: updated }));
  }
}

export function updateBookingStatus(id: string, status: Booking["status"]): boolean {
  const bookings = getStoredBookings();
  const idx = bookings.findIndex(b => b.id === id);
  if (idx >= 0) {
    bookings[idx].status = status;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(bookings));
      window.dispatchEvent(new CustomEvent("bookings_updated", { detail: bookings }));
    }
    return true;
  }
  return false;
}

export function getMyBookingIds(): string[] {
  if (typeof window === "undefined") return ["AP-SURAT-8921"];
  try {
    const raw = localStorage.getItem("aapnopass.myids");
    if (!raw) return ["AP-SURAT-8921"];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : ["AP-SURAT-8921"];
  } catch {
    return ["AP-SURAT-8921"];
  }
}

export function getStoredSyncLogs(): SyncLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_SYNC_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addSyncLog(log: SyncLog): void {
  if (typeof window === "undefined") return;
  const logs = getStoredSyncLogs();
  const updated = [log, ...logs.slice(0, 30)];
  localStorage.setItem(STORAGE_SYNC_LOGS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("synclogs_updated", { detail: updated }));
}

export function getSyncSettings(): SyncSettings {
  if (typeof window === "undefined") {
    return {
      autoSyncEnabled: true,
      syncIntervalMinutes: 30,
      autoApproveNew: true,
      overwriteManualEdits: false,
      lastSyncedAt: new Date().toISOString(),
      syncSource: "https://www.fastticket.live/surat",
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_SYNC_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const defaults: SyncSettings = {
    autoSyncEnabled: true,
    syncIntervalMinutes: 30,
    autoApproveNew: true,
    overwriteManualEdits: false,
    lastSyncedAt: new Date().toISOString(),
    syncSource: "https://www.fastticket.live/surat",
  };
  localStorage.setItem(STORAGE_SYNC_SETTINGS_KEY, JSON.stringify(defaults));
  return defaults;
}

export function saveSyncSettings(s: SyncSettings): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_SYNC_SETTINGS_KEY, JSON.stringify(s));
  }
}

export function getSelectedCity(): string {
  if (typeof window === "undefined") return "Surat";
  try {
    return localStorage.getItem(STORAGE_CITY_KEY) || "Surat";
  } catch {
    return "Surat";
  }
}

export function setSelectedCity(c: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_CITY_KEY, c);
    window.dispatchEvent(new CustomEvent("city_changed", { detail: c }));
  }
}

export function getSavedEventIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_SAVED_EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleSaveEventId(id: string): boolean {
  if (typeof window === "undefined") return false;
  const current = getSavedEventIds();
  let updated: string[];
  let isSaved = false;
  if (current.includes(id)) {
    updated = current.filter(x => x !== id);
    isSaved = false;
  } else {
    updated = [...current, id];
    isSaved = true;
  }
  localStorage.setItem(STORAGE_SAVED_EVENTS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("saved_changed", { detail: updated }));
  return isSaved;
}

export function getSportsActivities(): SportActivity[] {
  return FASTTICKET_SPORTS || [];
}
