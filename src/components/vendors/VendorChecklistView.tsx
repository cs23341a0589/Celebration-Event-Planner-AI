import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Plus,
  Phone,
  Mail,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Search,
  Tag,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { useEvent } from "../../context/EventContext.tsx";
import { api } from "../../services/api.ts";
import { VendorItem, BookingStatus, PaymentStatus } from "../../types/index.ts";

const VENDOR_CATEGORIES = [
  "All",
  "Event venues",
  "Caterers",
  "Decorators",
  "Photographers",
  "Videographers",
  "DJs",
  "Makeup artists",
  "Florists",
  "Transportation",
  "Entertainment providers",
] as const;

export const VendorChecklistView: React.FC = () => {
  const { events, activeEvent, setActiveEventId } = useEvent();
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");

  const currentEvent = activeEvent || (events.length > 0 ? events[0] : null);

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<any>("Event venues");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState<number>(25000);
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>("Inquiry");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("Pending");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function loadVendors() {
      if (!currentEvent) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api.getVendors(currentEvent.id);
        setVendors(res.vendors);
      } catch (err) {
        console.error("Failed to load vendors", err);
      } finally {
        setLoading(false);
      }
    }
    loadVendors();
  }, [currentEvent]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName("");
    setCategory("Event venues");
    setContact("");
    setEmail("");
    setEstimatedPrice(25000);
    setBookingStatus("Inquiry");
    setPaymentStatus("Pending");
    setNotes("");
    setShowModal(true);
  };

  const handleOpenEdit = (v: VendorItem) => {
    setEditingId(v.id);
    setName(v.name);
    setCategory(v.category);
    setContact(v.contact);
    setEmail(v.email || "");
    setEstimatedPrice(v.estimatedPrice);
    setBookingStatus(v.bookingStatus);
    setPaymentStatus(v.paymentStatus);
    setNotes(v.notes || "");
    setShowModal(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) return;

    try {
      if (editingId) {
        const res = await api.updateVendor(editingId, {
          name,
          category,
          contact,
          email,
          estimatedPrice,
          bookingStatus,
          paymentStatus,
          notes,
        });
        setVendors((prev) => prev.map((v) => (v.id === editingId ? res.vendor : v)));
      } else {
        if (!currentEvent) return;
        const res = await api.addVendor({
          eventId: currentEvent.id,
          name,
          category,
          contact,
          email,
          estimatedPrice,
          bookingStatus,
          paymentStatus,
          notes,
        });
        setVendors((prev) => [...prev, res.vendor]);
      }
      setShowModal(false);
    } catch (err) {
      console.error("Error saving vendor", err);
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm("Are you sure you want to remove this vendor?")) return;
    try {
      await api.deleteVendor(id);
      setVendors((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error("Error deleting vendor", err);
    }
  };

  // Filter vendors
  const filteredVendors = vendors.filter((v) => {
    const matchesCategory = selectedCategory === "All" || v.category === selectedCategory;
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.contact.includes(searchTerm) ||
      (v.notes && v.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const totalCommitted = vendors.reduce((s, v) => s + v.estimatedPrice, 0);
  const bookedCount = vendors.filter((v) => v.bookingStatus === "Booked").length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#6C4AB6] text-xs font-bold mb-2">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Curated Partner Directory</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#25223A]">
            Vendor Checklist
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Manage partners, quotes, booking status, and payment commitments for{" "}
            <strong>{currentEvent?.name || "Your Celebration"}</strong>.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 rounded-xl bg-[#6C4AB6] hover:bg-[#5b3da0] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vendor</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Total Vendors
          </span>
          <h4 className="text-xl font-black text-gray-800 mt-1">{vendors.length}</h4>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Contracted / Booked
          </span>
          <h4 className="text-xl font-black text-emerald-600 mt-1">{bookedCount}</h4>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Pending Decisions
          </span>
          <h4 className="text-xl font-black text-amber-600 mt-1">
            {vendors.length - bookedCount}
          </h4>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Committed Quotes
          </span>
          <h4 className="text-xl font-black text-[#6C4AB6] mt-1">
            ₹{totalCommitted.toLocaleString()}
          </h4>
        </div>
      </div>

      {/* Filter and Category Pills */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search vendor name, notes, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#6C4AB6] bg-white"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
          {VENDOR_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#6C4AB6] text-white shadow-xs"
                  : "bg-white text-gray-600 hover:bg-purple-50 border border-gray-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVendors.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-gray-400 bg-white rounded-3xl border border-purple-100">
            No vendors matching this filter. Click "Add New Vendor" to log quotes!
          </div>
        ) : (
          filteredVendors.map((vendor) => {
            return (
              <div
                key={vendor.id}
                className="bg-white p-5 rounded-2xl border border-purple-100/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-[#6C4AB6] uppercase">
                        {vendor.category}
                      </span>
                      <h4 className="font-bold text-base text-[#25223A] mt-1.5">{vendor.name}</h4>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                        vendor.bookingStatus === "Booked"
                          ? "bg-emerald-100 text-emerald-700"
                          : vendor.bookingStatus === "Shortlisted"
                          ? "bg-purple-100 text-purple-700"
                          : vendor.bookingStatus === "Inquiry"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {vendor.bookingStatus}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-gray-600 pt-1">
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>{vendor.contact}</span>
                    </p>
                    {vendor.email && (
                      <p className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span className="truncate">{vendor.email}</span>
                      </p>
                    )}
                    {vendor.notes && (
                      <p className="text-[11px] text-gray-500 pt-1.5 border-t border-gray-100 italic">
                        "{vendor.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold">
                      Estimated Cost:
                    </span>
                    <span className="font-extrabold text-sm text-[#25223A]">
                      ₹{vendor.estimatedPrice.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(vendor)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                      title="Edit vendor"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteVendor(vendor.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete vendor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">
                {editingId ? "Edit Vendor Details" : "Add Vendor to Checklist"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Vendor / Company Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Royal Marigold Florals"
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
                    {VENDOR_CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Estimated Price (₹)</label>
                  <input
                    type="number"
                    step={1000}
                    value={estimatedPrice}
                    onChange={(e) => setEstimatedPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Contact Number *</label>
                  <input
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@vendor.com"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Booking Status</label>
                  <select
                    value={bookingStatus}
                    onChange={(e) => setBookingStatus(e.target.value as BookingStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 bg-white"
                  >
                    <option value="Inquiry">Inquiry</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Booked">Booked</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Advance Paid">Advance Paid</option>
                    <option value="Fully Paid">Fully Paid</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Deliverables / Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Includes 3-camera team, drone, album within 2 weeks..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
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
                  {editingId ? "Save Changes" : "Add Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
