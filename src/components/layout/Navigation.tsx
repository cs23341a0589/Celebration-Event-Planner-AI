import React from "react";
import {
  LayoutDashboard,
  Wand2,
  FileText,
  PieChart,
  CalendarClock,
  Briefcase,
  Palette,
  Users,
  Receipt,
  MessageSquare,
} from "lucide-react";

interface NavigationProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  hasActiveEvent: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  hasActiveEvent,
}) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "creator", label: "AI Event Creator", icon: Wand2, highlight: true },
    { id: "plan", label: "AI Plan Details", icon: FileText },
    { id: "budget", label: "Budget Manager", icon: PieChart },
    { id: "timeline", label: "Timeline & Tasks", icon: CalendarClock },
    { id: "vendors", label: "Vendor Checklist", icon: Briefcase },
    { id: "themes", label: "AI Theme Studio", icon: Palette },
    { id: "guests", label: "Guest RSVP", icon: Users },
    { id: "expenses", label: "Expense Tracker", icon: Receipt },
    { id: "chat", label: "EventMate AI", icon: MessageSquare, badge: "GenAI" },
  ];

  return (
    <div className="bg-white border-b border-purple-100 shadow-2xs sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-[#6C4AB6] text-white shadow-sm shadow-purple-500/20"
                    : item.highlight
                    ? "text-purple-700 bg-purple-50 hover:bg-purple-100/70"
                    : "text-gray-600 hover:text-[#6C4AB6] hover:bg-purple-50/50"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? "text-white"
                      : item.highlight
                      ? "text-[#6C4AB6]"
                      : "text-gray-500"
                  }`}
                />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? "bg-white/30 text-white" : "bg-purple-100 text-[#6C4AB6]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
