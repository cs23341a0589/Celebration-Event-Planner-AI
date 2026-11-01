import React, { useState } from "react";
import {
  Sparkles,
  Calendar,
  Bell,
  User,
  Plus,
  Database,
  LogOut,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.tsx";
import { useEvent } from "../../context/EventContext.tsx";

interface HeaderProps {
  onOpenCreateModal: () => void;
  onOpenChat: () => void;
  onOpenSchemaModal: () => void;
  onOpenAuthModal: () => void;
  onSelectTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateModal,
  onOpenChat,
  onOpenSchemaModal,
  onOpenAuthModal,
  onSelectTab,
}) => {
  const { user, logout } = useAuth();
  const {
    events,
    activeEvent,
    setActiveEventId,
    notifications,
    unreadNotifCount,
    markNotificationsAsRead,
  } = useEvent();

  const [showEventMenu, setShowEventMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-purple-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => onSelectTab("dashboard")}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6C4AB6] to-[#A78BFA] flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-[#25223A] flex items-center gap-1.5">
                  Celebration <span className="text-[#6C4AB6]">&amp; Event</span>
                </span>
                <span className="block text-[10px] tracking-wider font-semibold text-purple-600 uppercase">
                  GenAI Planner Suite
                </span>
              </div>
            </div>

            {/* Active Event Selector */}
            <div className="relative hidden md:block ml-6">
              <button
                onClick={() => {
                  setShowEventMenu(!showEventMenu);
                  setShowNotifMenu(false);
                  setShowUserMenu(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100/70 border border-purple-200/60 text-xs font-semibold text-purple-900 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-[#6C4AB6]" />
                <span className="max-w-[200px] truncate">
                  {activeEvent ? activeEvent.name : "Select Celebration"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
              </button>

              {showEventMenu && (
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-purple-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Your Celebrations ({events.length})
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {events.map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => {
                          setActiveEventId(ev.id);
                          setShowEventMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-purple-50 transition-colors ${
                          activeEvent?.id === ev.id ? "bg-purple-50/80 font-bold text-[#6C4AB6]" : "text-gray-700"
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="truncate">{ev.name}</p>
                          <p className="text-[10px] text-gray-400 font-normal">
                            {ev.category} • {ev.date}
                          </p>
                        </div>
                        {activeEvent?.id === ev.id && (
                          <span className="w-2 h-2 rounded-full bg-[#6C4AB6] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-purple-50 pt-2 px-2 mt-1">
                    <button
                      onClick={() => {
                        setShowEventMenu(false);
                        onOpenCreateModal();
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-[#6C4AB6] hover:bg-[#5b3da0] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create New Celebration
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* EventMate AI Chat Button */}
            <button
              onClick={onOpenChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white text-xs font-semibold shadow-sm hover:shadow-md hover:scale-102 transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">EventMate AI</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[9px] font-bold">
                GenAI
              </span>
            </button>

            {/* Supabase Schema Modal Button */}
            <button
              onClick={onOpenSchemaModal}
              title="View Supabase PostgreSQL Schema & RLS"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-purple-300 text-gray-700 hover:text-[#6C4AB6] text-xs font-medium transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Supabase RLS</span>
            </button>

            {/* Create Event Button */}
            <button
              onClick={onOpenCreateModal}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200/80 text-[#6C4AB6] text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Plan Event</span>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifMenu(!showNotifMenu);
                  setShowEventMenu(false);
                  setShowUserMenu(false);
                  if (!showNotifMenu && unreadNotifCount > 0) {
                    markNotificationsAsRead();
                  }
                }}
                className="relative p-2 rounded-xl text-gray-500 hover:text-[#6C4AB6] hover:bg-purple-50 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-purple-100 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-800">Event Alerts</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-[#6C4AB6]">
                        {notifications.length}
                      </span>
                    </div>
                    {unreadNotifCount > 0 && (
                      <button
                        onClick={markNotificationsAsRead}
                        className="text-[11px] text-purple-600 hover:underline font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-gray-400">
                        No notifications yet. You are all caught up!
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`px-4 py-3 hover:bg-gray-50/80 transition-colors ${
                            !notif.read ? "bg-purple-50/40" : ""
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            {notif.type === "warning" && (
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            )}
                            {notif.type === "deadline" && (
                              <Clock className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            )}
                            {notif.type === "success" && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            )}
                            {notif.type === "info" && (
                              <Sparkles className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                            )}
                            <div className="text-xs">
                              <p className="font-semibold text-gray-800">{notif.title}</p>
                              <p className="text-gray-600 text-[11px] mt-0.5 leading-relaxed">
                                {notif.message}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-1">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowEventMenu(false);
                  setShowNotifMenu(false);
                }}
                className="flex items-center gap-2 p-1 pl-2 rounded-full border border-purple-200 hover:border-purple-300 hover:bg-purple-50/50 transition-colors"
              >
                <span className="text-xs font-semibold text-gray-700 hidden sm:inline max-w-[100px] truncate">
                  {user?.name || "Guest Host"}
                </span>
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#6C4AB6] to-pink-400 text-white flex items-center justify-center text-xs font-bold shadow-xs overflow-hidden">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-purple-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-800">{user?.name || "Celebration Host"}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user?.email || "demo@celebrationplanner.ai"}</p>
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Authenticated &amp; Isolated</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onSelectTab("dashboard");
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-purple-50 flex items-center gap-2"
                    >
                      <Calendar className="w-3.5 h-3.5 text-purple-600" />
                      <span>My Celebrations</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenSchemaModal();
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-purple-50 flex items-center gap-2"
                    >
                      <Database className="w-3.5 h-3.5 text-purple-600" />
                      <span>Supabase Schema &amp; Policies</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenAuthModal();
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-purple-50 flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-purple-600" />
                      <span>Switch Account / Sign In</span>
                    </button>
                  </div>

                  <div className="border-t border-gray-100 pt-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                        onOpenAuthModal();
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
