import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Calendar,
  Wallet,
  Receipt,
  CheckCircle2,
  Clock,
  Users,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Plus,
  MapPin,
  Flame,
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
} from "recharts";
import { useAuth } from "../../context/AuthContext.tsx";
import { useEvent } from "../../context/EventContext.tsx";
import { api } from "../../services/api.ts";
import { ExpenseItem, TaskItem, GuestItem } from "../../types/index.ts";

interface DashboardViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenCreateEvent: () => void;
  onOpenChat: () => void;
}

const PIE_COLORS = ["#6C4AB6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#64748B"];

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenCreateEvent,
  onOpenChat,
}) => {
  const { user } = useAuth();
  const { events, activeEvent, setActiveEventId } = useEvent();

  const [stats, setStats] = useState<any>(null);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const statsRes = await api.getDashboardStats();
        setStats(statsRes);

        if (activeEvent) {
          const [expRes, tskRes, gstRes] = await Promise.all([
            api.getExpenses(activeEvent.id),
            api.getTasks(activeEvent.id),
            api.getGuests(activeEvent.id),
          ]);
          setExpenses(expRes.expenses);
          setTasks(tskRes.tasks);
          setGuests(gstRes.guests);
        }
      } catch (err) {
        console.error("Dashboard data load error", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeEvent]);

  // Calculations for active event
  const activeEventBudget = activeEvent ? activeEvent.totalBudget : 0;
  const activeEventSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const activeEventRemaining = Math.max(0, activeEventBudget - activeEventSpent);
  const spentPercent = activeEventBudget > 0 ? Math.min(100, Math.round((activeEventSpent / activeEventBudget) * 100)) : 0;

  // Days until event countdown
  const daysUntil = activeEvent
    ? Math.ceil((new Date(activeEvent.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  // Category breakdown for chart
  const categoryMap: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });
  const pieData = Object.keys(categoryMap).map((cat) => ({
    name: cat,
    value: categoryMap[cat],
  }));

  // Bar chart data: Planned vs Actual
  const barData = [
    {
      name: "Total Budget",
      Planned: activeEventBudget,
      Actual: activeEventSpent,
    },
  ];

  const completedTasksCount = tasks.filter((t) => t.isCompleted).length;
  const pendingTasksCount = tasks.length - completedTasksCount;
  const taskProgressPct = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  const confirmedGuestsCount = guests
    .filter((g) => g.rsvpStatus === "Confirmed")
    .reduce((s, g) => s + (g.attendeesCount || 1), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#6C4AB6] via-[#7B52CE] to-[#A78BFA] p-6 sm:p-8 text-white shadow-xl shadow-purple-900/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-purple-100 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Celebration Intelligence Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || "Host"}!
            </h1>
            <p className="text-purple-100 text-sm sm:text-base leading-relaxed">
              {activeEvent ? (
                <>
                  Currently orchestrating <strong className="text-white underline decoration-pink-300 decoration-2 underline-offset-4">{activeEvent.name}</strong>.
                  {daysUntil > 0 ? (
                    <span className="ml-1 text-amber-200 font-bold">
                      {daysUntil} days to go! 🎉
                    </span>
                  ) : daysUntil === 0 ? (
                    <span className="ml-1 text-emerald-200 font-bold">Today is the big day! 🎊</span>
                  ) : (
                    <span className="ml-1 text-purple-200 font-medium">(Celebrated on {activeEvent.date})</span>
                  )}
                </>
              ) : (
                "You do not have any active celebrations selected. Start by creating a personalized AI event plan!"
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenCreateEvent}
              className="px-4 py-2.5 rounded-xl bg-white text-[#6C4AB6] text-xs sm:text-sm font-bold shadow-md hover:bg-purple-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#6C4AB6]" />
              <span>Create New Event</span>
            </button>
            <button
              onClick={onOpenChat}
              className="px-4 py-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-950/60 backdrop-blur-md border border-white/30 text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-pink-300" />
              <span>Ask EventMate AI</span>
            </button>
          </div>
        </div>

        {/* Ambient background blur blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-pink-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Planned Budget */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Budget
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-[#6C4AB6]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#25223A]">
              ₹{activeEventBudget.toLocaleString()}
            </h3>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <span>Target celebration allocation</span>
            </p>
          </div>
        </div>

        {/* Total Actual Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Actual Spending
            </span>
            <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#25223A]">
              ₹{activeEventSpent.toLocaleString()}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    spentPercent > 90 ? "bg-rose-500" : spentPercent > 70 ? "bg-amber-500" : "bg-[#6C4AB6]"
                  }`}
                  style={{ width: `${spentPercent}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-gray-500 shrink-0">{spentPercent}%</span>
            </div>
          </div>
        </div>

        {/* Task Completion */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Task Checklist
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#25223A]">
                {completedTasksCount} / {tasks.length}
              </h3>
              <span className="text-xs font-semibold text-emerald-600">{taskProgressPct}% done</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {pendingTasksCount} milestone tasks pending
            </p>
          </div>
        </div>

        {/* Guest Management */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Guest RSVPs
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#25223A]">
                {confirmedGuestsCount}
              </h3>
              <span className="text-xs text-gray-500">
                / {activeEvent?.guestCount || 50} target
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {guests.length} guest groups tracked
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts & Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Planned vs Actual Budget Chart */}
        <div className="bg-white p-6 rounded-2xl border border-purple-100/80 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#25223A]">Budget Utilization Overview</h3>
              <p className="text-xs text-gray-400">Planned vs Actual spent for active celebration</p>
            </div>
            <button
              onClick={() => onNavigateTab("budget")}
              className="text-xs font-semibold text-[#6C4AB6] hover:underline flex items-center gap-1"
            >
              <span>View Budget Manager</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barGap={16} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, ""]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar dataKey="Planned" fill="#A78BFA" radius={[6, 6, 0, 0]} name="Planned Target" />
                <Bar dataKey="Actual" fill="#6C4AB6" radius={[6, 6, 0, 0]} name="Logged Spent" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#A78BFA]" />
                Planned (₹{activeEventBudget.toLocaleString()})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#6C4AB6]" />
                Actual Spent (₹{activeEventSpent.toLocaleString()})
              </span>
            </div>
            <div className="font-semibold text-emerald-600">
              Remaining Buffer: ₹{activeEventRemaining.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Expense Category Pie Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-purple-100/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-[#25223A]">Expense Breakdown</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                {pieData.length} Categories
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-4">Real-time expenditure share</p>

            {pieData.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                No expenses logged yet. Add your first expense to visualize category spending.
              </div>
            ) : (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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

          <div className="space-y-1.5 max-h-36 overflow-y-auto pt-2">
            {pieData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs text-gray-600">
                <span className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
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

      {/* Upcoming Celebrations Cards & Recent Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Your Celebrations */}
        <div className="bg-white p-6 rounded-2xl border border-purple-100/80 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#6C4AB6]" />
              <h3 className="text-base font-bold text-[#25223A]">Your Celebrations ({events.length})</h3>
            </div>
            <button
              onClick={onOpenCreateEvent}
              className="text-xs font-bold text-[#6C4AB6] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Celebration</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((ev) => {
              const isSelected = activeEvent?.id === ev.id;
              const evDays = Math.ceil((new Date(ev.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={ev.id}
                  onClick={() => setActiveEventId(ev.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? "border-[#6C4AB6] bg-purple-50/40 shadow-xs"
                      : "border-gray-100 hover:border-purple-200 hover:bg-gray-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-[#6C4AB6]">
                        {ev.category}
                      </span>
                      <h4 className="font-bold text-sm text-[#25223A] mt-1.5 leading-snug">
                        {ev.name}
                      </h4>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6C4AB6] text-white">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-gray-500">
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{ev.date} {ev.time && `at ${ev.time}`}</span>
                      <span className="text-purple-600 font-semibold ml-1">
                        ({evDays > 0 ? `${evDays}d left` : "Today"})
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{ev.location}</span>
                    </p>
                    <div className="pt-2 flex items-center justify-between text-xs font-semibold text-gray-700">
                      <span>₹{ev.totalBudget.toLocaleString()}</span>
                      <span>{ev.guestCount} Guests</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone Timeline Quick Actions */}
        <div className="bg-white p-6 rounded-2xl border border-purple-100/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#25223A]">Upcoming Deadlines</h3>
              <button
                onClick={() => onNavigateTab("timeline")}
                className="text-xs font-semibold text-[#6C4AB6] hover:underline"
              >
                All Tasks
              </button>
            </div>

            <div className="space-y-3">
              {tasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-xl bg-gray-50/70 border border-gray-100 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <p
                      className={`font-semibold ${
                        task.isCompleted ? "line-through text-gray-400" : "text-gray-800"
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className="text-[11px] text-gray-500">Due: {task.dueDate}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      task.priority === "Critical"
                        ? "bg-rose-100 text-rose-700"
                        : task.priority === "High"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => onNavigateTab("plan")}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-[#6C4AB6] text-xs font-bold border border-purple-200/60 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Explore AI Comprehensive Plan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
