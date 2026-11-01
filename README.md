# Celebration & Event Planner AI

A modern, full-stack, GenAI-powered event planning assistant that automatically generates personalized event plans, manages budgets, creates schedules, recommends themes, organizes vendor checklists, tracks expenses, and provides real-time intelligent consultation using Google Gemini AI.

---

## Architecture & Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Recharts, Lucide React, Canvas Confetti.
- **Backend**: Node.js, Express.js REST API with Vite middleware integration.
- **Generative AI**: Google Gemini API via `@google/genai` with Resilient Model Fallback Ladder:
  - Primary: `gemini-3.6-flash`
  - High-Availability Fallback: `gemini-3.1-flash-lite`
  - Dynamic Alias: `gemini-flash-latest`
  - Deep Reasoning Fallback: `gemini-3.7-flash`
- **Database & RLS**:
  - Supabase PostgreSQL schema with 11 tables and strict Row Level Security (RLS) policies.
  - Zero-crash payload sanitizer stripping all `undefined` values before persistence.
  - Built-in multi-tenant user isolation.
- **Deployment**: Google Cloud Run / Render / Vercel container-friendly deployment.

---

## 1. Environment & Prerequisites

Ensure you have installed:
- Node.js 20+ and npm
- Google Cloud SDK (`gcloud` CLI)

Enable required Google Cloud APIs for Cloud Run and Secret Manager:

```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com
```

---

## 2. Secret Management Setup

Do not hardcode API keys in source files. Store `GEMINI_API_KEY` securely in Google Cloud Secret Manager:

```bash
# 1. Create the secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 2. Add your secret version
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant the Cloud Run runtime service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Database Security Configuration

### A. Firestore Security Rules (User Data Isolation)

If persisting state to Firestore, deploy the following owner-bound security rules (`firestore.rules`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /events/{eventId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /expenses/{expenseId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /tasks/{taskId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### B. Supabase PostgreSQL Schema & Row Level Security (RLS)

Execute `supabase-schema.sql` in your Supabase SQL Editor. It creates:
1. `profiles`
2. `events`
3. `event_plans`
4. `budgets`
5. `budget_categories`
6. `expenses`
7. `tasks`
8. `vendors`
9. `guests`
10. `chat_history`
11. `notifications`

All tables enforce:
```sql
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own events"
  ON public.events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 4. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure .env
cp .env.example .env
# Set GEMINI_API_KEY in .env

# 3. Start unified dev server (Express + Vite on Port 3000)
npm run dev
```

Visit `http://localhost:3000` to interact with the full dashboard and AI features.

---

## 5. Google Cloud Run Deployment Flow

Build and deploy directly using Cloud Build and Cloud Run:

```bash
# Deploy to Google Cloud Run
gcloud run deploy celebration-event-planner-ai \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port 3000
```

---

## 6. Required Campaign Verification Binding

To register the service for automated challenge verification, apply the mandatory resource label:

```bash
gcloud run services update celebration-event-planner-ai \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-southeast1
```

---

## 7. Automated Testing & Verification Walkthrough

Run TypeScript verification and builds:

```bash
npm run lint
npm run build
```

See the test cases in the documentation below for step-by-step user interaction validation.
