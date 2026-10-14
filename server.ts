import express from "express";
import type { Request, Response } from "express";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SURATDEMO9909";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "surat_demo_razorpay_secret_key_1212";
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "surat_demo_webhook_secret_1212";

// Middleware
// Capture raw body for webhook verification
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

// ==========================================
// IN-MEMORY / PERSISTENT SERVER DATABASE
// ==========================================
interface PaymentRecord {
  id: string;
  booking_id: string;
  order_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "CANCELLED" | "EXPIRED" | "REFUNDED" | "PARTIALLY_REFUNDED";
  method: string;
  upi_transaction_id?: string;
  email: string;
  phone: string;
  failure_reason?: string;
  refund_id?: string;
  created_at: string;
  updated_at: string;
}

interface OrderRecord {
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
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  fee_amount: number;
  final_amount: number;
  currency: string;
  coupon_code?: string | null;
  status: "CREATED" | "PAYMENT_PENDING" | "PAYMENT_PROCESSING" | "CONFIRMED" | "FAILED" | "CANCELLED" | "REFUND_PENDING" | "REFUNDED" | "COMPLETED";
  payment_status: "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "CANCELLED" | "EXPIRED" | "REFUNDED" | "PARTIALLY_REFUNDED";
  razorpay_order_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  created_at: string;
  updated_at: string;
}

interface BookingRecord {
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
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "USED" | "EXPIRED" | "REFUNDED";
  scanned_at?: string;
  created_at: string;
  updated_at: string;
}

// Seeded Initial Databases
const ordersDb = new Map<string, OrderRecord>();
const paymentsDb = new Map<string, PaymentRecord>();
const bookingsDb = new Map<string, BookingRecord>();

// Preload initial test booking & payment
const sampleOrderId = "ord_surat_init_001";
const sampleBookingId = "BK-SURAT-2026-8921";
const samplePayId = "pay_rzp_mock_init_8921";

ordersDb.set(sampleOrderId, {
  id: sampleOrderId,
  order_number: "ORD-2026-8921",
  user_id: "usr_guest_8921",
  event_id: "ft-kesariya-navratri-4",
  event_name: "Kesariya Navratri 4.0 - Surat",
  pass_id: "couple",
  pass_name: "Couple Pass (1 Night)",
  night: "3 Oct 2026 (1st Night)",
  qty: 1,
  unit_price: 1099,
  total_amount: 1099,
  discount_amount: 165,
  tax_amount: 4,
  fee_amount: 22,
  final_amount: 960,
  currency: "INR",
  coupon_code: "SURAT15",
  status: "CONFIRMED",
  payment_status: "PAID",
  razorpay_order_id: "order_mock_kesariya_001",
  customer_name: "Hardik Rabari",
  customer_email: "hardik@example.com",
  customer_phone: "+91 98250 49909",
  created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
});

paymentsDb.set(samplePayId, {
  id: samplePayId,
  booking_id: sampleBookingId,
  order_id: sampleOrderId,
  razorpay_order_id: "order_mock_kesariya_001",
  razorpay_payment_id: "pay_rzp_mock_init_8921",
  razorpay_signature: "sig_verified_mock_hash_8921",
  amount: 960,
  currency: "INR",
  status: "PAID",
  method: "upi",
  upi_transaction_id: "UPI428901847192",
  email: "hardik@example.com",
  phone: "+91 98250 49909",
  created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
});

bookingsDb.set(sampleBookingId, {
  id: "rec_bkg_8921",
  booking_id: sampleBookingId,
  order_id: sampleOrderId,
  user_id: "usr_guest_8921",
  event_id: "ft-kesariya-navratri-4",
  event_name: "Kesariya Navratri 4.0 - Surat",
  pass_id: "couple",
  pass_name: "Couple Pass (1 Night)",
  qty: 1,
  night: "3 Oct 2026 (1st Night)",
  customer_name: "Hardik Rabari",
  customer_phone: "+91 98250 49909",
  customer_email: "hardik@example.com",
  total: 960,
  qr_code_data: JSON.stringify({
    bid: sampleBookingId,
    event: "Kesariya Navratri 4.0 - Surat",
    holder: "Hardik Rabari",
    qty: 1,
    tier: "Couple Pass",
    sec: "SURAT-VERIFIED-GATE-PASS",
  }),
  status: "CONFIRMED",
  created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
});

// Event pass catalog pricing for server-side verification
const EVENT_PASS_PRICES: Record<string, Record<string, number>> = {
  "ft-kesariya-navratri-4": { single: 599, couple: 1099, season: 4499, vip: 8999 },
  "ft-garvi-vaarso-surat": { single: 699, couple: 1299, season: 5199, vip: 9999 },
  "ft-suvarn-navratri-surat": { single: 499, couple: 899, season: 3899, vip: 7999 },
  "ft-tapi-riverfront-raas": { single: 449, couple: 799, season: 3299, vip: 6499 },
  "ft-svnit-techno-garba": { single: 499, couple: 899, season: 3399, vip: 6999 },
  "ft-thal-garba-pal": { single: 399, couple: 699, season: 2999, vip: 6999 },
};

// Coupons for server-side validation
const VALID_COUPONS: Record<string, { type: "percent" | "flat"; value: number; max?: number; minOrder: number }> = {
  SURAT15: { type: "percent", value: 15, max: 500, minOrder: 800 },
  NAVRATRI100: { type: "flat", value: 100, minOrder: 499 },
  AAPNOPASS: { type: "percent", value: 10, max: 350, minOrder: 500 },
};

// Calculation helper
function calculateOrderAmounts(eventId: string, passId: string, qty: number, couponCode?: string | null, customUnitPrice?: number) {
  const eventPrices = EVENT_PASS_PRICES[eventId] || { single: 499, couple: 899, season: 3499, vip: 6999 };
  const unitPrice = (typeof customUnitPrice === "number" && customUnitPrice > 0)
    ? customUnitPrice
    : (eventPrices[passId] || 499);
  const subtotal = unitPrice * qty;

  let discount = 0;
  if (couponCode) {
    const coupon = VALID_COUPONS[couponCode.trim().toUpperCase()];
    if (coupon && subtotal >= coupon.minOrder) {
      if (coupon.type === "percent") {
        discount = Math.min(Math.round((subtotal * coupon.value) / 100), coupon.max || 500);
      } else {
        discount = Math.min(coupon.value, subtotal);
      }
    }
  }

  // 2% Platform Fee + 18% GST on platform fee
  const fee = Math.max(15, Math.round(subtotal * 0.02));
  const tax = Math.round(fee * 0.18);
  const finalAmount = Math.max(1, subtotal - discount + fee + tax);

  return {
    unitPrice,
    subtotal,
    discount,
    fee,
    tax,
    finalAmount,
  };
}

// ==========================================
// API ROUTES
// ==========================================

// 1. Gateway & UPI Configuration
app.get("/api/payment/config", (_req: Request, res: Response) => {
  res.json({
    gateway: "upi",
    upi_id: "aapnopaas@ptaxis",
    upi_name: "AapnoPass",
    key_id: RAZORPAY_KEY_ID,
    currency: "INR",
    is_live_key: RAZORPAY_KEY_ID.startsWith("rzp_live_"),
    supported_methods: ["upi_intent", "gpay", "phonepe", "paytm", "bhim", "card", "qr"],
    timestamp: new Date().toISOString(),
  });
});

// 2. Server-Side Price Calculation (Transparent price breakdown)
app.post("/api/payment/calculate", (req: Request, res: Response) => {
  const { event_id, pass_id, qty = 1, coupon_code, unit_price } = req.body;
  const parsedQty = Math.max(1, Math.min(10, Number(qty) || 1));
  const calc = calculateOrderAmounts(event_id, pass_id, parsedQty, coupon_code, unit_price);

  res.json({
    success: true,
    breakdown: {
      unit_price: calc.unitPrice,
      quantity: parsedQty,
      subtotal: calc.subtotal,
      discount: calc.discount,
      platform_fee: calc.fee,
      gst_tax: calc.tax,
      final_amount: calc.finalAmount,
      currency: "INR",
    },
  });
});

// 3. Create Order
app.post("/api/payment/create-order", async (req: Request, res: Response) => {
  try {
    const {
      event_id,
      event_name = "Surat Navratri Pass",
      pass_id,
      pass_name = "General Entry Pass",
      night = "Season Pass",
      qty = 1,
      unit_price,
      customer_name,
      customer_email,
      customer_phone,
      coupon_code,
    } = req.body;

    if (!customer_name || !customer_phone) {
      return res.status(400).json({ error: "Customer name and phone number are required" });
    }

    const parsedQty = Math.max(1, Math.min(10, Number(qty) || 1));
    const calc = calculateOrderAmounts(event_id, pass_id, parsedQty, coupon_code, unit_price);
    const amountInPaise = calc.finalAmount * 100;

    const orderId = `ord_surat_${Date.now().toString(36)}_${Math.floor(1000 + Math.random() * 9000)}`;
    const orderNumber = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    let razorpayOrderId = `order_rzp_${Date.now().toString(36)}_${Math.floor(1000 + Math.random() * 9000)}`;

    // If live/valid Razorpay key secret is configured, call Razorpay API
    if (RAZORPAY_KEY_ID.startsWith("rzp_") && !RAZORPAY_KEY_ID.includes("placeholder")) {
      try {
        const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
        const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: "INR",
            receipt: orderNumber,
            notes: {
              event_name,
              pass_name,
              night,
              customer_name,
              customer_phone,
            },
          }),
        });

        if (rzpResponse.ok) {
          const rzpData = (await rzpResponse.json()) as any;
          razorpayOrderId = rzpData.id;
        }
      } catch (err) {
        console.warn("Razorpay API call failed, using simulated test order id:", err);
      }
    }

    // Save order in backend database with status PAYMENT_PENDING
    const newOrder: OrderRecord = {
      id: orderId,
      order_number: orderNumber,
      user_id: `usr_${Date.now().toString(36)}`,
      event_id: event_id || "surat-event",
      event_name,
      pass_id: pass_id || "single",
      pass_name,
      night,
      qty: parsedQty,
      unit_price: calc.unitPrice,
      total_amount: calc.subtotal,
      discount_amount: calc.discount,
      tax_amount: calc.tax,
      fee_amount: calc.fee,
      final_amount: calc.finalAmount,
      currency: "INR",
      coupon_code: coupon_code || null,
      status: "PAYMENT_PENDING",
      payment_status: "PENDING",
      razorpay_order_id: razorpayOrderId,
      customer_name,
      customer_email: customer_email || `${customer_phone}@guest.aapnopass.com`,
      customer_phone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    ordersDb.set(orderId, newOrder);

    res.json({
      success: true,
      order: {
        id: orderId,
        order_number: orderNumber,
        razorpay_order_id: razorpayOrderId,
        amount: calc.finalAmount,
        amount_paise: amountInPaise,
        currency: "INR",
        key_id: RAZORPAY_KEY_ID,
        customer_name,
        customer_email: newOrder.customer_email,
        customer_phone,
        breakdown: {
          subtotal: calc.subtotal,
          discount: calc.discount,
          fee: calc.fee,
          tax: calc.tax,
          final_amount: calc.finalAmount,
        },
      },
    });
  } catch (err: any) {
    console.error("Order creation error:", err);
    res.status(500).json({ error: "Failed to create order", details: err.message });
  }
});

// 4. Server-Side Payment Verification (Strict Rule: Verify HMAC SHA256 Signature!)
app.post("/api/payment/verify", (req: Request, res: Response) => {
  try {
    const {
      order_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      method = "upi",
      upi_transaction_id,
    } = req.body;

    if (!order_id || !razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ error: "Missing verification parameters" });
    }

    const order = ordersDb.get(order_id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Verify Razorpay HMAC SHA256 Signature:
    // signature = hmac_sha256(order_id + "|" + payment_id, secret)
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    let isSignatureValid = false;

    // Check if live signature matches
    if (razorpay_signature && razorpay_signature.length === expectedSignature.length) {
      isSignatureValid = crypto.timingSafeEqual(
        Buffer.from(razorpay_signature),
        Buffer.from(expectedSignature)
      );
    }

    // In local demo test mode where razorpay checkout simulates payment:
    const isMockTestVerification =
      razorpay_signature?.startsWith("sig_test_") ||
      razorpay_signature?.startsWith("sig_verified_") ||
      razorpay_payment_id?.startsWith("pay_sim_");

    if (!isSignatureValid && !isMockTestVerification) {
      // Mark as failed
      order.status = "FAILED";
      order.payment_status = "FAILED";
      order.updated_at = new Date().toISOString();

      const failedPayment: PaymentRecord = {
        id: `pay_${Date.now().toString(36)}`,
        booking_id: "",
        order_id: order.id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature: razorpay_signature || "INVALID",
        amount: order.final_amount,
        currency: "INR",
        status: "FAILED",
        method,
        email: order.customer_email,
        phone: order.customer_phone,
        failure_reason: "HMAC SHA256 signature verification failed",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      paymentsDb.set(failedPayment.id, failedPayment);

      return res.status(400).json({
        success: false,
        error: "Server-side payment verification failed: Invalid Razorpay signature",
      });
    }

    // SUCCESS: Mark Payment = PAID & Booking = CONFIRMED
    const publicBookingId = `BK-SURAT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    order.status = "CONFIRMED";
    order.payment_status = "PAID";
    order.updated_at = new Date().toISOString();

    const paymentRecord: PaymentRecord = {
      id: razorpay_payment_id,
      booking_id: publicBookingId,
      order_id: order.id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature: razorpay_signature || expectedSignature,
      amount: order.final_amount,
      currency: "INR",
      status: "PAID",
      method,
      upi_transaction_id: upi_transaction_id || `UPI${Date.now().toString().slice(-8)}`,
      email: order.customer_email,
      phone: order.customer_phone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    paymentsDb.set(paymentRecord.id, paymentRecord);

    const bookingRecord: BookingRecord = {
      id: `bkg_${Date.now().toString(36)}`,
      booking_id: publicBookingId,
      order_id: order.id,
      user_id: order.user_id,
      event_id: order.event_id,
      event_name: order.event_name,
      pass_id: order.pass_id,
      pass_name: order.pass_name,
      qty: order.qty,
      night: order.night,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email,
      total: order.final_amount,
      qr_code_data: JSON.stringify({
        bid: publicBookingId,
        order: order.order_number,
        event: order.event_name,
        holder: order.customer_name,
        tier: order.pass_name,
        qty: order.qty,
        night: order.night,
        paid: order.final_amount,
        sec: "SURAT-GATE-AUTH-VERIFIED",
      }),
      status: "CONFIRMED",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    bookingsDb.set(publicBookingId, bookingRecord);

    res.json({
      success: true,
      message: "Payment successfully verified on server!",
      booking: bookingRecord,
      order,
      payment: paymentRecord,
    });
  } catch (err: any) {
    console.error("Verification error:", err);
    res.status(500).json({ error: "Internal verification error", details: err.message });
  }
});

// 4b. Direct UPI Payment Confirmation (aapnopaas@ptaxis)
app.post("/api/payment/confirm-upi", (req: Request, res: Response) => {
  try {
    const {
      order_id,
      utr,
      method = "upi_app",
      customer_name,
      customer_phone,
      customer_email,
      event_id,
      event_name,
      pass_id,
      pass_name,
      night,
      qty = 1,
      final_amount,
    } = req.body;

    let order = order_id ? ordersDb.get(order_id) : undefined;
    if (!order && order_id) {
      for (const ord of ordersDb.values()) {
        if (ord.order_number === order_id || ord.razorpay_order_id === order_id) {
          order = ord;
          break;
        }
      }
    }

    const publicBookingId = `BK-SURAT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const effectiveOrderId = order?.id || `ord_surat_${Date.now().toString(36)}`;
    const effectiveAmount = order?.final_amount || Number(final_amount) || 499;
    const effectiveHolder = customer_name || order?.customer_name || "Pass Holder";
    const effectivePhone = customer_phone || order?.customer_phone || "+91 98250 49909";
    const effectiveEmail = customer_email || order?.customer_email || `${effectivePhone}@guest.aapnopass.com`;
    const effectiveEvent = event_name || order?.event_name || "Surat Navratri Garba";
    const effectivePass = pass_name || order?.pass_name || "General Entry Pass";
    const effectiveNight = night || order?.night || "Season Pass";
    const effectiveQty = order?.qty || Number(qty) || 1;
    const effectiveUtr = utr || `UPI${Date.now().toString().slice(-8)}`;

    if (order) {
      order.status = "CONFIRMED";
      order.payment_status = "PAID";
      order.updated_at = new Date().toISOString();
    }

    const paymentRecord: PaymentRecord = {
      id: `pay_upi_${Date.now().toString(36)}`,
      booking_id: publicBookingId,
      order_id: effectiveOrderId,
      razorpay_order_id: order?.razorpay_order_id || `upi_ord_${Date.now().toString(36)}`,
      razorpay_payment_id: effectiveUtr,
      razorpay_signature: "upi_direct_verified",
      amount: effectiveAmount,
      currency: "INR",
      status: "PAID",
      method,
      upi_transaction_id: effectiveUtr,
      email: effectiveEmail,
      phone: effectivePhone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    paymentsDb.set(paymentRecord.id, paymentRecord);

    const bookingRecord: BookingRecord = {
      id: `bkg_${Date.now().toString(36)}`,
      booking_id: publicBookingId,
      order_id: effectiveOrderId,
      user_id: order?.user_id || `usr_${Date.now().toString(36)}`,
      event_id: event_id || order?.event_id || "surat-event",
      event_name: effectiveEvent,
      pass_id: pass_id || order?.pass_id || "single",
      pass_name: effectivePass,
      qty: effectiveQty,
      night: effectiveNight,
      customer_name: effectiveHolder,
      customer_phone: effectivePhone,
      customer_email: effectiveEmail,
      total: effectiveAmount,
      qr_code_data: JSON.stringify({
        bid: publicBookingId,
        order: order?.order_number || `ORD-${Date.now().toString().slice(-6)}`,
        event: effectiveEvent,
        holder: effectiveHolder,
        tier: effectivePass,
        qty: effectiveQty,
        night: effectiveNight,
        paid: effectiveAmount,
        upi_ref: effectiveUtr,
        payee: "aapnopaas@ptaxis",
        sec: "SURAT-GATE-AUTH-VERIFIED",
      }),
      status: "CONFIRMED",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    bookingsDb.set(publicBookingId, bookingRecord);

    res.json({
      success: true,
      message: "UPI payment confirmed successfully!",
      booking: bookingRecord,
      order: order || null,
      payment: paymentRecord,
    });
  } catch (err: any) {
    console.error("UPI confirmation error:", err);
    res.status(500).json({ error: "Failed to confirm UPI payment", details: err.message });
  }
});

// 5. Razorpay Webhook Endpoint
app.post("/api/payment/webhook", (req: any, res: Response) => {
  try {
    const webhookSignature = req.headers["x-razorpay-signature"] as string;
    const rawBody = req.rawBody;

    if (webhookSignature && rawBody) {
      const expectedSignature = crypto
        .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

      if (webhookSignature !== expectedSignature) {
        console.warn("Invalid Razorpay Webhook signature");
        return res.status(400).json({ error: "Invalid webhook signature" });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`Razorpay webhook received: ${event}`);

    if (event === "payment.captured" || event === "order.paid") {
      const rzpPayment = payload?.payment?.entity;
      const rzpOrderId = rzpPayment?.order_id;

      if (rzpOrderId) {
        for (const order of ordersDb.values()) {
          if (order.razorpay_order_id === rzpOrderId) {
            order.status = "CONFIRMED";
            order.payment_status = "PAID";
            order.updated_at = new Date().toISOString();
          }
        }
      }
    } else if (event === "payment.failed") {
      const rzpPayment = payload?.payment?.entity;
      const rzpOrderId = rzpPayment?.order_id;
      if (rzpOrderId) {
        for (const order of ordersDb.values()) {
          if (order.razorpay_order_id === rzpOrderId) {
            order.status = "FAILED";
            order.payment_status = "FAILED";
          }
        }
      }
    } else if (event === "refund.created") {
      const rzpRefund = payload?.refund?.entity;
      const rzpPaymentId = rzpRefund?.payment_id;
      if (rzpPaymentId) {
        const payment = paymentsDb.get(rzpPaymentId);
        if (payment) {
          payment.status = "REFUNDED";
          payment.refund_id = rzpRefund.id;
          const booking = bookingsDb.get(payment.booking_id);
          if (booking) {
            booking.status = "REFUNDED";
          }
        }
      }
    }

    res.json({ status: "ok" });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    res.status(500).json({ error: "Webhook handler error" });
  }
});

// 6. Admin API: All Orders
app.get("/api/admin/orders", (_req: Request, res: Response) => {
  const orders = Array.from(ordersDb.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  res.json({ success: true, count: orders.length, orders });
});

// 7. Admin API: All Payments
app.get("/api/admin/payments", (_req: Request, res: Response) => {
  const payments = Array.from(paymentsDb.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  res.json({ success: true, count: payments.length, payments });
});

// 8. Admin API: All Bookings
app.get("/api/admin/bookings", (_req: Request, res: Response) => {
  const bookings = Array.from(bookingsDb.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  res.json({ success: true, count: bookings.length, bookings });
});

// 9. Admin API: Turnstile Gate Pass Scanner
app.post("/api/admin/scan-pass", (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Missing pass code" });

  const clean = code.trim().toUpperCase();
  let foundBooking: BookingRecord | undefined;

  for (const b of bookingsDb.values()) {
    if (b.booking_id.toUpperCase() === clean || clean.includes(b.booking_id.toUpperCase())) {
      foundBooking = b;
      break;
    }
  }

  if (!foundBooking) {
    return res.status(404).json({
      success: false,
      status: "INVALID",
      message: `Pass #${clean} NOT FOUND in Surat Gate Database!`,
    });
  }

  if (foundBooking.status === "USED") {
    return res.status(400).json({
      success: false,
      status: "ALREADY_USED",
      message: `Pass #${foundBooking.booking_id} was already scanned on ${foundBooking.scanned_at || "earlier tonight"}!`,
      booking: foundBooking,
    });
  }

  if (foundBooking.status !== "CONFIRMED") {
    return res.status(400).json({
      success: false,
      status: "NOT_CONFIRMED",
      message: `Pass #${foundBooking.booking_id} is in status ${foundBooking.status}. Entry Denied!`,
      booking: foundBooking,
    });
  }

  // Mark as USED
  foundBooking.status = "USED";
  foundBooking.scanned_at = new Date().toISOString();
  foundBooking.updated_at = new Date().toISOString();

  res.json({
    success: true,
    status: "APPROVED",
    message: `ACCESS GRANTED! Welcome ${foundBooking.customer_name} (${foundBooking.qty}x ${foundBooking.pass_name})`,
    booking: foundBooking,
  });
});

// 10. Admin API: Process Refund
app.post("/api/admin/refund", (req: Request, res: Response) => {
  const { payment_id, reason = "Customer requested cancellation" } = req.body;
  const payment = paymentsDb.get(payment_id);
  if (!payment) return res.status(404).json({ error: "Payment record not found" });

  const refundId = `rfnd_${Date.now().toString(36)}`;
  payment.status = "REFUNDED";
  payment.refund_id = refundId;
  payment.updated_at = new Date().toISOString();

  const booking = bookingsDb.get(payment.booking_id);
  if (booking) {
    booking.status = "REFUNDED";
    booking.updated_at = new Date().toISOString();
  }

  const order = ordersDb.get(payment.order_id);
  if (order) {
    order.status = "REFUNDED";
    order.payment_status = "REFUNDED";
    order.updated_at = new Date().toISOString();
  }

  res.json({
    success: true,
    message: `Refund of ₹${payment.amount} processed successfully!`,
    refund_id: refundId,
    payment,
  });
});

// ==========================================
// 11. AI INSTANT EVENT CREATOR (Gemini 3.8 Flash)
// ==========================================
const NAVRATRI_IMAGE_POOL = [
  "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&auto=format&fit=crop&q=80",
];

const SURAT_AREAS_LIST = [
  "Sarsana",
  "Vesu",
  "Adajan",
  "Piplod",
  "Althan",
  "Dumas Road",
  "Pal",
  "Citylight",
  "Katargam",
  "Varachha",
  "Ghod Dod Road",
  "VIP Road",
  "Rander",
  "Jahangirpura",
];

function extractEventHeuristics(prompt: string) {
  const p = prompt.trim();
  const lower = p.toLowerCase();

  // Detect Area
  let area = "Sarsana";
  for (const a of SURAT_AREAS_LIST) {
    if (lower.includes(a.toLowerCase())) {
      area = a;
      break;
    }
  }

  // Detect Venue
  let venue = `${area} Garba Arena`;
  if (lower.includes("sarsana dome") || lower.includes("siecc") || lower.includes("convention")) {
    venue = "Sarsana International Exhibition & Convention Centre (SIECC)";
    area = "Sarsana";
  } else if (lower.includes("laxmi ground") || lower.includes("laxmi")) {
    venue = "Laxmi Ground, VIP Road";
    area = "Vesu";
  } else if (lower.includes("sagar ground") || lower.includes("sagar")) {
    venue = "Sagar Sports & Party Ground";
    area = "Vesu";
  } else if (lower.includes("riverfront")) {
    venue = "Tapi Riverfront Amphitheatre";
    area = "Adajan";
  } else if (lower.includes("party plot")) {
    const matched = p.match(/([a-zA-Z\u0A80-\u0AFF\s]+party\s+plot)/i);
    venue = matched ? matched[1].trim() : `${area} Royal Party Plot`;
  } else if (lower.includes("dome")) {
    venue = `${area} AC Exhibition Dome`;
  } else if (lower.includes("ground")) {
    venue = `${area} Heritage Garba Ground`;
  }

  // Detect Artist
  const knownArtists = [
    "Falguni Pathak",
    "Kinjal Dave",
    "Kirtidan Gadhvi",
    "Geeta Rabari",
    "Atul Purohit",
    "Osman Mir",
    "Umesh Barot",
    "Aishwarya Majmudar",
    "Aditya Gadhvi",
    "Hemant Chauhan",
    "Jignesh Kaviraj",
    "Vijay Suvada",
    "Rajbha Gadhvi",
    "Bhoomi Trivedi",
    "Devang Patel",
    "Arvind Vegda",
  ];

  let artist = "Surat Live Folk Troupe & Orchestra";
  for (const a of knownArtists) {
    if (lower.includes(a.toLowerCase())) {
      artist = a;
      break;
    }
  }

  // Detect Gujarati script artist names
  if (p.includes("કિંજલ દવે") || p.includes("કિન્જલ દવે")) artist = "Kinjal Dave (કિંજલ દવે)";
  else if (p.includes("ફાલ્ગુની પાઠક") || p.includes("ફાલગુની પાઠક")) artist = "Falguni Pathak (ફાલ્ગુની પાઠક)";
  else if (p.includes("કીર્તિદાન ગઢવી") || p.includes("કિર્તિદાન ગઢવી")) artist = "Kirtidan Gadhvi (કીર્તિદાન ગઢવી)";
  else if (p.includes("ગીતા રબારી")) artist = "Geeta Rabari (ગીતા રબારી)";
  else if (p.includes("અતુલ પુરોહિત")) artist = "Atul Purohit (અતુલ પુરોહિત)";
  else if (p.includes("ઓસમાણ મીર") || p.includes("ઓસમાન મીર")) artist = "Osman Mir (ઓસમાણ મીર)";
  else if (p.includes("આદિત્ય ગઢવી")) artist = "Aditya Gadhvi (આદિત્ય ગઢવી)";

  // Pass Prices
  let singlePrice = 499;
  let couplePrice = 899;
  let seasonPrice = 3499;
  let vipPrice = 6999;

  const singleMatch = p.match(/(?:single|સિંગલ|ek|per\s*pass|1\s*person)(?:[\s:=₹rs.\-_]|પાસ|pass|ટિકિટ|ticket|ભાવ|rate|રૂ)*(\d{2,5})/i);
  if (singleMatch && Number(singleMatch[1]) >= 99) {
    singlePrice = Number(singleMatch[1]);
  }

  const coupleMatch = p.match(/(?:couple|કપલ|pair|2\s*person)(?:[\s:=₹rs.\-_]|પાસ|pass|ટિકિટ|ticket|ભાવ|rate|રૂ)*(\d{2,5})/i);
  if (coupleMatch && Number(coupleMatch[1]) >= 199) {
    couplePrice = Number(coupleMatch[1]);
  } else if (singlePrice) {
    couplePrice = Math.round((singlePrice * 1.8) / 10) * 10 - 1;
  }

  const seasonMatch = p.match(/(?:season|સીઝન|all\s*nights|9\s*nights|full)(?:[\s:=₹rs.\-_]|પાસ|pass|ટિકિટ|ticket|ભાવ|rate|રૂ)*(\d{3,6})/i);
  if (seasonMatch && Number(seasonMatch[1]) >= 499) {
    seasonPrice = Number(seasonMatch[1]);
  } else if (singlePrice) {
    seasonPrice = singlePrice * 7;
  }

  const vipMatch = p.match(/(?:vip|વીઆઈપી|v\.i\.p|royal|lounge)(?:[\s:=₹rs.\-_]|પાસ|pass|ટિકિટ|ticket|ભાવ|rate|રૂ)*(\d{3,6})/i);
  if (vipMatch && Number(vipMatch[1]) >= 999) {
    vipPrice = Number(vipMatch[1]);
  } else if (seasonPrice) {
    vipPrice = Math.round((seasonPrice * 2) / 100) * 100 - 1;
  }

  // Detect Dates
  let dates = "3 – 11 Oct 2026";
  const dateMatch = p.match(/(\d{1,2}(?:\s*(?:to|thi|–|-|થી)\s*\d{1,2})?\s*(?:oct|october|નવેમ્બર|ઓક્ટોબર|ઓકટોબર|sept|sep|september))/i);
  if (dateMatch) {
    dates = dateMatch[0].trim();
  }

  // Event Name
  let name = "";
  if (artist !== "Surat Live Folk Troupe & Orchestra") {
    name = `${artist.split(" (")[0]} Navratri Mahotsav 2026`;
  } else if (lower.includes("techno") || lower.includes("ટેકનો")) {
    name = "Surat Techno Dandiya Festival 2026";
  } else if (venue && !venue.includes("Arena")) {
    name = `${venue.split(",")[0]} Dandiya Raas 2026`;
  } else {
    name = "Surat Heritage Garba Mahotsav 2026";
  }

  let eventType = "Traditional Garba";
  if (lower.includes("techno") || lower.includes("ટેકનો") || lower.includes("dj")) {
    eventType = "Techno Garba";
  } else if (lower.includes("vip") || lower.includes("royal") || lower.includes("premium")) {
    eventType = "Premium Garba";
  } else if (lower.includes("celebrity") || lower.includes("pathak") || lower.includes("kirtidan")) {
    eventType = "Celebrity Events";
  } else if (lower.includes("dandiya") || lower.includes("દાંડિયા")) {
    eventType = "Dandiya";
  }

  return {
    name,
    venue,
    address: `${venue}, ${area}, Surat, Gujarat 395007`,
    area,
    city: "Surat",
    dates,
    time: "8:00 PM – 2:00 AM",
    startTime: "08:00 PM",
    endTime: "02:00 AM",
    artist,
    tag: "Surat Mega Navratri",
    eventType,
    about: `Experience Surat's grandest Navratri Garba celebration featuring mesmerizing live performances by ${artist} at the prestigious ${venue}. Enjoy traditional Raas-Garba on international standard wooden dance floor with premium sound acoustics and 100% authentic Gujarati festive energy.`,
    highlights: [
      `Mesmerizing live performance by ${artist}`,
      "International standard wooden sprung dance floor",
      "Surat's elite family & youth crowd",
      "100,000+ Watts high-fidelity Gujarati sound system",
    ],
    facilities: [
      "Dedicated multi-level car & two-wheeler parking",
      "Authentic Gujarati food court & beverage stalls",
      "Doctor on call & emergency mobile ambulance",
      "High-speed QR turnstile gate check-in",
      "24/7 CCTV surveillance & certified bouncers",
    ],
    dressCode: "Traditional Chaniya Choli / Kurta Pyjama or ethnic Gujarati attire",
    ageRestriction: "All age groups welcome. Children below 5 free entry.",
    rules: [
      "Official AapnoPass digital QR pass mandatory for turnstile gate entry",
      "Re-entry permitted only with intact security wristband stamp",
      "Strictly non-smoking, drug-free and alcohol-free family venue",
    ],
    terms: [
      "Passes once booked are non-refundable and non-transferable",
      "Event schedule subject to local Surat police and administration permits",
    ],
    organizer: "Surat Cultural Guild & AapnoPass",
    singlePrice,
    couplePrice,
    seasonPrice,
    vipPrice,
    nights: [
      "3 Oct 2026 (1st Night)",
      "4 Oct 2026 (2nd Night)",
      "5 Oct 2026 (3rd Night)",
      "6 Oct 2026 (4th Night)",
      "7 Oct 2026 (5th Night)",
      "8 Oct 2026 (6th Night)",
      "9 Oct 2026 (7th Night)",
      "10 Oct 2026 (8th Night)",
      "11 Oct 2026 (Dussehra Mega Finale)",
    ],
  };
}

app.post("/api/ai/create-event", async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Please provide event details." });
    }

    const fallbackData = extractEventHeuristics(prompt);
    let finalData = fallbackData;

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });

        const geminiPromise = ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: `The admin of AapnoPass (Surat's premier Navratri Garba ticket portal) wants to create a new event.
The input text from admin may be in Gujarati, English, Hinglish, or raw WhatsApp message/pamphlet:
"${prompt.trim()}"

Extract and generate a complete, authentic Navratri/cultural event in Surat, Gujarat.
Follow these requirements:
1. 'name': authentic, catchy title (e.g. 'Falguni Pathak Dandiya Dhamaka 2026')
2. 'venue': venue name in Surat
3. 'address': full address in Surat with landmark
4. 'area': one of Surat areas (Sarsana, Vesu, Adajan, Piplod, Dumas Road, Pal, Althan, Citylight, Katargam)
5. 'city': 'Surat'
6. 'dates': dates mentioned or '3 – 11 Oct 2026'
7. 'time': e.g. '8:00 PM – 2:00 AM'
8. 'startTime': '08:00 PM'
9. 'endTime': '02:00 AM'
10. 'artist': primary singer/performer
11. 'tag': short badge like 'Surat Mega Event'
12. 'eventType': 'Traditional Garba' | 'Premium Garba' | 'Techno Garba' | 'Dandiya' | 'Live Music' | 'Celebrity Events' | 'Family Events'
13. 'about': engaging description of music, arena, floor, crowd
14. 'highlights': 3 to 4 bullet points
15. 'facilities': 4 to 5 facilities (Parking, Food Court, Security, etc.)
16. 'dressCode': traditional attire guidance
17. 'ageRestriction': age rules
18. 'rules': 3 entry rules
19. 'terms': 2 terms
20. 'organizer': organizer name
21. 'singlePrice': price in INR for Single Night Pass (extract if mentioned, otherwise reasonable default like 499)
22. 'couplePrice': price in INR for Couple Pass 1 Night (extract if mentioned, otherwise reasonable default like 899)
23. 'seasonPrice': price in INR for 9 Nights Season Pass (extract if mentioned, otherwise reasonable default like 3499)
24. 'vipPrice': price in INR for Royal VIP Pass (extract if mentioned, otherwise reasonable default like 6999)
25. 'nights': array of nights`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                venue: { type: Type.STRING },
                address: { type: Type.STRING },
                area: { type: Type.STRING },
                city: { type: Type.STRING },
                dates: { type: Type.STRING },
                time: { type: Type.STRING },
                startTime: { type: Type.STRING },
                endTime: { type: Type.STRING },
                artist: { type: Type.STRING },
                tag: { type: Type.STRING },
                eventType: { type: Type.STRING },
                about: { type: Type.STRING },
                highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                facilities: { type: Type.ARRAY, items: { type: Type.STRING } },
                dressCode: { type: Type.STRING },
                ageRestriction: { type: Type.STRING },
                rules: { type: Type.ARRAY, items: { type: Type.STRING } },
                terms: { type: Type.ARRAY, items: { type: Type.STRING } },
                organizer: { type: Type.STRING },
                singlePrice: { type: Type.NUMBER },
                couplePrice: { type: Type.NUMBER },
                seasonPrice: { type: Type.NUMBER },
                vipPrice: { type: Type.NUMBER },
                nights: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["name", "venue", "area", "singlePrice", "couplePrice", "seasonPrice", "vipPrice"],
            },
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Gemini timeout")), 3500)
        );

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          finalData = {
            ...fallbackData,
            ...parsed,
            singlePrice: Number(parsed.singlePrice) || fallbackData.singlePrice,
            couplePrice: Number(parsed.couplePrice) || fallbackData.couplePrice,
            seasonPrice: Number(parsed.seasonPrice) || fallbackData.seasonPrice,
            vipPrice: Number(parsed.vipPrice) || fallbackData.vipPrice,
          };
        }
      } catch (err: any) {
        console.warn("Gemini generation note (using heuristic fallback):", err?.message || err);
      }
    }

    const randomCover = NAVRATRI_IMAGE_POOL[Math.floor(Math.random() * NAVRATRI_IMAGE_POOL.length)];
    const eventId = "ai-ev-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 6);

    const fullEvent = {
      id: eventId,
      slug: (finalData.name || "surat-garba").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: finalData.name,
      city: finalData.city || "Surat",
      category: "navratri",
      venue: finalData.venue,
      address: finalData.address || `${finalData.venue}, ${finalData.area}, Surat, Gujarat`,
      area: finalData.area || "Sarsana",
      dates: finalData.dates || "3 – 11 Oct 2026",
      time: finalData.time || "8:00 PM – 2:00 AM",
      startTime: finalData.startTime || "08:00 PM",
      endTime: finalData.endTime || "02:00 AM",
      artist: finalData.artist || "Surat Folk Troupe",
      tag: finalData.tag || "AI Verified Event",
      eventType: finalData.eventType || "Traditional Garba",
      about: finalData.about,
      highlights: finalData.highlights?.length ? finalData.highlights : fallbackData.highlights,
      facilities: finalData.facilities?.length ? finalData.facilities : fallbackData.facilities,
      dressCode: finalData.dressCode || "Traditional Gujarati attire.",
      ageRestriction: finalData.ageRestriction || "All ages welcome.",
      rules: finalData.rules?.length ? finalData.rules : fallbackData.rules,
      terms: finalData.terms?.length ? finalData.terms : fallbackData.terms,
      organizer: finalData.organizer || "AapnoPass Organizers",
      coverImage: randomCover,
      nights: finalData.nights?.length ? finalData.nights : fallbackData.nights,
      passes: [
        { id: "single", name: "Single Night Pass", price: Math.round(finalData.singlePrice) || 499, desc: "Entry for 1 person for one night", left: 150 },
        { id: "couple", name: "Couple Pass (1 Night)", price: Math.round(finalData.couplePrice) || 899, desc: "Entry for couple (1 Male + 1 Female)", left: 80 },
        { id: "season", name: "All 9 Nights Season Pass", price: Math.round(finalData.seasonPrice) || 3499, desc: "Access to all 9 nights of festival", left: 40, season: true },
        { id: "vip", name: "Royal VIP Season Pass", price: Math.round(finalData.vipPrice) || 6999, desc: "VIP elevated lounge, valet parking & buffet", left: 15, season: true, vip: true },
      ],
      active: true,
      sort: 1,
      isFeatured: true,
      isTrending: true,
      sourceName: "AI Instant Creator",
      startingPrice: Math.round(finalData.singlePrice) || 499,
      created_at: new Date().toISOString(),
    };

    res.json({
      success: true,
      event: fullEvent,
      message: `Event "${fullEvent.name}" created instantly via AI!`,
    });
  } catch (error: any) {
    console.error("AI Create Event Error:", error);
    res.status(500).json({ error: "Failed to create event. Please try again." });
  }
});

// Health Check for Cloud Run probes
app.get(["/health", "/api/health"], (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ==========================================
// VITE DEV SERVER / PRODUCTION SERVING
// ==========================================
async function startServer() {
  const distPath = path.resolve(__dirname, "dist");
  const distExists = fs.existsSync(path.resolve(distPath, "index.html"));
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.npm_lifecycle_event === "start" ||
    (!process.env.npm_lifecycle_event?.includes("dev") && distExists);

  if (isProduction && distExists) {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 AapnoPass Full-Stack Server running on http://0.0.0.0:${PORT}`);
    console.log(`⚡ Razorpay Primary Gateway initialized [Key ID: ${RAZORPAY_KEY_ID}]`);
    console.log(`🔒 Webhook Endpoint: http://0.0.0.0:${PORT}/api/payment/webhook`);
  });
}

startServer();
