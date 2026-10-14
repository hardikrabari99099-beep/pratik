import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Link2,
  FileText,
  Share2,
  Calendar,
  MapPin,
  Clock,
  Mic,
  Tag,
  ArrowRight,
  PlusCircle,
  AlertCircle,
  RefreshCw,
  Search,
  CheckCircle2
} from "lucide-react";
import {
  LIVE_FASTTICKET_SURAT_CATALOG,
  formatEventForWhatsApp,
  formatEventPlainText,
  parseFastTicketInput,
  convertSourceToEventItem,
  type FastTicketEventSource
} from "../lib/fastticket-copier";
import { addOrUpdateEvent } from "../lib/storage";
import type { EventItem } from "../lib/types";

interface FastTicketCopierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventImported?: (event: EventItem) => void;
  onNotify: (msg: string) => void;
}

export const FastTicketCopierModal: React.FC<FastTicketCopierModalProps> = ({
  isOpen,
  onClose,
  onEventImported,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<"catalog" | "url" | "text">("catalog");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [importedId, setImportedId] = useState<string | null>(null);
  const [catalogSearch, setCatalogSearch] = useState("");

  // URL state
  const [inputUrl, setInputUrl] = useState("https://www.fastticket.live/surat/kesariya-navratri-4-0");
  const [extractedEvent, setExtractedEvent] = useState<Partial<EventItem> | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  // Raw text state
  const [rawText, setRawText] = useState("");
  const [extractedFromText, setExtractedFromText] = useState<Partial<EventItem> | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = async (text: string, id: string, label: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedId(id);
      onNotify(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (e) {
      onNotify("Unable to copy to clipboard.");
    }
  };

  const handleImportToLive = (source: FastTicketEventSource | Partial<EventItem>) => {
    let fullItem: EventItem;
    if ("fastTicketVerified" in source) {
      fullItem = convertSourceToEventItem(source as FastTicketEventSource);
    } else {
      fullItem = {
        ...parseFastTicketInput(source.name || "Surat Navratri Garba"),
        ...source,
      } as EventItem;
    }

    addOrUpdateEvent(fullItem);
    setImportedId(fullItem.id);
    onNotify(`"${fullItem.name}" is now live on AapnoPass!`);
    if (onEventImported) {
      onEventImported(fullItem);
    }
    setTimeout(() => setImportedId(null), 3000);
  };

  const handleExtractFromUrl = () => {
    if (!inputUrl.trim()) return;
    setIsExtracting(true);
    setTimeout(() => {
      const parsed = parseFastTicketInput(inputUrl);
      setExtractedEvent(parsed);
      setIsExtracting(false);
      onNotify("Event details extracted from FastTicket URL!");
    }, 400);
  };

  const handleParseRawText = () => {
    if (!rawText.trim()) return;
    const parsed = parseFastTicketInput(rawText);
    setExtractedFromText(parsed);
    onNotify("Event details extracted from text!");
  };

  const filteredCatalog = LIVE_FASTTICKET_SURAT_CATALOG.filter(e =>
    e.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    e.venue.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    e.area.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    e.artist.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-850 to-amber-950/40 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-white tracking-tight">
                  Copy Event from FastTicket.live/surat
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Feature Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Copy verified event details, pass tiers, and WhatsApp announcements directly from FastTicket Surat, or publish straight to your live site.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/60 px-6 gap-2">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === "catalog"
                ? "border-amber-400 text-amber-400 bg-amber-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>FastTicket Surat Live Catalog ({LIVE_FASTTICKET_SURAT_CATALOG.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("url")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === "url"
                ? "border-amber-400 text-amber-400 bg-amber-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Extract from FastTicket URL</span>
          </button>

          <button
            onClick={() => setActiveTab("text")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === "text"
                ? "border-amber-400 text-amber-400 bg-amber-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste Event Text / Brochure</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: FastTicket Surat Live Catalog */}
          {activeTab === "catalog" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Filter FastTicket events (Kesariya, Vesu, Adajan...)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Direct source: <strong>https://www.fastticket.live/surat</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCatalog.map((ev) => {
                  const isCopied = copiedId === ev.id;
                  const isImported = importedId === ev.id;

                  return (
                    <div
                      key={ev.id}
                      className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition space-y-3 group"
                    >
                      <div>
                        {/* Tag & Verified Badge */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {ev.tag}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> FastTicket Verified
                          </span>
                        </div>

                        {/* Title & Artist */}
                        <h4 className="font-display font-bold text-base text-white group-hover:text-amber-400 transition">
                          {ev.name}
                        </h4>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <Mic className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="truncate">{ev.artist}</span>
                        </div>

                        {/* Details grid */}
                        <div className="mt-3 pt-3 border-t border-slate-850 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{ev.venue}, {ev.area}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{ev.dates}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{ev.time}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-bold text-amber-400">
                            <Tag className="w-3.5 h-3.5 shrink-0" />
                            <span>From ₹{ev.startingPrice}</span>
                          </div>
                        </div>

                        {/* Pass Tiers Pills */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {ev.passes.map((p) => (
                            <span
                              key={p.id}
                              className="text-[9px] bg-slate-900 border border-slate-800 text-slate-300 px-1.5 py-0.5 rounded"
                            >
                              {p.name}: ₹{p.price}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                        {/* Copy WhatsApp Announcement */}
                        <button
                          onClick={() => copyToClipboard(formatEventForWhatsApp(ev), ev.id, `WhatsApp announcement for ${ev.name}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition cursor-pointer"
                          title="Copy ready-to-send WhatsApp message with dates, pass prices & venue"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                          <span>{isCopied ? "Copied!" : "Copy WhatsApp"}</span>
                        </button>

                        {/* Copy Plain Text */}
                        <button
                          onClick={() => copyToClipboard(formatEventPlainText(ev), ev.id + "-text", `Plain text for ${ev.name}`)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                          title="Copy plain text summary"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Direct FastTicket link */}
                        <a
                          href={ev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                          title="Open live page on fastticket.live"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {/* Import & Publish to AapnoPass */}
                        <button
                          onClick={() => handleImportToLive(ev)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition shadow-sm cursor-pointer"
                          title="Make this event active and bookable on AapnoPass"
                        >
                          {isImported ? <Check className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
                          <span>{isImported ? "Published!" : "Publish Live"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Extract from FastTicket URL */}
          {activeTab === "url" && (
            <div className="space-y-6">
              <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    FastTicket Surat Event URL:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="https://www.fastticket.live/surat/..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={handleExtractFromUrl}
                      disabled={isExtracting}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md shadow-amber-500/20"
                    >
                      {isExtracting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      <span>Extract Details</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Quick Test URLs:</span>
                  {[
                    "https://www.fastticket.live/surat/kesariya-navratri-4-0",
                    "https://www.fastticket.live/surat/garvi-vaarso-navratri-2026",
                    "https://www.fastticket.live/surat/suvarn-navratri-2026",
                    "https://www.fastticket.live/surat/svnit-beats-techno-garba-2026",
                  ].map((url) => (
                    <button
                      key={url}
                      onClick={() => setInputUrl(url)}
                      className="text-amber-400 hover:underline bg-slate-900 px-2 py-0.5 rounded border border-slate-800 truncate max-w-xs"
                    >
                      {url.split("fastticket.live/surat/")[1]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extracted Details Preview */}
              {extractedEvent && (
                <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Details Parsed Successfully
                      </span>
                      <h4 className="font-display font-bold text-lg text-white mt-1">
                        {extractedEvent.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(formatEventForWhatsApp(extractedEvent as EventItem), "extracted-url", "WhatsApp Announcement")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Copy WhatsApp</span>
                      </button>

                      <button
                        onClick={() => handleImportToLive(extractedEvent)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Publish to Live Portal</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">Venue & Area</span>
                      <span className="text-white font-medium">{extractedEvent.venue}, {extractedEvent.area}</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">Dates</span>
                      <span className="text-white font-medium">{extractedEvent.dates}</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">Artist</span>
                      <span className="text-white font-medium truncate block">{extractedEvent.artist}</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">Passes</span>
                      <span className="text-amber-400 font-bold">{extractedEvent.passes?.length || 0} Pass Types</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">About Event:</span>
                    {extractedEvent.about}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Paste Event Text / Brochure */}
          {activeTab === "text" && (
            <div className="space-y-4">
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Paste Event Text, WhatsApp Message, or Brochure from Surat:
                </label>
                <textarea
                  rows={5}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste event text here... e.g.:
Kesariya Navratri 2026 at Sarsana Dome Surat. Lead singer Kinjal Dave. Passes starting ₹599. 3 to 11 Oct."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleParseRawText}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Parse & Convert to Event</span>
                </button>
              </div>

              {extractedFromText && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-display font-bold text-base text-white">
                        {extractedFromText.name}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {extractedFromText.venue} • {extractedFromText.artist}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(formatEventForWhatsApp(extractedFromText as EventItem), "text-extracted", "WhatsApp Announcement")}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      >
                        Copy WhatsApp
                      </button>
                      <button
                        onClick={() => handleImportToLive(extractedFromText)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white"
                      >
                        Publish Live
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>FastTicket.live/surat synchronization ready</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
