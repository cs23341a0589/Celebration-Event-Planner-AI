import fs from "fs";
import path from "path";
import {
  UserProfile,
  EventItem,
  EventPlan,
  BudgetCategoryItem,
  ExpenseItem,
  TaskItem,
  VendorItem,
  GuestItem,
  ChatMessage,
  NotificationItem,
} from "../../src/types/index.ts";
import { stripUndefined } from "../utils/sanitizer.ts";

export interface DatabaseState {
  users: Record<string, UserProfile & { passwordHash?: string }>;
  events: Record<string, EventItem>;
  plans: Record<string, EventPlan>; // keyed by eventId
  budgetCategories: Record<string, BudgetCategoryItem[]>; // keyed by eventId
  expenses: Record<string, ExpenseItem[]>; // keyed by eventId
  tasks: Record<string, TaskItem[]>; // keyed by eventId
  vendors: Record<string, VendorItem[]>; // keyed by eventId
  guests: Record<string, GuestItem[]>; // keyed by eventId
  chats: Record<string, ChatMessage[]>; // keyed by userId
  notifications: Record<string, NotificationItem[]>; // keyed by userId
}

const DB_FILE_PATH = path.resolve(process.cwd(), "data", "event_planner_db.json");

function ensureDirectoryExists(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

class DatabaseStore {
  private state: DatabaseState = {
    users: {},
    events: {},
    plans: {},
    budgetCategories: {},
    expenses: {},
    tasks: {},
    vendors: {},
    guests: {},
    chats: {},
    notifications: {},
  };

  constructor() {
    this.load();
    if (Object.keys(this.state.users).length === 0) {
      this.seedInitialData();
      this.save();
    }
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
        this.state = JSON.parse(raw);
      }
    } catch (err) {
      console.warn("[Database] Could not read existing DB file, starting clean.", err);
    }
  }

  private save() {
    try {
      ensureDirectoryExists(DB_FILE_PATH);
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(stripUndefined(this.state), null, 2), "utf-8");
    } catch (err) {
      console.error("[Database] Error writing to DB file:", err);
    }
  }

  private seedInitialData() {
    const demoUserId = "demo-user-1";
    const demoUser: UserProfile = {
      id: demoUserId,
      email: "demo@celebrationplanner.ai",
      name: "Aanya Sharma",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
      phone: "+91 98765 43210",
      createdAt: new Date().toISOString(),
    };
    this.state.users[demoUserId] = demoUser;

    // Event 1: Royal Palace Wedding
    const event1Id = "event-royal-wedding";
    const event1: EventItem = {
      id: event1Id,
      userId: demoUserId,
      name: "Priya & Rohan's Royal Palace Wedding",
      category: "Wedding",
      date: "2026-11-28",
      time: "18:00",
      location: "The Grand Heritage Palace & Lawns, Udaipur",
      guestCount: 250,
      totalBudget: 450000,
      preferredTheme: "Royal Rajputana Crimson & Gold",
      duration: "3 Days / 2 Nights",
      specialRequirements: "Traditional Shehnai arrival, sustainable floral decor, drone coverage",
      foodPreferences: "Royal Rajasthani Thali, Chaat counter, Global Asian wok",
      decorationPreferences: "Marigold chandeliers, vintage brass lanterns, palace facade wash",
      status: "planning",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.events[event1Id] = event1;

    // Event 1 Plan
    this.state.plans[event1Id] = {
      id: "plan-wedding-1",
      eventId: event1Id,
      userId: demoUserId,
      overview:
        "A regal 3-day royal celebration inspired by Rajputana architecture, combining majestic palace courtyards with warm, opulent hospitality and sustainable floral artistry.",
      recommendedTheme: "Royal Rajputana Crimson & Gold Splendor",
      colorPalette: ["#8B0000", "#FFD700", "#E6C280", "#2E1A47"],
      decorationIdeas: [
        "Palace gate archway embellished with cascading fragrant marigolds & tuberoses",
        "Hand-beaten brass urns with floating water lilies along the lakeside walkway",
        "Royal Mandap with handcrafted rose-gold pillars overlooking the lake at sunset",
        "Custom royal motif gobo projections across heritage sandstone walls",
      ],
      venueSuggestions: {
        criteria: "Grand ballroom + open-air poolside lawn for 250+ guests with heritage acoustics",
        recommendedTypes: ["Heritage Fort / Palace Resort", "Lakeside Luxury Haveli"],
        tips: "Ensure dedicated generator backup for stage sound and check local sound curfews (10:00 PM cutoff).",
      },
      cateringRecommendations: {
        menuStyle: "Royal Feast Buffet with Live Specialty Stations",
        suggestedItems: [
          "Kesariya Thandai & Smoked Kokum Welcome Spritz",
          "Truffle Paneer Tikka & Galouti Kebabs",
          "Dal Baati Churma in traditional terracotta bowls",
          "Baked Malpua with Rabdi Gelato",
        ],
        dietaryNotes: "Strict Jain counter requested; distinct vegan and gluten-free items labeled clearly.",
      },
      entertainmentIdeas: [
        "Traditional Manganiyar folk ensemble with soulful morchang & dholak for guest arrival",
        "Grand Sangeet choreography with synchronized LED screen graphics",
        "Celebrity DJ set for late night after-party inside soundproof ballroom",
      ],
      photographyRequirements: [
        "Sunset couple portraits by the lake palace bastion",
        "Cinematic 4K drone overhead of Barat procession",
        "Candid instant photo booth for guests with custom royal frames",
      ],
      budgetDistribution: [
        { category: "Venue & Hospitality", percentage: 28, amount: 126000, notes: "Palace lawn rental, rooms for VIPs" },
        { category: "Catering & Bar", percentage: 30, amount: 135000, notes: "250 guests across 3 major meal services" },
        { category: "Decoration & Flowers", percentage: 16, amount: 72000, notes: "Mandap, fairy lights, floral chandeliers" },
        { category: "Photography & Cinema", percentage: 11, amount: 49500, notes: "3 camera team + drone + edit album" },
        { category: "Entertainment & DJ", percentage: 7, amount: 31500, notes: "Sound setup, folk artists, lighting console" },
        { category: "Invitations & Gifts", percentage: 4, amount: 18000, notes: "Bespoke gift boxes with artisan sweets" },
        { category: "Miscellaneous Contingency", percentage: 4, amount: 18000, notes: "Emergency permissions & transport" },
      ],
      vendorChecklist: [
        { category: "Venue", items: ["Sign banquet contract", "Confirm vendor access timing"], priority: "Essential" },
        { category: "Catering", items: ["Finalize menu tasting", "Confirm bar license & glassware"], priority: "Essential" },
        { category: "Decor", items: ["Approve 3D Mandap mockup", "Finalize floral color palette"], priority: "Essential" },
        { category: "Photography", items: ["Share family VIP shotlist", "Book accommodation for crew"], priority: "Recommended" },
      ],
      guestManagementSuggestions: [
        "Create WhatsApp broadcast group for real-time bus and event schedule updates",
        "Set up an arrival hospitality desk with luggage tags and cold wet towels",
        "Provide RSVP follow-up links via automated WhatsApp reminder 20 days prior",
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Event 1 Budget Categories
    this.state.budgetCategories[event1Id] = [
      { id: "bc-1", eventId: event1Id, userId: demoUserId, category: "Venue & Hospitality", allocatedAmount: 126000 },
      { id: "bc-2", eventId: event1Id, userId: demoUserId, category: "Catering & Bar", allocatedAmount: 135000 },
      { id: "bc-3", eventId: event1Id, userId: demoUserId, category: "Decoration & Flowers", allocatedAmount: 72000 },
      { id: "bc-4", eventId: event1Id, userId: demoUserId, category: "Photography & Cinema", allocatedAmount: 49500 },
      { id: "bc-5", eventId: event1Id, userId: demoUserId, category: "Entertainment & DJ", allocatedAmount: 31500 },
      { id: "bc-6", eventId: event1Id, userId: demoUserId, category: "Invitations & Gifts", allocatedAmount: 18000 },
      { id: "bc-7", eventId: event1Id, userId: demoUserId, category: "Miscellaneous Contingency", allocatedAmount: 18000 },
    ];

    // Event 1 Expenses
    this.state.expenses[event1Id] = [
      {
        id: "exp-1",
        eventId: event1Id,
        userId: demoUserId,
        title: "Palace Venue Booking Advance (50%)",
        category: "Venue & Hospitality",
        amount: 65000,
        date: "2026-10-15",
        paymentMethod: "Bank Transfer",
        description: "Official confirmation token for heritage lawn booking",
        createdAt: new Date().toISOString(),
      },
      {
        id: "exp-2",
        eventId: event1Id,
        userId: demoUserId,
        title: "Master Caterer Tasting & Contract Deposit",
        category: "Catering & Bar",
        amount: 40000,
        date: "2026-10-20",
        paymentMethod: "UPI / Online",
        description: "Token advance for 250 guest menu",
        createdAt: new Date().toISOString(),
      },
      {
        id: "exp-3",
        eventId: event1Id,
        userId: demoUserId,
        title: "Florist Material Deposit",
        category: "Decoration & Flowers",
        amount: 25000,
        date: "2026-10-25",
        paymentMethod: "Bank Transfer",
        description: "Advance for marigold & rose consignments",
        createdAt: new Date().toISOString(),
      },
      {
        id: "exp-4",
        eventId: event1Id,
        userId: demoUserId,
        title: "Cinematographer Retainer Fee",
        category: "Photography & Cinema",
        amount: 20000,
        date: "2026-10-28",
        paymentMethod: "Credit Card",
        description: "Drone crew & 4K lead camera booking lock",
        createdAt: new Date().toISOString(),
      },
    ];

    // Event 1 Tasks (Timeline)
    this.state.tasks[event1Id] = [
      {
        id: "task-1",
        eventId: event1Id,
        userId: demoUserId,
        title: "Finalize Palace Venue Booking & Sign Agreement",
        category: "Venue",
        priority: "Critical",
        dueDate: "2026-10-15",
        daysBeforeEvent: 44,
        isCompleted: true,
        notes: "Agreement received and signed with GM.",
        createdAt: new Date().toISOString(),
      },
      {
        id: "task-2",
        eventId: event1Id,
        userId: demoUserId,
        title: "Conduct Food Tasting & Lock 3-Day Menu",
        category: "Catering",
        priority: "High",
        dueDate: "2026-11-05",
        daysBeforeEvent: 23,
        isCompleted: false,
        notes: "Check vegetarian and gluten-free live counters.",
        createdAt: new Date().toISOString(),
      },
      {
        id: "task-3",
        eventId: event1Id,
        userId: demoUserId,
        title: "Approve 3D Stage & Mandap Floral Render",
        category: "Decor",
        priority: "High",
        dueDate: "2026-11-10",
        daysBeforeEvent: 18,
        isCompleted: false,
        notes: "Make sure pillars do not block front row guest views.",
        createdAt: new Date().toISOString(),
      },
      {
        id: "task-4",
        eventId: event1Id,
        userId: demoUserId,
        title: "Send Digital WhatsApp Video Invites & Track RSVPs",
        category: "Logistics",
        priority: "Critical",
        dueDate: "2026-11-08",
        daysBeforeEvent: 20,
        isCompleted: true,
        notes: "Animated invite sent to 200 primary contacts.",
        createdAt: new Date().toISOString(),
      },
      {
        id: "task-5",
        eventId: event1Id,
        userId: demoUserId,
        title: "Sound & DJ License Clearance with Local Authorities",
        category: "Entertainment",
        priority: "Medium",
        dueDate: "2026-11-20",
        daysBeforeEvent: 8,
        isCompleted: false,
        notes: "Get police NOC for music till 10 PM.",
        createdAt: new Date().toISOString(),
      },
      {
        id: "task-6",
        eventId: event1Id,
        userId: demoUserId,
        title: "Final Rehearsal & Vendor Load-in Verification",
        category: "Logistics",
        priority: "High",
        dueDate: "2026-11-27",
        daysBeforeEvent: 1,
        isCompleted: false,
        notes: "Check generator fuel and green room temperature.",
        createdAt: new Date().toISOString(),
      },
    ];

    // Event 1 Vendors
    this.state.vendors[event1Id] = [
      {
        id: "ven-1",
        eventId: event1Id,
        userId: demoUserId,
        name: "Udaivilas Heritage Lawns",
        category: "Event venues",
        contact: "+91 294 243 4300",
        email: "events@udaivilashaveli.com",
        estimatedPrice: 125000,
        bookingStatus: "Booked",
        paymentStatus: "Advance Paid",
        notes: "Includes palace courtyard and 12 luxury bridal rooms.",
        createdAt: new Date().toISOString(),
      },
      {
        id: "ven-2",
        eventId: event1Id,
        userId: demoUserId,
        name: "Shahi Dawat Royal Caterers",
        category: "Caterers",
        contact: "+91 98290 11223",
        email: "contact@shahidawat.in",
        estimatedPrice: 130000,
        bookingStatus: "Booked",
        paymentStatus: "Advance Paid",
        notes: "Providing 10 live cooking stations and traditional servers in Turbans.",
        createdAt: new Date().toISOString(),
      },
      {
        id: "ven-3",
        eventId: event1Id,
        userId: demoUserId,
        name: "Aura Floral & Production Studio",
        category: "Decorators",
        contact: "+91 97110 55443",
        email: "designs@auradecor.co",
        estimatedPrice: 70000,
        bookingStatus: "Booked",
        paymentStatus: "Advance Paid",
        notes: "Using eco-friendly marigolds, fairy lights, and brass props.",
        createdAt: new Date().toISOString(),
      },
      {
        id: "ven-4",
        eventId: event1Id,
        userId: demoUserId,
        name: "Lumiere Cinema & Photography",
        category: "Photographers",
        contact: "+91 98991 77665",
        email: "lumierefilms@gmail.com",
        estimatedPrice: 48000,
        bookingStatus: "Shortlisted",
        paymentStatus: "Pending",
        notes: "Delivering teaser within 48 hours and album within 3 weeks.",
        createdAt: new Date().toISOString(),
      },
      {
        id: "ven-5",
        eventId: event1Id,
        userId: demoUserId,
        name: "DJ Varun & Rhythm Beats",
        category: "DJs",
        contact: "+91 99100 88771",
        email: "varun.beats@djmail.com",
        estimatedPrice: 30000,
        bookingStatus: "Inquiry",
        paymentStatus: "Pending",
        notes: "Specializes in Bollywood remixes, EDM, and Punjabi dhol beats.",
        createdAt: new Date().toISOString(),
      },
    ];

    // Event 1 Guests
    this.state.guests[event1Id] = [
      {
        id: "gst-1",
        eventId: event1Id,
        userId: demoUserId,
        name: "Rajesh & Sunita Mehra",
        email: "rajesh.mehra@example.com",
        phone: "+91 98111 22334",
        rsvpStatus: "Confirmed",
        attendeesCount: 2,
        dietaryPreferences: "Vegetarian",
        specialRequirements: "Near front row seating for elderly grandmother",
        createdAt: new Date().toISOString(),
      },
      {
        id: "gst-2",
        eventId: event1Id,
        userId: demoUserId,
        name: "Vikram Singhania",
        email: "vikram.s@example.com",
        phone: "+91 98222 33445",
        rsvpStatus: "Confirmed",
        attendeesCount: 3,
        dietaryPreferences: "Jain Cuisine (No onion, no garlic)",
        specialRequirements: "Requires ground floor room accommodation",
        createdAt: new Date().toISOString(),
      },
      {
        id: "gst-3",
        eventId: event1Id,
        userId: demoUserId,
        name: "Kavita Kapoor",
        email: "kavita.k@example.com",
        phone: "+91 98333 44556",
        rsvpStatus: "Pending",
        attendeesCount: 1,
        dietaryPreferences: "Vegan",
        specialRequirements: "Arrival at 7 PM",
        createdAt: new Date().toISOString(),
      },
      {
        id: "gst-4",
        eventId: event1Id,
        userId: demoUserId,
        name: "Ananya & Siddharth Roy",
        email: "sid.roy@example.com",
        phone: "+91 98444 55667",
        rsvpStatus: "Invited",
        attendeesCount: 2,
        dietaryPreferences: "Non-Vegetarian",
        specialRequirements: "Airport pickup requested",
        createdAt: new Date().toISOString(),
      },
      {
        id: "gst-5",
        eventId: event1Id,
        userId: demoUserId,
        name: "Deepak Chawla",
        email: "deepak.c@example.com",
        phone: "+91 98555 66778",
        rsvpStatus: "Declined",
        attendeesCount: 0,
        dietaryPreferences: "None",
        specialRequirements: "Sending gift and wishes from overseas",
        createdAt: new Date().toISOString(),
      },
    ];

    // Event 2: Vivaan's 10th Superhero Birthday Fiesta
    const event2Id = "event-superhero-birthday";
    const event2: EventItem = {
      id: event2Id,
      userId: demoUserId,
      name: "Vivaan's 10th Superhero Birthday Fiesta",
      category: "Birthday",
      date: "2026-11-15",
      time: "16:30",
      location: "SkyZone Adventure Hub & Party Terrace, Mumbai",
      guestCount: 45,
      totalBudget: 85000,
      preferredTheme: "Avengers Cosmic Academy",
      duration: "4 Hours",
      specialRequirements: "Custom 3D superhero cake, interactive treasure quest, magician",
      foodPreferences: "Kids favorites: Artisanal pizzas, sliders, nachos, waffle bar",
      decorationPreferences: "Comic-style pop art cutouts, helium balloons, LED neon signage",
      status: "planning",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.events[event2Id] = event2;

    this.state.budgetCategories[event2Id] = [
      { id: "bc-b1", eventId: event2Id, userId: demoUserId, category: "Venue & Games", allocatedAmount: 30000 },
      { id: "bc-b2", eventId: event2Id, userId: demoUserId, category: "Catering & Cake", allocatedAmount: 25000 },
      { id: "bc-b3", eventId: event2Id, userId: demoUserId, category: "Theme Decor & Balloons", allocatedAmount: 15000 },
      { id: "bc-b4", eventId: event2Id, userId: demoUserId, category: "Entertainment & Games Host", allocatedAmount: 10000 },
      { id: "bc-b5", eventId: event2Id, userId: demoUserId, category: "Return Gifts & Favors", allocatedAmount: 5000 },
    ];

    this.state.expenses[event2Id] = [
      {
        id: "exp-b1",
        eventId: event2Id,
        userId: demoUserId,
        title: "SkyZone Arena 4-Hour Exclusive Hall Booking",
        category: "Venue & Games",
        amount: 18000,
        date: "2026-10-24",
        paymentMethod: "Credit Card",
        description: "Includes jump socks and party room host",
        createdAt: new Date().toISOString(),
      },
      {
        id: "exp-b2",
        eventId: event2Id,
        userId: demoUserId,
        title: "Custom 3-Tier Avengers Fondant Cake Deposit",
        category: "Catering & Cake",
        amount: 6000,
        date: "2026-10-26",
        paymentMethod: "UPI / Online",
        description: "Dark chocolate truffle & red velvet filling",
        createdAt: new Date().toISOString(),
      },
    ];

    this.state.tasks[event2Id] = [
      {
        id: "task-b1",
        eventId: event2Id,
        userId: demoUserId,
        title: "Order superhero customized capes & masks for return favors",
        category: "Favors",
        priority: "High",
        dueDate: "2026-11-02",
        daysBeforeEvent: 13,
        isCompleted: true,
        notes: "45 custom sets ordered with initials.",
        createdAt: new Date().toISOString(),
      },
      {
        id: "task-b2",
        eventId: event2Id,
        userId: demoUserId,
        title: "Confirm Magician and Game Host Schedule",
        category: "Entertainment",
        priority: "Medium",
        dueDate: "2026-11-06",
        daysBeforeEvent: 9,
        isCompleted: false,
        notes: "60-minute illusion act + treasure hunt.",
        createdAt: new Date().toISOString(),
      },
    ];

    // Seed Initial Notifications
    this.state.notifications[demoUserId] = [
      {
        id: "notif-1",
        userId: demoUserId,
        eventId: event1Id,
        title: "Food Tasting Approaching",
        message: "Your royal wedding catering tasting session is scheduled for Nov 5. Confirm guest counts.",
        type: "deadline",
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: "notif-2",
        userId: demoUserId,
        eventId: event1Id,
        title: "Budget Status Healthy",
        message: "You have utilized ₹1,50,000 out of ₹4,50,000 (33.3%). ₹3,00,000 remaining buffer.",
        type: "info",
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      },
      {
        id: "notif-3",
        userId: demoUserId,
        eventId: event2Id,
        title: "Cake Order Confirmed",
        message: "Avengers cake deposit confirmed with SugarCraft Bakery. Delivery scheduled Nov 15 at 3:30 PM.",
        type: "success",
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
    ];
  }

  // --- User Profiles ---
  getUser(id: string): UserProfile | null {
    const user = this.state.users[id];
    if (!user) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  getUserByEmail(email: string): (UserProfile & { passwordHash?: string }) | null {
    const target = Object.values(this.state.users).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    return target || null;
  }

  createUser(user: UserProfile & { passwordHash?: string }): UserProfile {
    this.state.users[user.id] = user;
    this.save();
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  updateUserProfile(userId: string, updates: Partial<UserProfile>): UserProfile {
    const existing = this.state.users[userId];
    if (!existing) throw new Error("User not found");
    const updated = { ...existing, ...updates, id: userId };
    this.state.users[userId] = updated;
    this.save();
    const { passwordHash, ...safeUser } = updated;
    return safeUser;
  }

  // --- Events ---
  getEventsByUser(userId: string): EventItem[] {
    let userEvents = Object.values(this.state.events)
      .filter((e) => e.userId === userId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // If a newly registered user has no events yet, auto-provision starter celebrations
    if (userEvents.length === 0) {
      this.seedUserStarterEvents(userId);
      userEvents = Object.values(this.state.events)
        .filter((e) => e.userId === userId)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    return userEvents;
  }

  seedUserStarterEvents(userId: string) {
    const starterEventId = `evt-${userId}-wedding`;
    const starterEvent: EventItem = {
      id: starterEventId,
      userId,
      name: "Grand Royal Celebration & Wedding",
      category: "Wedding",
      date: "2026-11-28",
      time: "18:00",
      location: "The Grand Heritage Palace & Lawns, Udaipur",
      guestCount: 200,
      totalBudget: 450000,
      preferredTheme: "Royal Rajputana Crimson & Gold Splendor",
      duration: "3 Days / 2 Nights",
      specialRequirements: "Traditional Shehnai arrival, sustainable floral decor, drone coverage",
      foodPreferences: "Royal Rajasthani Thali, Chaat counter, Global Asian wok",
      decorationPreferences: "Marigold chandeliers, vintage brass lanterns, palace facade wash",
      status: "planning",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.events[starterEventId] = starterEvent;

    // Plan
    this.state.plans[starterEventId] = {
      id: `plan-${starterEventId}`,
      eventId: starterEventId,
      userId,
      overview:
        "A regal 3-day royal celebration inspired by Rajputana architecture, combining majestic palace courtyards with warm, opulent hospitality and sustainable floral artistry.",
      recommendedTheme: "Royal Rajputana Crimson & Gold Splendor",
      colorPalette: ["#8B0000", "#FFD700", "#E6C280", "#2E1A47"],
      decorationIdeas: [
        "Palace gate archway embellished with cascading fragrant marigolds & tuberoses",
        "Hand-beaten brass urns with floating water lilies along the lakeside walkway",
        "Royal Mandap with handcrafted rose-gold pillars overlooking the lake at sunset",
        "Custom royal motif gobo projections across heritage sandstone walls",
      ],
      venueSuggestions: {
        criteria: "Grand ballroom + open-air poolside lawn for 200+ guests with heritage acoustics",
        recommendedTypes: ["Heritage Fort / Palace Resort", "Lakeside Luxury Haveli"],
        tips: "Ensure dedicated generator backup for stage sound and check local sound curfews (10:00 PM cutoff).",
      },
      cateringRecommendations: {
        menuStyle: "Royal Feast Buffet with Live Specialty Stations",
        suggestedItems: [
          "Kesariya Thandai & Smoked Kokum Welcome Spritz",
          "Truffle Paneer Tikka & Galouti Kebabs",
          "Dal Baati Churma in traditional terracotta bowls",
          "Baked Malpua with Rabdi Gelato",
        ],
        dietaryNotes: "Strict Jain counter requested; distinct vegan and gluten-free items labeled clearly.",
      },
      entertainmentIdeas: [
        "Traditional Manganiyar folk ensemble with soulful morchang & dholak for guest arrival",
        "Grand Sangeet choreography with synchronized LED screen graphics",
        "Celebrity DJ set for late night after-party inside soundproof ballroom",
      ],
      photographyRequirements: [
        "Sunset couple portraits by the lake palace bastion",
        "Cinematic 4K drone overhead of Barat procession",
        "Candid instant photo booth for guests with custom royal frames",
      ],
      budgetDistribution: [
        { category: "Venue & Hospitality", percentage: 28, amount: 126000, notes: "Palace lawn rental, rooms for VIPs" },
        { category: "Catering & Bar", percentage: 30, amount: 135000, notes: "200 guests across 3 major meal services" },
        { category: "Decoration & Flowers", percentage: 16, amount: 72000, notes: "Mandap, fairy lights, floral chandeliers" },
        { category: "Photography & Cinema", percentage: 11, amount: 49500, notes: "3 camera team + drone + edit album" },
        { category: "Entertainment & DJ", percentage: 7, amount: 31500, notes: "Sound setup, folk artists, lighting console" },
        { category: "Invitations & Gifts", percentage: 4, amount: 18000, notes: "Bespoke gift boxes with artisan sweets" },
        { category: "Miscellaneous Contingency", percentage: 4, amount: 18000, notes: "Emergency permissions & transport" },
      ],
      vendorChecklist: [
        { category: "Venue", items: ["Sign banquet contract", "Confirm vendor access timing"], priority: "Essential" },
        { category: "Catering", items: ["Finalize menu tasting", "Confirm bar license & glassware"], priority: "Essential" },
        { category: "Decor", items: ["Approve 3D Mandap mockup", "Finalize floral color palette"], priority: "Essential" },
        { category: "Photography", items: ["Share family VIP shotlist", "Book accommodation for crew"], priority: "Recommended" },
      ],
      guestManagementSuggestions: [
        "Create WhatsApp broadcast group for real-time bus and event schedule updates",
        "Set up an arrival hospitality desk with luggage tags and cold wet towels",
        "Provide RSVP follow-up links via automated WhatsApp reminder 20 days prior",
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Budget Categories
    this.state.budgetCategories[starterEventId] = [
      { id: `bc-${starterEventId}-1`, eventId: starterEventId, userId, category: "Venue & Hospitality", allocatedAmount: 126000 },
      { id: `bc-${starterEventId}-2`, eventId: starterEventId, userId, category: "Catering & Bar", allocatedAmount: 135000 },
      { id: `bc-${starterEventId}-3`, eventId: starterEventId, userId, category: "Decoration & Flowers", allocatedAmount: 72000 },
      { id: `bc-${starterEventId}-4`, eventId: starterEventId, userId, category: "Photography & Cinema", allocatedAmount: 49500 },
      { id: `bc-${starterEventId}-5`, eventId: starterEventId, userId, category: "Entertainment & DJ", allocatedAmount: 31500 },
      { id: `bc-${starterEventId}-6`, eventId: starterEventId, userId, category: "Invitations & Gifts", allocatedAmount: 18000 },
      { id: `bc-${starterEventId}-7`, eventId: starterEventId, userId, category: "Miscellaneous Contingency", allocatedAmount: 18000 },
    ];

    // Expenses
    this.state.expenses[starterEventId] = [
      {
        id: `exp-${starterEventId}-1`,
        eventId: starterEventId,
        userId,
        title: "Palace Venue Booking Advance (50%)",
        category: "Venue & Hospitality",
        amount: 65000,
        date: "2026-10-15",
        paymentMethod: "Bank Transfer",
        description: "Official confirmation token for heritage lawn booking",
        createdAt: new Date().toISOString(),
      },
      {
        id: `exp-${starterEventId}-2`,
        eventId: starterEventId,
        userId,
        title: "Master Caterer Tasting & Contract Deposit",
        category: "Catering & Bar",
        amount: 40000,
        date: "2026-10-20",
        paymentMethod: "UPI / Online",
        description: "Token advance for 200 guest menu",
        createdAt: new Date().toISOString(),
      },
      {
        id: `exp-${starterEventId}-3`,
        eventId: starterEventId,
        userId,
        title: "Florist Material Deposit",
        category: "Decoration & Flowers",
        amount: 25000,
        date: "2026-10-25",
        paymentMethod: "Bank Transfer",
        description: "Advance for marigold & rose consignments",
        createdAt: new Date().toISOString(),
      },
      {
        id: `exp-${starterEventId}-4`,
        eventId: starterEventId,
        userId,
        title: "Cinematographer Retainer Fee",
        category: "Photography & Cinema",
        amount: 20000,
        date: "2026-10-28",
        paymentMethod: "Credit Card",
        description: "Drone crew & 4K lead camera booking lock",
        createdAt: new Date().toISOString(),
      },
    ];

    // Tasks
    this.state.tasks[starterEventId] = [
      {
        id: `tsk-${starterEventId}-1`,
        eventId: starterEventId,
        userId,
        title: "Finalize Palace Venue Booking & Sign Agreement",
        category: "Venue",
        priority: "Critical",
        dueDate: "2026-10-15",
        daysBeforeEvent: 44,
        isCompleted: true,
        notes: "Agreement received and signed with GM.",
        createdAt: new Date().toISOString(),
      },
      {
        id: `tsk-${starterEventId}-2`,
        eventId: starterEventId,
        userId,
        title: "Conduct Food Tasting & Lock 3-Day Menu",
        category: "Catering",
        priority: "High",
        dueDate: "2026-11-05",
        daysBeforeEvent: 23,
        isCompleted: false,
        notes: "Check vegetarian and gluten-free live counters.",
        createdAt: new Date().toISOString(),
      },
      {
        id: `tsk-${starterEventId}-3`,
        eventId: starterEventId,
        userId,
        title: "Approve 3D Stage & Mandap Floral Render",
        category: "Decor",
        priority: "High",
        dueDate: "2026-11-10",
        daysBeforeEvent: 18,
        isCompleted: false,
        notes: "Make sure pillars do not block front row guest views.",
        createdAt: new Date().toISOString(),
      },
    ];

    // Vendors
    this.state.vendors[starterEventId] = [
      {
        id: `ven-${starterEventId}-1`,
        eventId: starterEventId,
        userId,
        name: "Udaivilas Heritage Lawns",
        category: "Event venues",
        contact: "+91 294 243 4300",
        email: "events@udaivilashaveli.com",
        estimatedPrice: 125000,
        bookingStatus: "Booked",
        paymentStatus: "Advance Paid",
        notes: "Includes palace courtyard and 12 luxury bridal rooms.",
        createdAt: new Date().toISOString(),
      },
      {
        id: `ven-${starterEventId}-2`,
        eventId: starterEventId,
        userId,
        name: "Shahi Dawat Royal Caterers",
        category: "Caterers",
        contact: "+91 98290 11223",
        email: "contact@shahidawat.in",
        estimatedPrice: 130000,
        bookingStatus: "Booked",
        paymentStatus: "Advance Paid",
        notes: "Providing 10 live cooking stations and traditional servers in Turbans.",
        createdAt: new Date().toISOString(),
      },
    ];

    // Guests
    this.state.guests[starterEventId] = [
      {
        id: `gst-${starterEventId}-1`,
        eventId: starterEventId,
        userId,
        name: "Rajesh & Sunita Mehra",
        email: "rajesh.mehra@example.com",
        phone: "+91 98111 22334",
        rsvpStatus: "Confirmed",
        attendeesCount: 2,
        dietaryPreferences: "Vegetarian",
        specialRequirements: "Near front row seating for elderly grandmother",
        createdAt: new Date().toISOString(),
      },
      {
        id: `gst-${starterEventId}-2`,
        eventId: starterEventId,
        userId,
        name: "Vikram Singhania",
        email: "vikram.s@example.com",
        phone: "+91 98222 33445",
        rsvpStatus: "Confirmed",
        attendeesCount: 3,
        dietaryPreferences: "Jain Cuisine (No onion, no garlic)",
        specialRequirements: "Requires ground floor room accommodation",
        createdAt: new Date().toISOString(),
      },
    ];

    this.save();
  }

  getEventById(eventId: string, userId: string): EventItem | null {
    const evt = this.state.events[eventId];
    if (!evt || evt.userId !== userId) return null;
    return evt;
  }

  createEvent(event: EventItem): EventItem {
    this.state.events[event.id] = event;
    // Auto-create initial default budget categories if none exist
    if (!this.state.budgetCategories[event.id]) {
      const defaultCats = [
        { name: "Venue & Hospitality", pct: 0.28 },
        { name: "Catering & Food", pct: 0.3 },
        { name: "Decoration & Theme", pct: 0.16 },
        { name: "Photography & Video", pct: 0.1 },
        { name: "Entertainment & Music", pct: 0.08 },
        { name: "Invitations & Favors", pct: 0.04 },
        { name: "Miscellaneous", pct: 0.04 },
      ];
      this.state.budgetCategories[event.id] = defaultCats.map((c, i) => ({
        id: `bc-${event.id}-${i}`,
        eventId: event.id,
        userId: event.userId,
        category: c.name,
        allocatedAmount: Math.round(event.totalBudget * c.pct),
      }));
    }
    this.save();
    return event;
  }

  updateEvent(eventId: string, userId: string, updates: Partial<EventItem>): EventItem {
    const existing = this.getEventById(eventId, userId);
    if (!existing) throw new Error("Event not found or unauthorized");
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.state.events[eventId] = updated;
    this.save();
    return updated;
  }

  deleteEvent(eventId: string, userId: string): boolean {
    const existing = this.getEventById(eventId, userId);
    if (!existing) return false;
    delete this.state.events[eventId];
    delete this.state.plans[eventId];
    delete this.state.budgetCategories[eventId];
    delete this.state.expenses[eventId];
    delete this.state.tasks[eventId];
    delete this.state.vendors[eventId];
    delete this.state.guests[eventId];
    this.save();
    return true;
  }

  // --- Event Plans ---
  getEventPlan(eventId: string, userId: string): EventPlan | null {
    const plan = this.state.plans[eventId];
    if (!plan || plan.userId !== userId) return null;
    return plan;
  }

  saveEventPlan(plan: EventPlan): EventPlan {
    this.state.plans[plan.eventId] = plan;
    // Sync recommended budget distribution to budgetCategories if present
    if (plan.budgetDistribution && plan.budgetDistribution.length > 0) {
      this.state.budgetCategories[plan.eventId] = plan.budgetDistribution.map((bd, i) => ({
        id: `bc-plan-${plan.eventId}-${i}`,
        eventId: plan.eventId,
        userId: plan.userId,
        category: bd.category,
        allocatedAmount: bd.amount,
        notes: bd.notes,
      }));
    }
    this.save();
    return plan;
  }

  // --- Budget Categories ---
  getBudgetCategories(eventId: string, userId: string): BudgetCategoryItem[] {
    const categories = this.state.budgetCategories[eventId] || [];
    return categories.filter((c) => c.userId === userId);
  }

  setBudgetCategories(eventId: string, userId: string, categories: BudgetCategoryItem[]): BudgetCategoryItem[] {
    this.state.budgetCategories[eventId] = categories.map((c) => ({
      ...c,
      eventId,
      userId,
    }));
    this.save();
    return this.state.budgetCategories[eventId];
  }

  // --- Expenses ---
  getExpenses(eventId: string, userId: string): ExpenseItem[] {
    const expenses = this.state.expenses[eventId] || [];
    return expenses.filter((e) => e.userId === userId);
  }

  addExpense(expense: ExpenseItem): ExpenseItem {
    if (!this.state.expenses[expense.eventId]) {
      this.state.expenses[expense.eventId] = [];
    }
    this.state.expenses[expense.eventId].unshift(expense);
    this.save();
    return expense;
  }

  updateExpense(expenseId: string, userId: string, updates: Partial<ExpenseItem>): ExpenseItem {
    for (const eventId in this.state.expenses) {
      const list = this.state.expenses[eventId];
      const index = list.findIndex((e) => e.id === expenseId && e.userId === userId);
      if (index !== -1) {
        list[index] = { ...list[index], ...updates };
        this.save();
        return list[index];
      }
    }
    throw new Error("Expense not found or unauthorized");
  }

  deleteExpense(expenseId: string, userId: string): boolean {
    for (const eventId in this.state.expenses) {
      const list = this.state.expenses[eventId];
      const initialLen = list.length;
      this.state.expenses[eventId] = list.filter((e) => !(e.id === expenseId && e.userId === userId));
      if (this.state.expenses[eventId].length !== initialLen) {
        this.save();
        return true;
      }
    }
    return false;
  }

  // --- Tasks (Timeline) ---
  getTasks(eventId: string, userId: string): TaskItem[] {
    const tasks = this.state.tasks[eventId] || [];
    return tasks
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  addTask(task: TaskItem): TaskItem {
    if (!this.state.tasks[task.eventId]) {
      this.state.tasks[task.eventId] = [];
    }
    this.state.tasks[task.eventId].push(task);
    this.save();
    return task;
  }

  updateTask(taskId: string, userId: string, updates: Partial<TaskItem>): TaskItem {
    for (const eventId in this.state.tasks) {
      const list = this.state.tasks[eventId];
      const index = list.findIndex((t) => t.id === taskId && t.userId === userId);
      if (index !== -1) {
        list[index] = { ...list[index], ...updates };
        this.save();
        return list[index];
      }
    }
    throw new Error("Task not found or unauthorized");
  }

  deleteTask(taskId: string, userId: string): boolean {
    for (const eventId in this.state.tasks) {
      const list = this.state.tasks[eventId];
      const initialLen = list.length;
      this.state.tasks[eventId] = list.filter((t) => !(t.id === taskId && t.userId === userId));
      if (this.state.tasks[eventId].length !== initialLen) {
        this.save();
        return true;
      }
    }
    return false;
  }

  // --- Vendors ---
  getVendors(eventId: string, userId: string): VendorItem[] {
    const list = this.state.vendors[eventId] || [];
    return list.filter((v) => v.userId === userId);
  }

  addVendor(vendor: VendorItem): VendorItem {
    if (!this.state.vendors[vendor.eventId]) {
      this.state.vendors[vendor.eventId] = [];
    }
    this.state.vendors[vendor.eventId].push(vendor);
    this.save();
    return vendor;
  }

  updateVendor(vendorId: string, userId: string, updates: Partial<VendorItem>): VendorItem {
    for (const eventId in this.state.vendors) {
      const list = this.state.vendors[eventId];
      const index = list.findIndex((v) => v.id === vendorId && v.userId === userId);
      if (index !== -1) {
        list[index] = { ...list[index], ...updates };
        this.save();
        return list[index];
      }
    }
    throw new Error("Vendor not found or unauthorized");
  }

  deleteVendor(vendorId: string, userId: string): boolean {
    for (const eventId in this.state.vendors) {
      const list = this.state.vendors[eventId];
      const initialLen = list.length;
      this.state.vendors[eventId] = list.filter((v) => !(v.id === vendorId && v.userId === userId));
      if (this.state.vendors[eventId].length !== initialLen) {
        this.save();
        return true;
      }
    }
    return false;
  }

  // --- Guests ---
  getGuests(eventId: string, userId: string): GuestItem[] {
    const list = this.state.guests[eventId] || [];
    return list.filter((g) => g.userId === userId);
  }

  addGuest(guest: GuestItem): GuestItem {
    if (!this.state.guests[guest.eventId]) {
      this.state.guests[guest.eventId] = [];
    }
    this.state.guests[guest.eventId].push(guest);
    this.save();
    return guest;
  }

  updateGuest(guestId: string, userId: string, updates: Partial<GuestItem>): GuestItem {
    for (const eventId in this.state.guests) {
      const list = this.state.guests[eventId];
      const index = list.findIndex((g) => g.id === guestId && g.userId === userId);
      if (index !== -1) {
        list[index] = { ...list[index], ...updates };
        this.save();
        return list[index];
      }
    }
    throw new Error("Guest not found or unauthorized");
  }

  deleteGuest(guestId: string, userId: string): boolean {
    for (const eventId in this.state.guests) {
      const list = this.state.guests[eventId];
      const initialLen = list.length;
      this.state.guests[eventId] = list.filter((g) => !(g.id === guestId && g.userId === userId));
      if (this.state.guests[eventId].length !== initialLen) {
        this.save();
        return true;
      }
    }
    return false;
  }

  // --- Notifications ---
  getNotifications(userId: string): NotificationItem[] {
    return (this.state.notifications[userId] || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  markNotificationsRead(userId: string): void {
    if (this.state.notifications[userId]) {
      this.state.notifications[userId].forEach((n) => (n.read = true));
      this.save();
    }
  }

  addNotification(userId: string, notif: Omit<NotificationItem, "id" | "createdAt">): NotificationItem {
    if (!this.state.notifications[userId]) {
      this.state.notifications[userId] = [];
    }
    const created: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.state.notifications[userId].unshift(created);
    this.save();
    return created;
  }

  // --- Chat ---
  getChatHistory(userId: string): ChatMessage[] {
    return this.state.chats[userId] || [];
  }

  addChatMessage(userId: string, message: ChatMessage): ChatMessage {
    if (!this.state.chats[userId]) {
      this.state.chats[userId] = [];
    }
    this.state.chats[userId].push(message);
    // Keep max 50 messages
    if (this.state.chats[userId].length > 50) {
      this.state.chats[userId] = this.state.chats[userId].slice(-50);
    }
    this.save();
    return message;
  }
}

export const db = new DatabaseStore();
