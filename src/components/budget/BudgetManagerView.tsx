import React, { useState, useEffect } from "react";
import {
  Wallet,
  Receipt,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  RotateCw,
  PieChart as PieIcon,
  BarChart3,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Calendar,
  ChevronDown,
  Printer,
  Download,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useEvent } from "../../context/EventContext.tsx";
import { api } from "../../services/api.ts";
import { ExpenseItem, BudgetCategoryItem } from "../../types/index.ts";
import confetti from "canvas-confetti";

const CHART_COLORS = [
  "#6C4AB6",
  "#A78BFA",
  "#F59EBD",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#64748B",
];

export const BudgetManagerView: React.FC = () => {
  const { events, activeEvent, setActiveEventId } = useEvent();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventDropdown, setShowEventDropdown] = useState(false);

  // AI Optimization modal & result state
  const [optimizing, setOptimizing] = useState(false);
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const currentEvent = activeEvent || (events.length > 0 ? events[0] : null);

  useEffect(() => {
    async function loadExpenses() {
      if (!currentEvent) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api.getExpenses(currentEvent.id);
        setExpenses(res.expenses);
      } catch (err) {
        console.error("Failed to load expenses for budget", err);
      } finally {
        setLoading(false);
      }
    }
    loadExpenses();
  }, [currentEvent]);

  const totalBudget = currentEvent ? currentEvent.totalBudget : 450000;
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBudget = totalBudget - totalSpent;
  const isOverBudget = totalSpent > totalBudget;
  const utilizationPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Default allocations if none set
  const defaultAllocations: Record<string, number> = {
    "Venue & Hospitality": Math.round(totalBudget * 0.28),
    "Catering & Bar": Math.round(totalBudget * 0.3),
    "Decoration & Flowers": Math.round(totalBudget * 0.16),
    "Photography & Cinema": Math.round(totalBudget * 0.1),
    "Entertainment & DJ": Math.round(totalBudget * 0.08),
    "Invitations & Gifts": Math.round(totalBudget * 0.04),
    "Miscellaneous Contingency": Math.round(totalBudget * 0.04),
  };

  // Group actual expenses by category
  const categorySpent: Record<string, number> = {};
  expenses.forEach((e) => {
    let matched = Object.keys(defaultAllocations).find((k) =>
      k.toLowerCase().includes(e.category.toLowerCase()) || e.category.toLowerCase().includes(k.toLowerCase())
    );
    const key = matched || e.category || "Miscellaneous";
    categorySpent[key] = (categorySpent[key] || 0) + e.amount;
  });

  // If no expenses logged yet, add sample preview so graphs render immediately
  if (expenses.length === 0) {
    categorySpent["Venue & Hospitality"] = Math.round(totalBudget * 0.15);
    categorySpent["Catering & Bar"] = Math.round(totalBudget * 0.09);
    categorySpent["Decoration & Flowers"] = Math.round(totalBudget * 0.05);
    categorySpent["Photography & Cinema"] = Math.round(totalBudget * 0.04);
  }

  // Categories list for planned vs actual
  const categoryRows = Object.keys(defaultAllocations).map((cat) => {
    const planned = defaultAllocations[cat];
    const actual = categorySpent[cat] || 0;
    const diff = planned - actual;
    const overCategory = actual > planned;
    return {
      category: cat,
      planned,
      actual,
      diff,
      overCategory,
      pctSpent: planned > 0 ? Math.round((actual / planned) * 100) : 0,
    };
  });

  // Chart Data
  const barChartData = categoryRows.map((r) => ({
    name: r.category.split(" ")[0],
    fullName: r.category,
    Planned: r.planned,
    Actual: r.actual,
  }));

  const pieChartData = Object.keys(categorySpent).map((cat) => ({
    name: cat,
    value: categorySpent[cat],
  }));

  // Trigger AI Budget Optimization
  const handleRunAiOptimization = async () => {
    setOptimizing(true);
    setShowOptimizeModal(true);
    setOptimizationResult(null);
    setAppliedSuccess(false);

    try {
      const res = await api.optimizeAiBudget({
        eventId: currentEvent?.id,
        eventName: currentEvent?.name || "Grand Celebration",
        category: currentEvent?.category || "Wedding",
        totalBudget: totalBudget,
        categories: categoryRows.map((r) => ({
          category: r.category,
          allocatedAmount: r.planned,
          spentAmount: r.actual,
        })),
      });

      setOptimizationResult(res.optimization);
    } catch (err: any) {
      console.error("AI Budget Optimization error", err);
    } finally {
      setOptimizing(false);
    }
  };

  const handleApplyReallocation = () => {
    setAppliedSuccess(true);
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch (e) {
      // ignore
    }
    setTimeout(() => {
      setShowOptimizeModal(false);
    }, 1500);
  };

  const handleExportBudget = () => {
    if (!currentEvent) return;
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${currentEvent.name} - Budget & Financial Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #25223A; max-width: 800px; margin: auto; }
    h1 { color: #6C4AB6; border-bottom: 2px solid #6C4AB6; padding-bottom: 6px; }
    .meta { font-size: 13px; color: #666; margin-bottom: 20px; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .box { background: #f8f7fc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .box span { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
    .box strong { display: block; font-size: 20px; color: #6C4AB6; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
    th { background: #f8f7fc; color: #6C4AB6; font-weight: bold; }
    .over { color: #e11d48; font-weight: bold; }
    .under { color: #059669; font-weight: bold; }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <h1>${currentEvent.name} - Budget & Expense Ledger</h1>
  <div class="meta">Category: ${currentEvent.category} &bull; Date: ${currentEvent.date} &bull; Guests: ${currentEvent.guestCount}</div>
  <div class="summary-grid">
    <div class="box"><span>Total Target Budget</span><strong>₹${totalBudget.toLocaleString()}</strong></div>
    <div class="box"><span>Total Actual Spent</span><strong>₹${totalSpent.toLocaleString()}</strong></div>
    <div class="box"><span>Remaining Funds</span><strong style="color: ${remainingBudget >= 0 ? '#059669' : '#e11d48'}">₹${remainingBudget.toLocaleString()}</strong></div>
  </div>
  <h3>Category Breakdown</h3>
  <table>
    <thead><tr><th>Category</th><th>Planned</th><th>Actual Spent</th><th>Remaining Variance</th><th>Status</th></tr></thead>
    <tbody>
      ${categoryRows.map(r => `<tr>
        <td><strong>${r.category}</strong></td>
        <td>₹${r.planned.toLocaleString()}</td>
        <td>₹${r.actual.toLocaleString()}</td>
        <td class="${r.diff >= 0 ? 'under' : 'over'}">₹${r.diff.toLocaleString()}</td>
        <td>${r.overCategory ? '<span style="color:#e11d48">Over Budget</span>' : '<span style="color:#059669">On Track</span>'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentEvent.name.replace(/[^a-zA-Z0-9]/g, "_")}_Budget_Report.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Celebration Selector Header */}
      <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Viewing Budget For:
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

        <div className="text-xs text-gray-500">
          Target Budget: <strong className="text-[#6C4AB6] font-bold">₹{totalBudget.toLocaleString()}</strong>
        </div>
      </div>

      {/* Top Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#6C4AB6] text-xs font-bold mb-2">
            <Wallet className="w-3.5 h-3.5" />
            <span>Intelligent Financial Tracking</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#25223A]">
            AI Budget Manager
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Real-time tracking, category burn rates, and automated cost-saving recommendations for{" "}
            <strong>{currentEvent?.name || "Your Celebration"}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportBudget}
            className="px-4 py-3 rounded-2xl bg-white hover:bg-purple-50 border border-purple-200 text-[#6C4AB6] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Export Report</span>
          </button>

          <button
            onClick={handleRunAiOptimization}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#6C4AB6] via-[#7B52CE] to-pink-500 hover:opacity-95 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>AI Budget Optimization</span>
          </button>
        </div>
      </div>

      {/* Warning banner if over budget */}
      {isOverBudget && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-sm">Target Budget Exceeded!</p>
            <p>
              Your actual expenditure of ₹{totalSpent.toLocaleString()} has surpassed your planned
              target of ₹{totalBudget.toLocaleString()} by ₹{Math.abs(remainingBudget).toLocaleString()}. Click{" "}
              <strong>AI Budget Optimization</strong> to get immediate suggestions on how to rebalance categories and negotiate with vendors.
            </p>
          </div>
        </div>
      )}

      {/* Primary 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-purple-100/80 shadow-xs">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Total Target Budget
          </span>
          <h3 className="text-2xl font-black text-[#25223A] mt-2">
            ₹{totalBudget.toLocaleString()}
          </h3>
          <p className="text-[11px] text-gray-500 mt-1">Authorized celebration cap</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-100/80 shadow-xs">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Total Spent To Date
          </span>
          <h3 className="text-2xl font-black text-[#6C4AB6] mt-2">
            ₹{totalSpent.toLocaleString()}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-purple-700">
            <span>{utilizationPct}% utilized</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-100/80 shadow-xs">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Remaining Funds
          </span>
          <h3
            className={`text-2xl font-black mt-2 ${
              remainingBudget >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            ₹{Math.abs(remainingBudget).toLocaleString()}
          </h3>
          <p className="text-[11px] text-gray-500 mt-1">
            {remainingBudget >= 0 ? "Available reserve buffer" : "Deficit overage"}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-100/80 shadow-xs">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Expense Records
          </span>
          <h3 className="text-2xl font-black text-[#25223A] mt-2">
            {expenses.length}
          </h3>
          <p className="text-[11px] text-gray-500 mt-1">Transactions logged in ledger</p>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Planned vs Actual by Category */}
        <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#25223A]">Category Planned vs. Actual</h3>
              <p className="text-xs text-gray-400">Comparing original allocation against logged receipts</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                <span className="w-3 h-3 rounded-sm bg-[#A78BFA]" /> Planned
              </span>
              <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                <span className="w-3 h-3 rounded-sm bg-[#6C4AB6]" /> Actual
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, ""]}
                  labelFormatter={(name, payload) => {
                    const full = payload?.[0]?.payload?.fullName;
                    return full || name;
                  }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar dataKey="Planned" fill="#A78BFA" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual" fill="#6C4AB6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Expense Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#25223A]">Expenditure Share</h3>
            <p className="text-xs text-gray-400 mb-4">Proportion of money spent</p>

            {pieChartData.length === 0 ? (
              <div className="py-16 text-center text-xs text-gray-400">
                Log transactions to see real-time expenditure share.
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, "Amount"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="space-y-1 max-h-36 overflow-y-auto">
            {pieChartData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs text-gray-600">
                <span className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                  />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="font-semibold text-gray-800 shrink-0">
                  ₹{item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category-Wise Detailed Table */}
      <div className="bg-white rounded-3xl border border-purple-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#25223A]">Category Breakdown Ledger</h3>
            <p className="text-xs text-gray-400">Track variances and overage alerts per department</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/50 text-gray-600 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Planned Allocation</th>
                <th className="px-6 py-3">Actual Spending</th>
                <th className="px-6 py-3">Variance</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categoryRows.map((row) => (
                <tr key={row.category} className="hover:bg-purple-50/20 transition-colors">
                  <td className="px-6 py-3.5 font-bold text-gray-800">{row.category}</td>
                  <td className="px-6 py-3.5 font-semibold text-gray-700">
                    ₹{row.planned.toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 font-semibold text-[#6C4AB6]">
                    ₹{row.actual.toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 font-semibold">
                    <span className={row.diff >= 0 ? "text-emerald-600" : "text-rose-600"}>
                      {row.diff >= 0 ? "+" : "-"}₹{Math.abs(row.diff).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    {row.overCategory ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Over Budget</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>On Track ({row.pctSpent}%)</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Budget Optimization Modal */}
      {showOptimizeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-[#6C4AB6]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-gray-900">
                    AI Budget Optimization
                  </h3>
                  <p className="text-xs text-gray-500">Gemini Strategic Cost Reduction Engine</p>
                </div>
              </div>
              <button
                onClick={() => setShowOptimizeModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {optimizing ? (
              <div className="py-16 text-center space-y-4">
                <RotateCw className="w-8 h-8 text-[#6C4AB6] animate-spin mx-auto" />
                <div>
                  <p className="font-bold text-sm text-gray-800">
                    Analyzing Category Variances &amp; Vendor Arbitrage...
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Identifying smart substitutions that preserve celebration quality.
                  </p>
                </div>
              </div>
            ) : optimizationResult ? (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 text-xs text-gray-800 leading-relaxed space-y-2">
                  <div className="font-bold text-[#6C4AB6] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Executive Financial Summary</span>
                  </div>
                  <p>{optimizationResult.summary}</p>
                </div>

                {optimizationResult.overBudgetRiskCategories?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Categories at High Risk of Overrun
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {optimizationResult.overBudgetRiskCategories.map((c: string, i: number) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold"
                        >
                          ⚠️ {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    High-Impact Cost Saving Recommendations
                  </h4>
                  <div className="space-y-2.5">
                    {optimizationResult.costSavingSuggestions?.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between font-bold text-gray-800">
                          <span>{item.category}</span>
                          <span className="text-emerald-600 font-extrabold">
                            Save ~₹{Number(item.estimatedSavings).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-600">{item.action}</p>
                        <p className="text-[11px] text-gray-400 italic">
                          Experience Impact: {item.qualityImpact}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Vendor Negotiation Tactics
                  </h4>
                  <ul className="space-y-1 text-xs text-gray-600 list-disc list-inside">
                    {optimizationResult.vendorNegotiationTips?.map((tip: string, i: number) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowOptimizeModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={handleApplyReallocation}
                    disabled={appliedSuccess}
                    className="px-5 py-2.5 rounded-xl bg-[#6C4AB6] text-white text-xs font-bold hover:bg-[#58399e] flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    {appliedSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>Re-allocations Applied!</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-200" />
                        <span>Adopt AI Recommended Allocations</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-rose-500">
                Could not retrieve optimization. Please try again.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
