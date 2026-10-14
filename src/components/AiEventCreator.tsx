import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  ArrowRight,
  CheckCircle2,
  Calendar,
  MapPin,
  Tag,
  IndianRupee,
  Edit3,
  ExternalLink,
  PlusCircle,
  Clock,
  Layers,
  Music,
  Check,
  ShieldCheck,
  RotateCw
} from "lucide-react";
import type { EventItem } from "../lib/types";
import { addOrUpdateEvent } from "../lib/storage";

interface AiEventCreatorProps {
  onEventCreated?: (event: EventItem) => void;
  onOpenPriceEdit?: (event: EventItem) => void;
  onEditEvent?: (event: EventItem) => void;
  onNotify: (msg: string) => void;
}

const SAMPLE_PROMPTS = [
  {
    title: "👑 Falguni Pathak - Sarsana AC Dome",
    prompt:
      "સરસાણા એસી ડોમ મા ફાલ્ગુની પાઠક ગરબા 2026, તારીખ 4 થી 12 ઓક્ટોબર, સિંગલ પાસ ₹650, કપલ ₹1200, સીઝન ₹4500, વીઆઈપી ₹8500, ફૂડ કોર્ટ, એસી ડોમ અને સુરત ના ટોપ આર્ટિસ્ટ",
    badge: "Celebrity / Sarsana",
  },
  {
    title: "💃 Kinjal Dave - Laxmi Ground Vesu",
    prompt:
      "વેસુ લક્ષ્મી ગ્રાઉન્ડ મા કિંજલ દવે ગરબા મહોત્સવ 2026 તારીખ 3 થી 11 ઓક્ટોબર સિંગલ પાસ ₹499 કપલ ₹899 સીઝન પાસ ₹3499 વીઆઈપી ₹6999, સુરત નું સૌથી મોટું ગ્રાઉન્ડ",
    badge: "Traditional / Vesu",
  },
  {
    title: "🪘 Kirtidan Gadhvi - Tapi Riverfront Adajan",
    prompt:
      "Kirtidan Gadhvi Dandiya Night at Tapi Riverfront Adajan Surat. Dates: 3 to 11 Oct 2026. Single pass 450, Couple 850, Season pass 3200, Royal VIP 6500. Authentic Gujarati folklore.",
    badge: "Dandiya / Adajan",
  },
  {
    title: "⚡ Surat Techno Dandiya - Dumas Road",
    prompt:
      "Surat Techno Dandiya 2026 at Dumas Road Luxury Lawn. DJ and Live Fusion Garba. Single pass 799, Couple 1499, Season 4999, VIP 9999. Laser show, food stalls, sound system.",
    badge: "Techno / Dumas Road",
  },
  {
    title: "🌸 Geeta Rabari - Althan Cultural Arena",
    prompt:
      "ગીતા રબારી લાઇવ રાસ ગરબા અલ્થાણ પાર્ટી પ્લોટ સુરત, 3 થી 11 ઓક્ટોબર, સિંગલ પાસ 550, કપલ 999, સીઝન 3999, વીઆઈપી 7500, પારંપરિક ગુજરાતી વેશભૂષા",
    badge: "Folk / Althan",
  },
];

export const AiEventCreator: React.FC<AiEventCreatorProps> = ({
  onEventCreated,
  onOpenPriceEdit,
  onEditEvent,
  onNotify,
}) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [createdEvent, setCreatedEvent] = useState<EventItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (customPrompt?: string) => {
    const textToSubmit = (customPrompt || prompt).trim();
    if (!textToSubmit) {
      setError("કૃપા કરીને ઇવેન્ટની વિગતો લખો અથવા નીચે આપેલ સેમ્પલ પસંદ કરો.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setLoadingStep("AI તમારી વિગતો સમજી રહ્યું છે (Analyzing details)...");

    try {
      const stepTimer1 = setTimeout(() => {
        setLoadingStep("પાસના ભાવો અને કેટેગરી સેટ કરી રહ્યું છે (Configuring pass prices)...");
      }, 700);

      const stepTimer2 = setTimeout(() => {
        setLoadingStep("ઇવેન્ટ કાર્ડ અને ટિકિટિંગ તૈયાર થઈ રહ્યું છે (Publishing event)...");
      }, 1400);

      const response = await fetch("/api/ai/create-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToSubmit }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const data = await response.json();

      if (!response.ok || !data.success || !data.event) {
        throw new Error(data.error || "Failed to create event with AI.");
      }

      const newEvent: EventItem = data.event;

      // Instantly save to local storage and sync across site
      addOrUpdateEvent(newEvent);
      setCreatedEvent(newEvent);
      setIsLoading(false);
      onNotify(`🎉 "${newEvent.name}" ઇવેન્ટ AI દ્વારા તાત્કાલિક બની ગઈ અને લાઈવ થઈ ગઈ!`);

      if (onEventCreated) {
        onEventCreated(newEvent);
      }
    } catch (err: any) {
      console.error("AI Event Creation Error:", err);
      setIsLoading(false);
      setError(err?.message || "ઇવેન્ટ બનાવવામાં ભૂલ આવી. કૃપા કરીને ફરી પ્રયાસ કરો.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-900/40 border border-amber-500/30 p-5 sm:p-6 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>AI Instant Event Engine • Gemini Powered</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display text-white">
              AI થી Instant Event બનાવો
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              કોઈપણ સામાન્ય વિગત લખો (ગુજરાતી, English કે WhatsApp મેસેજ) — AI જાતે જ આર્ટિસ્ટ, વેન્યુ, તારીખ,
              સિંગલ/કપલ/સીઝન પાસના ભાવો અને ઇવેન્ટ કાર્ડ તરત જ બનાવી દેશે!
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-amber-300/80 bg-slate-950/60 px-3.5 py-2 rounded-xl border border-amber-500/20 backdrop-blur-sm self-start md:self-auto">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>1-Click Instant Publish</span>
          </div>
        </div>
      </div>

      {/* Main Creation Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>ઇવેન્ટની વિગતો અહીં લખો (Event Details)</span>
            <span className="text-[11px] font-normal text-slate-400 lowercase">
              ગુજરાતી / English / Gujlish બધું ચાલે
            </span>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            rows={4}
            placeholder={`દા.ત. "સરસાણા એસી ડોમ મા ફાલ્ગુની પાઠક ગરબા 2026, તારીખ 4 થી 12 ઓક્ટોબર, સિંગલ પાસ ₹600, કપલ ₹1200, સીઝન ₹4200, વીઆઈપી ₹8000, સુરતનું સૌથી મોટું આયોજન"`}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
          />
        </div>

        {/* Quick sample chips */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-amber-400" />
            <span>એક ક્લિકમાં ટેસ્ટ કરવા માટે સેમ્પલ પસંદ કરો (Quick 1-Click Samples):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PROMPTS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(sample.prompt);
                  handleCreate(sample.prompt);
                }}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 transition cursor-pointer flex items-center gap-1.5"
              >
                <span>{sample.title}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950 text-amber-400 font-mono">
                  {sample.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            {isLoading ? (
              <span className="flex items-center gap-2 text-amber-300 animate-pulse font-medium">
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>{loadingStep}</span>
              </span>
            ) : (
              <span>ઇવેન્ટ બનતા જ એડમિન લિસ્ટ અને વેબસાઈટ પર તરત જ લાઈવ થઈ જશે.</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleCreate()}
            disabled={isLoading || !prompt.trim()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-display"
          >
            {isLoading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>ઇવેન્ટ બની રહી છે (Creating...)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Create Event Instantly (AI થી બનાવો)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* SUCCESS RESULT SHOWCASE CARD */}
      {createdEvent && (
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/40 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <span>ઇવેન્ટ સફળતાપૂર્વક બની ગઈ છે! (Event Live)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                    ACTIVE & LIVE
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  ID: <span className="font-mono text-slate-300">{createdEvent.id}</span> • સુરત Navratri
                  લિસ્ટિંગમાં ઉપલબ્ધ છે.
                </p>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2">
              {onOpenPriceEdit && (
                <button
                  onClick={() => onOpenPriceEdit(createdEvent)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition cursor-pointer flex items-center gap-1.5"
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>Change Prices</span>
                </button>
              )}

              {onEditEvent && (
                <button
                  onClick={() => onEditEvent(createdEvent)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Event</span>
                </button>
              )}

              <button
                onClick={() => {
                  setCreatedEvent(null);
                  setPrompt("");
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Event</span>
              </button>
            </div>
          </div>

          {/* Event Preview details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Left Cover Image */}
            <div className="relative rounded-xl overflow-hidden aspect-video md:aspect-auto border border-slate-800 shadow-inner group">
              <img
                src={createdEvent.coverImage}
                alt={createdEvent.name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute top-2.5 left-2.5">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500 text-slate-950 uppercase tracking-wider">
                  {createdEvent.eventType}
                </span>
              </div>
              <div className="absolute bottom-2.5 left-2.5 right-2.5">
                <span className="text-[11px] text-amber-300 font-medium">Lead Artist</span>
                <div className="text-sm font-bold text-white line-clamp-1">
                  {createdEvent.artist}
                </div>
              </div>
            </div>

            {/* Middle: Details */}
            <div className="md:col-span-2 space-y-3.5">
              <div>
                <h4 className="text-lg font-black text-white font-display">
                  {createdEvent.name}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {createdEvent.about}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-slate-400">Venue: </span>
                    <strong className="text-white">{createdEvent.venue}</strong> ({createdEvent.area})
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-slate-400">Dates: </span>
                    <strong className="text-white">{createdEvent.dates}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-slate-400">Timing: </span>
                    <strong className="text-white">{createdEvent.time}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-slate-400">Organizer: </span>
                    <strong className="text-white">{createdEvent.organizer}</strong>
                  </div>
                </div>
              </div>

              {/* Pass Prices configured by AI */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>AI દ્વારા સેટ કરેલા પાસના ભાવો (Pass Prices)</span>
                  <span className="text-amber-400 font-mono text-[10px]">
                    UPI ID: aapnopaas@ptaxis
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {createdEvent.passes?.map((pass) => (
                    <div
                      key={pass.id}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center"
                    >
                      <div className="text-[11px] text-slate-400 line-clamp-1">{pass.name}</div>
                      <div className="text-base font-black text-amber-400 font-mono mt-0.5">
                        ₹{pass.price}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {pass.season ? "9 Nights" : "Per Night"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Highlights & Facilities */}
              {createdEvent.highlights && createdEvent.highlights.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {createdEvent.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md text-[10px] bg-slate-950 text-slate-300 border border-slate-800 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>{h}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
