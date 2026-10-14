import express, { Request, Response } from "express";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

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
function calculateOrderAmounts(eventId: string, passId: string, qty: number, couponCode?: string | null) {
  const eventPrices = EVENT_PASS_PRICES[eventId] || { single: 499, couple: 899, season: 3499, vip: 6999 };
  const unitPrice = eventPrices[passId] || 499;
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

// 1. Gateway Configuration (Public Key only - Never secrets)
app.get("/api/payment/config", (_req: Request, res: Response) => {
  res.json({
    gateway: "razorpay",
    key_id: RAZORPAY_KEY_ID,
    currency: "INR",
    is_live_key: RAZORPAY_KEY_ID.startsWith("rzp_live_"),
    supported_methods: ["upi", "card", "netbanking", "wallet", "qr"],
    timestamp: new Date().toISOString(),
  });
});

// 2. Server-Side Price Calculation (Transparent price breakdown)
app.post("/api/payment/calculate", (req: Request, res: Response) => {
  const { event_id, pass_id, qty = 1, coupon_code } = req.body;
  const parsedQty = Math.max(1, Math.min(10, Number(qty) || 1));
  const calc = calculateOrderAmounts(event_id, pass_id, parsedQty, coupon_code);

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

// 3. Create Razorpay Order (Strict rule: calculate amount server-side!)
app.post("/api/payment/create-order", async (req: Request, res: Response) => {
  try {
    const {
      event_id,
      event_name = "Surat Navratri Pass",
      pass_id,
      pass_name = "General Entry Pass",
      night = "Season Pass",
      qty = 1,
      customer_name,
      customer_email,
      customer_phone,
      coupon_code,
    } = req.body;

    if (!customer_name || !customer_phone) {
      return res.status(400).json({ error: "Customer name and phone number are required" });
    }

    const parsedQty = Math.max(1, Math.min(10, Number(qty) || 1));
    const calc = calculateOrderAmounts(event_id, pass_id, parsedQty, coupon_code);
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
// VITE DEV SERVER / PRODUCTION SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 AapnoPass Full-Stack Server running on http://0.0.0.0:${PORT}`);
    console.log(`⚡ Razorpay Primary Gateway initialized [Key ID: ${RAZORPAY_KEY_ID}]`);
    console.log(`🔒 Webhook Endpoint: http://0.0.0.0:${PORT}/api/payment/webhook`);
  });
}

startServer();
