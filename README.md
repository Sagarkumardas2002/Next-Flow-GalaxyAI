


# 🌌 NextFlow — Galaxy.AI Visual AI Workflow Builder

<div align="center">

![NextFlow](https://img.shields.io/badge/NextFlow-Galaxy.AI-blueviolet?style=for-the-badge&logo=react&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)

<br/>

**A pixel-perfect visual AI workflow builder — drag, connect, and run multi-modal AI pipelines with real-time parallel execution and smart DAG convergence.**

<br/>

[🚀 Live Demo](https://next-flow-galaxy-ai-kx88.vercel.app) &nbsp;·&nbsp; [🐛 Report Bug](https://github.com/Sagarkumardas2002/Next-Flow-GalaxyAI/issues) &nbsp;·&nbsp; [✨ Request Feature](https://github.com/Sagarkumardas2002/Next-Flow-GalaxyAI/issues)

</div>

---

## 📖 Table of Contents

- [About the Project](#-about-the-project)
- [Key Demo Workflow](#-key-demo-workflow)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Node Types](#-node-types)
- [Workflow Features](#-workflow-features)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Submission Checklist](#-submission-checklist)
- [Resources](#-resources)
- [Author](#-author)

---

## 🎯 About the Project

**NextFlow** is a pixel-perfect UI/UX clone of [Krea.ai](https://krea.ai)'s workflow builder — purpose-built for **LLM and multi-modal AI pipelines**. It uses React Flow for the visual canvas, Google Gemini API for AI execution, and Trigger.dev for background task processing.

> Build complex AI workflows visually. Connect nodes. Run in parallel. Converge at the end. No code required.

### Why NextFlow?
- 🎨 **Pixel-perfect Krea.ai UI** — exact colors, spacing, fonts, and animations
- ⚡ **True parallel execution** — independent branches run concurrently via Trigger.dev
- 🧠 **Multi-modal AI** — Google Gemini vision support for image + text prompts
- 💾 **Full persistence** — workflows and history saved to PostgreSQL
- 🔐 **Auth protected** — every route secured with Clerk

---

## 🎬 Key Demo Workflow

**Product Marketing Kit Generator** — demonstrates all 6 node types with parallel execution and DAG convergence.

```
┌─────────────────────────────────────────────────────────────┐
│                    PARALLEL EXECUTION                        │
│                                                              │
│  Branch A (Image Processing)    Branch B (Video Processing)  │
│  ─────────────────────────     ───────────────────────────   │
│  📤 Upload Image Node           🎬 Upload Video Node        │
│         ↓                              ↓                     │
│  ✂️  Crop Image Node            🎞️  Extract Frame Node      │
│         ↓                              ↓                     │
│  🤖 LLM Node #1                   (complete ✓)              │
│    (waits for crop + text)                                   │
│         ↓                                                    │
│     (complete ✓)                                             │
│                                                              │
│                   ↓  CONVERGENCE  ↓                          │
│                                                              │
│              🤖 LLM Node #2                                  │
│         (waits for BOTH branches)                            │
│      Final Marketing Tweet / Post                            │
└─────────────────────────────────────────────────────────────┘
```

| Phase | Branch A | Branch B | Convergence |
|-------|----------|----------|-------------|
| Phase 1 | Upload Image + Text Nodes | Upload Video | — |
| Phase 2 | Crop Image Node | Extract Frame Node | — |
| Phase 3 | LLM Node #1 (waits for crop + texts) | *(complete)* | — |
| Phase 4 | *(complete)* | *(complete)* | **LLM Node #2 fires** |

> **Key:** Branch A and Branch B run in parallel during Phases 1–3. The Convergence Node (LLM #2) only executes after **both** branches complete. If Branch B finishes first, it waits. The convergence node triggers only when all upstream dependencies are satisfied.

---

## ✨ Features

### 🎨 Canvas & UI
- Pixel-perfect **Krea.ai clone** — exact colors, spacing, layout, and animations
- **React Flow canvas** with dot grid background, smooth panning/zooming, and MiniMap
- **Animated purple edges** connecting nodes
- **Pulsating glow effect** on nodes currently executing
- **Undo/Redo** for node operations
- **Responsive design** with proper overflow handling

### 📋 Sidebars
- **Left Sidebar** — Collapsible with search and 6 Quick Access node buttons
- **Right Sidebar** — Workflow History Panel showing all runs with timestamps, status badges, and duration

### 🧩 Node Execution History
- Click any run to expand **node-level execution details**
- Each node shows: status, inputs used, outputs generated, execution time
- Color-coded badges: 🟢 success / 🔴 failed / 🟡 running
- Partial runs show which nodes succeeded even if workflow failed

### ⚡ Workflow Engine
- **Parallel execution** — independent branches run concurrently
- **DAG validation** — circular loops/cycles are disallowed
- **Selective execution** — run a single node, selected nodes, or full workflow
- **Type-safe connections** — image nodes can't connect to text inputs (visually enforced)
- **Connected Input State** — connected handles grey out their manual input field automatically

### 💾 Persistence
- Save/load workflows to **PostgreSQL** via Prisma ORM
- Full **workflow history** persisted to database
- Export/import workflows as **JSON**
- **Pre-built sample workflow** showcasing all 6 node types

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16.2 (App Router, Turbopack) | React framework |
| **Language** | TypeScript (Strict Mode) | Type safety throughout |
| **Auth** | Clerk | Authentication & protected routes |
| **Database** | PostgreSQL (Neon) + Prisma ORM | Workflow & history persistence |
| **Canvas** | React Flow | Visual workflow/node graph |
| **Background Jobs** | Trigger.dev | ALL node executions |
| **Media Processing** | FFmpeg via Trigger.dev | Image crop & video frame extraction |
| **File Uploads** | Transloadit | Image & video uploads |
| **AI / LLM** | Google Gemini API | LLM inference + vision support |
| **State Management** | Zustand | Client state |
| **Validation** | Zod | API route schema validation |
| **Styling** | Tailwind CSS | Krea.ai-matched theme |
| **Icons** | Lucide React | Icon library |
| **Deployment** | Vercel | Hosting |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** database — use [Neon](https://neon.tech) (free tier)
- Accounts on: [Clerk](https://clerk.com), [Trigger.dev](https://trigger.dev), [Transloadit](https://transloadit.com), [Google AI Studio](https://aistudio.google.com)

### 1. Clone the repo

```bash
git clone https://github.com/Sagarkumardas2002/Next-Flow-GalaxyAI.git
cd Next-Flow-GalaxyAI
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root (see [Environment Variables](#-environment-variables) below).

### 4. Set up the database

```bash
npx prisma generate
npx prisma db push
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🔑 Environment Variables

Create a `.env.local` in the project root:

```env
# Clerk Auth — https://dashboard.clerk.com → API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# PostgreSQL (Neon) — https://neon.tech
DATABASE_URL=postgresql://...

# Trigger.dev — https://trigger.dev
TRIGGER_SECRET_KEY=tr_dev_...

# Transloadit — https://transloadit.com
NEXT_PUBLIC_TRANSLOADIT_KEY=...
TRANSLOADIT_SECRET=...
NEXT_PUBLIC_TRANSLOADIT_IMAGE_TEMPLATE_ID=...
NEXT_PUBLIC_TRANSLOADIT_VIDEO_TEMPLATE_ID=...

# Google Gemini — https://aistudio.google.com
GEMINI_API_KEY=...
```

### Getting API Keys

| Service | Where |
|---------|-------|
| **Google Gemini** | [Google AI Studio](https://aistudio.google.com) |
| **Clerk** | [clerk.com](https://clerk.com) → Dashboard → API Keys |
| **Trigger.dev** | [trigger.dev](https://trigger.dev) → Project → API Keys |
| **Transloadit** | [transloadit.com](https://transloadit.com) → Account |
| **PostgreSQL** | [Neon](https://neon.tech) → Free tier |

---

## 🧩 Node Types

### 1. 📝 Text Node
- Simple textarea input
- Output handle for text data
- Used for system prompts and user messages

### 2. 🖼️ Upload Image Node
- File upload via **Transloadit**
- Accepts: `jpg`, `jpeg`, `png`, `webp`, `gif`
- Live image preview after upload
- Output handle for image URL

### 3. 🎬 Upload Video Node
- File upload via **Transloadit**
- Accepts: `mp4`, `mov`, `webm`, `m4v`
- Video player preview after upload
- Output handle for video URL

### 4. 🤖 LLM Node (Run Any LLM)
- Model selector dropdown
- **3 Input Handles:** `system_prompt` (optional), `user_message` (required), `images` (optional, supports multiple)
- **1 Output Handle:** `output` — text response from LLM
- Results displayed **inline on the node itself**
- Executes via **Trigger.dev task** → Google Gemini API
- Full **vision support** (multimodal image + text)

### 5. ✂️ Crop Image Node
- **5 Input Handles:** `image_url` (required), `x_percent`, `y_percent`, `width_percent`, `height_percent` (all 0–100)
- **1 Output Handle:** `output` — cropped image URL via Transloadit
- Executes via **FFmpeg on Trigger.dev**

### 6. 🎞️ Extract Frame from Video Node
- **2 Input Handles:** `video_url` (required), `timestamp` (seconds or "50%", default: 0)
- **1 Output Handle:** `output` — extracted frame image URL (jpg/png)
- Executes via **FFmpeg on Trigger.dev**

---

## ⚙️ Workflow Features

| Feature | Description |
|---------|-------------|
| **Drag & Drop** | Add nodes from sidebar via click or drag |
| **Animated Edges** | Purple animated edges connecting handles |
| **Type-Safe Connections** | Invalid connections visually disallowed |
| **DAG Validation** | Circular loops are prevented |
| **Connected Input State** | Connected handles grey out manual inputs |
| **Parallel Execution** | Independent branches run concurrently |
| **Selective Execution** | Single node, selected nodes, or full workflow |
| **Undo / Redo** | Full undo/redo for node operations |
| **Canvas Navigation** | Pan, zoom, fit view |
| **MiniMap** | Bottom-right corner navigation |
| **Node Deletion** | Menu button or Delete/Backspace key |
| **Workflow Save/Load** | Persisted to PostgreSQL |
| **Export / Import** | Download/upload as JSON |
| **Pulsating Glow** | Visual feedback during node execution |




![LLM Execution](image.png)


---

## 📁 Project Structure

```📦 Project Structure
nextflow/
├── .clerk/
│   └── .tmp/
│       ├── keyless.json
│       └── README.md
├── .github/
│   └── instructions/
│       └── trigger-basic.instructions.md
├── .trigger/
│   ├── active-runs.json
│   ├── dev.lock
│   ├── watchdog.pid
│   └── tmp/
│       ├── build-JmPuK9/
│       │   ├── build.json
│       │   ├── index.json
│       │   ├── metafile.json
│       │   ├── cropImage.mjs
│       │   ├── extractFrame.mjs
│       │   ├── runLLM.mjs
│       │   ├── trigger.config.mjs
│       │   ├── dev-index-worker.mjs
│       │   ├── dev-run-worker.mjs
│       │   └── chunk-*.mjs  (+ .map files)
│       └── store/
│           └── (runtime key-value store files)
├── .vscode/
│   └── settings.json
├── app/
│   ├── globals.css                               # Global Tailwind base styles
│   ├── layout.tsx                                # Root layout (fonts, Clerk provider)
│   ├── page.tsx                                  # Landing / redirect page
│   ├── (auth)/                                   # Auth route group (no shared layout)
│   │   ├── sign-in/
│   │   │   └── [[...sign-in]]/
│   │   │       └── page.tsx                      # Clerk <SignIn /> page
│   │   └── sign-up/
│   │       └── [[...sign-up]]/
│   │           └── page.tsx                      # Clerk <SignUp /> page
│   ├── api/                                      # Next.js route handlers (REST API)
│   │   ├── nodes/
│   │   │   ├── crop/
│   │   │   │   └── route.ts                      # POST — crop image node handler
│   │   │   └── extract/
│   │   │       └── route.ts                      # POST — extract text/frame handler
│   │   ├── transloadit/
│   │   │   └── sign/
│   │   │       └── route.ts                      # POST — signs Transloadit upload params
│   │   └── workflow/
│   │       ├── delete/
│   │       │   └── route.ts                      # DELETE — remove workflow by ID
│   │       ├── get/
│   │       │   └── route.ts                      # GET — fetch workflow + nodes
│   │       ├── run/
│   │       │   └── route.ts                      # POST — trigger background job
│   │       ├── runs/
│   │       │   └── route.ts                      # GET — list all execution runs
│   │       └── save/
│   │           └── route.ts                      # POST — persist workflow graph to DB
│   └── dashboard/
│       ├── layout.tsx                            # Dashboard shell layout
│       ├── page.tsx                              # Dashboard entry page
│       ├── components/
│       │   ├── canvas/
│       │   │   ├── FlowCanvas.tsx                # React Flow canvas wrapper
│       │   │   ├── edges/
│       │   │   │   └── AnimatedEdge.tsx          # Custom animated edge type
│       │   │   └── nodes/
│       │   │       ├── BaseNode.tsx              # Shared base node wrapper
│       │   │       ├── CropNode.tsx              # Image crop node UI
│       │   │       ├── Cropimage.tsx             # Crop image preview component
│       │   │       ├── ExtractNode.tsx           # Frame/text extraction node UI
│       │   │       ├── ImageNode.tsx             # Image input node UI
│       │   │       ├── LLMNode.tsx               # LLM prompt node UI
│       │   │       ├── TextNode.tsx              # Text input node UI
│       │   │       ├── VideoNode.tsx             # Video input node UI
│       │   │       └── nodeTypes.tsx             # React Flow nodeTypes registry
│       │   ├── sidebar/
│       │   │   ├── LeftSidebar.tsx               # Node palette (drag to canvas)
│       │   │   ├── RightSidebar.tsx              # Node config / inspector panel
│       │   │   ├── Rightsidebarrunhistory.tsx    # Run history tab in right panel
│       │   │   └── Rightsidebarworkflows.tsx     # Saved workflows tab in right panel
│       │   └── topbar/
│       │       └── Topbar.tsx                    # Save, run, workflow title bar
│       └── hooks/
│           ├── useFlowStore.ts                   # Zustand store for React Flow state
│           └── useWorkflow.ts                    # Workflow CRUD & run logic
├── lib/
│   └── prisma.ts                                 # Prisma client singleton
├── prisma/
│   ├── schema.prisma                             # DB schema (Workflow, WorkflowRun)
│   └── migrations/
│       ├── migration_lock.toml                   # Migration engine lock
│       └── (migration folders with migration.sql)# Auto-generated SQL history
├── trigger/
│   └── jobs/
│       ├── cropImage.ts                          # Background job — crop image
│       ├── extractFrame.ts                       # Background job — extract frame
│       └── runLLM.ts                             # Background job — run LLM prompt
├── .env                                          # Environment variables (private)
├── .env.local                                    # Local overrides (gitignored)
├── .gitignore                                    # Git ignore rules
├── actions.ts                                    # Next.js server actions
├── eslint.config.mjs                             # ESLint flat config
├── next-env.d.ts                                 # Next.js TypeScript declarations
├── next.config.ts                                # Next.js config (plugins, env)
├── package-lock.json                             # Locked dependency tree
├── package.json                                  # Dependencies & npm scripts
├── postcss.config.mjs                            # PostCSS config (Tailwind)
├── prisma.config.ts                              # Prisma client config
├── proxy.ts                                      # Dev proxy setup
├── README.md                                     # Project documentation
├── tailwind.config.ts                            # Tailwind theme & plugins
├── trigger.config.ts                             # Trigger.dev project config
├── tsconfig.json                                 # TypeScript compiler config
└── tsconfig.tsbuildinfo                          # TS incremental build cache

```

---

## 🌍 Deployment

### Deploy to Vercel

```bash
# 1. Push to GitHub
git add .
git commit -m "production ready"
git push origin main
```

Then go to [vercel.com](https://vercel.com) → New Project → Import repo → Add all env variables → Deploy.

After deploying, update:
```env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

And add your Vercel URL to **Clerk → Allowed redirect URLs**.

---

## ✅ Submission Checklist

- [x] Pixel-perfect Krea clone UI (exact spacing/colors)
- [x] Clerk authentication with protected routes
- [x] Left sidebar with 6 buttons (Text, Upload Image, Upload Video, LLM, Crop Image, Extract Frame)
- [x] Right sidebar with workflow history panel
- [x] Node-level execution history when clicking a run
- [x] React Flow canvas with dot grid background
- [x] Functional Text Node with textarea and output handle
- [x] Functional Upload Image Node with Transloadit upload and image preview
- [x] Functional Upload Video Node with Transloadit upload and video player preview
- [x] Functional LLM Node with model selector, prompts, and run capability
- [x] Functional Crop Image Node (FFmpeg via Trigger.dev)
- [x] Functional Extract Frame from Video Node (FFmpeg via Trigger.dev)
- [x] All node executions via Trigger.dev tasks
- [x] Pulsating glow effect on nodes during execution
- [x] Pre-built sample workflow (demonstrates all features)
- [x] Node connections with animated purple edges
- [x] API routes with Zod validation
- [x] Google Gemini integration with vision support
- [x] TypeScript throughout with strict mode
- [x] PostgreSQL database with Prisma ORM
- [x] Workflow save/load to database
- [x] Workflow history persistence to database
- [x] Workflow export/import as JSON
- [x] Deployed on Vercel with environment variables

---

## 📚 Resources

- [Krea.ai](https://krea.ai) — Reference application
- [React Flow Docs](https://reactflow.dev/docs)
- [Trigger.dev Docs](https://trigger.dev/docs)
- [Clerk Docs](https://clerk.com/docs)
- [Transloadit Docs](https://transloadit.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Google AI Studio](https://aistudio.google.com)
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs/models)
- [Zustand Docs](https://zustand-demo.pmnd.rs)
- [Zod Docs](https://zod.dev)
- [FFmpeg Docs](https://ffmpeg.org/documentation.html)
- [Neon PostgreSQL](https://neon.tech/docs)

---

## 👤 Author

**Sagar Kumar Das**

- GitHub: [@Sagarkumardas2002](https://github.com/Sagarkumardas2002)
- Live Demo: [next-flow-galaxy-ai-kx88.vercel.app](https://next-flow-galaxy-ai-kx88.vercel.app)

---

<div align="center">

Built with ❤️ using Next.js · React Flow · Google Gemini · Trigger.dev

⭐ **Star this repo if you found it helpful!**

</div>
