import React, { useState, useEffect } from "react";
import {
  CalendarClock,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  RotateCw,
  Trash2,
  AlertCircle,
  Flag,
  Calendar,
  Layers,
  Printer,
} from "lucide-react";
import { useEvent } from "../../context/EventContext.tsx";
import { api } from "../../services/api.ts";
import { TaskItem, TaskPriority } from "../../types/index.ts";
import confetti from "canvas-confetti";

export const TimelineView: React.FC = () => {
  const { events, activeEvent, setActiveEventId } = useEvent();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  const currentEvent = activeEvent || (events.length > 0 ? events[0] : null);

  // Add Task modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Logistics");
  const [newPriority, setNewPriority] = useState<TaskPriority>("Medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // AI Timeline generation
  const [generatingAi, setGeneratingAi] = useState(false);

  useEffect(() => {
    async function loadTasks() {
      if (!currentEvent) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api.getTasks(currentEvent.id);
        setTasks(res.tasks);
      } catch (e) {
        console.error("Failed to load timeline tasks", e);
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, [currentEvent]);

  const handleToggleTask = async (task: TaskItem) => {
    const updated = !task.isCompleted;
    try {
      if (updated) {
        try {
          confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
        } catch {
          // ignore
        }
      }
      const res = await api.updateTask(task.id, { isCompleted: updated });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? res.task : t)));
    } catch (e) {
      console.error("Error updating task", e);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      console.error("Error deleting task", e);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      if (!currentEvent) return;
      const res = await api.addTask({
        eventId: currentEvent.id,
        title: newTitle,
        category: newCategory,
        priority: newPriority,
        dueDate: newDueDate || currentEvent.date,
        isCompleted: false,
        notes: newNotes,
      });

      setTasks((prev) => [...prev, res.task]);
      setShowAddModal(false);
      setNewTitle("");
      setNewNotes("");
    } catch (e) {
      console.error("Error adding task", e);
    }
  };

  const handleGenerateAiTimeline = async () => {
    if (!currentEvent) return;
    setGeneratingAi(true);
    try {
      const res = await api.generateAiTimeline({
        eventId: currentEvent.id,
        name: currentEvent.name,
        category: currentEvent.category,
        date: currentEvent.date,
        saveToEvent: true,
      });

      // Reload fresh tasks from backend
      const tasksRes = await api.getTasks(currentEvent.id);
      setTasks(tasksRes.tasks);

      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    } catch (e) {
      console.error("Failed to generate AI timeline", e);
    } finally {
      setGeneratingAi(false);
    }
  };

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const handleExportTimeline = () => {
    if (!currentEvent) return;
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${currentEvent.name} - Milestone Timeline & Checklist</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #25223A; max-width: 800px; margin: auto; }
    h1 { color: #6C4AB6; border-bottom: 2px solid #6C4AB6; padding-bottom: 6px; }
    .meta { font-size: 13px; color: #666; margin-bottom: 20px; }
    .progress-box { background: #ede9fe; color: #6C4AB6; padding: 12px; border-radius: 8px; font-weight: bold; margin-bottom: 20px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; }
    th { background: #f8f7fc; color: #6C4AB6; }
    .completed { text-decoration: line-through; color: #94a3b8; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; }
    .urgent { background: #fee2e2; color: #b91c1c; }
    .high { background: #ffedd5; color: #c2410c; }
    .medium { background: #e0e7ff; color: #4338ca; }
    .low { background: #f1f5f9; color: #475569; }
  </style>
</head>
<body>
  <h1>${currentEvent.name} - Checklist & Timeline</h1>
  <div class="meta">Category: ${currentEvent.category} &bull; Target Date: ${currentEvent.date} &bull; Total Tasks: ${tasks.length}</div>
  <div class="progress-box">Completion Progress: ${completedCount} of ${tasks.length} completed (${progressPct}%)</div>
  <table>
    <thead><tr><th>Status</th><th>Task Description</th><th>Category</th><th>Priority</th><th>Due Date</th></tr></thead>
    <tbody>
      ${tasks.map(t => `<tr>
        <td>${t.isCompleted ? '&#10003; Done' : '&#9675; Pending'}</td>
        <td class="${t.isCompleted ? 'completed' : ''}"><strong>${t.title}</strong>${t.notes ? `<br><small style="color:#64748b">${t.notes}</small>` : ''}</td>
        <td>${t.category}</td>
        <td><span class="badge ${t.priority.toLowerCase()}">${t.priority}</span></td>
        <td>${t.dueDate || 'Flexible'}</td>
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
    a.download = `${currentEvent.name.replace(/[^a-zA-Z0-9]/g, "_")}_Timeline.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#6C4AB6] text-xs font-bold mb-2">
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Preparation Countdown &amp; Tasks</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#25223A]">
            Celebration Timeline
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Chronological milestone schedule for <strong>{currentEvent?.name || "Celebration"}</strong> (Target Date:{" "}
            {currentEvent?.date || "2026-11-28"}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportTimeline}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-[#6C4AB6] text-xs font-bold border border-purple-200/80 flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Export</span>
          </button>
          <button
            onClick={handleGenerateAiTimeline}
            disabled={generatingAi}
            className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100/80 text-[#6C4AB6] text-xs font-bold border border-purple-200/60 flex items-center gap-2 transition-colors cursor-pointer"
          >
            {generatingAi ? (
              <RotateCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-purple-600" />
            )}
            <span>Generate AI Timeline</span>
          </button>
          <button
            onClick={() => {
              setNewDueDate(currentEvent?.date || "");
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#6C4AB6] hover:bg-[#5b3da0] text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Task</span>
          </button>
        </div>
      </div>

      {/* Progress Bar Card */}
      <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Execution Progress</span>
          </span>
          <span className="text-[#6C4AB6]">
            {completedCount} of {tasks.length} Milestones Completed ({progressPct}%)
          </span>
        </div>
        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#6C4AB6] to-pink-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Timeline Milestones Cards */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-purple-100 text-center space-y-3">
            <Clock className="w-10 h-10 text-purple-400 mx-auto" />
            <h4 className="text-base font-bold text-gray-800">No tasks in timeline yet</h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Click <strong>Generate AI Timeline</strong> to let Gemini automatically craft a personalized countdown from 60 days before down to Event Day!
            </p>
          </div>
        ) : (
          tasks.map((task, index) => {
            const isDueSoon =
              new Date(task.dueDate).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 7 &&
              !task.isCompleted;

            return (
              <div
                key={task.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  task.isCompleted
                    ? "bg-gray-50/70 border-gray-100 opacity-70"
                    : isDueSoon
                    ? "bg-white border-amber-200 shadow-xs hover:border-purple-300"
                    : "bg-white border-purple-100 shadow-xs hover:border-purple-300"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    onClick={() => handleToggleTask(task)}
                    className="mt-0.5 text-gray-400 hover:text-[#6C4AB6] transition-colors cursor-pointer shrink-0"
                    title={task.isCompleted ? "Mark incomplete" : "Mark completed"}
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`font-bold text-sm ${
                          task.isCompleted ? "line-through text-gray-400" : "text-[#25223A]"
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.category && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700">
                          {task.category}
                        </span>
                      )}
                    </div>

                    {task.notes && (
                      <p className="text-xs text-gray-500 leading-relaxed">{task.notes}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-400 pt-1">
                      <span className="flex items-center gap-1 font-medium text-gray-600">
                        <Calendar className="w-3.5 h-3.5 text-purple-500" />
                        <span>Due: {task.dueDate}</span>
                      </span>
                      {isDueSoon && (
                        <span className="text-amber-600 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded-full">
                          ⚡ Approaching Soon
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      task.priority === "Critical"
                        ? "bg-rose-100 text-rose-700"
                        : task.priority === "High"
                        ? "bg-amber-100 text-amber-700"
                        : task.priority === "Medium"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {task.priority}
                  </span>

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete milestone"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">Add Timeline Milestone</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Conduct second floral mockup review"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#6C4AB6] text-xs text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#6C4AB6] text-xs text-gray-800 bg-white"
                  >
                    <option value="Venue">Venue</option>
                    <option value="Catering">Catering</option>
                    <option value="Decor">Decor</option>
                    <option value="Photography">Photography</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Favors">Favors</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#6C4AB6] text-xs text-gray-800 bg-white"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Due Date</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#6C4AB6] text-xs text-gray-800 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Action Notes</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Specific details or phone numbers to contact..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#6C4AB6] text-xs text-gray-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-xl text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#6C4AB6] hover:bg-[#58399e] text-white font-bold cursor-pointer"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
