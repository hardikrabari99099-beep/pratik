import React, { useState } from "react";
import { Lock, X, ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";
import { loginAdmin } from "../lib/storage";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onNotify: (msg: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onNotify,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const ok = loginAdmin(email, password);
      setIsSubmitting(false);

      if (ok) {
        onNotify("Organizer authentication successful! Welcome to Admin Panel.");
        onLoginSuccess();
        onClose();
        setEmail("");
        setPassword("");
      } else {
        setError("Invalid credentials. Please enter authorized organizer details.");
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white border border-neutral-200 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-neutral-50/80 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800">
              <Lock className="w-4 h-4 text-[#f59e0b]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-neutral-900">
                Organizer & Staff Portal
              </h3>
              <p className="text-[11px] text-neutral-500">
                Restricted gate scanner & event control access
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
              Admin Email:
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@aapnopass.com"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-[#f59e0b] transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
              Master Password:
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-[#f59e0b] transition"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center gap-2 shadow-sm transition cursor-pointer mt-2"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>{isSubmitting ? "Authenticating..." : "Login to Organizer Console"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 text-[11px] text-neutral-400 text-center">
          Authorized personnel only • Surat Gate Control & Inventory
        </div>

      </div>
    </div>
  );
};
