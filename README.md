# Composio App Research Agent

AI-driven research pipeline that analyzes 100 apps for integration readiness as Composio agent toolkits.

## Project Structure

```text
composio/
├── api/
│   └── index.js                # Vercel serverless function entrypoint
├── backend/                    # Research agent pipeline & API server
│   ├── agent/
│   │   ├── analyzer.py         # Pattern analysis routines
│   │   └── researcher.py       # Core research logic per app
│   ├── data/
│   │   ├── apps_input.json     # Input: 100 apps metadata
│   │   ├── patterns.json       # Generated cross-app statistical patterns
│   │   ├── research_results_merged.json # Primary database for research results
│   │   └── verification.json   # Spot-check verification metrics
│   ├── main.py                 # CLI research pipeline orchestrator
│   ├── requirements.txt        # Python dependency documentation
│   └── server.js               # Express server with live SSE agent endpoint
├── frontend/
│   └── index.html              # Dynamic single-page dashboard deliverable
├── .env.example                # Environment variables template
├── vercel.json                 # Vercel deployment configuration
├── build.js                    # Build script for frontend generation
├── package.json                # Project dependencies and npm scripts
└── README.md
```

## How to Run Locally

### 1. Web Application & Live Agent Server
```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start development server
npm run dev

# Or build frontend dashboard bundle
npm run build
```
Open `http://localhost:3001` in your browser to view the dynamic dashboard and interact with the live Groq research agent.

### 2. Python Pattern Analysis Pipeline
```bash
python backend/main.py
```

---

## How to Host on Vercel

The project is pre-configured for **one-click deployment to Vercel** using `@vercel/node` serverless functions and `vercel.json`.

### Method A: Deploy via Vercel CLI (Recommended)

1. Install Vercel CLI globally:
   ```bash
   npm i -g vercel
   ```

2. Run `vercel` in the project root directory:
   ```bash
   vercel
   ```

3. When prompted, set Environment Variables on Vercel:
   - `GROQ_API_KEY`: Your Groq API key (e.g., `gsk_...`)
   - `GROQ_MODEL`: Optional (defaults to `llama-3.3-70b-versatile`)

4. Deploy to Production:
   ```bash
   vercel --prod
   ```

---

### Method B: Deploy via GitHub & Vercel Dashboard

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Configure Vercel deployment"
   git push origin main
   ```

2. Go to [Vercel Dashboard](https://vercel.com/new) and click **Import Project**.
3. Select your GitHub repository.
4. Framework Preset: **Other** or **Node.js**.
5. Under **Environment Variables**, add:
   - `GROQ_API_KEY`: `your_groq_api_key`
   - `GROQ_MODEL`: `llama-3.3-70b-versatile`
6. Click **Deploy**. Vercel will automatically build the static assets using `node build.js` and spin up serverless API routes.

---

## Features

- **Dynamic Statistics & Insights**: All dashboard metrics, category breakdowns, auth distribution charts, and buildability verdicts are calculated dynamically from real backend research data.
- **Real-Time Agent Execution**: Streams step-by-step LLM analysis via Server-Sent Events (SSE) using Groq API (`llama-3.3-70b-versatile` / `allam-2-7b`).
- **Data Persistence & Vercel Serverless Ready**: Works seamlessly locally and in cloud serverless environments.
