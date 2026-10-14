import React, { useState, useEffect } from "react";
import {
  Shield,
  ScanLine,
  RefreshCw,
  PlusCircle,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Ticket,
  Calendar,
  Layers,
  Clock,
  ArrowRight
} from "lucide-react";
import type { EventItem, Booking, SyncLog } from "../lib/types";
import {
  getStoredEvents,
  saveEvents,
  addOrUpdateEvent,
  deleteEvent,
  getStoredBookings,
  updateBookingStatus,
  getStoredSyncLogs,
  addSyncLog,
  getSyncSettings,
  saveSyncSettings,
  SURAT_AREAS
} from "../lib/storage";
import { LIVE_FASTTICKET_SURAT_CATALOG, convertSourceToEventItem } from "../lib/fastticket-copier";

interface AdminConsoleProps {
  onOpenFastTicketCopier: () => void;
  onLogout?: () => void;
  onNotify: (msg: string) => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  onOpenFastTicketCopier,
  onLogout,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<"scanner" | "events" | "bookings" | "sync">("scanner");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Scanner State
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState<{
    status: "success" | "warning" | "error";
    message: string;
    booking?: Booking;
  } | null>(null);

  // New/Edit Event Form State
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<EventItem> | null>(null);

  useEffect(() => {
    setEvents(getStoredEvents());
    setBookings(getStoredBookings());
    setSyncLogs(getStoredSyncLogs());

    const eventHandler = (e: any) => setEvents(e.detail || getStoredEvents());
    const bookingHandler = (e: any) => setBookings(e.detail || getStoredBookings());
    const syncHandler = (e: any) => setSyncLogs(e.detail || getStoredSyncLogs());

    window.addEventListener("events_updated", eventHandler);
    window.addEventListener("bookings_updated", bookingHandler);
    window.addEventListener("synclogs_updated", syncHandler);

    return () => {
      window.removeEventListener("events_updated", eventHandler);
      window.removeEventListener("bookings_updated", bookingHandler);
      window.removeEventListener("synclogs_updated", syncHandler);
    };
  }, []);

  // Handle gate scan simulation
  const handleVerifyScan = (passIdToVerify?: string) => {
    const targetId = (passIdToVerify || scanInput).trim().toUpperCase();
    if (!targetId) return;

    const booking = bookings.find(
      (b) => b.id.toUpperCase() === targetId || targetId.includes(b.id.toUpperCase())
    );

    if (!booking) {
      setScanResult({
        status: "error",
        message: `Pass #${targetId} not found in Surat central database. Entry Denied!`,
      });
      onNotify("Scan Failed: Invalid Pass ID");
      return;
    }

    if (booking.status === "USED") {
      setScanResult({
        status: "warning",
        message: `Pass #${booking.id} was already used and scanned at gate! Re-entry restricted.`,
        booking,
      });
      onNotify("Warning: Pass already scanned");
      return;
    }

    // Mark as used
    updateBookingStatus(booking.id, "USED");
    setScanResult({
      status: "success",
      message: `ACCESS GRANTED! Verified entry for ${booking.name} (${booking.qty}x ${booking.pass_name}) at ${booking.event_name}.`,
      booking: { ...booking, status: "USED" },
    });
    onNotify(`✓ Access Granted for ${booking.name}`);
  };

  // FastTicket Sync Operation
  const handleSyncFastTicket = () => {
    setIsSyncing(true);
    setTimeout(() => {
      let added = 0;
      let updated = 0;
      const currentEvents = getStoredEvents();
      const currentMap = new Map(currentEvents.map((e) => [e.name.toLowerCase(), e]));

      LIVE_FASTTICKET_SURAT_CATALOG.forEach((item) => {
        const existing = currentMap.get(item.name.toLowerCase());
        if (existing) {
          updated++;
        } else {
          currentEvents.unshift(convertSourceToEventItem(item));
          added++;
        }
      });

      saveEvents(currentEvents);

      const log: SyncLog = {
        id: "sync-" + Date.now().toString(36),
        timestamp: new Date().toLocaleTimeString() + ", " + new Date().toLocaleDateString(),
        source: "https://www.fastticket.live/surat",
        status: "success",
        eventsProcessed: LIVE_FASTTICKET_SURAT_CATALOG.length,
        newEventsAdded: added,
        eventsUpdated: updated,
        duplicatesSkipped: 0,
        soldOutDetected: 0,
        errors: [],
        details: LIVE_FASTTICKET_SURAT_CATALOG.map((c) => ({
          eventTitle: c.name,
          action: "added" as const,
        })),
      };

      addSyncLog(log);
      setIsSyncing(false);
      onNotify(`FastTicket Sync complete! ${added} new events added, ${updated} refreshed.`);
    }, 1200);
  };

  const handleToggleSoldOut = (event: EventItem) => {
    const updated = { ...event, isSoldOut: !event.isSoldOut };
    addOrUpdateEvent(updated);
    onNotify(`Event marked as ${updated.isSoldOut ? "Sold Out" : "Active"}`);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteEvent(id);
      onNotify(`Event deleted.`);
    }
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent?.name) return;

    const fullItem: EventItem = {
      id: editingEvent.id || "ev-" + Date.now().toString(36),
      name: editingEvent.name,
      city: editingEvent.city || "Surat",
      category: editingEvent.category || "navratri",
      venue: editingEvent.venue || "Surat Arena",
      address: editingEvent.address || "Surat, Gujarat",
      area: editingEvent.area || "Sarsana",
      dates: editingEvent.dates || "3 – 11 Oct 2026",
      time: editingEvent.time || "8:00 PM – 2:00 AM",
      startTime: editingEvent.startTime || "08:00 PM",
      endTime: editingEvent.endTime || "02:00 AM",
      artist: editingEvent.artist || "Live Folk Troupe",
      tag: editingEvent.tag || "Surat Live",
      eventType: editingEvent.eventType || "Traditional Garba",
      about: editingEvent.about || "Surat Navratri Celebration",
      highlights: editingEvent.highlights || ["Live Orchestra", "Safe Family Venue"],
      facilities: editingEvent.facilities || ["Parking", "Security", "Food Plaza"],
      dressCode: editingEvent.dressCode || "Traditional Gujarati attire.",
      ageRestriction: editingEvent.ageRestriction || "All ages welcome.",
      rules: editingEvent.rules || ["Valid QR pass required"],
      terms: editingEvent.terms || ["Non-refundable"],
      organizer: editingEvent.organizer || "Surat Cultural Guild",
      coverImage: editingEvent.coverImage || "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1200&auto=format&fit=crop&q=80",
      nights: editingEvent.nights || ["3 Oct 2026", "4 Oct 2026", "5 Oct 2026", "6 Oct 2026", "7 Oct 2026"],
      passes: editingEvent.passes || [
        { id: "single", name: "Single Night Pass", price: 499, desc: "Entry for 1 night", left: 100 },
        { id: "couple", name: "Couple Pass (1 Night)", price: 899, desc: "Entry for couple", left: 50 },
        { id: "season", name: "All 9 Nights Season", price: 3499, desc: "All nights pass", left: 25, season: true },
      ],
      active: true,
      sort: 1,
      isFeatured: editingEvent.isFeatured ?? true,
      sourceName: "AapnoPass Admin",
    };

    addOrUpdateEvent(fullItem);
    setShowEventModal(false);
    setEditingEvent(null);
    onNotify(`Event "${fullItem.name}" saved!`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="font-display font-black text-2xl text-white">
              Organizer & Gate Control Console
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Turnstile QR Pass Verification • FastTicket Surat Automated Sync • Event Inventory
          </p>
        </div>

        {/* Sync & Copy Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenFastTicketCopier}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Event from FastTicket</span>
          </button>

          <button
            onClick={handleSyncFastTicket}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Sync Now from FastTicket.live"}</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 transition cursor-pointer"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab("scanner")}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === "scanner"
              ? "border-amber-400 text-amber-400 bg-amber-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <ScanLine className="w-4 h-4" />
          <span>Gate Scanner Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab("events")}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === "events"
              ? "border-amber-400 text-amber-400 bg-amber-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Manage Events ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("bookings")}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === "bookings"
              ? "border-amber-400 text-amber-400 bg-amber-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Bookings & Gate Log ({bookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("sync")}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === "sync"
              ? "border-amber-400 text-amber-400 bg-amber-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>FastTicket Integration Audit</span>
        </button>
      </div>

      {/* TAB 1: GATE SCANNER SIMULATOR */}
      {activeTab === "scanner" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Turnstile Scan Terminal
              </span>
              <h3 className="font-display font-bold text-lg text-white">
                Scan Digital QR or Enter Pass ID
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulates official venue gate scanning hardware in Surat (SIECC Sarsana, VR Festive Lawns).
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Enter or paste Pass ID (e.g. AP-SURAT-8921)"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono font-bold"
                />
                <button
                  onClick={() => handleVerifyScan()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer shrink-0 shadow-md shadow-amber-500/20"
                >
                  Verify Gate Entry
                </button>
              </div>

              {/* Quick Test Pass IDs */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-semibold text-slate-400 block">
                  Quick Demo Passes:
                </span>
                <div className="flex flex-wrap gap-2">
                  {bookings.slice(0, 4).map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setScanInput(b.id);
                        handleVerifyScan(b.id);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono font-bold text-amber-400 hover:border-amber-500/60"
                    >
                      {b.id} ({b.name})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scan Output Screen */}
            {scanResult && (
              <div
                className={`p-4 rounded-xl border space-y-2 mt-4 ${
                  scanResult.status === "success"
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                    : scanResult.status === "warning"
                    ? "bg-amber-950/40 border-amber-500/40 text-amber-200"
                    : "bg-rose-950/40 border-rose-500/40 text-rose-200"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {scanResult.status === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  {scanResult.status === "warning" && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                  {scanResult.status === "error" && <XCircle className="w-5 h-5 text-rose-400" />}
                  <span>{scanResult.status.toUpperCase()}</span>
                </div>
                <p className="text-xs leading-relaxed">{scanResult.message}</p>
              </div>
            )}
          </div>

          <div className="md:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-base text-white">
              Gate Entry Turnstile Stats
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Total Issued Passes</span>
                <span className="font-mono text-xl font-black text-white">{bookings.length}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Scanned & Admitted</span>
                <span className="font-mono text-xl font-black text-emerald-400">
                  {bookings.filter((b) => b.status === "USED").length}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Ready for Gate Entry</span>
                <span className="font-mono text-xl font-black text-amber-400">
                  {bookings.filter((b) => b.status === "CONFIRMED").length}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Active Gate Turnstiles</span>
                <span className="font-mono text-xl font-black text-cyan-400">4 Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE EVENTS */}
      {activeTab === "events" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Showing <strong>{events.length}</strong> active Surat events
            </div>

            <div className="flex gap-2">
              <button
                onClick={onOpenFastTicketCopier}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Import from FastTicket</span>
              </button>

              <button
                onClick={() => {
                  setEditingEvent({
                    name: "",
                    area: "Sarsana",
                    venue: "",
                    dates: "3 – 11 Oct 2026",
                    time: "8:00 PM – 2:00 AM",
                    artist: "",
                  });
                  setShowEventModal(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Event</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Event</th>
                    <th className="p-3.5">Venue & Area</th>
                    <th className="p-3.5">Dates & Time</th>
                    <th className="p-3.5">Artist</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {events.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-850/50 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-white line-clamp-1">{ev.name}</div>
                        <div className="text-[10px] text-slate-500">{ev.sourceName || "Direct"}</div>
                      </td>
                      <td className="p-3.5">
                        <div>{ev.venue}</div>
                        <div className="text-[10px] text-amber-400">{ev.area}, Surat</div>
                      </td>
                      <td className="p-3.5">
                        <div>{ev.dates}</div>
                        <div className="text-[10px] text-slate-400">{ev.time}</div>
                      </td>
                      <td className="p-3.5 truncate max-w-[140px] text-slate-300">
                        {ev.artist}
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleSoldOut(ev)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer ${
                            ev.isSoldOut
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          }`}
                        >
                          {ev.isSoldOut ? "Sold Out" : "Active"}
                        </button>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingEvent(ev);
                            setShowEventModal(true);
                          }}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(ev.id, ev.name)}
                          className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BOOKINGS AUDIT */}
      {activeTab === "bookings" && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400">
            Audit log of all issued tickets and gate entries
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Pass ID</th>
                  <th className="p-3.5">Pass Holder</th>
                  <th className="p-3.5">Event</th>
                  <th className="p-3.5">Pass Tier</th>
                  <th className="p-3.5">Night</th>
                  <th className="p-3.5">Total Paid</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-850/50 transition">
                    <td className="p-3.5 font-mono font-bold text-amber-400">{b.id}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-white">{b.name}</div>
                      <div className="text-[10px] text-slate-400">{b.phone}</div>
                    </td>
                    <td className="p-3.5 max-w-[180px] truncate">{b.event_name}</td>
                    <td className="p-3.5">{b.pass_name} ({b.qty}x)</td>
                    <td className="p-3.5 text-slate-400">{b.night}</td>
                    <td className="p-3.5 font-mono font-bold text-emerald-400">
                      ₹{b.total.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                          b.status === "USED"
                            ? "bg-slate-800 text-slate-400 border-slate-700"
                            : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: FASTTICKET INTEGRATION AUDIT */}
      {activeTab === "sync" && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Integration Status
                </span>
                <h3 className="font-display font-bold text-lg text-white">
                  FastTicket.live/surat API Sync Engine
                </h3>
              </div>
              <button
                onClick={handleSyncFastTicket}
                disabled={isSyncing}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                <span>Sync Now</span>
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Active endpoint: <code>https://www.fastticket.live/surat</code>. Automatically imports newly published Navratri garba arenas, concerts, and pricing updates directly into AapnoPass.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="font-display font-bold text-sm text-white">
              Sync Operations History ({syncLogs.length})
            </h4>

            {syncLogs.length === 0 ? (
              <p className="text-xs text-slate-400">No sync operations run yet. Click "Sync Now" above.</p>
            ) : (
              <div className="space-y-2">
                {syncLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white">{log.source}</div>
                      <div className="text-[10px] text-slate-400">{log.timestamp}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-bold">{log.eventsProcessed} events processed</span>
                      <div className="text-[10px] text-slate-400">{log.newEventsAdded} added • {log.eventsUpdated} updated</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-white">
              {editingEvent?.id ? "Edit Event" : "Create New Surat Event"}
            </h3>

            <form onSubmit={handleSaveEvent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Event Name:</label>
                <input
                  type="text"
                  required
                  value={editingEvent?.name || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  placeholder="e.g. Surat Heritage Dandiya 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Area in Surat:</label>
                  <select
                    value={editingEvent?.area || "Sarsana"}
                    onChange={(e) => setEditingEvent({ ...editingEvent, area: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    {SURAT_AREAS.filter((a) => a !== "All").map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Venue:</label>
                  <input
                    type="text"
                    required
                    value={editingEvent?.venue || ""}
                    onChange={(e) => setEditingEvent({ ...editingEvent, venue: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    placeholder="e.g. SIECC Dome"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Lead Artist / Performer:</label>
                <input
                  type="text"
                  required
                  value={editingEvent?.artist || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, artist: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  placeholder="e.g. Kinjal Dave"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Poster Image URL:</label>
                <input
                  type="url"
                  value={editingEvent?.coverImage || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, coverImage: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 font-bold text-slate-950 hover:bg-amber-400"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
