# NEXUS AI — Company AI Operations Control Center

> **One AI Brain for Company Operations** — Natural Language Request → Intent & Entity Extraction → Workflow Orchestration → Role-based Approvals & Tasks → Live AI Monitoring → Audit Trail.

---

## 📌 Problem Statement
Companies operate with fragmented, disjointed departmental tools (spreadsheets, emails, chat messages, tickets, expense forms, and HR portals). Employees struggle to know which form to fill, managers lose track of approvals, and operations leaders lack real-time visibility into bottlenecks, policy risks, and impending SLA breaches.

## 💡 Solution Overview
**NEXUS AI** transforms natural language company requests into structured, executable, and monitorable operations workflows. With a single conversational intake powered by **Google Gemini 1.5 Flash**, the system automatically classifies the request, validates policy rules, routes approvals to the correct manager or department lead, generates live action tasks, and continuously tracks execution health through an **AI Operations Monitor**.

---

## 🚀 5 Core Demo-Ready Workflows

| # | Workflow | Natural Language Example | AI Extraction & Actions |
|---|---|---|---|
| 1 | **AI ExpenseFlow** | *"I spent ₹2,850 during yesterday's Mumbai client visit."* | Extracts `amount: 2850`, `date`, `category: Travel & Meals`, `purpose`, checks `per_diem_cap (₹10,000)`, routes `Manager -> Finance`. |
| 2 | **AI Helpdesk** | *"My laptop Wi-Fi is not working and I have a client presentation in 20 minutes."* | Identifies `category: Network`, sets `priority: critical`, calculates `SLA: 20 mins`, assigns rapid IT hotfix, triggers radar alert. |
| 3 | **Employee Onboarding** | *"Rahul Sharma is joining Engineering as a Software Intern on October 10."* | Extracts candidate details, generates 4 dynamic onboarding milestones (IT accounts, MacBook setup, 1:1 welcome, first-week review). |
| 4 | **MeetingOps AI** | *"Omkar will finish the API by Friday. Priya will prepare the presentation. Rahul will contact the client tomorrow."* | Parses transcript, extracts 3 actionable commitments with assignees and deadlines, creates live assignable tasks. |
| 5 | **AI ApprovalFlow** | *"I need a ₹35,000 monitor for my development work."* | Extracts `amount: 35000`, `category: Equipment`, checks budget threshold, creates Manager approval card. |

---

## 👥 Role-Based Access Control (RBAC) & Persona Switcher

NEXUS AI includes a top-bar interactive Persona Switcher with 6 distinct roles:

1. **Omkar Dev (Employee - Engineering)**: Create requests via AI intake, track own workflows and personal tasks.
2. **Sarah Connor (Manager - Engineering)**: Review pending approvals, sign off with comments, track team tasks.
3. **Vikram Mehta (Finance Controller)**: Process reimbursement claims, verify expense policy limits.
4. **Priya Sharma (Head of HR)**: Manage new hire onboarding pipelines, buddy pairings, and milestone reviews.
5. **Alex Rivera (Lead IT Support)**: Resolve critical incidents, track SLA countdowns, provision hardware.
6. **Elena Rostova (Chief Operating Officer - Admin)**: 360° operations radar, workflow distribution, and SLA compliance metrics.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Lucide Icons + Glassmorphism Dark UI
- **Backend**: Node.js + Express + CORS + Morgan Logging
- **AI Intelligence**: Google Gemini 1.5 Flash structured JSON generation + deterministic pattern-based fallback engine (zero latency, 100% resilient)
- **Data Persistence**: In-Memory + JSON persistent storage engine with pre-seeded data for instant demo reliability
- **Automation / Integrations**: Webhook dispatcher for Make.com / Gmail notification simulation

---

## ⚡ Setup & Local Execution

### 1. Prerequisites
- Node.js v18+ and npm installed

### 2. Configure Environment Variables
Create or verify `.env` in the root and `server/.env`:
```env
PORT=3001
# Paste your Google Gemini API Key below (Optional, system includes deterministic AI fallback)
GEMINI_API_KEY=your_gemini_api_key_here
MAKE_WEBHOOK_URL=https://hook.eu2.make.com/demo-nexus-webhook
```

### 3. Install Dependencies
```bash
npm install
cd client && npm install && cd ..
```

### 4. Run the Full-Stack Application
In root directory:
```bash
# Terminal 1 - Backend Server (Port 3001)
node server/index.js

# Terminal 2 - Frontend Client (Port 5173)
cd client
npm run dev
```

Open **http://localhost:5173** in your browser!

### 5. Automated Verification
Run the automated test suite verifying all 5 core flows:
```bash
node test_flows.js
```

---

## 🎬 3-Minute Demo Guide

1. Open **http://localhost:5173** (Logged in as **Omkar Dev - Employee**).
2. Click **"AI Operations Intake"** (or use the 1-Click Demo Presets).
3. Select **"Expense Claim"** (*"I spent ₹2,850 during yesterday's Mumbai client visit."*) and click **"Analyze with AI"**.
4. Review the structured extraction (Amount: ₹2,850, Policy Checked, Recommended Route: Manager -> Finance).
5. Click **"Start Operations Workflow"** — the workflow timeline opens with pending manager approval.
6. Switch persona in top right dropdown to **Sarah Connor (Manager)**.
7. Navigate to **"Approvals Queue"** (or open the workflow) and click **"Approve & Advance"**.
8. Notice the instant status update to `approved / Finance Disbursement` and activity audit entry.
9. Try the **Helpdesk Incident** preset (*"My laptop Wi-Fi is not working and I have a client presentation in 20 minutes."*) — observe the critical SLA badge and live alert on the **AI Operations Monitor**.
10. Try **Employee Onboarding** and **MeetingOps** — observe dynamic tasks and assignees created live!
