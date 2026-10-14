import React, { useState } from "react";
import {
  MapPin,
  Search,
  Ticket,
  ChevronDown,
  Sparkles,
  Phone,
  ShieldCheck,
  Menu,
  X,
  Flame,
  Layers,
  Lock,
  UserCheck
} from "lucide-react";
import { getSelectedCity, setSelectedCity, getStoredBookings, isAdminAuthenticated } from "../lib/storage";

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAdminLogin: () => void;
  isAdminLoggedIn: boolean;
  onLogoutAdmin: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedArea: string;
  onAreaChange: (area: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenAdminLogin,
  isAdminLoggedIn,
  onLogoutAdmin,
  searchQuery,
  onSearchChange,
}) => {
  const [city, setCity] = useState(getSelectedCity());
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const bookings = getStoredBookings();

  const handleCityChange = (newCity: string) => {
    setSelectedCity(newCity);
    setCity(newCity);
    setShowCityDropdown(false);
  };

  // Pure public navigation items - NO admin and NO FastTicket
  const navItems = [
    { id: "events", label: "Explore Events", icon: Flame },
    { id: "sports", label: "Sports & Turfs", icon: Layers },
    { id: "my-passes", label: `My Pass (${bookings.length})`, icon: Ticket, badge: bookings.length > 0 },
  ];

  return (
    <>
      {/* Top Notice Bar */}
      <div className="bg-[#18181B] text-[#FAFAF7] font-medium text-[11px] py-1.5 px-4 border-b border-neutral-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />
            <span className="text-[#f59e0b] font-bold">Surat Ni Navratri 2026:</span>
            <span className="text-neutral-300 hidden sm:inline">Official Gate Passes • Instant QR Verification • Razorpay Secure Checkout</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Discrete side Organizer / Admin Login */}
            {isAdminLoggedIn ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectTab("admin")}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#f59e0b] hover:underline cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Admin Panel Active</span>
                </button>
                <span className="opacity-40">|</span>
                <button
                  onClick={onLogoutAdmin}
                  className="text-[10px] text-neutral-400 hover:text-white cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-white transition cursor-pointer"
                title="Organizer Login"
              >
                <Lock className="w-3 h-3 text-[#f59e0b]" />
                <span>Organizer Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & City */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => onSelectTab("events")}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-[#f59e0b] font-display font-black text-lg shadow-sm group-hover:scale-105 transition">
                આ
              </div>
              <div>
                <div className="font-display font-black text-xl tracking-tight text-neutral-900 flex items-center gap-1">
                  aapnopass<span className="text-[#f59e0b]">.</span>
                  <span className="text-[10px] uppercase font-sans font-extrabold bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.2 rounded ml-1">
                    Surat
                  </span>
                </div>
                <div className="text-[10px] text-neutral-500 font-medium">
                  Surat Ni Navratri, Aapno Pass
                </div>
              </div>
            </button>

            {/* City Selector */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200/70 border border-neutral-200 text-xs font-semibold text-neutral-800 transition cursor-pointer"
                title="Change City"
              >
                <MapPin className="w-3.5 h-3.5 text-[#f59e0b]" />
                <span>{city}</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
              </button>

              {showCityDropdown && (
                <div className="absolute left-0 mt-2 w-48 rounded-2xl bg-white border border-neutral-200 shadow-xl py-1.5 z-50">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100">
                    Select Event City
                  </div>
                  {["Surat", "Ahmedabad", "Vadodara", "Rajkot", "Mumbai"].map((c) => (
                    <button
                      key={c}
                      onClick={() => handleCityChange(c)}
                      className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer ${
                        c === city ? "text-[#f59e0b] font-bold bg-amber-50/60" : "text-neutral-700"
                      }`}
                    >
                      <span>{c}</span>
                      {c === "Surat" && (
                        <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                          Live Pass Hub
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search Bar on Desktop */}
          <div className="hidden lg:flex items-center flex-1 max-w-sm relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search Garba, artist, dome, arena..."
              className="w-full bg-neutral-100/90 border border-neutral-200/90 rounded-full pl-9 pr-4 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-[#f59e0b] transition shadow-2xs"
            />
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? "bg-neutral-900 text-white font-bold shadow-sm"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* If Admin logged in, show quick Admin access */}
            {isAdminLoggedIn && (
              <button
                onClick={() => onSelectTab("admin")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                  currentTab === "admin"
                    ? "bg-[#f59e0b] text-neutral-900 font-bold"
                    : "bg-neutral-100 text-neutral-800 border border-neutral-300 hover:border-[#f59e0b]"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#f59e0b]" />
                <span>Admin Console</span>
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {!isAdminLoggedIn && (
              <button
                onClick={onOpenAdminLogin}
                className="p-2 rounded-xl bg-neutral-100 text-neutral-700 hover:text-neutral-900 border border-neutral-200"
                title="Organizer Login"
              >
                <Lock className="w-4 h-4 text-[#f59e0b]" />
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-700 hover:text-neutral-900"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white px-4 py-3 space-y-2 shadow-lg">
            <div className="mb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search Surat events..."
                className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 pb-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive
                        ? "bg-neutral-900 text-white font-bold"
                        : "bg-neutral-100 text-neutral-800 border border-neutral-200"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {isAdminLoggedIn ? (
                <button
                  onClick={() => {
                    onSelectTab("admin");
                    setMobileMenuOpen(false);
                  }}
                  className="col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-neutral-900 text-[#f59e0b]"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin & Organizer Console</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminLogin();
                  }}
                  className="col-span-2 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-600 bg-neutral-100 border border-neutral-200"
                >
                  <Lock className="w-3.5 h-3.5 text-[#f59e0b]" />
                  <span>Organizer Login</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};
