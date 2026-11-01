import React, { useState, useEffect } from "react";
import {
  Receipt,
  Plus,
  CreditCard,
  Calendar,
  Tag,
  DollarSign,
  Trash2,
  Edit2,
  TrendingUp,
  Wallet,
  ArrowUpDown,
  Search,
} from "lucide-react";
import { useEvent } from "../../context/EventContext.tsx";
import { api } from "../../services/api.ts";
import { ExpenseItem } from "../../types/index.ts";

export const ExpenseTrackerView: React.FC = () => {
  const { events, activeEvent, setActiveEventId } = useEvent();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const currentEvent = activeEvent || (events.length > 0 ? events[0] : null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Venue & Hospitality");
  const [amount, setAmount] = useState<number>(10000);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<any>("UPI / Online");
  const [description, setDescription] = useState("");

  const EXPENSE_CATEGORIES = [
    "Venue & Hospitality",
    "Catering & Bar",
    "Decoration & Flowers",
    "Photography & Cinema",
    "Entertainment & DJ",
    "Invitations & Gifts",
    "Attire & Makeup",
    "Logistics & Travel",
    "Miscellaneous Contingency",
  ];

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
        console.error("Failed to load expenses", err);
      } finally {
        setLoading(false);
      }
    }
    loadExpenses();
  }, [currentEvent]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setTitle("");
    setCategory("Venue & Hospitality");
    setAmount(10000);
    setDate(new Date().toISOString().split("T")[0]);
    setPaymentMethod("UPI / Online");
    setDescription("");
    setShowModal(true);
  };

  const handleOpenEdit = (exp: ExpenseItem) => {
    setEditingId(exp.id);
    setTitle(exp.title);
    setCategory(exp.category);
    setAmount(exp.amount);
    setDate(exp.date);
    setPaymentMethod(exp.paymentMethod);
    setDescription(exp.description || "");
    setShowModal(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) return;

    try {
      if (editingId) {
        const res = await api.updateExpense(editingId, {
          title,
          category,
          amount,
          date,
          paymentMethod,
          description,
        });
        setExpenses((prev) => prev.map((e) => (e.id === editingId ? res.expense : e)));
      } else {
        if (!currentEvent) return;
        const res = await api.addExpense({
          eventId: currentEvent.id,
          title,
          category,
          amount,
          date,
          paymentMethod,
          description,
        });
        setExpenses((prev) => [res.expense, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      console.error("Error saving expense", err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    try {
      await api.deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error("Error deleting expense", err);
    }
  };

  const currentBudget = currentEvent ? currentEvent.totalBudget : 450000;
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = currentBudget - totalSpent;
  const utilizationPct = currentBudget > 0 ? Math.round((totalSpent / currentBudget) * 100) : 0;

  // Filter
  const filtered = expenses.filter((e) => {
    const matchesCat = categoryFilter === "All" || e.category === categoryFilter;
    const matchesSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      e.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#6C4AB6] text-xs font-bold mb-2">
            <Receipt className="w-3.5 h-3.5" />
            <span>Expenditure &amp; Receipt Ledger</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#25223A]">
            Expense Tracker
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Log, categorize, and monitor transactions for <strong>{currentEvent?.name || "Your Celebration"}</strong> in real time.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 rounded-xl bg-[#6C4AB6] hover:bg-[#5b3da0] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Expense</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Total Spent
          </span>
          <h4 className="text-xl font-black text-[#6C4AB6] mt-1">
            ₹{totalSpent.toLocaleString()}
          </h4>
          <span className="text-[10px] text-gray-400">{utilizationPct}% of total budget</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Remaining Buffer
          </span>
          <h4
            className={`text-xl font-black mt-1 ${
              remaining >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            ₹{Math.abs(remaining).toLocaleString()}
          </h4>
          <span className="text-[10px] text-gray-400">
            {remaining >= 0 ? "Funds unspent" : "Budget exceeded"}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Transactions
          </span>
          <h4 className="text-xl font-black text-gray-800 mt-1">{expenses.length}</h4>
          <span className="text-[10px] text-gray-400">Total receipts logged</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Avg / Transaction
          </span>
          <h4 className="text-xl font-black text-gray-800 mt-1">
            ₹
            {expenses.length > 0
              ? Math.round(totalSpent / expenses.length).toLocaleString()
              : "0"}
          </h4>
          <span className="text-[10px] text-gray-400">Across all categories</span>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search expense title, description, or payment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#6C4AB6] bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
          {["All", ...EXPENSE_CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === c
                  ? "bg-[#6C4AB6] text-white"
                  : "bg-white text-gray-600 hover:bg-purple-50 border border-gray-100"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Expense List Table */}
      <div className="bg-white rounded-3xl border border-purple-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/50 text-gray-600 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Expense Item</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Payment Method</th>
                <th className="px-6 py-3.5 text-right">Amount</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-gray-400">
                    No transactions recorded matching this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((exp) => (
                  <tr key={exp.id} className="hover:bg-purple-50/20 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{exp.title}</p>
                        {exp.description && (
                          <p className="text-[11px] text-gray-500 mt-0.5">{exp.description}</p>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-[#6C4AB6]">
                        {exp.category}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-gray-600 font-medium">{exp.date}</td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-semibold text-[11px]">
                        {exp.paymentMethod}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className="font-black text-gray-900 text-sm">
                        ₹{exp.amount.toLocaleString()}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                          title="Edit transaction"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">
                {editingId ? "Edit Expense Transaction" : "Record New Expense"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Expense Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Florist Mandap Advance 50%"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 bg-white"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Transaction Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 bg-white"
                  >
                    <option value="UPI / Online">UPI / Online</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Notes / Vendor Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Receipt #4829, includes tax and transport..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-xl text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#6C4AB6] hover:bg-[#58399e] text-white font-bold cursor-pointer"
                >
                  {editingId ? "Save Changes" : "Log Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
