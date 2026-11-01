import {
  UserProfile,
  EventItem,
  EventPlan,
  ExpenseItem,
  TaskItem,
  VendorItem,
  GuestItem,
  NotificationItem,
  ThemeSuggestion,
} from "../types/index.ts";

const TOKEN_KEY = "event_planner_token";

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: { name: string; email: string; password?: string }) =>
    request<{ user: UserProfile; token: string; message: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password?: string }) =>
    request<{ user: UserProfile; token: string; message: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  demoLogin: () =>
    request<{ user: UserProfile; token: string; message: string }>("/api/auth/demo-login", {
      method: "POST",
    }),

  getMe: () => request<{ user: UserProfile }>("/api/auth/me"),

  updateProfile: (updates: Partial<UserProfile>) =>
    request<{ user: UserProfile; message: string }>("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    }),

  resetPassword: (email: string) =>
    request<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  // Events
  getEvents: () => request<{ events: EventItem[] }>("/api/events"),

  getEvent: (id: string) => request<{ event: EventItem }>(`/api/events/${id}`),

  createEvent: (eventData: Partial<EventItem>) =>
    request<{ event: EventItem; message: string }>("/api/events", {
      method: "POST",
      body: JSON.stringify(eventData),
    }),

  updateEvent: (id: string, updates: Partial<EventItem>) =>
    request<{ event: EventItem; message: string }>(`/api/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }),

  deleteEvent: (id: string) =>
    request<{ message: string }>(`/api/events/${id}`, {
      method: "DELETE",
    }),

  getEventPlan: (id: string) => request<{ plan: EventPlan | null }>(`/api/events/${id}/plan`),

  saveEventPlan: (id: string, plan: Partial<EventPlan>) =>
    request<{ plan: EventPlan; message: string }>(`/api/events/${id}/plan`, {
      method: "POST",
      body: JSON.stringify(plan),
    }),

  // AI Endpoints
  generateAiPlan: (params: {
    name: string;
    category: string;
    date: string;
    location: string;
    guestCount: number;
    totalBudget: number;
    preferredTheme?: string;
    duration?: string;
    specialRequirements?: string;
    foodPreferences?: string;
    decorationPreferences?: string;
  }) =>
    request<{ success: boolean; plan: EventPlan; message: string }>("/api/ai/generate-plan", {
      method: "POST",
      body: JSON.stringify(params),
    }),

  optimizeAiBudget: (params: {
    eventId?: string;
    eventName?: string;
    category?: string;
    totalBudget?: number;
    categories?: any[];
  }) =>
    request<{
      success: boolean;
      optimization: {
        status: string;
        summary: string;
        overBudgetRiskCategories: string[];
        costSavingSuggestions: {
          category: string;
          action: string;
          estimatedSavings: number;
          qualityImpact: string;
        }[];
        recommendedReallocation: {
          category: string;
          currentAllocation: number;
          suggestedAllocation: number;
          rational: string;
        }[];
        vendorNegotiationTips: string[];
      };
    }>("/api/ai/optimize-budget", {
      method: "POST",
      body: JSON.stringify(params),
    }),

  generateAiTimeline: (params: {
    eventId?: string;
    name?: string;
    category?: string;
    date?: string;
    saveToEvent?: boolean;
  }) =>
    request<{
      success: boolean;
      timeline: {
        title: string;
        category: string;
        priority: 'Critical' | 'High' | 'Medium' | 'Low';
        daysBeforeEvent: number;
        notes: string;
      }[];
    }>("/api/ai/generate-timeline", {
      method: "POST",
      body: JSON.stringify(params),
    }),

  generateAiThemes: (params: {
    category: string;
    totalBudget: number;
    guestCount: number;
    preferences?: string;
  }) =>
    request<{ success: boolean; themes: (ThemeSuggestion & { tagline?: string })[] }>(
      "/api/ai/generate-themes",
      {
        method: "POST",
        body: JSON.stringify(params),
      }
    ),

  chatWithAi: (params: {
    message: string;
    eventId?: string;
    history?: { role: 'user' | 'assistant'; content: string }[];
  }) =>
    request<{ success: boolean; reply: string; sender: string }>("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify(params),
    }),

  // Expenses
  getExpenses: (eventId?: string) =>
    request<{ expenses: ExpenseItem[] }>(
      eventId ? `/api/expenses?eventId=${encodeURIComponent(eventId)}` : "/api/expenses"
    ),

  addExpense: (expense: Partial<ExpenseItem>) =>
    request<{ expense: ExpenseItem; message: string }>("/api/expenses", {
      method: "POST",
      body: JSON.stringify(expense),
    }),

  updateExpense: (id: string, updates: Partial<ExpenseItem>) =>
    request<{ expense: ExpenseItem; message: string }>(`/api/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }),

  deleteExpense: (id: string) =>
    request<{ message: string }>(`/api/expenses/${id}`, {
      method: "DELETE",
    }),

  // Tasks
  getTasks: (eventId?: string) =>
    request<{ tasks: TaskItem[] }>(
      eventId ? `/api/tasks?eventId=${encodeURIComponent(eventId)}` : "/api/tasks"
    ),

  addTask: (task: Partial<TaskItem>) =>
    request<{ task: TaskItem; message: string }>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    }),

  updateTask: (id: string, updates: Partial<TaskItem>) =>
    request<{ task: TaskItem; message: string }>(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }),

  deleteTask: (id: string) =>
    request<{ message: string }>(`/api/tasks/${id}`, {
      method: "DELETE",
    }),

  // Vendors
  getVendors: (eventId?: string) =>
    request<{ vendors: VendorItem[] }>(
      eventId ? `/api/vendors?eventId=${encodeURIComponent(eventId)}` : "/api/vendors"
    ),

  addVendor: (vendor: Partial<VendorItem>) =>
    request<{ vendor: VendorItem; message: string }>("/api/vendors", {
      method: "POST",
      body: JSON.stringify(vendor),
    }),

  updateVendor: (id: string, updates: Partial<VendorItem>) =>
    request<{ vendor: VendorItem; message: string }>(`/api/vendors/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }),

  deleteVendor: (id: string) =>
    request<{ message: string }>(`/api/vendors/${id}`, {
      method: "DELETE",
    }),

  // Guests
  getGuests: (eventId?: string) =>
    request<{ guests: GuestItem[] }>(
      eventId ? `/api/guests?eventId=${encodeURIComponent(eventId)}` : "/api/guests"
    ),

  addGuest: (guest: Partial<GuestItem>) =>
    request<{ guest: GuestItem; message: string }>("/api/guests", {
      method: "POST",
      body: JSON.stringify(guest),
    }),

  updateGuest: (id: string, updates: Partial<GuestItem>) =>
    request<{ guest: GuestItem; message: string }>(`/api/guests/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }),

  deleteGuest: (id: string) =>
    request<{ message: string }>(`/api/guests/${id}`, {
      method: "DELETE",
    }),

  // Notifications & Dashboard
  getNotifications: () => request<{ notifications: NotificationItem[] }>("/api/notifications"),

  markNotificationsRead: () =>
    request<{ message: string }>("/api/notifications/mark-read", {
      method: "POST",
    }),

  getDashboardStats: () =>
    request<{
      totalEvents: number;
      upcomingEventsCount: number;
      upcomingEvents: EventItem[];
      totalPlannedBudget: number;
      totalExpenses: number;
      remainingBudget: number;
      pendingTasks: number;
      completedTasks: number;
      taskCompletionRate: number;
      totalGuests: number;
      confirmedGuests: number;
    }>("/api/dashboard/stats"),

  getSchemaSql: () => request<{ sql: string }>("/api/system/schema-sql"),
};
