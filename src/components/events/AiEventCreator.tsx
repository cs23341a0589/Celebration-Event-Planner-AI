import React, { useState } from "react";
import {
  Sparkles,
  Calendar,
  MapPin,
  Users,
  Wallet,
  Clock,
  Palette,
  Utensils,
  Flower2,
  FileCheck,
  RotateCw,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { api } from "../../services/api.ts";
import { useEvent } from "../../context/EventContext.tsx";
import { EventCategory, EventPlan } from "../../types/index.ts";
import confetti from "canvas-confetti";

interface AiEventCreatorProps {
  onPlanCreated: () => void;
}

export const AiEventCreator: React.FC<AiEventCreatorProps> = ({ onPlanCreated }) => {
  const { createEvent } = useEvent();

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState<EventCategory>("Wedding");
  const [date, setDate] = useState("2026-12-20");
  const [time, setTime] = useState("17:30");
  const [location, setLocation] = useState("The Royal Orchid Banquet, Bangalore");
  const [guestCount, setGuestCount] = useState<number>(150);
  const [totalBudget, setTotalBudget] = useState<number>(350000);
  const [preferredTheme, setPreferredTheme] = useState("Emerald Green & Champagne Gold Elegance");
  const [duration, setDuration] = useState("Evening (6 Hours)");
  const [specialRequirements, setSpecialRequirements] = useState("Live acoustic saxophonist, eco-friendly confetti, valet parking");
  const [foodPreferences, setFoodPreferences] = useState("North Indian & Pan-Asian live wok, artisanal dessert bar");
  const [decorationPreferences, setDecorationPreferences] = useState("Fairy light tunnel entrance, brass lanterns, white lilies");

  // Plan generation state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<EventPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Quick preset loader for fast testing
  const applyPreset = (type: "wedding" | "birthday" | "corporate" | "college") => {
    if (type === "wedding") {
      setName("Meera & Kabir's Sunset Sangeet & Wedding");
      setCategory("Wedding");
      setDate("2026-11-20");
      setLocation("Taj West End Heritage Lawns, Bangalore");
      setGuestCount(200);
      setTotalBudget(500000);
      setPreferredTheme("Royal Marigold & Sunset Amber");
      setDuration("2 Days");
      setSpecialRequirements("Drone videography, traditional Dhol welcome, vintage car entry");
      setFoodPreferences("Authentic Awadhi Biryani, Chaat street, European dessert display");
      setDecorationPreferences("Cascading marigold curtains, royal velvet seating, fairy lights canopy");
    } else if (type === "birthday") {
      setName("Aarav's 18th Milestone Glow Festival");
      setCategory("Birthday");
      setDate("2026-12-05");
      setLocation("The High Lounge & Terrace, Mumbai");
      setGuestCount(60);
      setTotalBudget(120000);
      setPreferredTheme("Cyberpunk Neon Glow & Holographic");
      setDuration("4 Hours");
      setSpecialRequirements("Glow-in-the-dark face painting, custom mocktail bar, 360 photo booth");
      setFoodPreferences("Sliders, wood-fired pizzas, loaded nachos, churros");
      setDecorationPreferences("UV reactive neon signs, LED light tubes, laser projections");
    } else if (type === "corporate") {
      setName("TechNext Annual Innovation Gala 2026");
      setCategory("Corporate Event");
      setDate("2026-12-15");
      setLocation("Grand Hyatt Ballroom, Hyderabad");
      setGuestCount(300);
      setTotalBudget(650000);
      setPreferredTheme("Minimalist Executive Sapphire & Platinum");
      setDuration("Full Day (9 AM - 8 PM)");
      setSpecialRequirements("Keynote teleprompter, simultaneous interpretation, badge scanners");
      setFoodPreferences("Executive high-tea, multi-cuisine continental lunch buffet, wine reception");
      setDecorationPreferences("Clean geometric branding backdrop, crystal podium, blue uplighting");
    } else if (type === "college") {
      setName("Ignite 2026 Inter-College Cultural Fest");
      setCategory("College Event");
      setDate("2026-11-30");
      setLocation("University Open Air Amphitheatre, Delhi");
      setGuestCount(500);
      setTotalBudget(250000);
      setPreferredTheme("Bohemian Electric Carnival");
      setDuration("2 Days");
      setSpecialRequirements("Battle of the bands sound rig, food truck zone, live graffiti wall");
      setFoodPreferences("Budget friendly street food, momos, burger carts, cold coffee");
      setDecorationPreferences("Origami paper lanterns, colorful festival flags, recycled pallets");
    }
  };

  const handleGeneratePlan = async () => {
    if (!name.trim()) {
      setError("Please provide an event name.");
      return;
    }
    setError(null);
    setLoading(true);
    setSavedSuccess(false);

    try {
      const res = await api.generateAiPlan({
        name,
        category,
        date,
        location,
        guestCount,
        totalBudget,
        preferredTheme,
        duration,
        specialRequirements,
        foodPreferences,
        decorationPreferences,
      });

      setGeneratedPlan(res.plan);
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch (e) {
        // ignore
      }
    } catch (err: any) {
      setError(err?.message || "Failed to generate AI event plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndActivate = async () => {
    if (!generatedPlan) return;
    setSaving(true);
    try {
      // 1. Create Event in DB
      const createdEvent = await createEvent({
        name,
        category,
        date,
        time,
        location,
        guestCount,
        totalBudget,
        preferredTheme,
        duration,
        specialRequirements,
        foodPreferences,
        decorationPreferences,
      });

      // 2. Save Plan in DB
      await api.saveEventPlan(createdEvent.id, {
        ...generatedPlan,
        eventId: createdEvent.id,
      });

      // 3. Auto-populate initial tasks from plan
      if (generatedPlan.vendorChecklist) {
        for (const vItem of generatedPlan.vendorChecklist) {
          for (const taskStr of vItem.items) {
            await api.addTask({
              eventId: createdEvent.id,
              title: `${vItem.category}: ${taskStr}`,
              category: vItem.category,
              priority: vItem.priority === "Essential" ? "Critical" : "Medium",
              dueDate: date,
              isCompleted: false,
            });
          }
        }
      }

      setSavedSuccess(true);
      try {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      } catch (e) {
        // ignore
      }

      setTimeout(() => {
        onPlanCreated();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Failed to save event and plan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 via-white to-pink-50 p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-[#6C4AB6] text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generative AI Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#25223A]">
              AI Event Architect
            </h2>
            <p className="text-gray-500 text-sm mt-1 max-w-xl">
              Fill in your event vision. Gemini AI will automatically orchestrate a full end-to-end plan, budget allocation, vendor checklist, and decor recommendations.
            </p>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-400">Quick Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset("wedding")}
              className="px-2.5 py-1 text-xs rounded-lg bg-white border border-purple-200 hover:border-purple-400 text-purple-700 font-medium transition-colors"
            >
              💍 Wedding
            </button>
            <button
              type="button"
              onClick={() => applyPreset("birthday")}
              className="px-2.5 py-1 text-xs rounded-lg bg-white border border-purple-200 hover:border-purple-400 text-purple-700 font-medium transition-colors"
            >
              🎂 Birthday
            </button>
            <button
              type="button"
              onClick={() => applyPreset("corporate")}
              className="px-2.5 py-1 text-xs rounded-lg bg-white border border-purple-200 hover:border-purple-400 text-purple-700 font-medium transition-colors"
            >
              🏢 Corporate
            </button>
            <button
              type="button"
              onClick={() => applyPreset("college")}
              className="px-2.5 py-1 text-xs rounded-lg bg-white border border-purple-200 hover:border-purple-400 text-purple-700 font-medium transition-colors"
            >
              🎓 College
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-[#25223A] border-b border-gray-100 pb-3 flex items-center gap-2">
          <span>1. Core Event Parameters</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Event Name */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Event Title / Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maya & Kabir's Sunset Palace Wedding"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#6C4AB6] text-sm text-gray-800"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Event Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as EventCategory)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#6C4AB6] text-sm text-gray-800 bg-white"
            >
              <option value="Wedding">Wedding</option>
              <option value="Birthday">Birthday</option>
              <option value="Anniversary">Anniversary</option>
              <option value="College Event">College Event</option>
              <option value="Corporate Event">Corporate Event</option>
              <option value="Community Event">Community Event</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#6C4AB6]" />
                <span>Date *</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#6C4AB6] text-sm text-gray-800 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#6C4AB6]" />
                <span>Time</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#6C4AB6] text-sm text-gray-800 bg-white"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#6C4AB6]" />
              <span>Location / City / Venue *</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Udaipur, Bangalore, Mumbai, or venue name"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#6C4AB6] text-sm text-gray-800"
            />
          </div>

          {/* Guest Count & Budget */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3 text-[#6C4AB6]" />
                <span>Guests *</span>
              </label>
              <input
                type="number"
                min={5}
                max={5000}
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#6C4AB6] text-sm text-gray-800"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                <Wallet className="w-3 h-3 text-[#6C4AB6]" />
                <span>Budget (₹) *</span>
              </label>
              <input
                type="number"
                step={5000}
                value={totalBudget}
                onChange={(e) => setTotalBudget(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#6C4AB6] text-sm text-gray-800 font-bold text-purple-900"
              />
            </div>
          </div>
        </div>

        <h3 className="text-lg font-bold text-[#25223A] border-b border-gray-100 pb-3 pt-4 flex items-center gap-2">
          <span>2. Aesthetics &amp; Preferences</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Preferred Theme */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
              <Palette className="w-3 h-3 text-[#6C4AB6]" />
              <span>Preferred Theme / Color Mood</span>
            </label>
            <input
              type="text"
              value={preferredTheme}
              onChange={(e) => setPreferredTheme(e.target.value)}
              placeholder="e.g. Royal Maroon & Gold, Pastel Boho, Cyberpunk"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#6C4AB6] text-sm text-gray-800"
            />
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#6C4AB6]" />
              <span>Event Duration</span>
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 4 Hours, Evening, 2 Days"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#6C4AB6] text-sm text-gray-800"
            />
          </div>

          {/* Food Preferences */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
              <Utensils className="w-3 h-3 text-[#6C4AB6]" />
              <span>Food &amp; Catering Preferences</span>
            </label>
            <input
              type="text"
              value={foodPreferences}
              onChange={(e) => setFoodPreferences(e.target.value)}
              placeholder="e.g. Pure Vegetarian, Live Chaat, Mocktail Bar, Continental"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#6C4AB6] text-sm text-gray-800"
            />
          </div>

          {/* Decoration Preferences */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
              <Flower2 className="w-3 h-3 text-[#6C4AB6]" />
              <span>Decoration &amp; Stage Preferences</span>
            </label>
            <input
              type="text"
              value={decorationPreferences}
              onChange={(e) => setDecorationPreferences(e.target.value)}
              placeholder="e.g. Floral arches, fairy light canopy, minimal stages"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#6C4AB6] text-sm text-gray-800"
            />
          </div>

          {/* Special Requirements */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Special Requirements / Unique Notes
            </label>
            <textarea
              rows={2}
              value={specialRequirements}
              onChange={(e) => setSpecialRequirements(e.target.value)}
              placeholder="e.g. Elderly accessibility, pet-friendly lawn, drone clearance, late-night music permissions..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#6C4AB6] text-sm text-gray-800"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={handleGeneratePlan}
            className={`px-6 py-3 rounded-xl font-bold text-sm text-white flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
              loading
                ? "bg-purple-400 cursor-not-allowed"
                : "bg-gradient-to-r from-[#6C4AB6] via-[#7B52CE] to-pink-500 hover:opacity-95 hover:scale-101 shadow-purple-600/20"
            }`}
          >
            {loading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Gemini AI is Architecting Your Plan...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Generate Complete Event Plan with Gemini</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Plan Review Panel */}
      {generatedPlan && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-200 shadow-xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                AI Blueprint Generated
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#25223A] mt-1">
                {generatedPlan.recommendedTheme}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={handleGeneratePlan}
                className="px-4 py-2 rounded-xl border border-purple-200 hover:bg-purple-50 text-xs font-semibold text-[#6C4AB6] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
              <button
                type="button"
                disabled={saving || savedSuccess}
                onClick={handleSaveAndActivate}
                className="px-5 py-2.5 rounded-xl bg-[#6C4AB6] hover:bg-[#58399e] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                {saving ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Saving to Dashboard...</span>
                  </>
                ) : savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Activated! Redirecting...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Plan &amp; Activate</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Plan Overview & Palette */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Event Narrative &amp; Overview
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed bg-purple-50/40 p-4 rounded-2xl border border-purple-100/60">
                {generatedPlan.overview}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Color Palette
              </h4>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                {generatedPlan.colorPalette?.map((hex, i) => (
                  <div key={i} className="flex-1 text-center">
                    <div
                      className="w-full h-10 rounded-xl shadow-xs border border-black/10"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-[10px] font-mono text-gray-500 mt-1 block">
                      {hex}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Decor & Venue */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Decor Ideas */}
            <div className="p-5 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-3">
              <h4 className="text-xs font-bold text-[#6C4AB6] uppercase tracking-wider flex items-center gap-1.5">
                <Flower2 className="w-4 h-4" />
                <span>Decor &amp; Aesthetic Concepts</span>
              </h4>
              <ul className="space-y-2 text-xs text-gray-700">
                {generatedPlan.decorationIdeas?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6C4AB6] mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Venue Suggestions */}
            <div className="p-5 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-3">
              <h4 className="text-xs font-bold text-[#6C4AB6] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>Venue Selection &amp; Criteria</span>
              </h4>
              <div className="space-y-2 text-xs text-gray-700">
                <p>
                  <strong className="text-gray-900">Criteria:</strong> {generatedPlan.venueSuggestions?.criteria}
                </p>
                <div>
                  <strong className="text-gray-900">Recommended Types:</strong>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {generatedPlan.venueSuggestions?.recommendedTypes?.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-purple-100/80 text-purple-800 text-[11px] font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-gray-500 italic text-[11px]">
                  💡 Tip: {generatedPlan.venueSuggestions?.tips}
                </p>
              </div>
            </div>
          </div>

          {/* Catering & Entertainment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Catering */}
            <div className="p-5 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-3">
              <h4 className="text-xs font-bold text-[#6C4AB6] uppercase tracking-wider flex items-center gap-1.5">
                <Utensils className="w-4 h-4" />
                <span>Catering &amp; Menu Recommendations</span>
              </h4>
              <div className="space-y-2 text-xs text-gray-700">
                <p>
                  <strong className="text-gray-900">Style:</strong> {generatedPlan.cateringRecommendations?.menuStyle}
                </p>
                <div>
                  <strong className="text-gray-900">Signature Items:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                    {generatedPlan.cateringRecommendations?.suggestedItems?.map((food, idx) => (
                      <li key={idx}>{food}</li>
                    ))}
                  </ul>
                </div>
                <p className="text-[11px] text-gray-500">
                  {generatedPlan.cateringRecommendations?.dietaryNotes}
                </p>
              </div>
            </div>

            {/* Budget Distribution */}
            <div className="p-5 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-3">
              <h4 className="text-xs font-bold text-[#6C4AB6] uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-4 h-4" />
                <span>AI Proposed Budget Distribution</span>
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {generatedPlan.budgetDistribution?.map((bd, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-semibold text-gray-800">{bd.category}</p>
                      <p className="text-[10px] text-gray-400">{bd.notes}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#6C4AB6]">₹{bd.amount.toLocaleString()}</p>
                      <span className="text-[10px] text-gray-400">{bd.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
