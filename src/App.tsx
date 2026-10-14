/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Search,
  MapPin,
  Calendar,
  Ticket,
  Flame,
  ArrowRight,
  ShieldCheck,
  Filter,
  Layers,
  ChevronDown,
  Users,
  Trophy,
  CheckCircle2,
  Clock,
  Mic,
  Star,
  Info,
  QrCode,
  Lock
} from "lucide-react";

import heroGarba from "./assets/hero-garba.jpg";
import type { EventItem } from "./lib/types";
import {
  getStoredEvents,
  SURAT_AREAS,
  CATEGORIES,
  DEFAULT_SETTINGS,
  isAdminAuthenticated,
  logoutAdmin
} from "./lib/storage";
import { Header } from "./components/Header";
import { EventCard } from "./components/EventCard";
import { EventDetailModal } from "./components/EventDetailModal";
import { FastTicketCopierModal } from "./components/FastTicketCopierModal";
import { AdminLoginModal } from "./components/AdminLoginModal";
import { MyPassesView } from "./components/MyPassesView";
import { AdminConsole } from "./components/AdminConsole";
import { SportsTurfView } from "./components/SportsTurfView";
import { Footer } from "./components/Footer";

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("events");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isCopierOpen, setIsCopierOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(isAdminAuthenticated());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedArea, setSelectedArea] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc">("featured");
  const [viewPassId, setViewPassId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load events and subscribe to updates
  useEffect(() => {
    setEvents(getStoredEvents());

    const handleEventsUpdated = (e: any) => {
      setEvents(e.detail || getStoredEvents());
    };
    const handleAuthUpdated = (e: any) => {
      setIsAdminLoggedIn(e.detail);
    };

    window.addEventListener("events_updated", handleEventsUpdated);
    window.addEventListener("admin_auth_changed", handleAuthUpdated);

    return () => {
      window.removeEventListener("events_updated", handleEventsUpdated);
      window.removeEventListener("admin_auth_changed", handleAuthUpdated);
    };
  }, []);

  const notify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const handleSelectTab = (tab: string) => {
    if (tab === "admin" && !isAdminLoggedIn) {
      setIsAdminLoginOpen(true);
      return;
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = () => {
    logoutAdmin();
    setIsAdminLoggedIn(false);
    if (currentTab === "admin") {
      setCurrentTab("events");
    }
    notify("Logged out of organizer panel.");
  };

  // Filter & Sort events
  const filteredEvents = events.filter((e) => {
    if (!e.active) return false;
    
    // Category filter
    if (selectedCategory === "navratri" && e.category !== "navratri") return false;
    if (selectedCategory === "trending" && !e.isTrending && !e.isFeatured) return false;
    if (selectedCategory === "concerts" && e.category !== "concerts" && e.eventType !== "Live Music") return false;

    // Area filter
    if (selectedArea !== "All" && e.area.toLowerCase() !== selectedArea.toLowerCase()) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        e.name.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.area.toLowerCase().includes(q) ||
        e.artist.toLowerCase().includes(q) ||
        e.eventType.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Sorting
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const minA = a.passes?.length ? Math.min(...a.passes.map((p) => p.price)) : 499;
    const minB = b.passes?.length ? Math.min(...b.passes.map((p) => p.price)) : 499;

    if (sortBy === "price-asc") return minA - minB;
    if (sortBy === "price-desc") return minB - minA;
    return (a.sort || 99) - (b.sort || 99);
  });

  const featuredEvent = events[0] || null;
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-neutral-900 flex flex-col font-sans selection:bg-[#f59e0b] selection:text-neutral-950">
      
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-amber-400 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-bounce text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
        onLogoutAdmin={handleLogout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedArea={selectedArea}
        onAreaChange={setSelectedArea}
      />

      {/* View Switcher */}
      <main className="flex-1">
        {currentTab === "my-passes" ? (
          <MyPassesView initialBookingId={viewPassId} onNotify={notify} />
        ) : currentTab === "sports" ? (
          <SportsTurfView onNotify={notify} />
        ) : currentTab === "admin" ? (
          <AdminConsole
            onOpenFastTicketCopier={() => setIsCopierOpen(true)}
            onLogout={handleLogout}
            onNotify={notify}
          />
        ) : (
          /* DEFAULT: PUBLIC SURAT EVENTS HOME VIEW */
          <div className="space-y-12 pb-20">
            
            {/* EDITORIAL HERO BANNER FROM VIDEO PROTOTYPE */}
            <section className="relative overflow-hidden bg-white border-b border-neutral-200/90 py-16 sm:py-24">
              
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-100/40 rounded-full blur-3xl pointer-events-none -mr-40 -mt-20" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-100/30 rounded-full blur-3xl pointer-events-none -ml-32 -mb-20" />
              <div className="pattern-dots absolute inset-0 opacity-40 pointer-events-none" />

              <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 md:grid-cols-[1.3fr_1fr]">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-ping" />
                    <span>SURAT NI NAVRATRI 2026 • OFFICIAL PASS PORTAL</span>
                  </div>
                  
                  <h1 className="mt-5 font-display font-black text-4xl sm:text-5xl md:text-6xl leading-[1.08] text-neutral-900 tracking-tight">
                    Experience Surat’s Most Celebrated Festive & Musical Nights.
                  </h1>

                  <p className="mt-5 max-w-lg text-base sm:text-lg text-neutral-600 leading-relaxed font-normal">
                    Direct gate entry with instant QR codes, 100% verified organizers, and seamless Razorpay checkout for couples, season passes, and VIP arenas across Surat.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        const el = document.getElementById("events-catalog");
                        el?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="rounded-full bg-neutral-900 hover:bg-neutral-800 px-7 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg transition cursor-pointer flex items-center gap-2"
                    >
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span>Explore Navratri Passes</span>
                    </button>

                    <button
                      onClick={() => handleSelectTab("my-passes")}
                      className="rounded-full bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 px-6 py-3.5 text-xs sm:text-sm font-semibold text-neutral-800 transition cursor-pointer flex items-center gap-2"
                    >
                      <Ticket className="w-4 h-4 text-[#f59e0b]" />
                      <span>Download Digital Pass</span>
                    </button>
                  </div>

                  {/* Highlights row */}
                  <div className="mt-10 pt-6 border-t border-neutral-200 grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <div className="font-display font-black text-2xl text-neutral-900">15+</div>
                      <div className="text-[11px] text-neutral-500 font-medium">Surat Arenas & Domes</div>
                    </div>
                    <div>
                      <div className="font-display font-black text-2xl text-emerald-600">100%</div>
                      <div className="text-[11px] text-neutral-500 font-medium">Verified Turnstile QR</div>
                    </div>
                    <div>
                      <div className="font-display font-black text-2xl text-amber-600">₹499</div>
                      <div className="text-[11px] text-neutral-500 font-medium">Passes Starting</div>
                    </div>
                  </div>
                </div>

                {/* Rotated PassCard preview from video prototype */}
                {featuredEvent && (
                  <div className="hidden justify-center md:flex">
                    <div className="rotate-2 hover:rotate-0 transition-transform duration-300">
                      <div className="ticket-notch w-80 rounded-3xl bg-neutral-950 border-2 border-neutral-800 p-6 text-white shadow-2xl">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em]">
                          <span className="text-[#f59e0b] font-bold">AapnoPass VIP</span>
                          <span className="text-neutral-400 font-mono">AP-SURAT-8921</span>
                        </div>
                        
                        <p className="mt-3 font-display font-black text-xl leading-snug text-white">
                          {featuredEvent.name}
                        </p>
                        
                        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-neutral-400 text-[10px] uppercase font-semibold">Attendee</p>
                            <p className="font-bold text-white">Hardik Rabari</p>
                          </div>
                          <div>
                            <p className="text-neutral-400 text-[10px] uppercase font-semibold">Dates</p>
                            <p className="font-bold text-white">{featuredEvent.dates}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-neutral-400 text-[10px] uppercase font-semibold">Pass Tier</p>
                            <p className="font-bold text-[#f59e0b]">VIP Season Pass (All 9 Nights)</p>
                          </div>
                        </div>

                        <div className="my-4 border-t border-dashed border-neutral-800" />

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[11px] text-neutral-400 font-medium">Turnstile Speed Entry</p>
                            <p className="text-[10px] text-emerald-400 font-bold">● RFID Wristband Included</p>
                          </div>
                          <div className="bg-white p-1 rounded-xl shadow">
                            <QrCode className="w-12 h-12 text-neutral-950" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* CATALOG SECTION */}
            <div id="events-catalog" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
              
              {/* Category Pills Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        isSelected
                          ? "bg-neutral-900 text-white shadow-sm"
                          : "bg-white border border-neutral-200/90 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Filter & Sort Sub-bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-neutral-200/90 shadow-2xs">
                
                {/* Area Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-neutral-500 mr-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#f59e0b]" />
                    <span>Area:</span>
                  </span>
                  {SURAT_AREAS.map((area) => (
                    <button
                      key={area}
                      onClick={() => setSelectedArea(area)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition cursor-pointer ${
                        selectedArea === area
                          ? "bg-neutral-900 text-white font-bold shadow-2xs"
                          : "bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>

                {/* Sort Option */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-neutral-500 font-semibold">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 text-xs text-neutral-800 focus:outline-none focus:border-[#f59e0b] cursor-pointer"
                  >
                    <option value="featured">Featured / Trending</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Event Cards Grid */}
              {sortedEvents.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-neutral-200 shadow-xs space-y-3">
                  <Filter className="w-10 h-10 text-neutral-400 mx-auto" />
                  <h3 className="font-display font-bold text-lg text-neutral-900">
                    No events found matching your filters
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Try clearing the search query or selecting "All" areas.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                      setSelectedArea("All");
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-900 text-white cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedEvents.map((ev) => (
                    <EventCard
                      key={ev.id}
                      event={ev}
                      onSelect={(e) => setSelectedEvent(e)}
                      onNotify={notify}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* DISTINCTIVE YELLOW ORGANIZER BANNER FROM VIDEO PROTOTYPE */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="bg-[#FEEA85] text-neutral-950 border border-amber-300/80 rounded-3xl p-8 sm:p-10 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-300/40 rounded-full blur-2xl pointer-events-none -mr-20 -mt-20" />

                <div className="space-y-3 max-w-xl text-center md:text-left relative z-10">
                  <span className="text-[10px] uppercase font-black tracking-widest bg-neutral-950 text-amber-300 px-3 py-1 rounded-full inline-block">
                    FOR EVENT HOSTS & DOME ORGANIZERS
                  </span>
                  
                  <h3 className="font-display font-black text-2xl sm:text-3xl text-neutral-950 leading-tight">
                    Host your Garba Mahotsav or Concert with AapnoPass
                  </h3>

                  <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed font-medium">
                    Deploy anti-counterfeit QR ticketing, automated turnstile gate check-ins, live revenue settlement via Razorpay, and instant WhatsApp pass broadcast to thousands of attendees.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 relative z-10 w-full md:w-auto">
                  <button
                    onClick={() => setIsAdminLoginOpen(true)}
                    className="w-full sm:w-auto px-6 py-3 rounded-full text-xs font-bold bg-neutral-950 text-white hover:bg-neutral-800 transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Organizer Console</span>
                  </button>
                  <a
                    href="https://wa.me/919825049909?text=Hello%2C%20I%20am%20an%20event%20organizer%20in%20Surat%20interested%20in%20listing%20our%20event%20on%20AapnoPass."
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-5 py-3 rounded-full text-xs font-bold bg-white/90 hover:bg-white text-neutral-900 border border-amber-300/80 transition cursor-pointer text-center"
                  >
                    WhatsApp Desk
                  </a>
                </div>
              </div>
            </section>

            {/* HOW IT WORKS / BANDHANI CULTURAL STEPS SECTION */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="grid gap-6 rounded-3xl bg-white border border-neutral-200/90 p-8 sm:p-10 shadow-xs md:grid-cols-4">
                {[
                  {
                    step: "01",
                    title: "Select Garba Arena",
                    desc: "Choose from Surat's premier festive grounds including Sarsana Dome, VR Mall, and Tapi Riverfront.",
                  },
                  {
                    step: "02",
                    title: "Choose Night & Pass",
                    desc: "Pick Single Day, Couple, or All 9 Nights Season Pass with real-time pass availability.",
                  },
                  {
                    step: "03",
                    title: "Instant UPI Checkout",
                    desc: "Pay securely via Google Pay, PhonePe, Paytm, or BHIM with instant pass issuance via Razorpay.",
                  },
                  {
                    step: "04",
                    title: "Wristband Gate Entry",
                    desc: "Show your digital pass QR at the turnstile gate for high-speed security check-in.",
                  },
                ].map((s) => (
                  <div key={s.step} className="space-y-2">
                    <p className="text-[#f59e0b] font-mono font-black text-2xl tracking-tight">
                      {s.step}
                    </p>
                    <h4 className="font-display font-bold text-lg text-neutral-900">
                      {s.title}
                    </h4>
                    <p className="text-xs text-neutral-600 leading-relaxed font-normal">
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* ACCORDION FAQ SECTION FROM VIDEO PROTOTYPE */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 space-y-4">
              <div className="text-center space-y-1.5 mb-8">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#f59e0b] bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  NEED HELP?
                </span>
                <h3 className="font-display font-black text-2xl sm:text-3xl text-neutral-900">
                  A few things you might be wondering.
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500">
                  Everything you need to know about Navratri Garba passes and digital check-ins in Surat.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    q: "How do I receive my pass after paying with Razorpay?",
                    a: "Upon completing your payment via Google Pay, PhonePe, Paytm, or Card, your digital pass with an anti-counterfeit QR code is generated instantly. You can access it anytime under the 'My Passes' tab, download the PDF, or save the ticket image to your phone.",
                  },
                  {
                    q: "What payment methods are supported on AapnoPass?",
                    a: "We support 100% of Indian payment methods through Razorpay: UPI Apps (GPay, PhonePe, Paytm, BHIM, CRED), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking (over 50+ Indian banks), and Wallets.",
                  },
                  {
                    q: "Is traditional Gujarati attire mandatory at Surat Garba venues?",
                    a: "Yes! At all major venues (SIECC Sarsana, VR Festive Lawns, Althan Grounds, Dumas Road Domes), authentic traditional attire—Chaniya Choli for women and Kedia/Kurta Pajama for men—is strictly required to enter the dancing arena.",
                  },
                  {
                    q: "How does gate QR entry work at the venue?",
                    a: "Show the verified QR code from your 'My Passes' screen to the gate turnstile scanner. Once scanned, security staff issues your official RFID/cloth wristband for entry. Note that used passes cannot be re-scanned.",
                  },
                  {
                    q: "Can I use discount coupon codes on my booking?",
                    a: "Yes! Use coupon 'SURAT15' for 15% off up to ₹500, 'NAVRATRI100' for a flat ₹100 instant cash discount, or 'AAPNOPASS' for 10% off. The final payable amount is calculated server-side before initiating payment.",
                  },
                  {
                    q: "Are season passes valid for all 9 nights?",
                    a: "Yes, Season Passes give unlimited access for all nine nights of Navratri with a dedicated priority entry turnstile lane at the venue.",
                  },
                ].map((faq, i) => {
                  const isOpen = openFaqIndex === i;
                  return (
                    <div
                      key={i}
                      className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden transition-all duration-200 shadow-2xs"
                    >
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                        className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50/60 transition"
                      >
                        <span className="font-bold text-neutral-900 text-sm sm:text-base">
                          {faq.q}
                        </span>
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                            isOpen ? "bg-neutral-900 text-white rotate-180" : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-4 sm:px-5 pb-5 pt-1 text-neutral-600 text-xs sm:text-sm leading-relaxed border-t border-neutral-100">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

          </div>
        )}
      </main>

      {/* Footer */}
      <Footer
        onSelectTab={handleSelectTab}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Interactive Event Detail & Booking Modal */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onViewPass={(bookingId) => {
          setViewPassId(bookingId);
          setCurrentTab("my-passes");
        }}
        onNotify={notify}
      />

      {/* Admin Login Modal (Accessible only from side login) */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={() => {
          setIsAdminLoggedIn(true);
          setCurrentTab("admin");
        }}
        onNotify={notify}
      />

      {/* FastTicket Copier & Importer Modal (Accessible only inside Admin Console) */}
      <FastTicketCopierModal
        isOpen={isCopierOpen}
        onClose={() => setIsCopierOpen(false)}
        onEventImported={(newEvent) => {
          setEvents(getStoredEvents());
          setSelectedEvent(newEvent);
        }}
        onNotify={notify}
      />

    </div>
  );
}
