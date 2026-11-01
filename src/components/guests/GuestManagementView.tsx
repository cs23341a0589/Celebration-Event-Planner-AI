import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Mail,
  Phone,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  Edit2,
  Utensils,
  HeartHandshake,
  Printer,
} from "lucide-react";
import { useEvent } from "../../context/EventContext.tsx";
import { api } from "../../services/api.ts";
import { GuestItem, RSVPStatus } from "../../types/index.ts";

export const GuestManagementView: React.FC = () => {
  const { events, activeEvent, setActiveEventId } = useEvent();
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const currentEvent = activeEvent || (events.length > 0 ? events[0] : null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus>("Pending");
  const [attendeesCount, setAttendeesCount] = useState<number>(1);
  const [dietaryPreferences, setDietaryPreferences] = useState("Vegetarian");
  const [specialRequirements, setSpecialRequirements] = useState("");

  useEffect(() => {
    async function loadGuests() {
      if (!currentEvent) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api.getGuests(currentEvent.id);
        setGuests(res.guests);
      } catch (err) {
        console.error("Failed to load guests", err);
      } finally {
        setLoading(false);
      }
    }
    loadGuests();
  }, [currentEvent]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName("");
    setEmail("");
    setPhone("");
    setRsvpStatus("Invited");
    setAttendeesCount(1);
    setDietaryPreferences("Vegetarian");
    setSpecialRequirements("");
    setShowModal(true);
  };

  const handleOpenEdit = (g: GuestItem) => {
    setEditingId(g.id);
    setName(g.name);
    setEmail(g.email || "");
    setPhone(g.phone || "");
    setRsvpStatus(g.rsvpStatus);
    setAttendeesCount(g.attendeesCount);
    setDietaryPreferences(g.dietaryPreferences || "Vegetarian");
    setSpecialRequirements(g.specialRequirements || "");
    setShowModal(true);
  };

  const handleSaveGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editingId) {
        const res = await api.updateGuest(editingId, {
          name,
          email,
          phone,
          rsvpStatus,
          attendeesCount,
          dietaryPreferences,
          specialRequirements,
        });
        setGuests((prev) => prev.map((g) => (g.id === editingId ? res.guest : g)));
      } else {
        if (!currentEvent) return;
        const res = await api.addGuest({
          eventId: currentEvent.id,
          name,
          email,
          phone,
          rsvpStatus,
          attendeesCount,
          dietaryPreferences,
          specialRequirements,
        });
        setGuests((prev) => [...prev, res.guest]);
      }
      setShowModal(false);
    } catch (err) {
      console.error("Error saving guest", err);
    }
  };

  const handleQuickStatusChange = async (guest: GuestItem, newStatus: RSVPStatus) => {
    try {
      const res = await api.updateGuest(guest.id, { rsvpStatus: newStatus });
      setGuests((prev) => prev.map((g) => (g.id === guest.id ? res.guest : g)));
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  const handleDeleteGuest = async (id: string) => {
    if (!confirm("Are you sure you want to remove this guest?")) return;
    try {
      await api.deleteGuest(id);
      setGuests((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      console.error("Error deleting guest", err);
    }
  };

  // Metrics
  const totalHeadcount = guests.reduce((s, g) => s + g.attendeesCount, 0);
  const confirmedCount = guests
    .filter((g) => g.rsvpStatus === "Confirmed")
    .reduce((s, g) => s + g.attendeesCount, 0);
  const pendingCount = guests
    .filter((g) => g.rsvpStatus === "Pending" || g.rsvpStatus === "Invited")
    .reduce((s, g) => s + g.attendeesCount, 0);
  const declinedCount = guests
    .filter((g) => g.rsvpStatus === "Declined")
    .reduce((s, g) => s + (g.attendeesCount || 1), 0);

  // Filtering
  const filteredGuests = guests.filter((g) => {
    const matchesStatus = statusFilter === "All" || g.rsvpStatus === statusFilter;
    const matchesSearch =
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.email && g.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (g.phone && g.phone.includes(searchTerm)) ||
      (g.dietaryPreferences && g.dietaryPreferences.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleExportGuestList = () => {
    if (!currentEvent) return;
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${currentEvent.name} - Guest Attendance Roster</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #25223A; max-width: 800px; margin: auto; }
    h1 { color: #6C4AB6; border-bottom: 2px solid #6C4AB6; padding-bottom: 6px; }
    .meta { font-size: 13px; color: #666; margin-bottom: 20px; }
    .stats { display: flex; gap: 16px; margin-bottom: 20px; font-size: 13px; }
    .stat-pill { padding: 8px 16px; border-radius: 8px; background: #f8f7fc; border: 1px solid #e2e8f0; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
    th { background: #f8f7fc; color: #6C4AB6; font-weight: bold; }
    .badge { padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px; }
    .confirmed { background: #dcfce7; color: #15803d; }
    .pending { background: #fef3c7; color: #b45309; }
    .declined { background: #fee2e2; color: #b91c1c; }
  </style>
</head>
<body>
  <h1>${currentEvent.name} - Guest Attendance Roster</h1>
  <div class="meta">Category: ${currentEvent.category} &bull; Date: ${currentEvent.date} &bull; Total Registered Parties: ${guests.length}</div>
  <div class="stats">
    <div class="stat-pill">Total Headcount: ${totalHeadcount}</div>
    <div class="stat-pill">Confirmed: ${confirmedCount}</div>
    <div class="stat-pill">Pending RSVP: ${pendingCount}</div>
    <div class="stat-pill">Declined: ${declinedCount}</div>
  </div>
  <table>
    <thead><tr><th>Guest Name</th><th>Party Size</th><th>RSVP Status</th><th>Contact</th><th>Dietary / Notes</th></tr></thead>
    <tbody>
      ${filteredGuests.map(g => `<tr>
        <td><strong>${g.name}</strong></td>
        <td>${g.attendeesCount} pax</td>
        <td><span class="badge ${g.rsvpStatus.toLowerCase()}">${g.rsvpStatus}</span></td>
        <td>${g.email || ''}<br><small>${g.phone || ''}</small></td>
        <td>${g.dietaryPreferences || 'None'} ${g.specialRequirements ? `(${g.specialRequirements})` : ''}</td>
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
    a.download = `${currentEvent.name.replace(/[^a-zA-Z0-9]/g, "_")}_Guest_List.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#6C4AB6] text-xs font-bold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Hospitality &amp; RSVP Center</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#25223A]">
            Guest Management
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Track invitations, confirmed headcounts, dietary requirements, and VIP seating for{" "}
            <strong>{currentEvent?.name || "Your Celebration"}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportGuestList}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-[#6C4AB6] text-xs sm:text-sm font-bold border border-purple-200/80 flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Export List</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-[#6C4AB6] hover:bg-[#5b3da0] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Guest</span>
          </button>
        </div>
      </div>

      {/* 4 Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-xs">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Total Invites
          </span>
          <h4 className="text-2xl font-black text-gray-800 mt-1">{totalHeadcount}</h4>
          <p className="text-[10px] text-gray-400 mt-0.5">Across {guests.length} invitation parties</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-xs">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Confirmed Attendees
          </span>
          <h4 className="text-2xl font-black text-emerald-600 mt-1">{confirmedCount}</h4>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
            {totalHeadcount > 0 ? Math.round((confirmedCount / totalHeadcount) * 100) : 0}% attendance rate
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-xs">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Pending Responses
          </span>
          <h4 className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</h4>
          <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Awaiting RSVP</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-xs">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Declined Invites
          </span>
          <h4 className="text-2xl font-black text-rose-600 mt-1">{declinedCount}</h4>
          <p className="text-[10px] text-rose-500 mt-0.5">Regrets received</p>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search guest name, email, dietary preference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#6C4AB6] bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {["All", "Confirmed", "Pending", "Invited", "Declined"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? "bg-[#6C4AB6] text-white"
                  : "bg-white text-gray-600 hover:bg-purple-50 border border-gray-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Guests Table */}
      <div className="bg-white rounded-3xl border border-purple-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/50 text-gray-600 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Guest &amp; Contact</th>
                <th className="px-6 py-3.5">Attendees</th>
                <th className="px-6 py-3.5">RSVP Status</th>
                <th className="px-6 py-3.5">Dietary &amp; Special Needs</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-gray-400">
                    No guests matching this filter.
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => {
                  return (
                    <tr key={guest.id} className="hover:bg-purple-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{guest.name}</p>
                          <div className="flex items-center gap-3 text-gray-400 text-[11px] mt-0.5">
                            {guest.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-purple-500" />
                                {guest.phone}
                              </span>
                            )}
                            {guest.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-purple-500" />
                                {guest.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-extrabold text-gray-800 text-sm">
                          {guest.attendeesCount}
                        </span>
                        <span className="text-[11px] text-gray-400 ml-1">
                          {guest.attendeesCount === 1 ? "Person" : "People"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={guest.rsvpStatus}
                            onChange={(e) =>
                              handleQuickStatusChange(guest, e.target.value as RSVPStatus)
                            }
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border-0 focus:ring-2 focus:ring-purple-400 cursor-pointer ${
                              guest.rsvpStatus === "Confirmed"
                                ? "bg-emerald-100 text-emerald-800"
                                : guest.rsvpStatus === "Pending"
                                ? "bg-amber-100 text-amber-800"
                                : guest.rsvpStatus === "Declined"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            <option value="Confirmed">✓ Confirmed</option>
                            <option value="Pending">⏳ Pending</option>
                            <option value="Invited">✉️ Invited</option>
                            <option value="Declined">✕ Declined</option>
                          </select>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          {guest.dietaryPreferences && (
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-900">
                              <Utensils className="w-3 h-3 text-[#6C4AB6]" />
                              <span>{guest.dietaryPreferences}</span>
                            </div>
                          )}
                          {guest.specialRequirements && (
                            <p className="text-[10px] text-gray-500 italic max-w-xs truncate">
                              "{guest.specialRequirements}"
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(guest)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                            title="Edit Guest"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteGuest(guest.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove Guest"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Guest Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">
                {editingId ? "Edit Guest Entry" : "Add Guest to Party"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGuest} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Guest / Family Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vikram & Priya Singhania"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Total Attendees</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={attendeesCount}
                    onChange={(e) => setAttendeesCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">RSVP Status</label>
                  <select
                    value={rsvpStatus}
                    onChange={(e) => setRsvpStatus(e.target.value as RSVPStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 bg-white"
                  >
                    <option value="Invited">Invited</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                    <option value="Declined">Declined</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Dietary Preferences</label>
                <input
                  type="text"
                  value={dietaryPreferences}
                  onChange={(e) => setDietaryPreferences(e.target.value)}
                  placeholder="e.g. Vegetarian, Jain, Vegan, Gluten-Free"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Special Requirements</label>
                <textarea
                  rows={2}
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  placeholder="Seating near front, wheelchair accessibility, airport pickup..."
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
                  {editingId ? "Save Changes" : "Add Guest"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
