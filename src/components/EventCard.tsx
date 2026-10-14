import React, { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Mic,
  Tag,
  Copy,
  Check,
  Share2,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Ticket
} from "lucide-react";
import type { EventItem } from "../lib/types";

interface EventCardProps {
  event: EventItem;
  onSelect: (event: EventItem) => void;
  onNotify: (msg: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onSelect, onNotify }) => {
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const minPrice = event.passes?.length ? Math.min(...event.passes.map(p => p.price)) : 499;

  const handleCopy = async (e: React.MouseEvent, type: "whatsapp" | "text" | "link") => {
    e.stopPropagation();
    let textToCopy = "";
    let label = "";

    const passLines = event.passes?.map(p => `  • ${p.name}: ₹${p.price.toLocaleString("en-IN")} (${p.desc})`).join("\n") || `  • Passes starting at ₹${minPrice}`;

    if (type === "whatsapp") {
      textToCopy = `🔥 *${event.name.toUpperCase()}* 🔥
📍 *Venue:* ${event.venue}, ${event.area}, Surat
📅 *Dates:* ${event.dates} | ⏰ *Time:* ${event.time}
🎤 *Lead Artist:* ${event.artist}
✨ *Event Type:* ${event.eventType}
🏷️ *Organized by:* ${event.organizer}

🎟️ *TICKET & PASS TIERS:*
${passLines}

🌟 *Highlights:*
${event.highlights?.slice(0, 3).map(h => `  ✓ ${h}`).join("\n") || "  ✓ Authentic Navratri Garba"}

👗 *Dress Code:* ${event.dressCode || "Traditional Gujarati Attire mandatory"}
🔗 *Book Digital Passes on AapnoPass:* ${typeof window !== "undefined" ? window.location.origin : ""}/#event-${event.id}

_Book passes online on AapnoPass before sold out!_ 💃🕺`;
      label = "WhatsApp formatted event message";
    } else if (type === "text") {
      textToCopy = `EVENT DETAILS:
Title: ${event.name}
Dates: ${event.dates}
Timings: ${event.time}
Venue: ${event.venue}
Area: ${event.area}, Surat
Address: ${event.address}
Lead Artist: ${event.artist}
Starting Price: ₹${minPrice}
Booking Link: ${typeof window !== "undefined" ? window.location.origin : ""}/#event-${event.id}`;
      label = "Plain text details";
    } else if (type === "link") {
      textToCopy = `${typeof window !== "undefined" ? window.location.origin : ""}/#event-${event.id}`;
      label = "AapnoPass booking link";
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedType(type);
      onNotify(`${label} copied to clipboard!`);
      setTimeout(() => {
        setCopiedType(null);
        setShowCopyMenu(false);
      }, 2000);
    } catch {
      onNotify("Unable to copy to clipboard.");
    }
  };

  return (
    <div
      onClick={() => onSelect(event)}
      className="bg-white border border-neutral-200/90 rounded-3xl overflow-hidden hover:border-amber-400/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative"
    >
      {/* Poster Image & Badges */}
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
        <img
          src={event.coverImage}
          alt={event.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <span className="text-[10px] font-black uppercase tracking-wider bg-neutral-900/85 backdrop-blur-md text-amber-300 border border-white/20 px-2.5 py-1 rounded-full shadow-sm">
            {event.tag || "Surat Live"}
          </span>

          <span className="text-[10px] font-bold bg-white/95 backdrop-blur-md text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Verified Pass
          </span>
        </div>

        {/* Bottom Area & Price Pill over image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-full border border-neutral-200/80 text-[11px] font-semibold text-neutral-800 flex items-center gap-1 shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span>{event.area}, Surat</span>
          </div>

          <div className="bg-[#f59e0b] text-neutral-950 px-3 py-1 rounded-full font-black text-xs shadow-md flex items-center gap-0.5">
            <span>₹{minPrice.toLocaleString("en-IN")}</span>
            <span className="text-[9px] font-bold opacity-80">onwards</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3.5 bg-white">
        <div>
          {/* Artist & Event Type */}
          <div className="flex items-center gap-2 text-xs text-amber-800 font-bold mb-1">
            <Mic className="w-3.5 h-3.5 shrink-0 text-[#f59e0b]" />
            <span className="truncate">{event.artist}</span>
          </div>

          {/* Title */}
          <h3 className="font-display font-extrabold text-lg text-neutral-900 group-hover:text-amber-600 transition leading-snug line-clamp-1">
            {event.name}
          </h3>

          {/* Venue & Time info */}
          <div className="mt-2.5 space-y-1.5 text-xs text-neutral-500">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="truncate text-neutral-700 font-medium">{event.venue}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-neutral-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#f59e0b] shrink-0" />
                <span>{event.dates}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#f59e0b] shrink-0" />
                <span>{event.time}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pass tiers chips */}
        <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-neutral-100">
          {event.passes?.slice(0, 3).map((p) => (
            <span
              key={p.id}
              className="text-[10px] bg-neutral-100/80 px-2 py-0.5 rounded-md border border-neutral-200/60 text-neutral-700 font-medium"
            >
              {p.name.replace(/Pass/i, "")}: <strong className="text-neutral-900">₹{p.price}</strong>
            </span>
          ))}
          {(event.passes?.length || 0) > 3 && (
            <span className="text-[10px] text-neutral-400 self-center">
              +{event.passes!.length - 3} more
            </span>
          )}
        </div>

        {/* Action Buttons: Book & Share */}
        <div className="pt-2 flex items-center gap-2">
          
          {/* Book Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(event);
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Ticket className="w-3.5 h-3.5 text-amber-400" />
            <span>Book Tickets</span>
          </button>

          {/* Copy Details Menu Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCopyMenu(!showCopyMenu);
              }}
              className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 border border-neutral-200 transition cursor-pointer"
              title="Share event details on WhatsApp or copy link"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {/* Dropdown Menu */}
            {showCopyMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 bottom-full mb-2 w-56 rounded-2xl bg-white border border-neutral-200 shadow-xl p-1.5 z-30 text-xs"
              >
                <div className="px-2.5 py-1 text-[9px] uppercase font-bold tracking-wider text-neutral-400 border-b border-neutral-100">
                  Share Event
                </div>

                <button
                  onClick={(e) => handleCopy(e, "whatsapp")}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-neutral-50 text-neutral-800 flex items-center justify-between group transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-medium">WhatsApp Invite</span>
                  </span>
                  {copiedType === "whatsapp" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>

                <button
                  onClick={(e) => handleCopy(e, "text")}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-neutral-50 text-neutral-800 flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5 text-[#f59e0b]" />
                    <span className="font-medium">Plain Text Details</span>
                  </span>
                  {copiedType === "text" && <Check className="w-3.5 h-3.5 text-[#f59e0b]" />}
                </button>

                <button
                  onClick={(e) => handleCopy(e, "link")}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-neutral-50 text-neutral-800 flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-medium">Copy Pass Link</span>
                  </span>
                  {copiedType === "link" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
