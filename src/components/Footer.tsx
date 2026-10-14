import React from "react";
import {
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Lock,
  Heart,
  Sparkles,
  Ticket,
  CheckCircle2,
  CreditCard
} from "lucide-react";
import { DEFAULT_SETTINGS, SURAT_AREAS } from "../lib/storage";

interface FooterProps {
  onSelectTab: (tab: string) => void;
  onOpenAdminLogin: () => void;
  isAdminLoggedIn: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectTab,
  onOpenAdminLogin,
  isAdminLoggedIn,
}) => {
  return (
    <footer className="bg-neutral-900 text-neutral-400 text-xs border-t border-neutral-800">
      
      {/* Editorial Trust Banner */}
      <div className="bg-[#18181B] border-b border-neutral-800 py-8 px-4 text-neutral-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-[#f59e0b] font-display font-black text-2xl shrink-0 shadow-lg">
              આ
            </div>
            <div>
              <h4 className="font-display font-black text-lg text-white">
                aapnopass<span className="text-[#f59e0b]">.</span> — Surat Ni Navratri, Aapno Pass
              </h4>
              <p className="text-neutral-400 text-xs mt-0.5">
                Official digital gate passes for Sarsana Dome, VR Festive Grounds, Tapi Riverfront, and Dumas Road.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab("events")}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#f59e0b] hover:bg-[#d97706] text-neutral-950 transition shadow-sm cursor-pointer"
            >
              Explore Garba Passes
            </button>
            <button
              onClick={() => onSelectTab("my-passes")}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition cursor-pointer"
            >
              Download My Pass
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[#f59e0b] font-display font-black text-sm">
              આ
            </div>
            <span className="font-display font-black text-base text-white">
              aapnopass<span className="text-[#f59e0b]">.</span> Surat
            </span>
          </div>
          <p className="text-neutral-400 text-xs leading-relaxed">
            Surat's premiere digital pass and ticketing platform. Official RFID wristbands, verified QR gate check-ins, and live pass inventory.
          </p>
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Genuine & Verified Passes</span>
          </div>
          
          {/* Razorpay Trust Badge */}
          <div className="pt-2">
            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block mb-1">
              Payment Gateway
            </span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700 text-[11px] text-neutral-300 font-medium">
              <CreditCard className="w-3.5 h-3.5 text-blue-400" />
              <span>Razorpay Verified • UPI / Cards / NetBanking</span>
            </div>
          </div>
        </div>

        {/* Surat Garba Hubs */}
        <div className="space-y-3">
          <h4 className="font-display font-bold text-sm text-white">
            Surat Event Locations
          </h4>
          <div className="grid grid-cols-2 gap-1.5 text-xs text-neutral-400">
            {SURAT_AREAS.filter((a) => a !== "All").map((area) => (
              <span key={area} className="hover:text-[#f59e0b] cursor-pointer transition">
                • {area}
              </span>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-2.5">
          <h4 className="font-display font-bold text-sm text-white">
            Quick Navigation
          </h4>
          <ul className="space-y-1.5 text-xs text-neutral-400">
            <li>
              <button onClick={() => onSelectTab("events")} className="hover:text-[#f59e0b] transition cursor-pointer">
                Explore All Surat Events
              </button>
            </li>
            <li>
              <button onClick={() => onSelectTab("my-passes")} className="hover:text-[#f59e0b] transition cursor-pointer">
                Download Digital Passes
              </button>
            </li>
            <li>
              <button onClick={() => onSelectTab("sports")} className="hover:text-[#f59e0b] transition cursor-pointer">
                Box Cricket & Turfs
              </button>
            </li>
          </ul>
        </div>

        {/* Surat Helpline & Side Login */}
        <div className="space-y-3">
          <h4 className="font-display font-bold text-sm text-white">
            Surat Support Helpline
          </h4>
          <div className="space-y-2 text-xs text-neutral-300">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
              <span>{DEFAULT_SETTINGS.contactPhone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
              <span>{DEFAULT_SETTINGS.contactEmail}</span>
            </div>
            <div className="flex items-start gap-2 text-neutral-400 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-[#f59e0b] shrink-0 mt-0.5" />
              <span>{DEFAULT_SETTINGS.contactAddress}</span>
            </div>
          </div>

          {/* Discrete Side Organizer Login */}
          <div className="pt-2 border-t border-neutral-800">
            {isAdminLoggedIn ? (
              <button
                onClick={() => onSelectTab("admin")}
                className="text-[11px] font-bold text-[#f59e0b] hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Go to Organizer Panel</span>
              </button>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="text-[11px] text-neutral-500 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
              >
                <Lock className="w-3 h-3 text-[#f59e0b]" />
                <span>Organizer & Staff Login</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Copyright Bar */}
      <div className="border-t border-neutral-800 py-4 px-4 text-center text-[11px] text-neutral-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{DEFAULT_SETTINGS.footerText}</span>
          <span className="flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-[#f59e0b] fill-[#f59e0b]" /> for Surat Navratri enthusiasts
          </span>
        </div>
      </div>
    </footer>
  );
};
