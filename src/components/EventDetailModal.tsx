import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Mic,
  ShieldCheck,
  CheckCircle2,
  Ticket,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Sparkles,
  QrCode,
  ArrowRight,
  CreditCard,
  Smartphone,
  Tag,
  AlertCircle,
  Lock,
  Download,
  Printer
} from "lucide-react";
import confetti from "canvas-confetti";
import QRCode from "qrcode";
import type { EventItem, BookingRecord, OrderRecord } from "../lib/types";
import { AVAILABLE_COUPONS, saveBooking } from "../lib/storage";
import {
  calculatePrice,
  createServerOrder,
  verifyPaymentOnServer,
  loadRazorpayScript,
  type PaymentCalculationResult
} from "../lib/razorpay";

interface EventDetailModalProps {
  event: EventItem | null;
  onClose: () => void;
  onViewPass: (bookingId: string) => void;
  onNotify: (msg: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onViewPass,
  onNotify,
}) => {
  if (!event) return null;

  const [selectedNight, setSelectedNight] = useState<string>(
    event.nights?.[0] || event.dates || "3 Oct 2026 (Night 1)"
  );
  const [selectedPassId, setSelectedPassId] = useState<string>(
    event.passes?.[0]?.id || "single"
  );
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Server calculation state
  const [pricing, setPricing] = useState<PaymentCalculationResult>({
    unit_price: event.passes?.[0]?.price || 499,
    quantity: 1,
    subtotal: (event.passes?.[0]?.price || 499) * 1,
    discount: 0,
    platform_fee: 15,
    gst_tax: 3,
    final_amount: (event.passes?.[0]?.price || 499) * 1 + 18,
    currency: "INR",
  });
  const [isCalculating, setIsCalculating] = useState(false);

  // Checkout process states
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState<"tickets" | "details" | "rules">("tickets");
  const [copiedLink, setCopiedLink] = useState(false);

  // Razorpay Checkout State
  const [currentOrder, setCurrentOrder] = useState<any | null>(null);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [selectedUpiMethod, setSelectedUpiMethod] = useState<string>("gpay");
  const [simulatedUtr, setSimulatedUtr] = useState<string>("");

  // Confirmed Booking Result
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRecord | null>(null);
  const [ticketQrUrl, setTicketQrUrl] = useState<string>("");

  const selectedPass = event.passes?.find((p) => p.id === selectedPassId) || event.passes?.[0] || {
    id: "single",
    name: "General Entry Pass",
    price: 499,
    desc: "Single night admission",
    left: 100,
  };

  // Re-calculate price on server whenever pass, qty, or coupon changes
  useEffect(() => {
    let isMounted = true;
    setIsCalculating(true);

    calculatePrice(event.id, selectedPassId, qty, appliedCoupon)
      .then((res) => {
        if (isMounted) {
          setPricing(res);
          setIsCalculating(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsCalculating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [event.id, selectedPassId, qty, appliedCoupon]);

  // Generate QR image on booking confirmation
  useEffect(() => {
    if (confirmedBooking) {
      QRCode.toDataURL(confirmedBooking.qr_code_data, {
        width: 220,
        margin: 1,
        color: { dark: "#0c281e", light: "#ffffff" },
      })
        .then((url) => setTicketQrUrl(url))
        .catch((e) => console.error("QR Gen error:", e));
    }
  }, [confirmedBooking]);

  const handleApplyCoupon = (codeToApply?: string) => {
    const target = (codeToApply || couponCode).trim().toUpperCase();
    const found = AVAILABLE_COUPONS.find((c) => c.code === target);
    if (!found) {
      onNotify("Invalid coupon code. Try SURAT15 or NAVRATRI100");
      return;
    }
    setAppliedCoupon(target);
    setCouponCode(target);
    onNotify(`Coupon ${target} applied!`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    onNotify("Coupon removed");
  };

  /**
   * Complete Payment Flow:
   * 1. Validate customer details
   * 2. Call backend /api/payment/create-order
   * 3. Invoke Razorpay Checkout with server-created razorpay_order_id
   * 4. Call /api/payment/verify on backend with razorpay_signature
   */
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      onNotify("Please enter pass holder's name");
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      onNotify("Please enter a valid 10-digit mobile number");
      return;
    }

    try {
      setIsCreatingOrder(true);

      // STEP 1: CREATE ORDER ON BACKEND (SERVER CALCULATES AMOUNT!)
      const orderRes = await createServerOrder({
        event_id: event.id,
        event_name: event.name,
        pass_id: selectedPass.id,
        pass_name: selectedPass.name,
        night: selectedNight,
        qty,
        customer_name: name.trim(),
        customer_email: email.trim(),
        customer_phone: phone.trim(),
        coupon_code: appliedCoupon,
      });

      setIsCreatingOrder(false);
      setCurrentOrder(orderRes.order);

      // STEP 2: OPEN RAZORPAY CHECKOUT
      const hasSdk = await loadRazorpayScript();

      if (hasSdk && window.Razorpay) {
        try {
          const options = {
            key: orderRes.order.key_id,
            amount: orderRes.order.amount_paise,
            currency: orderRes.order.currency,
            name: "AapnoPass Surat",
            description: `${event.name} — ${selectedPass.name} (${qty}x)`,
            image: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=128&h=128&fit=crop",
            order_id: orderRes.order.razorpay_order_id,
            prefill: {
              name: name.trim(),
              contact: phone.trim(),
              email: email.trim() || `${phone.trim()}@guest.aapnopass.com`,
            },
            theme: { color: "#f59e0b" },
            handler: async (response: any) => {
              await verifyPayment(
                orderRes.order.id,
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature,
                "razorpay_sdk"
              );
            },
            modal: {
              ondismiss: () => {
                onNotify("Payment cancelled by user");
              },
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
          return;
        } catch (sdkError) {
          console.warn("Razorpay SDK launch issue, using integrated checkout modal:", sdkError);
        }
      }

      // If SDK is in an iframe / test mode: show integrated Razorpay UPI Modal
      setShowRazorpayModal(true);
    } catch (err: any) {
      setIsCreatingOrder(false);
      onNotify(err.message || "Failed to initiate payment");
    }
  };

  /**
   * STEP 3: SERVER-SIDE SIGNATURE VERIFICATION
   * Strictly enforces backend validation: Order is NEVER marked paid without /api/payment/verify!
   */
  const verifyPayment = async (
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    method = "upi"
  ) => {
    try {
      setIsVerifying(true);

      const verificationResult = await verifyPaymentOnServer({
        order_id: orderId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        method,
      });

      setIsVerifying(false);
      setShowRazorpayModal(false);

      if (verificationResult.success && verificationResult.booking) {
        setConfirmedBooking(verificationResult.booking);
        // Sync local storage for MyPasses view
        saveBooking({
          ...verificationResult.booking,
          id: verificationResult.booking.booking_id,
          name: verificationResult.booking.customer_name,
          phone: verificationResult.booking.customer_phone,
          email: verificationResult.booking.customer_email,
        } as any);

        // Confetti burst
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#f59e0b", "#10b981", "#fbbf24", "#ffffff"],
          });
        } catch {}

        onNotify(`Payment verified! Pass #${verificationResult.booking.booking_id} issued.`);
      }
    } catch (err: any) {
      setIsVerifying(false);
      onNotify(err.message || "Server signature verification failed");
    }
  };

  // Simulate payment for testing Razorpay flow
  const handleSimulatePayment = async () => {
    if (!currentOrder) return;
    const testPayId = `pay_sim_${Date.now().toString(36)}_${Math.floor(1000 + Math.random() * 9000)}`;
    const testSig = `sig_verified_${Date.now().toString(36)}`;

    await verifyPayment(
      currentOrder.id,
      currentOrder.razorpay_order_id,
      testPayId,
      testSig,
      selectedUpiMethod
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-neutral-200 rounded-3xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        
        {/* Modal Top Bar */}
        <div className="p-4 sm:px-6 sm:py-4 bg-neutral-50/90 border-b border-neutral-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
              {event.eventType}
            </span>
            <span className="text-xs text-neutral-600 truncate max-w-xs font-medium">
              {event.area}, Surat
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin + "/#event-" + event.id);
                setCopiedLink(true);
                onNotify("Pass booking link copied!");
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 transition cursor-pointer shadow-2xs"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-[#f59e0b]" />}
              <span className="hidden sm:inline">{copiedLink ? "Copied" : "Share"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* ======================================================== */}
          {/* SCREEN 1: SUCCESS CONFIRMED TICKET */}
          {/* ======================================================== */}
          {confirmedBooking ? (
            <div className="py-6 text-center space-y-6 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl font-bold animate-bounce shadow-sm">
                ✓
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                  Payment Verified via Razorpay
                </span>
                <h3 className="font-display font-black text-2xl sm:text-3xl text-neutral-900 mt-2">
                  Pass Confirmed!
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Your digital entry pass has been issued with a verified gate turnstile QR code.
                </p>
              </div>

              {/* Digital Pass Ticket Box with ticket notch */}
              <div className="relative bg-neutral-950 text-white border-2 border-neutral-800 rounded-3xl p-6 sm:p-7 text-left space-y-4 ticket-notch-l ticket-notch-r shadow-2xl">
                <div className="flex items-start justify-between border-b border-dashed border-neutral-800 pb-3">
                  <div>
                    <span className="font-display font-black text-lg text-white block">
                      AapnoPass Surat
                    </span>
                    <span className="text-[10px] font-mono text-[#f59e0b] uppercase font-bold">
                      Booking #{confirmedBooking.booking_id}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                      {confirmedBooking.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-7 space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-neutral-400 font-semibold block">Event</span>
                      <span className="font-bold text-white text-sm line-clamp-1">{confirmedBooking.event_name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] uppercase text-neutral-400 font-semibold block">Pass Tier</span>
                        <span className="text-[#f59e0b] font-bold">{confirmedBooking.pass_name}</span>
                        <span className="text-[10px] text-neutral-400 block">({confirmedBooking.qty}x Person)</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-neutral-400 font-semibold block">Schedule</span>
                        <span className="text-white font-medium">{confirmedBooking.night}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-neutral-400 font-semibold block">Pass Holder</span>
                      <span className="text-white font-medium">{confirmedBooking.customer_name}</span>
                      <span className="text-[10px] text-neutral-400 block">{confirmedBooking.customer_phone}</span>
                    </div>

                    <div className="pt-2 border-t border-neutral-800 flex justify-between font-bold">
                      <span className="text-neutral-400">Total Paid:</span>
                      <span className="text-emerald-400 font-mono text-sm">₹{confirmedBooking.total.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Generated QR Code */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 bg-neutral-900 rounded-2xl border border-neutral-800 text-center">
                    {ticketQrUrl ? (
                      <div className="bg-white p-1.5 rounded-xl shadow-lg">
                        <img src={ticketQrUrl} alt="Gate QR" className="w-28 h-28 mx-auto" />
                      </div>
                    ) : (
                      <div className="w-28 h-28 bg-neutral-800 animate-pulse rounded-xl" />
                    )}
                    <span className="text-[9px] font-mono font-bold text-[#f59e0b] uppercase tracking-wider mt-1.5">
                      ★ GATE PASS ★
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onViewPass(confirmedBooking.booking_id);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Ticket className="w-4 h-4 text-amber-400" />
                  <span>View in My Passes</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="py-3 px-4 rounded-xl text-xs font-semibold bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-4 h-4 text-neutral-500" />
                  <span>Print Ticket</span>
                </button>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* SCREEN 2: EVENT DETAILS & TICKET BOOKING */
            /* ======================================================== */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Event Overview & Information */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* Hero Header Poster */}
                <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-neutral-100 border border-neutral-200">
                  <img
                    src={event.coverImage}
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                  
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest bg-neutral-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                      {event.tag}
                    </span>
                    <h2 className="font-display font-black text-xl sm:text-2xl text-white mt-1.5">
                      {event.name}
                    </h2>
                    <div className="text-xs text-amber-300 font-semibold flex items-center gap-1.5 mt-0.5">
                      <Mic className="w-3.5 h-3.5 text-[#f59e0b]" />
                      <span>{event.artist}</span>
                    </div>
                  </div>
                </div>

                {/* Key Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200/90 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">Dates</span>
                    <span className="text-neutral-900 font-medium flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-[#f59e0b]" />
                      {event.dates}
                    </span>
                  </div>

                  <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200/90 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">Time</span>
                    <span className="text-neutral-900 font-medium flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-[#f59e0b]" />
                      {event.time}
                    </span>
                  </div>

                  <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200/90 col-span-2 sm:col-span-1 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">Venue</span>
                    <span className="text-neutral-900 font-medium truncate block mt-0.5">
                      {event.venue}
                    </span>
                  </div>
                </div>

                {/* Address & Google Maps pill */}
                <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200/90 flex items-center justify-between gap-3 text-xs shadow-2xs">
                  <div className="flex items-center gap-2 text-neutral-700">
                    <MapPin className="w-4 h-4 text-[#f59e0b] shrink-0" />
                    <span className="line-clamp-1">{event.address}</span>
                  </div>
                  <a
                    href={event.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(event.venue + " " + event.area + " Surat")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 hover:underline flex items-center gap-1 text-[11px] font-bold shrink-0"
                  >
                    <span>View Map</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Tabs: Details / Highlights / Rules */}
                <div>
                  <div className="flex border-b border-neutral-200 gap-4 mb-3.5">
                    <button
                      onClick={() => setActiveTab("tickets")}
                      className={`pb-2 text-xs font-bold border-b-2 transition cursor-pointer ${
                        activeTab === "tickets" ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-400 hover:text-neutral-700"
                      }`}
                    >
                      Ticket Passes ({event.passes?.length || 0})
                    </button>
                    <button
                      onClick={() => setActiveTab("details")}
                      className={`pb-2 text-xs font-bold border-b-2 transition cursor-pointer ${
                        activeTab === "details" ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-400 hover:text-neutral-700"
                      }`}
                    >
                      About Event
                    </button>
                    <button
                      onClick={() => setActiveTab("rules")}
                      className={`pb-2 text-xs font-bold border-b-2 transition cursor-pointer ${
                        activeTab === "rules" ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-400 hover:text-neutral-700"
                      }`}
                    >
                      Dress Code & Rules
                    </button>
                  </div>

                  {activeTab === "tickets" && (
                    <div className="space-y-2.5">
                      {event.passes?.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPassId(p.id)}
                          className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                            selectedPassId === p.id
                              ? "bg-amber-50/70 border-amber-400 text-neutral-900 shadow-sm"
                              : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300 shadow-2xs"
                          }`}
                        >
                          <div>
                            <div className="font-bold flex items-center gap-2 text-xs text-neutral-900">
                              <span>{p.name}</span>
                              {p.vip && (
                                <span className="text-[9px] bg-neutral-900 text-amber-300 font-extrabold px-1.5 py-0.2 rounded">
                                  VIP PASS
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-0.5">{p.desc}</div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-neutral-900 text-base">
                              ₹{p.price.toLocaleString("en-IN")}
                            </span>
                            <span className="block text-[10px] text-neutral-400">{p.left} passes left</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "details" && (
                    <div className="space-y-3 text-xs text-neutral-600 leading-relaxed bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                      <p>{event.about}</p>
                      <div className="pt-2 text-neutral-500 text-[11px]">
                        <strong>Organizer:</strong> {event.organizer} • <strong>Security:</strong> Full CCTV & Turnstile Verification
                      </div>
                    </div>
                  )}

                  {activeTab === "rules" && (
                    <div className="space-y-3 text-xs bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 font-medium">
                        <strong>Mandatory Dress Code:</strong> {event.dressCode || "Traditional Chaniya Choli for women, Kedia/Kurta for men."}
                      </div>
                      <div className="space-y-1.5 text-neutral-600">
                        {event.rules?.map((r, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="text-[#f59e0b] font-bold">•</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Checkout & Booking Form */}
              <div className="lg:col-span-5 bg-neutral-50/80 border border-neutral-200 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-sm">
                <div>
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
                    <h3 className="font-display font-bold text-base text-neutral-900 flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-[#f59e0b]" />
                      <span>Select Pass & Book</span>
                    </h3>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                      Razorpay Secured
                    </span>
                  </div>

                  <form onSubmit={handleProceedToPayment} className="space-y-4 text-xs">
                    
                    {/* 1. Night Selection */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                        1. Night / Date Schedule:
                      </label>
                      <select
                        value={selectedNight}
                        onChange={(e) => setSelectedNight(e.target.value)}
                        className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-[#f59e0b] cursor-pointer shadow-2xs"
                      >
                        <option value="All 9 Nights Season">All 9 Nights Season Pass (3 – 11 Oct)</option>
                        {event.nights?.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Quantity Stepper */}
                    <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-neutral-200 shadow-2xs">
                      <div>
                        <span className="font-semibold text-neutral-800 block text-xs">
                          {selectedPass.name}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          ₹{selectedPass.price} per person
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setQty(Math.max(1, qty - 1))}
                          className="w-7 h-7 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-700 font-bold flex items-center justify-center hover:bg-neutral-200 transition cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-bold font-mono text-sm text-neutral-900 w-4 text-center">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(Math.min(10, qty + 1))}
                          className="w-7 h-7 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-700 font-bold flex items-center justify-center hover:bg-neutral-200 transition cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* 3. Attendee Details */}
                    <div className="space-y-2 pt-2 border-t border-neutral-200">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                        2. Pass Holder Details:
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full Name (for gate verification)"
                        className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#f59e0b] shadow-2xs"
                      />
                      <div className="flex gap-2">
                        <div className="bg-neutral-100 border border-neutral-200 px-2.5 py-2 rounded-xl text-neutral-600 text-xs font-semibold shrink-0">
                          +91
                        </div>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="10-digit mobile number"
                          className="flex-1 bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#f59e0b] shadow-2xs"
                        />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email (for digital ticket delivery)"
                        className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#f59e0b] shadow-2xs"
                      />
                    </div>

                    {/* 4. Coupon Input & Quick Pills */}
                    <div className="pt-2 border-t border-neutral-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                          3. Apply Coupon:
                        </label>
                        {appliedCoupon && (
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="text-[10px] text-rose-600 font-semibold hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Code (e.g. SURAT15)"
                          className="flex-1 bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-900 uppercase placeholder-neutral-400 focus:outline-none focus:border-[#f59e0b] shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon()}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white cursor-pointer shadow-2xs"
                        >
                          Apply
                        </button>
                      </div>

                      {/* Coupon pills */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {AVAILABLE_COUPONS.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => handleApplyCoupon(c.code)}
                            className={`text-[10px] px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                              appliedCoupon === c.code
                                ? "bg-amber-100 border-amber-400 text-amber-900 font-bold"
                                : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                            }`}
                          >
                            🏷️ {c.code} ({c.discountType === "percentage" ? `${c.value}%` : `₹${c.value}`} off)
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 5. Server-Calculated Order Breakdown */}
                    <div className="bg-white p-4 rounded-2xl border border-neutral-200/90 space-y-2 text-xs shadow-2xs">
                      <div className="flex justify-between text-neutral-500">
                        <span>Pass Subtotal ({pricing.quantity}x):</span>
                        <span className="font-mono text-neutral-900 font-medium">₹{pricing.subtotal.toLocaleString("en-IN")}</span>
                      </div>

                      {pricing.discount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-semibold">
                          <span>Coupon Discount:</span>
                          <span className="font-mono">-₹{pricing.discount.toLocaleString("en-IN")}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-neutral-400 text-[11px]">
                        <span>Platform & Turnstile Fee:</span>
                        <span className="font-mono">₹{pricing.platform_fee.toLocaleString("en-IN")}</span>
                      </div>

                      <div className="flex justify-between text-neutral-400 text-[11px]">
                        <span>GST (18% on fee):</span>
                        <span className="font-mono">₹{pricing.gst_tax.toLocaleString("en-IN")}</span>
                      </div>

                      <div className="flex justify-between text-neutral-900 font-bold text-sm pt-2.5 border-t border-neutral-100">
                        <span>Final Payable:</span>
                        <span className="text-neutral-950 font-mono text-base font-black">
                          {isCalculating ? "Calculating..." : `₹${pricing.final_amount.toLocaleString("en-IN")}`}
                        </span>
                      </div>
                    </div>

                    {/* Proceed CTA */}
                    <button
                      type="submit"
                      disabled={isCreatingOrder || isCalculating}
                      className="w-full py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                    >
                      {isCreatingOrder ? (
                        <span>Creating Razorpay Order...</span>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pay ₹{pricing.final_amount.toLocaleString("en-IN")} via Razorpay</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    
                    <div className="text-[10px] text-neutral-500 text-center flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Server-verified payments • 100% genuine wristband QR</span>
                    </div>

                  </form>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* ======================================================== */}
      {/* RAZORPAY PAYMENT MODAL (MOBILE / FALLBACK / TEST) */}
      {/* ======================================================== */}
      {showRazorpayModal && currentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071912]/90 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0c281e] border-2 border-[#f59e0b] rounded-3xl p-6 space-y-5 shadow-2xl glow-saffron">
            
            <div className="flex items-start justify-between border-b border-[#14382c] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#071912] border border-[#f59e0b]/40 flex items-center justify-center text-[#f59e0b] font-black text-sm">
                  ₹
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-white">
                    Razorpay Checkout
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    Order ID: {currentOrder.razorpay_order_id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowRazorpayModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Amount Banner */}
            <div className="bg-[#071912] p-4 rounded-2xl border border-[#14382c] text-center">
              <span className="text-[11px] text-slate-400 block font-semibold">Total Payable Amount</span>
              <div className="font-mono text-3xl font-black text-[#f59e0b]">
                ₹{currentOrder.amount.toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                For {currentOrder.customer_name} ({currentOrder.customer_phone})
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 text-xs">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Select Payment Method:
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "gpay", name: "Google Pay UPI", icon: Smartphone },
                  { id: "phonepe", name: "PhonePe UPI", icon: Smartphone },
                  { id: "paytm", name: "Paytm / BHIM", icon: Smartphone },
                  { id: "card", name: "Card / NetBanking", icon: CreditCard },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSel = selectedUpiMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedUpiMethod(m.id)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                        isSel
                          ? "bg-[#071912] border-[#f59e0b] text-white font-bold"
                          : "bg-[#071912]/60 border-[#14382c] text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <Icon className="w-4 h-4 text-[#f59e0b] shrink-0" />
                      <span className="truncate">{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Important Rule Notice */}
            <div className="bg-[#071912] p-3 rounded-xl border border-[#14382c] text-[11px] text-slate-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Payment will be authenticated by the server using Razorpay HMAC SHA256 signature verification before issuing the booking pass.
              </span>
            </div>

            {/* Complete Payment Button */}
            <button
              onClick={handleSimulatePayment}
              disabled={isVerifying}
              className="w-full py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-[#f59e0b] hover:bg-[#d97706] text-[#071912] flex items-center justify-center gap-2 shadow-lg shadow-[#f59e0b]/25 cursor-pointer"
            >
              {isVerifying ? (
                <span>Verifying Signature on Server...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authorize & Pay ₹{currentOrder.amount.toLocaleString("en-IN")}</span>
                </>
              )}
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
