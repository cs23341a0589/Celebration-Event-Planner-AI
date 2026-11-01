import React, { useState } from "react";
import {
  Printer,
  X,
  Download,
  Copy,
  Check,
  Sparkles,
  Calendar,
  MapPin,
  Users,
  Wallet,
  ExternalLink,
} from "lucide-react";
import { EventItem, EventPlan } from "../../types/index.ts";

interface PrintExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem;
  plan: EventPlan;
}

export const PrintExportModal: React.FC<PrintExportModalProps> = ({
  isOpen,
  onClose,
  event,
  plan,
}) => {
  const [copied, setCopied] = useState(false);
  const [printBlocked, setPrintBlocked] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn("Iframe window.print blocked by browser sandbox", err);
      setPrintBlocked(true);
      handleDownloadHtml();
    }
  };

  const handleCopyMarkdown = () => {
    const text = `
# ${event.name} - Master Celebration Plan
Generated with Celebration & Event Planner AI

- Category: ${event.category}
- Date: ${event.date} ${event.time ? `at ${event.time}` : ""}
- Location: ${event.location}
- Guests: ${event.guestCount}
- Target Budget: ₹${event.totalBudget.toLocaleString()}
- Recommended Theme: ${plan.recommendedTheme}

## Celebration Narrative
${plan.overview}

## Color Palette
${plan.colorPalette?.join(", ")}

## Decor & Aesthetic Concepts
${plan.decorationIdeas?.map((d) => `- ${d}`).join("\n")}

## Venue Selection
Criteria: ${plan.venueSuggestions?.criteria}
Recommended Types: ${plan.venueSuggestions?.recommendedTypes?.join(", ")}
Insider Tip: ${plan.venueSuggestions?.tips}

## Catering & Menu
Style: ${plan.cateringRecommendations?.menuStyle}
Signature Items: ${plan.cateringRecommendations?.suggestedItems?.join(", ")}
Dietary: ${plan.cateringRecommendations?.dietaryNotes}

## Budget Allocation
${plan.budgetDistribution?.map((b) => `- ${b.category}: ₹${b.amount.toLocaleString()} (${b.percentage}%) - ${b.notes}`).join("\n")}

## Vendor Checklist
${plan.vendorChecklist?.map((v) => `### ${v.category} (${v.priority})\n${v.items.map((i) => `- [ ] ${i}`).join("\n")}`).join("\n\n")}
`;
    navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${event.name} - Celebration Plan</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #25223A; line-height: 1.5; padding: 40px; max-width: 800px; margin: 0 auto; background: #fff; }
    h1 { color: #6C4AB6; border-bottom: 2px solid #6C4AB6; padding-bottom: 8px; margin-bottom: 4px; }
    h2 { color: #6C4AB6; margin-top: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; font-size: 16px; text-transform: uppercase; }
    .meta { font-size: 13px; color: #64748b; margin-bottom: 24px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; background: #ede9fe; color: #6C4AB6; }
    .overview { background: #f8f7fc; padding: 16px; border-radius: 12px; font-size: 13px; border-left: 4px solid #6C4AB6; }
    .palette-box { display: inline-block; width: 60px; height: 35px; border-radius: 6px; margin-right: 8px; border: 1px solid #ccc; text-align: center; line-height: 35px; color: #fff; font-size: 10px; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.6); }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
    th { background: #f8f7fc; color: #6C4AB6; font-weight: bold; }
    ul { margin: 8px 0; padding-left: 20px; font-size: 13px; }
    @media print {
      body { padding: 0; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <h1>${event.name}</h1>
  <div class="meta">
    <strong>Category:</strong> ${event.category} &bull; 
    <strong>Date:</strong> ${event.date} &bull; 
    <strong>Guests:</strong> ${event.guestCount} &bull; 
    <strong>Budget:</strong> ₹${event.totalBudget.toLocaleString()} &bull; 
    <span class="badge">${plan.recommendedTheme}</span>
  </div>

  <h2>Celebration Overview</h2>
  <div class="overview">${plan.overview}</div>

  <h2>Color Palette</h2>
  <div>
    ${plan.colorPalette?.map((hex) => `<div class="palette-box" style="background-color: ${hex};">${hex}</div>`).join("")}
  </div>

  <h2>Decor &amp; Aesthetic Concepts</h2>
  <ul>
    ${plan.decorationIdeas?.map((d) => `<li>${d}</li>`).join("")}
  </ul>

  <h2>Venue Criteria</h2>
  <p><strong>Selection Criteria:</strong> ${plan.venueSuggestions?.criteria}</p>
  <p><strong>Recommended Types:</strong> ${plan.venueSuggestions?.recommendedTypes?.join(", ")}</p>
  <p><em>Tip: ${plan.venueSuggestions?.tips}</em></p>

  <h2>Catering &amp; Menu</h2>
  <p><strong>Style:</strong> ${plan.cateringRecommendations?.menuStyle}</p>
  <ul>
    ${plan.cateringRecommendations?.suggestedItems?.map((i) => `<li>${i}</li>`).join("")}
  </ul>
  <p><em>Dietary: ${plan.cateringRecommendations?.dietaryNotes}</em></p>

  <h2>Budget Distribution</h2>
  <table>
    <thead>
      <tr><th>Category</th><th>Amount</th><th>Share</th><th>Notes</th></tr>
    </thead>
    <tbody>
      ${plan.budgetDistribution?.map((b) => `<tr><td><strong>${b.category}</strong></td><td>₹${b.amount.toLocaleString()}</td><td>${b.percentage}%</td><td>${b.notes}</td></tr>`).join("")}
    </tbody>
  </table>

  <h2>Vendor Checklist</h2>
  <ul>
    ${plan.vendorChecklist?.flatMap((v) => v.items.map((i) => `<li><strong>${v.category}:</strong> ${i} (${v.priority})</li>`)).join("")}
  </ul>

  <script>
    // Auto-trigger print when opened in a new tab
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.name.replace(/[^a-zA-Z0-9]/g, "_")}_Event_Plan.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenPrintWindow = () => {
    // Open in standalone tab for guaranteed printing outside iframe
    handleDownloadHtml();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#6C4AB6] flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-gray-900">
                Print &amp; Export Celebration Plan
              </h3>
              <p className="text-xs text-gray-500">
                Print directly, download offline HTML/PDF, or copy markdown
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {printBlocked && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <span>
              ℹ️ Direct iframe printing was captured by the browser sandbox. Your offline printable HTML has been downloaded and can be opened in any tab to print with Ctrl+P / Cmd+P!
            </span>
          </div>
        )}

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-purple-50/60 rounded-2xl border border-purple-100">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#6C4AB6] hover:bg-[#5b3da0] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Document</span>
          </button>

          <button
            onClick={handleDownloadHtml}
            className="px-4 py-2 rounded-xl bg-white hover:bg-purple-100/70 border border-purple-200 text-[#6C4AB6] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Offline HTML / PDF</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="px-4 py-2 rounded-xl bg-white hover:bg-purple-100/70 border border-purple-200 text-[#6C4AB6] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Markdown Text</span>
              </>
            )}
          </button>
        </div>

        {/* Formatted Preview */}
        <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-4 text-gray-800 font-sans max-h-96 overflow-y-auto">
          <div className="border-b border-gray-200 pb-3">
            <h1 className="text-xl font-black text-[#6C4AB6]">{event.name}</h1>
            <p className="text-gray-500 text-xs mt-1">
              Category: {event.category} &bull; Date: {event.date} &bull; Guests: {event.guestCount} &bull; Budget: ₹{event.totalBudget.toLocaleString()}
            </p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#6C4AB6] font-bold text-[10px]">
              Theme: {plan.recommendedTheme}
            </span>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-1">
              Narrative Overview
            </h4>
            <p className="leading-relaxed bg-white p-3 rounded-xl border border-gray-100">
              {plan.overview}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-2">
              Color Palette
            </h4>
            <div className="flex gap-2">
              {plan.colorPalette?.map((hex, i) => (
                <div key={i} className="text-center">
                  <div
                    className="w-12 h-8 rounded-md border border-gray-300"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="text-[9px] font-mono block mt-1">{hex}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-1">
              Decor Concepts
            </h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {plan.decorationIdeas?.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-1">
              Budget Distribution
            </h4>
            <div className="divide-y divide-gray-200 bg-white rounded-xl border border-gray-200">
              {plan.budgetDistribution?.map((b, i) => (
                <div key={i} className="p-2.5 flex items-center justify-between">
                  <span>{b.category}</span>
                  <span className="font-bold text-[#6C4AB6]">
                    ₹{b.amount.toLocaleString()} ({b.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
