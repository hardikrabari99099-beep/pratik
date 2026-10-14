/**
 * Razorpay Payment Gateway Client Integration
 * Strictly enforces server-side verification: Payment is NEVER marked as PAID
 * until /api/payment/verify validates the Razorpay signature on the backend.
 */

import type { BookingRecord, OrderRecord, PaymentRecord } from "./types";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface PaymentCalculationResult {
  unit_price: number;
  quantity: number;
  subtotal: number;
  discount: number;
  platform_fee: number;
  gst_tax: number;
  final_amount: number;
  currency: string;
}

export interface CreateOrderParams {
  event_id: string;
  event_name: string;
  pass_id: string;
  pass_name: string;
  night: string;
  qty: number;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  coupon_code?: string | null;
}

export interface CreateOrderResponse {
  success: boolean;
  order: {
    id: string;
    order_number: string;
    razorpay_order_id: string;
    amount: number;
    amount_paise: number;
    currency: string;
    key_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    breakdown: {
      subtotal: number;
      discount: number;
      fee: number;
      tax: number;
      final_amount: number;
    };
  };
}

export interface VerifyPaymentParams {
  order_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  method?: string;
  upi_transaction_id?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  booking: BookingRecord;
  order: OrderRecord;
  payment: PaymentRecord;
  error?: string;
}

/**
 * Load official Razorpay Checkout script dynamically
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn("Could not load external Razorpay script, fallback modal enabled.");
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export interface ConfirmUpiParams {
  order_id?: string;
  utr?: string;
  method?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  event_id?: string;
  event_name?: string;
  pass_id?: string;
  pass_name?: string;
  night?: string;
  qty?: number;
  final_amount?: number;
}

/**
 * Request server-side price calculation
 */
export async function calculatePrice(
  eventId: string,
  passId: string,
  qty: number,
  couponCode?: string | null,
  unitPrice?: number
): Promise<PaymentCalculationResult> {
  try {
    const res = await fetch("/api/payment/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: eventId,
        pass_id: passId,
        qty,
        coupon_code: couponCode,
        unit_price: unitPrice,
      }),
    });
    const data = await res.json();
    if (data.success && data.breakdown) {
      return data.breakdown;
    }
  } catch (err) {
    console.warn("Server calculation failed, using fallback:", err);
  }

  // Client calculation fallback if server is starting
  const basePrice = unitPrice && unitPrice > 0 ? unitPrice : 499;
  const subtotal = basePrice * qty;
  const fee = Math.max(15, Math.round(subtotal * 0.02));
  const tax = Math.round(fee * 0.18);
  return {
    unit_price: basePrice,
    quantity: qty,
    subtotal,
    discount: 0,
    platform_fee: fee,
    gst_tax: tax,
    final_amount: subtotal + fee + tax,
    currency: "INR",
  };
}

/**
 * Create Order on backend
 */
export async function createServerOrder(params: CreateOrderParams & { unit_price?: number }): Promise<CreateOrderResponse> {
  const res = await fetch("/api/payment/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create order on server");
  }

  return res.json();
}

/**
 * Confirm Direct UPI payment on backend
 */
export async function confirmUpiPaymentOnServer(params: ConfirmUpiParams): Promise<VerifyPaymentResponse> {
  const res = await fetch("/api/payment/confirm-upi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to confirm UPI payment on server");
  }

  return data;
}

/**
 * Verify payment on backend with Razorpay Signature
 */
export async function verifyPaymentOnServer(
  params: VerifyPaymentParams
): Promise<VerifyPaymentResponse> {
  const res = await fetch("/api/payment/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Server payment verification failed");
  }

  return data;
}

/**
 * Fetch all payments for Admin Panel
 */
export async function fetchAdminPayments(): Promise<PaymentRecord[]> {
  try {
    const res = await fetch("/api/admin/payments");
    const data = await res.json();
    return data.payments || [];
  } catch {
    return [];
  }
}

/**
 * Fetch all orders for Admin Panel
 */
export async function fetchAdminOrders(): Promise<OrderRecord[]> {
  try {
    const res = await fetch("/api/admin/orders");
    const data = await res.json();
    return data.orders || [];
  } catch {
    return [];
  }
}

/**
 * Fetch all bookings for Admin Panel
 */
export async function fetchAdminBookings(): Promise<BookingRecord[]> {
  try {
    const res = await fetch("/api/admin/bookings");
    const data = await res.json();
    return data.bookings || [];
  } catch {
    return [];
  }
}

/**
 * Verify turnstile pass code at gate
 */
export async function scanGatePass(code: string) {
  const res = await fetch("/api/admin/scan-pass", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  return res.json();
}
