import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.tsx";
import { EventProvider, useEvent } from "./context/EventContext.tsx";
import { Header } from "./components/layout/Header.tsx";
import { Navigation } from "./components/layout/Navigation.tsx";
import { DashboardView } from "./components/dashboard/DashboardView.tsx";
import { AiEventCreator } from "./components/events/AiEventCreator.tsx";
import { EventPlanView } from "./components/events/EventPlanView.tsx";
import { BudgetManagerView } from "./components/budget/BudgetManagerView.tsx";
import { TimelineView } from "./components/timeline/TimelineView.tsx";
import { VendorChecklistView } from "./components/vendors/VendorChecklistView.tsx";
import { ThemeGeneratorView } from "./components/themes/ThemeGeneratorView.tsx";
import { GuestManagementView } from "./components/guests/GuestManagementView.tsx";
import { ExpenseTrackerView } from "./components/expenses/ExpenseTrackerView.tsx";
import { EventMateChat } from "./components/chat/EventMateChat.tsx";
import { SupabaseSchemaModal } from "./components/modals/SupabaseSchemaModal.tsx";
import { AuthModal } from "./components/auth/AuthModal.tsx";
import { MessageSquare, Sparkles } from "lucide-react";

function MainApp() {
  const { activeEvent } = useEvent();
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Modals
  const [showChat, setShowChat] = useState<boolean>(false);
  const [showSchemaModal, setShowSchemaModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#F8F7FC] text-[#25223A] flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onOpenCreateModal={() => setActiveTab("creator")}
        onOpenChat={() => setShowChat(true)}
        onOpenSchemaModal={() => setShowSchemaModal(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

      {/* Navigation Tab Bar */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === "chat") {
            setShowChat(true);
          } else {
            setActiveTab(tab);
          }
        }}
        hasActiveEvent={Boolean(activeEvent)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeTab === "dashboard" && (
          <DashboardView
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenCreateEvent={() => setActiveTab("creator")}
            onOpenChat={() => setShowChat(true)}
          />
        )}

        {activeTab === "creator" && (
          <AiEventCreator onPlanCreated={() => setActiveTab("plan")} />
        )}

        {activeTab === "plan" && <EventPlanView />}

        {activeTab === "budget" && <BudgetManagerView />}

        {activeTab === "timeline" && <TimelineView />}

        {activeTab === "vendors" && <VendorChecklistView />}

        {activeTab === "themes" && <ThemeGeneratorView />}

        {activeTab === "guests" && <GuestManagementView />}

        {activeTab === "expenses" && <ExpenseTrackerView />}
      </main>

      {/* Floating EventMate AI Chat Widget */}
      <EventMateChat
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        isFloating={true}
      />

      {/* Floating Chat Trigger Button (when closed) */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full bg-gradient-to-r from-[#6C4AB6] via-[#7B52CE] to-pink-500 text-white font-bold text-xs shadow-xl shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer group"
          title="Chat with EventMate AI"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          </div>
          <span className="hidden sm:inline">EventMate AI</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[9px]">GenAI</span>
        </button>
      )}

      {/* Schema / RLS Modal */}
      <SupabaseSchemaModal
        isOpen={showSchemaModal}
        onClose={() => setShowSchemaModal(false)}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <EventProvider>
        <MainApp />
      </EventProvider>
    </AuthProvider>
  );
}
