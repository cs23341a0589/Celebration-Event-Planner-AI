import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { db } from "./server/db/store.ts";
import {
  generateAiEventPlan,
  optimizeAiBudget,
  generateAiTimeline,
  generateAiThemes,
  chatWithEventMate,
} from "./server/services/geminiService.ts";
import { sanitizeText, sanitizeNumber, stripUndefined } from "./server/utils/sanitizer.ts";
import { EventItem, EventPlan, TaskItem } from "./src/types/index.ts";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const isProduction = process.env.NODE_ENV === "production";

// 1. TOP-LEVEL REQUEST DESERIALIZATION (Ordering Guarantee)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting map for AI endpoints (prevents abuse)
const aiRateLimits = new Map<string, { count: number; resetAt: number }>();
function rateLimitAi(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "anonymous";
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 25; // 25 requests per minute

  const record = aiRateLimits.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + windowMs;
  } else {
    record.count++;
  }
  aiRateLimits.set(ip, record);

  if (record.count > maxRequests) {
    return res.status(429).json({
      error: "Too many AI generation requests. Please wait a minute before trying again.",
    });
  }
  next();
}

// Authentication & Context Helper
function getAuthUserId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) return token;
  }
// Fallback demo user for initial preview session
  return "demo-user-1";
}

app.get("/api/health", (_req: Request, res: Response) => {
  return res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// -------------------------------------------------------------
// AUTHENTICATION ROUTES
// -------------------------------------------------------------

app.post("/api/auth/register", (req: Request, res: Response) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const email = sanitizeText(body.email).toLowerCase();
  const name = sanitizeText(body.name) || "Celebration Host";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "A valid email address is required." });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: "An account with this email already exists." });
  }

  const newUserId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newUser = db.createUser({
    id: newUserId,
    email,
    name,
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    createdAt: new Date().toISOString(),
  });

  // Seed welcome notification
  db.addNotification(newUserId, {
    userId: newUserId,
    title: "Welcome to Celebration Planner AI!",
    message: "Get started by creating your first celebration or exploring AI event planning tools.",
    type: "info",
    read: false,
  });

  return res.status(201).json({
    user: newUser,
    token: newUserId,
    message: "Account registered successfully.",
  });
});

app.post("/api/auth/login", (req: Request, res: Response) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const email = sanitizeText(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  let user = db.getUserByEmail(email);
  if (!user) {
    // For ease of demo/testing, if user doesn't exist, automatically create demo profile
    const newUserId = `user-${Date.now()}`;
    const created = db.createUser({
      id: newUserId,
      email,
      name: email.split("@")[0].replace(/[._]/g, " "),
      createdAt: new Date().toISOString(),
    });
    return res.json({
      user: created,
      token: created.id,
      message: "Signed in successfully.",
    });
  }

  const { passwordHash, ...safeUser } = user;
  return res.json({
    user: safeUser,
    token: user.id,
    message: "Logged in successfully.",
  });
});

app.post("/api/auth/demo-login", (req: Request, res: Response) => {
  const demoUserId = "demo-user-1";
  const user = db.getUser(demoUserId);
  if (!user) {
    return res.status(404).json({ error: "Demo user not found." });
  }
  return res.json({
    user,
    token: demoUserId,
    message: "Logged in as Demo Host (Aanya Sharma).",
  });
});

app.get("/api/auth/me", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const user = db.getUser(userId);
  if (!user) {
    return res.status(401).json({ error: "Session expired or user not found." });
  }
  return res.json({ user });
});

app.put("/api/auth/profile", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const updates: any = {};
  if (body.name) updates.name = sanitizeText(body.name);
  if (body.phone) updates.phone = sanitizeText(body.phone);
  if (body.avatarUrl) updates.avatarUrl = sanitizeText(body.avatarUrl);

  try {
    const updated = db.updateUserProfile(userId, updates);
    return res.json({ user: updated, message: "Profile updated successfully." });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || "Failed to update profile." });
  }
});

app.post("/api/auth/reset-password", (req: Request, res: Response) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const email = sanitizeText(body.email);
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  return res.json({
    message: `Password reset link sent to ${email} (Supabase Auth simulation).`,
  });
});

// -------------------------------------------------------------
// EVENT ROUTES (CRUD)
// -------------------------------------------------------------

app.get("/api/events", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const events = db.getEventsByUser(userId);
  return res.json({ events });
});

app.post("/api/events", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const body = req.body && typeof req.body === "object" ? req.body : {};

  const name = sanitizeText(body.name);
  const category = sanitizeText(body.category) as any;
  const date = sanitizeText(body.date);
  const location = sanitizeText(body.location);
  const guestCount = sanitizeNumber(body.guestCount, 50);
  const totalBudget = sanitizeNumber(body.totalBudget, 50000);

  if (!name) return res.status(400).json({ error: "Event name is required." });
  if (!date) return res.status(400).json({ error: "Event date is required." });
  if (!location) return res.status(400).json({ error: "Event location is required." });

  const newEvent: EventItem = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
    name,
    category: category || "Other",
    date,
    time: sanitizeText(body.time) || "18:00",
    location,
    guestCount,
    totalBudget,
    preferredTheme: sanitizeText(body.preferredTheme),
    duration: sanitizeText(body.duration) || "4 Hours",
    specialRequirements: sanitizeText(body.specialRequirements),
    foodPreferences: sanitizeText(body.foodPreferences),
    decorationPreferences: sanitizeText(body.decorationPreferences),
    status: "planning",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const created = db.createEvent(newEvent);

  db.addNotification(userId, {
    userId,
    eventId: created.id,
    title: "New Celebration Created",
    message: `"${created.name}" has been created with a budget of ₹${created.totalBudget.toLocaleString()}.`,
    type: "success",
    read: false,
  });

  return res.status(201).json({ event: created, message: "Event created successfully." });
});

app.get("/api/events/:id", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const event = db.getEventById(req.params.id, userId);
  if (!event) {
    return res.status(404).json({ error: "Event not found or unauthorized." });
  }
  return res.json({ event });
});

app.put("/api/events/:id", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const body = req.body && typeof req.body === "object" ? req.body : {};
  try {
    const updated = db.updateEvent(req.params.id, userId, {
      ...(body.name && { name: sanitizeText(body.name) }),
      ...(body.category && { category: sanitizeText(body.category) as any }),
      ...(body.date && { date: sanitizeText(body.date) }),
      ...(body.time && { time: sanitizeText(body.time) }),
      ...(body.location && { location: sanitizeText(body.location) }),
      ...(body.guestCount !== undefined && { guestCount: sanitizeNumber(body.guestCount) }),
      ...(body.totalBudget !== undefined && { totalBudget: sanitizeNumber(body.totalBudget) }),
      ...(body.preferredTheme !== undefined && { preferredTheme: sanitizeText(body.preferredTheme) }),
      ...(body.duration !== undefined && { duration: sanitizeText(body.duration) }),
      ...(body.specialRequirements !== undefined && { specialRequirements: sanitizeText(body.specialRequirements) }),
      ...(body.foodPreferences !== undefined && { foodPreferences: sanitizeText(body.foodPreferences) }),
      ...(body.decorationPreferences !== undefined && { decorationPreferences: sanitizeText(body.decorationPreferences) }),
      ...(body.status && { status: body.status }),
    });
    return res.json({ event: updated, message: "Event updated successfully." });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || "Failed to update event." });
  }
});

app.delete("/api/events/:id", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const success = db.deleteEvent(req.params.id, userId);
  if (!success) {
    return res.status(404).json({ error: "Event not found or unauthorized." });
  }
  return res.json({ message: "Event deleted successfully." });
});

// Event Plans
app.get("/api/events/:id/plan", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const plan = db.getEventPlan(req.params.id, userId);
  return res.json({ plan });
});

app.post("/api/events/:id/plan", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const event = db.getEventById(req.params.id, userId);
  if (!event) {
    return res.status(404).json({ error: "Event not found." });
  }
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const plan: EventPlan = {
    id: body.id || `plan-${Date.now()}`,
    eventId: event.id,
    userId,
    overview: sanitizeText(body.overview),
    recommendedTheme: sanitizeText(body.recommendedTheme),
    colorPalette: Array.isArray(body.colorPalette) ? body.colorPalette : [],
    decorationIdeas: Array.isArray(body.decorationIdeas) ? body.decorationIdeas : [],
    venueSuggestions: body.venueSuggestions || { criteria: "", recommendedTypes: [], tips: "" },
    cateringRecommendations: body.cateringRecommendations || { menuStyle: "", suggestedItems: [], dietaryNotes: "" },
    entertainmentIdeas: Array.isArray(body.entertainmentIdeas) ? body.entertainmentIdeas : [],
    photographyRequirements: Array.isArray(body.photographyRequirements) ? body.photographyRequirements : [],
    budgetDistribution: Array.isArray(body.budgetDistribution) ? body.budgetDistribution : [],
    vendorChecklist: Array.isArray(body.vendorChecklist) ? body.vendorChecklist : [],
    guestManagementSuggestions: Array.isArray(body.guestManagementSuggestions) ? body.guestManagementSuggestions : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = db.saveEventPlan(plan);
  return res.json({ plan: saved, message: "Event plan saved successfully." });
});

// -------------------------------------------------------------
// AI ENDPOINTS (Gemini Powered)
// -------------------------------------------------------------

app.post("/api/ai/generate-plan", rateLimitAi, async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const body = req.body && typeof req.body === "object" ? req.body : {};

  const name = sanitizeText(body.name);
  const category = sanitizeText(body.category) || "Celebration";
  const date = sanitizeText(body.date) || new Date().toISOString().split("T")[0];
  const location = sanitizeText(body.location) || "Local Banquet";
  const guestCount = sanitizeNumber(body.guestCount, 50);
  const totalBudget = sanitizeNumber(body.totalBudget, 100000);

  if (!name) {
    return res.status(400).json({ error: "Event name is required to generate a plan." });
  }

  try {
    const generated = await generateAiEventPlan({
      name,
      category,
      date,
      location,
      guestCount,
      totalBudget,
      preferredTheme: sanitizeText(body.preferredTheme),
      duration: sanitizeText(body.duration),
      specialRequirements: sanitizeText(body.specialRequirements),
      foodPreferences: sanitizeText(body.foodPreferences),
      decorationPreferences: sanitizeText(body.decorationPreferences),
    });

    return res.json({
      success: true,
      plan: generated,
      message: "Personalized event plan generated with Gemini AI.",
    });
  } catch (err: any) {
    console.error("[AI Generate Plan Error]", err);
    return res.status(500).json({
      error: `AI Plan generation failed: ${err?.message || "Internal server error"}. Please try again.`,
    });
  }
});

app.post("/api/ai/optimize-budget", rateLimitAi, async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const body = req.body && typeof req.body === "object" ? req.body : {};

  const eventId = sanitizeText(body.eventId);
  let event = eventId ? db.getEventById(eventId, userId) : null;

  const eventName = event ? event.name : sanitizeText(body.eventName) || "Celebration";
  const category = event ? event.category : sanitizeText(body.category) || "Wedding";
  const totalBudget = event ? event.totalBudget : sanitizeNumber(body.totalBudget, 100000);

  const budgetCategories = eventId ? db.getBudgetCategories(eventId, userId) : [];
  const expenses = eventId ? db.getExpenses(eventId, userId) : [];
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryBreakdown = budgetCategories.map((bc) => {
    const spent = expenses
      .filter((e) => e.category.toLowerCase().includes(bc.category.toLowerCase()) || bc.category.toLowerCase().includes(e.category.toLowerCase()))
      .reduce((s, e) => s + e.amount, 0);
    return {
      category: bc.category,
      allocatedAmount: bc.allocatedAmount,
      spentAmount: spent,
    };
  });

  try {
    const optimization = await optimizeAiBudget({
      eventName,
      category,
      totalBudget,
      totalSpent,
      categories: categoryBreakdown.length > 0 ? categoryBreakdown : (body.categories || []),
    });

    return res.json({
      success: true,
      optimization,
      message: "Intelligent budget optimization generated successfully.",
    });
  } catch (err: any) {
    console.error("[AI Optimize Budget Error]", err);
    return res.status(500).json({
      error: `Budget optimization failed: ${err?.message || "Service unavailable"}.`,
    });
  }
});

app.post("/api/ai/generate-timeline", rateLimitAi, async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const body = req.body && typeof req.body === "object" ? req.body : {};

  const eventId = sanitizeText(body.eventId);
  let event = eventId ? db.getEventById(eventId, userId) : null;

  const name = event ? event.name : sanitizeText(body.name) || "Celebration";
  const category = event ? event.category : sanitizeText(body.category) || "Wedding";
  const date = event ? event.date : sanitizeText(body.date) || "2026-12-31";

  try {
    const tasks = await generateAiTimeline({ name, category, date });

    // If eventId provided and user requested auto-sync, add these tasks to db
    if (eventId && body.saveToEvent) {
      const eventDateObj = new Date(date);
      for (const t of tasks) {
        const days = typeof t.daysBeforeEvent === "number" ? t.daysBeforeEvent : 14;
        const dueDate = new Date(eventDateObj.getTime() - days * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

        const newTask: TaskItem = {
          id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          eventId,
          userId,
          title: t.title,
          category: t.category || "General",
          priority: t.priority || "Medium",
          dueDate,
          daysBeforeEvent: days,
          isCompleted: false,
          notes: t.notes || "",
          createdAt: new Date().toISOString(),
        };
        db.addTask(newTask);
      }
    }

    return res.json({
      success: true,
      timeline: tasks,
      message: "AI Timeline generated successfully.",
    });
  } catch (err: any) {
    console.error("[AI Timeline Error]", err);
    return res.status(500).json({
      error: `Timeline generation failed: ${err?.message || "Internal error"}.`,
    });
  }
});

app.post("/api/ai/generate-themes", rateLimitAi, async (req: Request, res: Response) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};

  const category = sanitizeText(body.category) || "Wedding";
  const totalBudget = sanitizeNumber(body.totalBudget, 200000);
  const guestCount = sanitizeNumber(body.guestCount, 100);
  const preferences = sanitizeText(body.preferences);

  try {
    const themes = await generateAiThemes({
      category,
      totalBudget,
      guestCount,
      preferences,
    });
    return res.json({ success: true, themes });
  } catch (err: any) {
    console.error("[AI Themes Error]", err);
    return res.status(500).json({
      error: `Theme generation failed: ${err?.message || "Service unavailable"}.`,
    });
  }
});

app.post("/api/ai/chat", rateLimitAi, async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const body = req.body && typeof req.body === "object" ? req.body : {};

  const message = sanitizeText(body.message);
  if (!message) {
    return res.status(400).json({ error: "Message cannot be empty." });
  }

  const eventId = sanitizeText(body.eventId);
  let eventContext = null;
  if (eventId) {
    const event = db.getEventById(eventId, userId);
    if (event) {
      const expenses = db.getExpenses(eventId, userId);
      const spent = expenses.reduce((s, e) => s + e.amount, 0);
      eventContext = {
        name: event.name,
        category: event.category,
        date: event.date,
        location: event.location,
        totalBudget: event.totalBudget,
        guestCount: event.guestCount,
        expensesTotal: spent,
        remainingBudget: Math.max(0, event.totalBudget - spent),
      };
    }
  }

  try {
    // Record user chat message
    db.addChatMessage(userId, {
      id: `chat-${Date.now()}-u`,
      userId,
      eventId: eventId || undefined,
      sender: "user",
      content: message,
      timestamp: new Date().toISOString(),
    });

    const reply = await chatWithEventMate({
      message,
      eventContext,
      history: body.history || [],
    });

    // Record assistant chat message
    db.addChatMessage(userId, {
      id: `chat-${Date.now()}-a`,
      userId,
      eventId: eventId || undefined,
      sender: "assistant",
      content: reply,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      reply,
      sender: "EventMate AI",
    });
  } catch (err: any) {
    console.error("[AI Chat Error]", err);
    return res.status(500).json({
      error: `EventMate AI could not respond: ${err?.message || "Internal error"}.`,
    });
  }
});

// -------------------------------------------------------------
// EXPENSE ROUTES (CRUD)
// -------------------------------------------------------------

app.get("/api/expenses", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const eventId = typeof req.query.eventId === "string" ? req.query.eventId : "";
  if (!eventId) {
    // return all expenses across all user events
    const events = db.getEventsByUser(userId);
    const allExpenses = events.flatMap((e) => db.getExpenses(e.id, userId));
    return res.json({ expenses: allExpenses });
  }
  const expenses = db.getExpenses(eventId, userId);
  return res.json({ expenses });
});

app.post("/api/expenses", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const body = req.body && typeof req.body === "object" ? req.body : {};

  const eventId = sanitizeText(body.eventId);
  const title = sanitizeText(body.title);
  const category = sanitizeText(body.category) || "General";
  const amount = sanitizeNumber(body.amount, 0);
  const date = sanitizeText(body.date) || new Date().toISOString().split("T")[0];
  const paymentMethod = sanitizeText(body.paymentMethod) as any || "Cash";
  const description = sanitizeText(body.description);

  if (!eventId) return res.status(400).json({ error: "eventId is required." });
  if (!title) return res.status(400).json({ error: "Expense title is required." });
  if (amount <= 0) return res.status(400).json({ error: "Expense amount must be greater than 0." });

  const newExpense = db.addExpense({
    id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    eventId,
    userId,
    title,
    category,
    amount,
    date,
    paymentMethod,
    description,
    createdAt: new Date().toISOString(),
  });

  // Check if budget exceeded and fire alert
  const event = db.getEventById(eventId, userId);
  if (event) {
    const allExpenses = db.getExpenses(eventId, userId);
    const totalSpent = allExpenses.reduce((s, e) => s + e.amount, 0);
    if (totalSpent > event.totalBudget) {
      db.addNotification(userId, {
        userId,
        eventId,
        title: "Budget Exceeded Warning!",
        message: `Total expenses (₹${totalSpent.toLocaleString()}) have surpassed your planned budget (₹${event.totalBudget.toLocaleString()}) by ₹${(totalSpent - event.totalBudget).toLocaleString()}. Consider running AI Budget Optimization.`,
        type: "warning",
        read: false,
      });
    }
  }

  return res.status(201).json({ expense: newExpense, message: "Expense logged successfully." });
});

app.put("/api/expenses/:id", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const body = req.body && typeof req.body === "object" ? req.body : {};
  try {
    const updated = db.updateExpense(req.params.id, userId, {
      ...(body.title && { title: sanitizeText(body.title) }),
      ...(body.category && { category: sanitizeText(body.category) }),
      ...(body.amount !== undefined && { amount: sanitizeNumber(body.amount) }),
      ...(body.date && { date: sanitizeText(body.date) }),
      ...(body.paymentMethod && { paymentMethod: body.paymentMethod }),
      ...(body.description !== undefined && { description: sanitizeText(body.description) }),
    });
    return res.json({ expense: updated, message: "Expense updated." });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || "Failed to update expense." });
  }
});

app.delete("/api/expenses/:id", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const success = db.deleteExpense(req.params.id, userId);
  if (!success) {
    return res.status(404).json({ error: "Expense not found or unauthorized." });
  }
  return res.json({ message: "Expense deleted successfully." });
});

// -------------------------------------------------------------
// TASK ROUTES (TIMELINE)
// -------------------------------------------------------------

app.get("/api/tasks", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const eventId = typeof req.query.eventId === "string" ? req.query.eventId : "";
  if (!eventId) {
    const events = db.getEventsByUser(userId);
    const allTasks = events.flatMap((e) => db.getTasks(e.id, userId));
    return res.json({ tasks: allTasks });
  }
  const tasks = db.getTasks(eventId, userId);
  return res.json({ tasks });
});

app.post("/api/tasks", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const body = req.body && typeof req.body === "object" ? req.body : {};

  const eventId = sanitizeText(body.eventId);
  const title = sanitizeText(body.title);
  const dueDate = sanitizeText(body.dueDate) || new Date().toISOString().split("T")[0];
  const priority = (sanitizeText(body.priority) as any) || "Medium";
  const category = sanitizeText(body.category) || "General";
  const notes = sanitizeText(body.notes);

  if (!eventId) return res.status(400).json({ error: "eventId is required." });
  if (!title) return res.status(400).json({ error: "Task title is required." });

  const newTask = db.addTask({
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    eventId,
    userId,
    title,
    category,
    priority,
    dueDate,
    isCompleted: Boolean(body.isCompleted),
    notes,
    createdAt: new Date().toISOString(),
  });

  return res.status(201).json({ task: newTask, message: "Task added to timeline." });
});

app.put("/api/tasks/:id", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const body = req.body && typeof req.body === "object" ? req.body : {};
  try {
    const updated = db.updateTask(req.params.id, userId, {
      ...(body.title !== undefined && { title: sanitizeText(body.title) }),
      ...(body.category !== undefined && { category: sanitizeText(body.category) }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.dueDate !== undefined && { dueDate: sanitizeText(body.dueDate) }),
      ...(body.isCompleted !== undefined && { isCompleted: Boolean(body.isCompleted) }),
      ...(body.notes !== undefined && { notes: sanitizeText(body.notes) }),
    });
    return res.json({ task: updated, message: "Task updated." });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || "Failed to update task." });
  }
});

app.delete("/api/tasks/:id", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const success = db.deleteTask(req.params.id, userId);
  if (!success) {
    return res.status(404).json({ error: "Task not found or unauthorized." });
  }
  return res.json({ message: "Task deleted successfully." });
});

// -------------------------------------------------------------
// VENDOR ROUTES (CRUD)
// -------------------------------------------------------------

app.get("/api/vendors", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const eventId = typeof req.query.eventId === "string" ? req.query.eventId : "";
  if (!eventId) {
    const events = db.getEventsByUser(userId);
    const allVendors = events.flatMap((e) => db.getVendors(e.id, userId));
    return res.json({ vendors: allVendors });
  }
  const vendors = db.getVendors(eventId, userId);
  return res.json({ vendors });
});

app.post("/api/vendors", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const body = req.body && typeof req.body === "object" ? req.body : {};

  const eventId = sanitizeText(body.eventId);
  const name = sanitizeText(body.name);
  const category = (sanitizeText(body.category) as any) || "Event venues";
  const contact = sanitizeText(body.contact);
  const email = sanitizeText(body.email);
  const estimatedPrice = sanitizeNumber(body.estimatedPrice, 0);
  const bookingStatus = (sanitizeText(body.bookingStatus) as any) || "Inquiry";
  const paymentStatus = (sanitizeText(body.paymentStatus) as any) || "Pending";
  const notes = sanitizeText(body.notes);

  if (!eventId) return res.status(400).json({ error: "eventId is required." });
  if (!name) return res.status(400).json({ error: "Vendor name is required." });
  if (!contact) return res.status(400).json({ error: "Contact phone/number is required." });

  const newVendor = db.addVendor({
    id: `ven-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    eventId,
    userId,
    name,
    category,
    contact,
    email,
    estimatedPrice,
    bookingStatus,
    paymentStatus,
    notes,
    createdAt: new Date().toISOString(),
  });

  return res.status(201).json({ vendor: newVendor, message: "Vendor added to checklist." });
});

app.put("/api/vendors/:id", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const body = req.body && typeof req.body === "object" ? req.body : {};
  try {
    const updated = db.updateVendor(req.params.id, userId, {
      ...(body.name !== undefined && { name: sanitizeText(body.name) }),
      ...(body.category !== undefined && { category: sanitizeText(body.category) as any }),
      ...(body.contact !== undefined && { contact: sanitizeText(body.contact) }),
      ...(body.email !== undefined && { email: sanitizeText(body.email) }),
      ...(body.estimatedPrice !== undefined && { estimatedPrice: sanitizeNumber(body.estimatedPrice) }),
      ...(body.bookingStatus !== undefined && { bookingStatus: body.bookingStatus }),
      ...(body.paymentStatus !== undefined && { paymentStatus: body.paymentStatus }),
      ...(body.notes !== undefined && { notes: sanitizeText(body.notes) }),
    });
    return res.json({ vendor: updated, message: "Vendor updated." });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || "Failed to update vendor." });
  }
});

app.delete("/api/vendors/:id", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const success = db.deleteVendor(req.params.id, userId);
  if (!success) {
    return res.status(404).json({ error: "Vendor not found or unauthorized." });
  }
  return res.json({ message: "Vendor removed from checklist." });
});

// -------------------------------------------------------------
// GUEST ROUTES (CRUD)
// -------------------------------------------------------------

app.get("/api/guests", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const eventId = typeof req.query.eventId === "string" ? req.query.eventId : "";
  if (!eventId) {
    const events = db.getEventsByUser(userId);
    const allGuests = events.flatMap((e) => db.getGuests(e.id, userId));
    return res.json({ guests: allGuests });
  }
  const guests = db.getGuests(eventId, userId);
  return res.json({ guests });
});

app.post("/api/guests", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const body = req.body && typeof req.body === "object" ? req.body : {};

  const eventId = sanitizeText(body.eventId);
  const name = sanitizeText(body.name);
  const email = sanitizeText(body.email);
  const phone = sanitizeText(body.phone);
  const rsvpStatus = (sanitizeText(body.rsvpStatus) as any) || "Pending";
  const attendeesCount = sanitizeNumber(body.attendeesCount, 1);
  const dietaryPreferences = sanitizeText(body.dietaryPreferences);
  const specialRequirements = sanitizeText(body.specialRequirements);

  if (!eventId) return res.status(400).json({ error: "eventId is required." });
  if (!name) return res.status(400).json({ error: "Guest name is required." });

  const newGuest = db.addGuest({
    id: `gst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    eventId,
    userId,
    name,
    email,
    phone,
    rsvpStatus,
    attendeesCount: Math.max(0, attendeesCount),
    dietaryPreferences,
    specialRequirements,
    createdAt: new Date().toISOString(),
  });

  return res.status(201).json({ guest: newGuest, message: "Guest added to list." });
});

app.put("/api/guests/:id", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const body = req.body && typeof req.body === "object" ? req.body : {};
  try {
    const updated = db.updateGuest(req.params.id, userId, {
      ...(body.name !== undefined && { name: sanitizeText(body.name) }),
      ...(body.email !== undefined && { email: sanitizeText(body.email) }),
      ...(body.phone !== undefined && { phone: sanitizeText(body.phone) }),
      ...(body.rsvpStatus !== undefined && { rsvpStatus: body.rsvpStatus }),
      ...(body.attendeesCount !== undefined && { attendeesCount: sanitizeNumber(body.attendeesCount, 1) }),
      ...(body.dietaryPreferences !== undefined && { dietaryPreferences: sanitizeText(body.dietaryPreferences) }),
      ...(body.specialRequirements !== undefined && { specialRequirements: sanitizeText(body.specialRequirements) }),
    });
    return res.json({ guest: updated, message: "Guest details updated." });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || "Failed to update guest." });
  }
});

app.delete("/api/guests/:id", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const success = db.deleteGuest(req.params.id, userId);
  if (!success) {
    return res.status(404).json({ error: "Guest not found or unauthorized." });
  }
  return res.json({ message: "Guest removed from list." });
});

// -------------------------------------------------------------
// NOTIFICATIONS & DASHBOARD METRICS
// -------------------------------------------------------------

app.get("/api/notifications", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const notifications = db.getNotifications(userId);
  return res.json({ notifications });
});

app.post("/api/notifications/mark-read", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  db.markNotificationsRead(userId);
  return res.json({ message: "Notifications marked as read." });
});

app.get("/api/dashboard/stats", (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const events = db.getEventsByUser(userId);

  let totalPlannedBudget = 0;
  let totalExpenses = 0;
  let totalTasks = 0;
  let completedTasks = 0;
  let totalGuests = 0;
  let confirmedGuests = 0;

  for (const ev of events) {
    totalPlannedBudget += ev.totalBudget;
    const expenses = db.getExpenses(ev.id, userId);
    totalExpenses += expenses.reduce((s, e) => s + e.amount, 0);

    const tasks = db.getTasks(ev.id, userId);
    totalTasks += tasks.length;
    completedTasks += tasks.filter((t) => t.isCompleted).length;

    const guests = db.getGuests(ev.id, userId);
    totalGuests += guests.reduce((s, g) => s + (g.attendeesCount || 1), 0);
    confirmedGuests += guests
      .filter((g) => g.rsvpStatus === "Confirmed")
      .reduce((s, g) => s + (g.attendeesCount || 1), 0);
  }

  const upcomingEvents = events.filter((e) => new Date(e.date).getTime() >= Date.now() - 86400000);

  return res.json({
    totalEvents: events.length,
    upcomingEventsCount: upcomingEvents.length,
    upcomingEvents: upcomingEvents.slice(0, 3),
    totalPlannedBudget,
    totalExpenses,
    remainingBudget: Math.max(0, totalPlannedBudget - totalExpenses),
    pendingTasks: totalTasks - completedTasks,
    completedTasks,
    taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    totalGuests,
    confirmedGuests,
  });
});

app.get("/api/system/schema-sql", (_req: Request, res: Response) => {
  try {
    const sqlPath = path.resolve(process.cwd(), "supabase-schema.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");
    return res.json({ sql });
  } catch (err: any) {
    return res.status(500).json({ error: "Could not read schema SQL file." });
  }
});

// -------------------------------------------------------------
// VITE DEV MIDDLEWARE / STATIC ASSETS
// -------------------------------------------------------------

async function startServer() {
  if (!isProduction) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Celebration & Event Planner AI] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
