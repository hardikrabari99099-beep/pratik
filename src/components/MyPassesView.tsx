import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Ticket,
  Search,
  Share2,
  Printer,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Copy,
  Check,
  Sparkles
} from "lucide-react";
import type { Booking } from "../lib/types";
import { getStoredBookings } from "../lib/storage";

interface MyPassesViewProps {
  initialBookingId?: string | null;
  onNotify: (msg: string) => void;
}

export const MyPassesView: React.FC<MyPassesViewProps> = ({
  initialBookingId,
  onNotify,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialBookingId || "");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    const list = getStoredBookings();
    setBookings(list);
    if (initialBookingId) {
      const match = list.find((b) => b.id.toLowerCase() === initialBookingId.toLowerCase());
      if (match) setSelectedBooking(match);
      else if (list.length > 0) setSelectedBooking(list[0]);
    } else if (list.length > 0) {
      setSelectedBooking(list[0]);
    }

    const handler = (e: any) => {
      setBookings(e.detail || getStoredBookings());
    };
    window.addEventListener("bookings_updated", handler);
    return () => window.removeEventListener("bookings_updated", handler);
  }, [initialBookingId]);

  useEffect(() => {
    if (!selectedBooking) return;
    const qrPayload = JSON.stringify({
      id: selectedBooking.id,
      event: selectedBooking.event_name,
      holder: selectedBooking.name,
      tier: selectedBooking.pass_name,
      qty: selectedBooking.qty,
      night: selectedBooking.night,
      status: selectedBooking.status,
      sec: "SURAT-VERIFIED-GATE-PASS",
    });

    QRCode.toDataURL(qrPayload, {
      width: 250,
      margin: 1,
      color: {
        dark: "#0c281e",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Code Error:", err));
  }, [selectedBooking]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const clean = searchQuery.trim().toLowerCase();
    const match = bookings.find(
      (b) =>
        (b.id || "").toLowerCase().includes(clean) ||
        (b.booking_id || "").toLowerCase().includes(clean) ||
        (b.phone || b.customer_phone || "").toLowerCase().includes(clean) ||
        (b.name || b.customer_name || "").toLowerCase().includes(clean)
    );

    if (match) {
      setSelectedBooking(match);
      onNotify(`Pass #${match.id} loaded!`);
    } else {
      onNotify("No pass found with that Booking ID or Phone Number.");
    }
  };

  const handleCopyPassId = () => {
    if (!selectedBooking) return;
    navigator.clipboard.writeText(selectedBooking.id);
    setCopiedId(true);
    onNotify(`Pass ID #${selectedBooking.id} copied!`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!selectedBooking) return;
    const message = `🎟️ *MY AAPNOPASS DIGITAL ENTRY TICKET*
Pass ID: *${selectedBooking.id}*
Event: *${selectedBooking.event_name}*
Tier: ${selectedBooking.pass_name} (${selectedBooking.qty}x)
Date / Night: ${selectedBooking.night}
Holder: ${selectedBooking.name || selectedBooking.customer_name || "Guest"}
Status: *VERIFIED & READY FOR GATE SCAN* ✅

Pass details link: ${window.location.origin}/#pass-${selectedBooking.id}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Title & Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-200">
              <Ticket className="w-5 h-5 text-[#f59e0b]" />
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-neutral-900">
              My Digital Passes
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Display your official QR entry pass at venue turnstiles for instant wristband verification.
          </p>
        </div>

        {/* Search Pass */}
        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Pass ID (e.g. AP-SURAT-8921)"
              className="w-full bg-white border border-neutral-200 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#f59e0b] shadow-2xs"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white transition cursor-pointer shrink-0 shadow-2xs"
          >
            Find
          </button>
        </form>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-neutral-200 shadow-xs space-y-3">
          <Ticket className="w-12 h-12 text-neutral-400 mx-auto" />
          <h3 className="font-display font-bold text-lg text-neutral-900">No passes found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            You haven't booked any passes yet. Explore Surat events and book online for instant digital entry.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: List of User Passes */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 px-1">
              Your Booked Passes ({bookings.length})
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {bookings.map((b) => {
                const isSelected = selectedBooking?.id === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-amber-50/70 border-amber-400 shadow-sm"
                        : "bg-white border-neutral-200/90 hover:border-neutral-300 shadow-2xs"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
                          #{b.id}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded">
                          {b.status}
                        </span>
                      </div>
                      <h4 className="font-display font-bold text-sm text-neutral-900 mt-1.5 line-clamp-1">
                        {b.event_name}
                      </h4>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        {b.pass_name} • {b.night}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-xs text-neutral-900">
                        ₹{b.total.toLocaleString("en-IN")}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-medium">
                        Qty: {b.qty}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Pixel-Perfect Digital Pass Ticket */}
          {selectedBooking && (
            <div className="lg:col-span-7 space-y-4">
              
              {/* Ticket Container with Notch styling */}
              <div className="relative bg-neutral-950 text-white border-2 border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden ticket-notch-l ticket-notch-r">
                
                {/* Holographic Watermark Header */}
                <div className="flex items-start justify-between border-b border-dashed border-neutral-800 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-[#f59e0b] font-display font-black text-2xl shadow-lg">
                      આ
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#f59e0b] block">
                        Official Gate Pass • Surat Live
                      </span>
                      <h2 className="font-display font-black text-xl sm:text-2xl text-white">
                        AapnoPass VIP Gate Entry
                      </h2>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-mono text-neutral-400 uppercase">Status</div>
                    <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{selectedBooking.status.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Event & Pass Details */}
                <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  
                  {/* Left info */}
                  <div className="md:col-span-7 space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                        Event
                      </span>
                      <h3 className="font-display font-black text-xl text-white leading-tight mt-0.5">
                        {selectedBooking.event_name}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Pass Type</span>
                        <span className="text-[#f59e0b] font-bold block">{selectedBooking.pass_name}</span>
                        <span className="text-[10px] text-neutral-400">Quantity: {selectedBooking.qty} Person(s)</span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Night / Schedule</span>
                        <span className="text-white font-medium block">{selectedBooking.night}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-neutral-800">
                      <div>
                        <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Pass Holder</span>
                        <span className="text-white font-medium block truncate">{selectedBooking.name || selectedBooking.customer_name || "Guest"}</span>
                        <span className="text-[10px] text-neutral-400">{selectedBooking.phone || selectedBooking.customer_phone || ""}</span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Booking ID</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono font-bold text-[#f59e0b]">{selectedBooking.id}</span>
                          <button
                            onClick={handleCopyPassId}
                            className="text-neutral-400 hover:text-white cursor-pointer"
                          >
                            {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Dynamic High-Res QR Code */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-neutral-900 rounded-2xl border border-neutral-800 text-center space-y-2">
                    {qrDataUrl ? (
                      <div className="bg-white p-2 rounded-xl shadow-xl">
                        <img
                          src={qrDataUrl}
                          alt="Gate Entry QR"
                          className="w-36 h-36 object-contain mx-auto"
                        />
                      </div>
                    ) : (
                      <div className="w-36 h-36 bg-neutral-800 animate-pulse rounded-xl" />
                    )}

                    <div className="text-[10px] uppercase font-mono font-bold text-[#f59e0b] tracking-wider">
                      ★ SCAN AT VENUE TURNSTILE ★
                    </div>
                    <div className="text-[9px] text-neutral-400">
                      Security hash • Watermarked pass
                    </div>
                  </div>

                </div>

                {/* Perforation Line & Gate Rules */}
                <div className="border-t border-dashed border-neutral-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Bring valid Govt photo ID along with this digital pass.</span>
                  </div>

                  <div className="font-mono text-[11px] text-neutral-400">
                    AUTH #{selectedBooking.id}-SEC
                  </div>
                </div>

              </div>

              {/* Action Buttons: Print, WhatsApp, Download */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleShareWhatsApp}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Pass on WhatsApp</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold bg-white hover:bg-neutral-50 text-neutral-800 flex items-center justify-center gap-2 transition cursor-pointer border border-neutral-200 shadow-2xs"
                >
                  <Printer className="w-4 h-4 text-neutral-500" />
                  <span>Print Ticket</span>
                </button>

                <button
                  onClick={handleCopyPassId}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold bg-white hover:bg-neutral-50 text-amber-700 flex items-center justify-center gap-2 transition cursor-pointer border border-neutral-200 shadow-2xs"
                >
                  {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedId ? "Copied" : "Copy Pass ID"}</span>
                </button>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
};
