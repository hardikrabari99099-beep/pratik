import React, { useState } from "react";
import {
  Trophy,
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Phone
} from "lucide-react";
import { getSportsActivities, SURAT_AREAS } from "../lib/storage";
import type { SportActivity } from "../lib/types";

interface SportsTurfViewProps {
  onNotify: (msg: string) => void;
}

export const SportsTurfView: React.FC<SportsTurfViewProps> = ({ onNotify }) => {
  const sports = getSportsActivities();
  const [selectedSport, setSelectedSport] = useState<SportActivity | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [filterArea, setFilterArea] = useState("All");

  const filteredSports = sports.filter(
    (s) => filterArea === "All" || s.area.toLowerCase() === filterArea.toLowerCase()
  );

  const handleBookSlot = (sport: SportActivity) => {
    setSelectedSport(sport);
    setSelectedSlot(sport.slots[0] || "06:00 PM - 07:00 PM");
    setBookingSuccess(false);
  };

  const handleConfirmSlot = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(true);
    onNotify(`Turf Slot booked at ${selectedSport?.name} for ${selectedSlot}!`);
    setTimeout(() => {
      setSelectedSport(null);
      setBookingSuccess(false);
    }, 2500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-200">
              <Trophy className="w-5 h-5 text-[#f59e0b]" />
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-neutral-900">
              Surat Sports & Turf Booking
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Book box cricket turfs, USAPA pickleball courts, padel arenas, and sim racing in Surat.
          </p>
        </div>

        {/* Area filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 font-semibold">Area:</span>
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-[#f59e0b] cursor-pointer shadow-2xs"
          >
            {SURAT_AREAS.map((a) => (
              <option key={a} value={a}>
                {a === "All" ? "All Surat Areas" : a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSports.map((sport) => (
          <div
            key={sport.id}
            className="bg-white border border-neutral-200/90 rounded-3xl overflow-hidden hover:border-amber-400/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              <div className="relative aspect-[16/10] bg-neutral-100 overflow-hidden">
                <img
                  src={sport.image}
                  alt={sport.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-900/80 backdrop-blur-md text-amber-300 border border-white/20 px-2.5 py-1 rounded-full shadow-sm">
                    {sport.sportType}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-xs">
                  <span className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-neutral-800 font-semibold border border-neutral-200/80 shadow-sm">
                    {sport.area}, Surat
                  </span>
                  <span className="bg-[#f59e0b] text-neutral-950 font-black px-3 py-1 rounded-full shadow-sm">
                    ₹{sport.pricePerHour}/hr
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base text-neutral-900 line-clamp-1">
                    {sport.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-[#f59e0b] font-bold">
                    <Star className="w-3.5 h-3.5 fill-[#f59e0b]" />
                    <span>{sport.rating}</span>
                  </div>
                </div>

                <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                  {sport.about}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-neutral-100">
                  {sport.amenities.slice(0, 3).map((am, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-neutral-100 border border-neutral-200 text-neutral-600 px-2 py-0.5 rounded-md font-medium"
                    >
                      {am}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 pt-0">
              <button
                onClick={() => handleBookSlot(sport)}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Book Slot</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Slot Modal */}
      {selectedSport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            {bookingSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h3 className="font-display font-bold text-lg text-neutral-900">Turf Slot Reserved!</h3>
                <p className="text-xs text-neutral-500">
                  {selectedSport.name} • {selectedSlot}. Entry instructions sent.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                      {selectedSport.sportType}
                    </span>
                    <h3 className="font-display font-bold text-lg text-neutral-900">
                      {selectedSport.name}
                    </h3>
                    <p className="text-xs text-neutral-500">{selectedSport.address}</p>
                  </div>
                  <button
                    onClick={() => setSelectedSport(null)}
                    className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleConfirmSlot} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-1.5">
                      Select 1-Hour Time Slot:
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {selectedSport.slots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2.5 rounded-xl border text-[11px] font-medium transition text-center cursor-pointer ${
                            selectedSlot === slot
                              ? "bg-amber-50 border-amber-400 text-amber-900 font-bold"
                              : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 flex justify-between items-center">
                    <span className="text-neutral-500 font-medium">Rate per hour:</span>
                    <span className="text-neutral-900 font-mono font-bold text-sm">
                      ₹{selectedSport.pricePerHour}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl font-bold bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm cursor-pointer"
                  >
                    Confirm Booking
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
