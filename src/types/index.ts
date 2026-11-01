export type EventCategory = 
  | 'Wedding'
  | 'Birthday'
  | 'Anniversary'
  | 'College Event'
  | 'Corporate Event'
  | 'Community Event'
  | 'Other';

export type RSVPStatus = 'Invited' | 'Confirmed' | 'Declined' | 'Pending';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type BookingStatus = 'Inquiry' | 'Shortlisted' | 'Contacted' | 'Booked' | 'Cancelled';

export type PaymentStatus = 'Pending' | 'Advance Paid' | 'Fully Paid';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  phone?: string;
  createdAt: string;
}

export interface EventItem {
  id: string;
  userId: string;
  name: string;
  category: EventCategory;
  date: string;
  time?: string;
  location: string;
  guestCount: number;
  totalBudget: number;
  preferredTheme?: string;
  duration?: string;
  specialRequirements?: string;
  foodPreferences?: string;
  decorationPreferences?: string;
  status: 'planning' | 'confirmed' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface EventPlan {
  id: string;
  eventId: string;
  userId: string;
  overview: string;
  recommendedTheme: string;
  colorPalette: string[];
  decorationIdeas: string[];
  venueSuggestions: {
    criteria: string;
    recommendedTypes: string[];
    tips: string;
  };
  cateringRecommendations: {
    menuStyle: string;
    suggestedItems: string[];
    dietaryNotes: string;
  };
  entertainmentIdeas: string[];
  photographyRequirements: string[];
  budgetDistribution: {
    category: string;
    percentage: number;
    amount: number;
    notes: string;
  }[];
  vendorChecklist: {
    category: string;
    items: string[];
    priority: 'Essential' | 'Recommended' | 'Optional';
  }[];
  guestManagementSuggestions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategoryItem {
  id: string;
  eventId: string;
  userId: string;
  category: string;
  allocatedAmount: number;
  notes?: string;
}

export interface ExpenseItem {
  id: string;
  eventId: string;
  userId: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: 'Cash' | 'Credit Card' | 'Bank Transfer' | 'UPI / Online' | 'Other';
  description?: string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  eventId: string;
  userId: string;
  title: string;
  category?: string;
  priority: TaskPriority;
  dueDate: string;
  daysBeforeEvent?: number;
  isCompleted: boolean;
  notes?: string;
  createdAt: string;
}

export interface VendorItem {
  id: string;
  eventId: string;
  userId: string;
  name: string;
  category: 
    | 'Event venues'
    | 'Caterers'
    | 'Decorators'
    | 'Photographers'
    | 'Videographers'
    | 'DJs'
    | 'Makeup artists'
    | 'Florists'
    | 'Transportation'
    | 'Entertainment providers'
    | 'Other';
  contact: string;
  email?: string;
  estimatedPrice: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
}

export interface GuestItem {
  id: string;
  eventId: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  rsvpStatus: RSVPStatus;
  attendeesCount: number;
  dietaryPreferences?: string;
  specialRequirements?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  eventId?: string;
  userId: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  eventId?: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success' | 'deadline';
  read: boolean;
  createdAt: string;
}

export interface ThemeSuggestion {
  themeName: string;
  colorPalette: { name: string; hex: string }[];
  decorationConcepts: string[];
  lightingIdeas: string[];
  stageDesign: string;
  foodPresentation: string[];
  entertainmentActivities: string[];
  invitationIdeas: string;
}
