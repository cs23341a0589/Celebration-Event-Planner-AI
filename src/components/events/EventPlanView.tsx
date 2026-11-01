import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Palette,
  Flower2,
  MapPin,
  Utensils,
  Music,
  Camera,
  Wallet,
  CheckSquare,
  Users,
  Printer,
  RotateCw,
  Copy,
  Check,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { useEvent } from "../../context/EventContext.tsx";
import { api } from "../../services/api.ts";
import { EventPlan } from "../../types/index.ts";
import { PrintExportModal } from "../modals/PrintExportModal.tsx";

export const EventPlanView: React.FC = () => {
  const { events, activeEvent, setActiveEventId } = useEvent();
  const [plan, setPlan] = useState<EventPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Determine current active event or fallback to first event in list
  const currentEvent = activeEvent || (events.length > 0 ? events[0] : null);

  useEffect(() => {
    async function fetchPlan() {
      if (!currentEvent) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api.getEventPlan(currentEvent.id);
        if (res.plan) {
          setPlan(res.plan);
        } else {
          // Provide fallback plan based on event details so user always sees full plan
          const fallbackPlan: EventPlan = {
            id: `plan-${currentEvent.id}`,
            eventId: currentEvent.id,
            userId: currentEvent.userId,
            overview: `A tailored ${currentEvent.category.toLowerCase()} celebration designed for ${
              currentEvent.guestCount
            } guests with a budget of ₹${currentEvent.totalBudget.toLocaleString()}. Combining refined ambiance with unforgettable guest entertainment and gourmet catering in ${
              currentEvent.location
            }.`,
            recommendedTheme:
              currentEvent.preferredTheme ||
              (currentEvent.category === "Wedding"
                ? "Royal Rajputana Crimson & Gold Splendor"
                : currentEvent.category === "Birthday"
                ? "Cosmic Neon & Holographic Fiesta"
                : "Modern Sophistication & Champagne Warmth"),
            colorPalette:
              currentEvent.category === "Wedding"
                ? ["#8B0000", "#FFD700", "#E6C280", "#2E1A47"]
                : currentEvent.category === "Birthday"
                ? ["#6C4AB6", "#EC4899", "#3B82F6", "#10B981"]
                : ["#1E293B", "#6C4AB6", "#A78BFA", "#F59E0B"],
            decorationIdeas: [
              "Grand floral entry archway with localized seasonal flowers and warm LED accents",
              "Bespoke ambient lighting with hanging lanterns and fairy light canopies",
              "Statement stage backdrop tailored for memorable photo-ops and speeches",
              "Minimalist curated table centerpieces with soft brass accents",
            ],
            venueSuggestions: {
              criteria: `Spacious indoor banquet or open-air lawn accommodating ${currentEvent.guestCount} guests comfortably`,
              recommendedTypes: ["Heritage Banquet Hall", "Lawn & Poolside Terrace"],
              tips: "Ensure generator backup for stage sound and check local curfew guidelines (10:00 PM cutoff).",
            },
            cateringRecommendations: {
              menuStyle: "Curated Live Specialty Counters & Full-Course Buffet",
              suggestedItems: [
                "Artisanal Mocktail / Welcome Elixir",
                "Gourmet Paneer Tikka & Regional Street Chaat",
                "Royal Biryani & Handcrafted Breads",
                "Signature Dessert Counter with Belgian Chocolate & Rabdi",
              ],
              dietaryNotes:
                "Dedicated vegetarian and Jain options clearly labeled; allergen-friendly dishes available.",
            },
            entertainmentIdeas: [
              "Live acoustic band or traditional folk ensemble for guest arrival",
              "Synchronized celebration soundtrack and DJ dance segment",
              "Interactive digital photobooth with customized celebratory print frames",
            ],
            photographyRequirements: [
              "Sunset golden hour couple/host portraits",
              "Cinematic drone coverage of grand entry and peak celebration moments",
              "Candid family shots and guest interaction reels",
            ],
            budgetDistribution: [
              {
                category: "Venue & Hospitality",
                percentage: 28,
                amount: Math.round(currentEvent.totalBudget * 0.28),
                notes: "Banquet rental, guest parking, security",
              },
              {
                category: "Catering & Bar",
                percentage: 30,
                amount: Math.round(currentEvent.totalBudget * 0.3),
                notes: "Multi-course feast and live stations",
              },
              {
                category: "Decoration & Flowers",
                percentage: 16,
                amount: Math.round(currentEvent.totalBudget * 0.16),
                notes: "Entrance arch, stage backdrop, fairy lights",
              },
              {
                category: "Photography & Video",
                percentage: 10,
                amount: Math.round(currentEvent.totalBudget * 0.1),
                notes: "Lead photographer, cinematic teaser film",
              },
              {
                category: "Entertainment & DJ",
                percentage: 8,
                amount: Math.round(currentEvent.totalBudget * 0.08),
                notes: "Sound setup, DJ console, live performer",
              },
              {
                category: "Invitations & Favors",
                percentage: 4,
                amount: Math.round(currentEvent.totalBudget * 0.04),
                notes: "Digital video invitations, customized favors",
              },
              {
                category: "Miscellaneous Contingency",
                percentage: 4,
                amount: Math.round(currentEvent.totalBudget * 0.04),
                notes: "Buffer reserve for last-minute approvals",
              },
            ],
            vendorChecklist: [
              {
                category: "Venue",
                items: ["Confirm banquet agreement", "Verify loading hours"],
                priority: "Essential",
              },
              {
                category: "Catering",
                items: ["Menu tasting session", "Confirm bar & glassware count"],
                priority: "Essential",
              },
              {
                category: "Decor",
                items: ["Approve 3D stage layout", "Floral color palette review"],
                priority: "Essential",
              },
              {
                category: "Photography",
                items: ["Finalize VIP shotlist", "Book crew travel"],
                priority: "Recommended",
              },
            ],
            guestManagementSuggestions: [
              "Send automated digital RSVP reminders 20 days prior to event",
              "Set up a dedicated welcome desk for luggage and guest guidance",
              "Organize comfortable seating near stage for elderly guests and VIPs",
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setPlan(fallbackPlan);
        }
      } catch (e) {
        console.error("Error loading plan", e);
      } finally {
        setLoading(false);
      }
    }
    fetchPlan();
  }, [currentEvent]);

  const copyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  const handleRegenerate = async () => {
    if (!currentEvent) return;
    setRegenerating(true);
    try {
      const res = await api.generateAiPlan({
        name: currentEvent.name,
        category: currentEvent.category,
        date: currentEvent.date,
        location: currentEvent.location,
        guestCount: currentEvent.guestCount,
        totalBudget: currentEvent.totalBudget,
        preferredTheme: currentEvent.preferredTheme,
        duration: currentEvent.duration,
        specialRequirements: currentEvent.specialRequirements,
        foodPreferences: currentEvent.foodPreferences,
        decorationPreferences: currentEvent.decorationPreferences,
      });

      const saved = await api.saveEventPlan(currentEvent.id, {
        ...res.plan,
        eventId: currentEvent.id,
      });
      setPlan(saved.plan);
    } catch (e) {
      console.error("Regenerate failed", e);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Celebration Switcher Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Viewing Celebration:
          </span>
          <div className="relative">
            <button
              onClick={() => setShowEventDropdown(!showEventDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100/70 border border-purple-200 text-xs font-bold text-[#6C4AB6] transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{currentEvent?.name || "Select Celebration"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
            </button>

            {showEventDropdown && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-purple-100 py-2 z-50 animate-in fade-in">
                {events.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => {
                      setActiveEventId(ev.id);
                      setShowEventDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-purple-50 transition-colors ${
                      currentEvent?.id === ev.id
                        ? "bg-purple-50/80 font-bold text-[#6C4AB6]"
                        : "text-gray-700"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className="truncate">{ev.name}</p>
                      <p className="text-[10px] text-gray-400">{ev.category} • ₹{ev.totalBudget.toLocaleString()}</p>
                    </div>
                    {currentEvent?.id === ev.id && (
                      <span className="w-2 h-2 rounded-full bg-[#6C4AB6]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-400 font-medium">
          Date: <strong className="text-gray-700">{currentEvent?.date || "2026-11-28"}</strong> •{" "}
          Budget: <strong className="text-[#6C4AB6]">₹{currentEvent?.totalBudget?.toLocaleString() || "4,50,000"}</strong>
        </div>
      </div>

      {/* Top Banner with Action Bar */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-[#6C4AB6] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>GenAI Master Event Plan Details</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            {plan?.recommendedTheme || "Royal Rajputana Crimson & Gold Splendor"}
          </h2>
          <p className="text-purple-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Custom crafted for <strong>{currentEvent?.name || "Grand Celebration"}</strong> •{" "}
            {currentEvent?.guestCount || 200} Guests • Budget: ₹
            {currentEvent?.totalBudget?.toLocaleString() || "4,50,000"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowPrintModal(true)}
            className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="px-4 py-2 rounded-xl bg-white text-[#6C4AB6] hover:bg-purple-50 text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            {regenerating ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCw className="w-3.5 h-3.5" />
            )}
            <span>Regenerate with AI</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-purple-600 bg-white rounded-3xl border border-purple-100">
          <RotateCw className="w-6 h-6 animate-spin" />
          <span className="text-sm font-semibold">Loading celebration blueprint...</span>
        </div>
      ) : plan ? (
        <>
          {/* Overview & Color Palette */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-xs lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700">
                <Sparkles className="w-4 h-4" />
                <span>Celebration Narrative &amp; Vision</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed bg-purple-50/30 p-4 rounded-2xl border border-purple-100/60">
                {plan.overview}
              </p>
            </div>

            {/* Color Palette */}
            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700">
                <Palette className="w-4 h-4" />
                <span>Color Swatches</span>
              </div>
              <p className="text-xs text-gray-400">Click any color to copy hex value</p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {plan.colorPalette?.map((hex, i) => (
                  <div
                    key={i}
                    onClick={() => copyColor(hex)}
                    className="group relative p-2 rounded-xl bg-gray-50 border border-gray-100 hover:border-purple-300 transition-all cursor-pointer"
                  >
                    <div
                      className="w-full h-12 rounded-lg shadow-2xs border border-black/10 group-hover:scale-102 transition-transform"
                      style={{ backgroundColor: hex }}
                    />
                    <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-gray-600 font-semibold">
                      <span>{hex}</span>
                      {copiedHex === hex ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-400 group-hover:text-purple-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Decor Concepts & Venue */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6C4AB6]">
                <Flower2 className="w-4 h-4" />
                <span>Decor &amp; Stage Concepts</span>
              </div>
              <div className="space-y-2.5">
                {plan.decorationIdeas?.map((idea, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-purple-50/30 border border-purple-100/50 flex items-start gap-3 text-xs text-gray-800 leading-relaxed"
                  >
                    <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{idea}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6C4AB6]">
                <MapPin className="w-4 h-4" />
                <span>Venue Criteria &amp; Suggestions</span>
              </div>
              <div className="space-y-3 text-xs text-gray-700">
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                  <strong className="block text-gray-900 font-semibold mb-1">
                    Recommended Venue Styles:
                  </strong>
                  <div className="flex flex-wrap gap-2">
                    {plan.venueSuggestions?.recommendedTypes?.map((vt, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-900 font-semibold text-[11px]"
                      >
                        {vt}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                  <strong className="block text-gray-900 font-semibold mb-1">Selection Criteria:</strong>
                  <p className="leading-relaxed">{plan.venueSuggestions?.criteria}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-900">
                  <strong className="block font-semibold mb-0.5">💡 Coordinator's Insider Tip:</strong>
                  <p className="leading-relaxed">{plan.venueSuggestions?.tips}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Catering & Entertainment & Photography */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6C4AB6]">
                <Utensils className="w-4 h-4" />
                <span>Catering &amp; Menu</span>
              </div>
              <div className="text-xs space-y-2">
                <p className="font-semibold text-gray-800">
                  Style:{" "}
                  <span className="text-[#6C4AB6] font-bold">
                    {plan.cateringRecommendations?.menuStyle}
                  </span>
                </p>
                <div className="pt-1">
                  <p className="font-semibold text-gray-700 mb-1.5">Signature Menu Highlights:</p>
                  <ul className="space-y-1.5 text-gray-600">
                    {plan.cateringRecommendations?.suggestedItems?.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-[11px] text-gray-500 pt-2 border-t border-gray-100 italic">
                  {plan.cateringRecommendations?.dietaryNotes}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6C4AB6]">
                <Music className="w-4 h-4" />
                <span>Entertainment &amp; DJ</span>
              </div>
              <div className="space-y-2 text-xs text-gray-700">
                {plan.entertainmentIdeas?.map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100 leading-relaxed">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6C4AB6]">
                <Camera className="w-4 h-4" />
                <span>Photography &amp; Video</span>
              </div>
              <div className="space-y-2 text-xs text-gray-700">
                {plan.photographyRequirements?.map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100 leading-relaxed">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Budget Distribution & Vendor Checklist */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6C4AB6]">
                  <Wallet className="w-4 h-4" />
                  <span>Budget Distribution</span>
                </div>
                <span className="text-xs font-bold text-gray-700">
                  Total: ₹{currentEvent?.totalBudget?.toLocaleString()}
                </span>
              </div>

              <div className="divide-y divide-gray-100">
                {plan.budgetDistribution?.map((bd, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-gray-800">{bd.category}</p>
                      <p className="text-[11px] text-gray-400">{bd.notes}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#6C4AB6]">₹{bd.amount?.toLocaleString()}</p>
                      <span className="text-[10px] text-gray-400">{bd.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6C4AB6]">
                <CheckSquare className="w-4 h-4" />
                <span>Curated Vendor Checklist</span>
              </div>

              <div className="space-y-3">
                {plan.vendorChecklist?.map((v, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">{v.category}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          v.priority === "Essential"
                            ? "bg-rose-100 text-rose-700"
                            : v.priority === "Recommended"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {v.priority}
                      </span>
                    </div>
                    <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5">
                      {v.items?.map((it, idx) => (
                        <li key={idx}>{it}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {showPrintModal && currentEvent && plan && (
        <PrintExportModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          event={currentEvent}
          plan={plan}
        />
      )}
    </div>
  );
};
