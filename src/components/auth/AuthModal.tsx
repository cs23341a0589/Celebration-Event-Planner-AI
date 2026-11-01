import React, { useState } from "react";
import {
  Sparkles,
  Mail,
  Lock,
  User,
  X,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  KeyRound,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.tsx";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, demoLogin, resetPassword } = useAuth();

  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
        onClose();
      } else if (mode === "register") {
        if (!name.trim()) throw new Error("Please enter your name");
        await register(name, email, password);
        onClose();
      } else if (mode === "forgot") {
        const msg = await resetPassword(email);
        setMessage(msg);
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await demoLogin();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Demo sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-[#6C4AB6]">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-lg text-gray-900">
              {mode === "login"
                ? "Sign In to Celebration AI"
                : mode === "register"
                ? "Create Celebration Account"
                : "Reset Account Password"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Demo Account Button */}
        {mode !== "forgot" && (
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center justify-between gap-3">
            <div className="text-xs">
              <p className="font-bold text-purple-900">1-Click Demo Profile</p>
              <p className="text-[11px] text-purple-600">Explore pre-seeded celebrations &amp; budgets</p>
            </div>
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-[#6C4AB6] text-white text-xs font-bold hover:bg-[#5b3da0] shadow-xs cursor-pointer shrink-0"
            >
              Demo Sign In
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === "register" && (
            <div className="space-y-1">
              <label className="font-bold text-gray-700">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aanya Sharma"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#6C4AB6]"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-bold text-gray-700">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#6C4AB6]"
              />
            </div>
          </div>

          {mode !== "forgot" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-gray-700">Password</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-[11px] text-purple-600 hover:underline font-semibold"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#6C4AB6]"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#6C4AB6] to-pink-500 hover:opacity-95 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <RotateCw className="w-4 h-4 animate-spin" />
            ) : mode === "login" ? (
              "Sign In"
            ) : mode === "register" ? (
              "Create Account"
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-gray-500 border-t border-gray-100">
          {mode === "login" ? (
            <p>
              Don't have an account?{" "}
              <button
                onClick={() => setMode("register")}
                className="font-bold text-[#6C4AB6] hover:underline"
              >
                Sign up free
              </button>
            </p>
          ) : mode === "register" ? (
            <p>
              Already have an account?{" "}
              <button
                onClick={() => setMode("login")}
                className="font-bold text-[#6C4AB6] hover:underline"
              >
                Sign in
              </button>
            </p>
          ) : (
            <p>
              Remembered your password?{" "}
              <button
                onClick={() => setMode("login")}
                className="font-bold text-[#6C4AB6] hover:underline"
              >
                Back to sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
