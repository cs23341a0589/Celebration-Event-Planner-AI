import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const BASE_FALLBACK_MODELS = [
  "gemini-3.1-flash-lite", // Ultra-low latency (<1s)
  "gemini-flash-latest",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
] as const;

let knownWorkingModel: string | null = null;
const permanentlyFailedModels = new Set<string>();

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[Gemini API] WARNING: GEMINI_API_KEY is not defined in environment.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  // Strip code fences if present
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  cleaned = cleaned.trim();

  // If there's surrounding conversational text, slice to outermost { ... } or [ ... ]
  const firstCurly = cleaned.indexOf("{");
  const lastCurly = cleaned.lastIndexOf("}");
  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");

  if (firstCurly !== -1 && lastCurly > firstCurly && (firstBracket === -1 || firstCurly < firstBracket)) {
    return cleaned.slice(firstCurly, lastCurly + 1);
  }
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    return cleaned.slice(firstBracket, lastBracket + 1);
  }

  return cleaned;
}

/**
 * High-Speed Resilient Gemini Helper with Fast Model Priority & Fallback Ladder
 */
export async function generateContentWithFallback(
  prompt: string,
  options?: {
    systemInstruction?: string;
    responseMimeType?: string;
    responseSchema?: any;
    thinkingLevel?: ThinkingLevel;
  }
): Promise<string> {
  const ai = getGeminiClient();
  let lastError: any = null;

  // Prioritize the known working model to eliminate initial fallback latency
  const modelsToTry: string[] = [];
  if (knownWorkingModel && !permanentlyFailedModels.has(knownWorkingModel)) {
    modelsToTry.push(knownWorkingModel);
  }
  for (const m of BASE_FALLBACK_MODELS) {
    if (!modelsToTry.includes(m) && !permanentlyFailedModels.has(m)) {
      modelsToTry.push(m);
    }
  }

  for (const model of modelsToTry) {
    try {
      const config: any = {};
      if (options?.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
      }
      if (options?.responseMimeType) {
        config.responseMimeType = options.responseMimeType;
      }
      if (options?.responseSchema) {
        config.responseSchema = options.responseSchema;
      }
      // Use ThinkingLevel.LOW to minimize reasoning latency and return fast responses
      if (model.includes("3.") || model.includes("flash")) {
        config.thinkingConfig = {
          thinkingLevel: options?.thinkingLevel || ThinkingLevel.LOW,
        };
      }

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      const text = response.text;
      if (text) {
        knownWorkingModel = model; // Cache this fast working model
        return text;
      }
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.statusCode || (err?.message?.includes("503") ? 503 : null);
      const isRecoverable =
        status === 503 ||
        status === 429 ||
        status === 404 ||
        status === 500 ||
        err?.message?.includes("RESOURCE_EXHAUSTED") ||
        err?.message?.includes("not found") ||
        err?.message?.includes("UNAVAILABLE");

      if (status === 404 || err?.message?.includes("not found")) {
        permanentlyFailedModels.add(model);
      }

      console.warn(
        `[Gemini Fallback] Model '${model}' failed with: ${err?.message || err}. Recoverable: ${isRecoverable}`
      );

      if (!isRecoverable && status === 400 && !err?.message?.includes("model")) {
        break;
      }
    }
  }

  throw new Error(
    `All models in the resilient fallback ladder failed. Last error: ${lastError?.message || lastError}`
  );
}

export async function generateAiEventPlan(eventData: {
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
}) {
  const prompt = `
Generate a comprehensive, tailored, and luxurious event plan for:
Event Name: "${eventData.name}"
Category: "${eventData.category}"
Date: "${eventData.date}"
Location: "${eventData.location}"
Guest Count: ${eventData.guestCount}
Total Budget: ₹${eventData.totalBudget.toLocaleString()}
Preferred Theme: "${eventData.preferredTheme || 'Elegant & Modern'}"
Event Duration: "${eventData.duration || 'Full day / Evening'}"
Special Requirements: "${eventData.specialRequirements || 'None specified'}"
Food Preferences: "${eventData.foodPreferences || 'Multi-cuisine / Regional specialties'}"
Decoration Preferences: "${eventData.decorationPreferences || 'Sophisticated floral and modern lighting'}"

Return a valid JSON object matching this exact structure:
{
  "overview": "Rich narrative summarizing the celebration vibe, key highlights, and guest experience.",
  "recommendedTheme": "Specific creative theme title",
  "colorPalette": ["#Hex1", "#Hex2", "#Hex3", "#Hex4"],
  "decorationIdeas": [
    "Specific entrance focal point idea",
    "Centerpiece & table decor concept",
    "Stage or main backdrop design",
    "Ambient lighting design"
  ],
  "venueSuggestions": {
    "criteria": "Key factors to evaluate when selecting the venue for ${eventData.guestCount} guests",
    "recommendedTypes": ["Type of venue 1 (e.g. Heritage Banquet)", "Type of venue 2 (e.g. Open-air lawn)"],
    "tips": "Pro-tip on acoustics, guest flow, and vendor access"
  },
  "cateringRecommendations": {
    "menuStyle": "e.g. Live Gourmet Stations & Curated Buffet",
    "suggestedItems": ["Welcome Drink / Mocktail", "Signature Appetizer 1", "Main Course Specialty", "Signature Dessert"],
    "dietaryNotes": "How to balance vegetarian, non-vegetarian, vegan, and allergen considerations"
  },
  "entertainmentIdeas": [
    "Music / DJ / Live acoustic set recommendations",
    "Interactive guest activity or photo op experience",
    "Ceremonial or celebration peak moment"
  ],
  "photographyRequirements": [
    "Key mandatory shot lists",
    "Drone / candid coverage recommendations",
    "Golden hour timing advice"
  ],
  "budgetDistribution": [
    {"category": "Venue & Hospitality", "percentage": 25, "amount": 0, "notes": "Rental, power backup, security"},
    {"category": "Catering & Beverages", "percentage": 30, "amount": 0, "notes": "Full-course dinner, live counters, service staff"},
    {"category": "Decoration & Floral", "percentage": 15, "amount": 0, "notes": "Stage, entrance arches, lighting"},
    {"category": "Photography & Video", "percentage": 10, "amount": 0, "notes": "Candid photographer, cinematic teaser"},
    {"category": "Entertainment & DJ", "percentage": 8, "amount": 0, "notes": "Sound system, artists, MC"},
    {"category": "Invitations & Favors", "percentage": 4, "amount": 0, "notes": "Digital invites, customized guest gifts"},
    {"category": "Miscellaneous & Buffer", "percentage": 8, "amount": 0, "notes": "Contingency reserve for unexpected costs"}
  ],
  "vendorChecklist": [
    {"category": "Venue", "items": ["Book venue contract", "Inspect sound limits"], "priority": "Essential"},
    {"category": "Catering", "items": ["Tasting session", "Finalize menu count"], "priority": "Essential"},
    {"category": "Decor", "items": ["Finalize 3D stage layout", "Floral sourcing review"], "priority": "Recommended"},
    {"category": "Photography", "items": ["Discuss shot list", "Book crew travel"], "priority": "Essential"}
  ],
  "guestManagementSuggestions": [
    "Digital RSVP timeline guidelines",
    "Welcome desk and seating chart management",
    "Special care for elderly guests and children"
  ]
}

Note: Ensure the amounts in budgetDistribution sum up exactly or closely to the total budget of ${eventData.totalBudget}. Return ONLY valid JSON.
`;

  const systemInstruction = `You are a master luxury event producer and certified wedding planner with 15+ years of experience organizing unforgettable, budget-optimized celebrations. Provide concrete, creative, realistic recommendations in clean JSON format.`;

  const raw = await generateContentWithFallback(prompt, {
    systemInstruction,
    responseMimeType: "application/json",
  });

  return JSON.parse(cleanJsonString(raw));
}

export async function optimizeAiBudget(params: {
  eventName: string;
  category: string;
  totalBudget: number;
  totalSpent: number;
  categories: { category: string; allocatedAmount: number; spentAmount: number }[];
}) {
  const prompt = `
The user is planning "${params.eventName}" (${params.category}) with a total target budget of ₹${params.totalBudget.toLocaleString()}.
Current total spent: ₹${params.totalSpent.toLocaleString()}.

Here is the current breakdown by category:
${JSON.stringify(params.categories, null, 2)}

Provide an intelligent AI budget optimization plan to reduce costs, eliminate overspending, and suggest smart high-impact alternatives while maintaining event elegance.

Return a JSON object matching this structure:
{
  "status": "warning" or "on_track",
  "summary": "Clear executive summary of the budget health and where the biggest savings can be achieved.",
  "overBudgetRiskCategories": ["Category 1", "Category 2"],
  "costSavingSuggestions": [
    {
      "category": "e.g. Venue",
      "action": "Concrete negotiation or substitution tip",
      "estimatedSavings": 15000,
      "qualityImpact": "Minimal - retains full ambiance by using localized seasonal decor"
    }
  ],
  "recommendedReallocation": [
    {
      "category": "Category Name",
      "currentAllocation": 0,
      "suggestedAllocation": 0,
      "rational": "Why this allocation optimizes budget without sacrificing attendee experience"
    }
  ],
  "vendorNegotiationTips": [
    "Tip 1 on booking off-peak timing or package bundles",
    "Tip 2 on BYOB / outside vendor corkage waivers",
    "Tip 3 on seasonal flower substitutions"
  ]
}
Return ONLY valid JSON.
`;

  const systemInstruction = `You are an expert event financial analyst and wedding coordinator skilled at optimizing budgets, finding vendor arbitrage, and re-allocating funds to prevent cost overruns.`;

  const raw = await generateContentWithFallback(prompt, {
    systemInstruction,
    responseMimeType: "application/json",
  });

  return JSON.parse(cleanJsonString(raw));
}

export async function generateAiTimeline(eventData: {
  name: string;
  category: string;
  date: string;
}) {
  const prompt = `
Create a comprehensive, chronological countdown preparation timeline for "${eventData.name}" (${eventData.category}) taking place on ${eventData.date}.

Return a JSON array of timeline tasks from 60 days before down to Event Day:
[
  {
    "title": "Short descriptive task name",
    "category": "Venue | Catering | Decor | Invitations | Attire | Vendors | Logistics",
    "priority": "Critical" | "High" | "Medium" | "Low",
    "daysBeforeEvent": 60,
    "notes": "Actionable detail on what to verify"
  }
]

Include 8 to 12 realistic milestones representing the complete lifecycle (e.g. 60 days, 45 days, 30 days, 21 days, 14 days, 7 days, 3 days, 1 day before, and Event Day execution).
Return ONLY a valid JSON array.
`;

  const systemInstruction = `You are an elite event logistics director. Produce structured, timeline tasks formatted strictly in JSON.`;

  const raw = await generateContentWithFallback(prompt, {
    systemInstruction,
    responseMimeType: "application/json",
  });

  return JSON.parse(cleanJsonString(raw));
}

export async function generateAiThemes(params: {
  category: string;
  totalBudget: number;
  guestCount: number;
  preferences?: string;
}) {
  const prompt = `
Generate 3 distinct, breathtaking celebration themes for:
Category: ${params.category}
Budget: ₹${params.totalBudget.toLocaleString()}
Guest Count: ${params.guestCount}
Preferences: ${params.preferences || 'Modern, vibrant, and elegant'}

Return a JSON array of 3 theme objects:
[
  {
    "themeName": "Creative Theme Title",
    "tagline": "Inspiring one-line aesthetic hook",
    "colorPalette": [
      {"name": "Color Name", "hex": "#HEXCODE"},
      {"name": "Color Name", "hex": "#HEXCODE"},
      {"name": "Color Name", "hex": "#HEXCODE"},
      {"name": "Color Name", "hex": "#HEXCODE"}
    ],
    "decorationConcepts": ["Entrance arch details", "Table centerpiece concept", "Backdrop theme"],
    "lightingIdeas": ["Fairy lights canopy", "Uplighting hues", "Gobo monogram projection"],
    "stageDesign": "Architectural or organic stage focal point description",
    "foodPresentation": ["Signature mocktail presentation", "Interactive food station theme"],
    "entertainmentActivities": ["Activity 1 for guests", "Music style"],
    "invitationIdeas": "Paper texture or digital video motion invite concept"
  }
]

Return ONLY valid JSON.
`;

  const systemInstruction = `You are a visionary event designer and creative art director for high-profile celebrations.`;

  const raw = await generateContentWithFallback(prompt, {
    systemInstruction,
    responseMimeType: "application/json",
  });

  return JSON.parse(cleanJsonString(raw));
}

export async function chatWithEventMate(params: {
  message: string;
  eventContext?: {
    name: string;
    category: string;
    date: string;
    location: string;
    totalBudget: number;
    guestCount: number;
    expensesTotal?: number;
    remainingBudget?: number;
  } | null;
  history?: { role: 'user' | 'assistant'; content: string }[];
}) {
  const contextDescription = params.eventContext
    ? `Active Event Context:
- Name: "${params.eventContext.name}"
- Category: "${params.eventContext.category}"
- Date: "${params.eventContext.date}"
- Location: "${params.eventContext.location}"
- Total Budget: ₹${params.eventContext.totalBudget.toLocaleString()}
- Guests: ${params.eventContext.guestCount}
- Expenses Logged: ₹${(params.eventContext.expensesTotal || 0).toLocaleString()}
- Remaining Budget: ₹${(params.eventContext.remainingBudget || 0).toLocaleString()}
`
    : `No specific event selected yet. You are providing general professional event planning guidance.`;

  const conversationHistory = (params.history || [])
    .slice(-6)
    .map((h) => `${h.role === 'user' ? 'User' : 'EventMate'}: ${h.content}`)
    .join('\n');

  const prompt = `
${contextDescription}

Recent Conversation:
${conversationHistory}

User Query: "${params.message}"

Please respond as "EventMate AI", the user's friendly, proactive, and highly knowledgeable celebration assistant.
- Provide direct, actionable, practical advice.
- When budget or numbers are mentioned, provide concrete percentage breakdowns and price estimates in INR (₹).
- Use cheerful, professional formatting with clean bullet points or numbered lists where suitable.
- Keep the response concise, engaging, and easy to read on mobile or desktop.
`;

  const systemInstruction = `You are EventMate AI, an intelligent, empathetic, and detail-oriented event planner. You help people plan weddings, birthdays, anniversaries, college fests, corporate events, and community galas effortlessly.`;

  return await generateContentWithFallback(prompt, {
    systemInstruction,
  });
}
