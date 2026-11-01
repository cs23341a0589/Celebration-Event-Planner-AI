import React, { useState } from "react";
import {
  Palette,
  Sparkles,
  Flower2,
  Lightbulb,
  Layers,
  Utensils,
  Music,
  Mail,
  RotateCw,
  Check,
  Copy,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { api } from "../../services/api.ts";
import { useEvent } from "../../context/EventContext.tsx";
import { ThemeSuggestion } from "../../types/index.ts";
import confetti from "canvas-confetti";

export const ThemeGeneratorView: React.FC = () => {
  const { activeEvent, updateEvent } = useEvent();

  const [category, setCategory] = useState<string>(activeEvent?.category || "Wedding");
  const [totalBudget, setTotalBudget] = useState<number>(activeEvent?.totalBudget || 300000);
  const [guestCount, setGuestCount] = useState<number>(activeEvent?.guestCount || 150);
  const [preferences, setPreferences] = useState<string>(
    activeEvent?.preferredTheme || "Royal Rajputana meets modern minimalist fairy lights"
  );

  const [loading, setLoading] = useState(false);
  const [themes, setThemes] = useState<(ThemeSuggestion & { tagline?: string })[]>([]);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [appliedTheme, setAppliedTheme] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setAppliedTheme(null);
    try {
      const res = await api.generateAiThemes({
        category,
        totalBudget,
        guestCount,
        preferences,
      });
      setThemes(res.themes);
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    } catch (e) {
      console.error("Failed to generate themes", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  const handleApplyToEvent = async (theme: ThemeSuggestion) => {
    if (!activeEvent) return;
    try {
      await updateEvent(activeEvent.id, {
        preferredTheme: theme.themeName,
        decorationPreferences: theme.decorationConcepts.join(", "),
      });
      setAppliedTheme(theme.themeName);
      try {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
      } catch {
        // ignore
      }
    } catch (e) {
      console.error("Failed to apply theme", e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 via-white to-pink-50 p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-[#6C4AB6] text-xs font-bold mb-2">
            <Palette className="w-3.5 h-3.5" />
            <span>Creative Visual Conception Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#25223A]">
            AI Theme &amp; Idea Studio
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 max-w-2xl">
            Explore breathtaking aesthetic themes, curated color hex palettes, stage architecture,
            and lighting designs tailored to your celebration budget.
          </p>
        </div>
      </div>

      {/* Control Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-[#25223A] border-b border-gray-100 pb-3">
          Configure Creative Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Celebration Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 bg-white"
            >
              <option value="Wedding">Wedding</option>
              <option value="Birthday">Birthday</option>
              <option value="Anniversary">Anniversary</option>
              <option value="College Event">College Festival</option>
              <option value="Corporate Event">Corporate Gala</option>
              <option value="Community Event">Community Gathering</option>
              <option value="Other">Other Celebration</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Estimated Budget (₹)</label>
            <input
              type="number"
              step={10000}
              value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Guest Count</label>
            <input
              type="number"
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800"
            />
          </div>
        </div>

        <div className="space-y-1 pt-2">
          <label className="text-xs font-bold text-gray-700">
            Aesthetic Preferences / Mood Board Keywords
          </label>
          <input
            type="text"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="e.g. Vintage Parisian pastel, Bohemian chic with pampas grass, Retro Neon Cyberpunk"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#6C4AB6] to-pink-500 hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all"
          >
            {loading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Generating Theme Packages with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Generate Creative Themes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Themes Cards */}
      {themes.length > 0 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="text-center space-y-1">
            <h3 className="text-xl font-black text-[#25223A]">
              3 Bespoke Celebration Themes
            </h3>
            <p className="text-xs text-gray-500">
              Pick your favorite concept or adopt it directly into your active event.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {themes.map((th, index) => {
              const isApplied = appliedTheme === th.themeName;

              return (
                <div
                  key={index}
                  className="bg-white rounded-3xl border border-purple-100 shadow-md p-6 flex flex-col justify-between space-y-5 hover:shadow-xl transition-all"
                >
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#6C4AB6] uppercase">
                        Theme Concept 0{index + 1}
                      </span>
                      <h4 className="text-lg font-black text-[#25223A] mt-2 leading-tight">
                        {th.themeName}
                      </h4>
                      {th.tagline && (
                        <p className="text-xs text-purple-600 font-medium italic mt-1">
                          "{th.tagline}"
                        </p>
                      )}
                    </div>

                    {/* Palette */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Color Palette
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {th.colorPalette.map((col, i) => (
                          <div
                            key={i}
                            onClick={() => handleCopyHex(col.hex)}
                            title={`Click to copy ${col.hex} (${col.name})`}
                            className="text-center group cursor-pointer"
                          >
                            <div
                              className="h-9 rounded-lg border border-black/10 shadow-2xs group-hover:scale-105 transition-transform"
                              style={{ backgroundColor: col.hex }}
                            />
                            <span className="text-[9px] font-mono text-gray-500 block truncate mt-0.5">
                              {col.hex}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Decor Concepts */}
                    <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                        <Flower2 className="w-3 h-3" />
                        <span>Decor Concepts</span>
                      </span>
                      <ul className="space-y-1 text-gray-600">
                        {th.decorationConcepts?.slice(0, 3).map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-1 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Stage & Lighting */}
                    <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        <span>Lighting &amp; Stage Design</span>
                      </span>
                      <p className="text-gray-600">{th.stageDesign}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {th.lightingIdeas?.map((lit, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-semibold"
                          >
                            ✨ {lit}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Food & Invites */}
                    <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span>Invitation Experience</span>
                      </span>
                      <p className="text-gray-600 italic text-[11px]">
                        "{th.invitationIdeas}"
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleApplyToEvent(th)}
                      disabled={isApplied}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isApplied
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-purple-100 hover:bg-[#6C4AB6] text-[#6C4AB6] hover:text-white"
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Applied to Active Event</span>
                        </>
                      ) : (
                        <>
                          <span>Apply to {activeEvent?.name || "Active Event"}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
