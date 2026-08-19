/**
 * Composio Research Agent - Backend Server
 * 
 * Express server with SSE endpoint for real-time agent execution.
 * Uses Groq API as the AI layer for app research analysis.
 * Auto-discovers available models on startup.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 3001;

// Validate Groq API key
const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error('[ERROR] GROQ_API_KEY not found in environment variables.');
  process.exit(1);
}

const groq = new Groq({ apiKey: GROQ_API_KEY });

// Model selection — resolved at startup
let activeModel = null;

// Preferred models in priority order (most capable first)
const MODEL_PRIORITY = [
  process.env.GROQ_MODEL,          // user override from .env
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'llama3-70b-8192',
  'mixtral-8x7b-32768',
  'llama-3.1-8b-instant',
  'llama3-8b-8192',
  'gemma2-9b-it',
  'allam-2-7b',
  'qwen/qwen3.6-27b',
].filter(Boolean);

/**
 * Discover which Groq model is actually available and usable.
 * Lists models from the API, cross-references with our priority list,
 * then validates with a test call.
 */
async function discoverModel() {
  console.log('[MODEL] Discovering available Groq models...');

  // 1. List models from Groq API
  let available = [];
  try {
    const list = await groq.models.list();
    available = list.data.map(m => m.id);
    console.log(`[MODEL] ${available.length} models on account: ${available.join(', ')}`);
  } catch (err) {
    console.error('[MODEL] Could not list models:', err.message);
  }

  // 2. Build candidate list: prioritized models that are available, plus all available as fallback
  const candidates = [];
  for (const m of MODEL_PRIORITY) {
    if (available.includes(m)) candidates.push(m);
  }
  // Add any available model not already in candidates as last-resort fallback
  for (const m of available) {
    if (!candidates.includes(m) && !m.includes('whisper') && !m.includes('guard')) {
      candidates.push(m);
    }
  }

  if (candidates.length === 0) {
    console.error('[MODEL] No candidate models found. Will attempt configured model at runtime.');
    activeModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    return;
  }

  // 3. Test each candidate with a real API call
  for (const model of candidates) {
    try {
      console.log(`[MODEL] Testing: ${model}...`);
      const result = await groq.chat.completions.create({
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
        model,
        max_tokens: 5,
        temperature: 0,
      });
      const reply = (result.choices[0]?.message?.content || '').trim();
      if (reply.length > 0) {
        activeModel = model;
        console.log(`[MODEL] Selected: ${model} (replied: "${reply}")`);
        return;
      }
      console.log(`[MODEL] ${model} returned empty response, skipping.`);
    } catch (err) {
      console.log(`[MODEL] ${model} failed: ${err.message.substring(0, 80)}`);
    }
  }

  // If nothing worked, set a fallback anyway — error will surface at agent runtime
  activeModel = candidates[0];
  console.warn(`[MODEL] No model passed test. Falling back to: ${activeModel}`);
}

// Load research data
const dataPath = path.join(__dirname, 'data', 'research_results_merged.json');
let researchData = [];
try {
  researchData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`[DATA] Loaded ${researchData.length} apps from research results.`);
} catch (err) {
  console.error('[ERROR] Could not load research data:', err.message);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Health check — includes active model info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    apps: researchData.length,
    groq: !!GROQ_API_KEY,
    model: activeModel,
  });
});

// List available apps and full data for UI
app.get('/api/apps', (req, res) => {
  res.json(researchData);
});

/**
 * Agent execution endpoint - Server-Sent Events (SSE)
 * Streams real-time agent steps to the frontend.
 */
app.get('/api/agent/run/:appId', async (req, res) => {
  const appId = parseInt(req.params.appId, 10);
  const appData = researchData.find(a => a.id === appId);

  if (!appData) {
    return res.status(404).json({ error: 'App not found' });
  }

  if (!activeModel) {
    return res.status(503).json({ error: 'No AI model available. Check server logs.' });
  }

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  send('start', {
    app: appData.name,
    category: appData.cat,
    totalSteps: 10,
    model: activeModel,
  });

  try {
    // --- Step 1: App Selection ---
    send('step', { stepId: 'app_selection', status: 'running', progress: 10 });
    const selectionResult = await callGroq(
      `You are researching "${appData.name}" for Composio integration readiness. This app is in the "${appData.cat}" category. Describe what ${appData.name} does in one clear sentence and explain why it's relevant for AI agent toolkits. Be concise (2-3 sentences max).`
    );
    send('step', {
      stepId: 'app_selection', status: 'complete', progress: 10,
      output: selectionResult,
      data: { name: appData.name, category: appData.cat, description: appData.desc }
    });

    // --- Step 2: Web Research ---
    send('step', { stepId: 'web_research', status: 'running', progress: 20 });
    const webResult = await callGroq(
      `You are researching "${appData.name}" developer ecosystem. Based on your knowledge, describe: 1) What is their developer platform URL? 2) Do they have public API documentation? 3) What developer resources exist (SDKs, CLI, sandbox)? Be factual and concise. If unsure, say so honestly.`
    );
    send('step', {
      stepId: 'web_research', status: 'complete', progress: 20,
      output: webResult,
      data: { evidenceUrl: appData.evidenceUrl }
    });

    // --- Step 3: Official Docs Discovery ---
    send('step', { stepId: 'docs_discovery', status: 'running', progress: 30 });
    const docsResult = await callGroq(
      `For "${appData.name}", their developer documentation is at: ${appData.evidenceUrl}. Analyze the documentation quality: 1) Is it a REST API, GraphQL, or both? 2) Is there an interactive API explorer or sandbox? 3) Rate documentation quality (excellent/good/fair/poor). Evidence URL: ${appData.evidenceUrl}. Be concise.`
    );
    send('step', {
      stepId: 'docs_discovery', status: 'complete', progress: 30,
      output: docsResult,
      data: { docsUrl: appData.evidenceUrl, apiType: appData.apiType }
    });

    // --- Step 4: Auth Extraction ---
    send('step', { stepId: 'auth_extraction', status: 'running', progress: 40 });
    const authResult = await callGroq(
      `For "${appData.name}", analyze the authentication methods. Known auth methods: ${appData.auth.join(', ')}. Explain: 1) How each auth method works for this specific app 2) Which is recommended for agent/automation use 3) Any special requirements (scopes, app review, etc). Be specific to ${appData.name}, not generic.`
    );
    send('step', {
      stepId: 'auth_extraction', status: 'complete', progress: 40,
      output: authResult,
      data: { methods: appData.auth, recommended: appData.auth[0] }
    });

    // --- Step 5: API Analysis ---
    send('step', { stepId: 'api_analysis', status: 'running', progress: 50 });
    const apiResult = await callGroq(
      `Analyze the API surface of "${appData.name}". Known facts: API type is ${appData.apiType}, breadth is ${appData.apiBreadth}. Describe: 1) Key API capabilities (what can you do programmatically?) 2) Rate limits or usage constraints 3) Data formats and response structure. Be specific to ${appData.name}.`
    );
    send('step', {
      stepId: 'api_analysis', status: 'complete', progress: 50,
      output: apiResult,
      data: { type: appData.apiType, breadth: appData.apiBreadth }
    });

    // --- Step 6: MCP Detection ---
    send('step', { stepId: 'mcp_detection', status: 'running', progress: 60 });
    const mcpResult = await callGroq(
      `Does "${appData.name}" have an existing MCP (Model Context Protocol) server? Answer: ${appData.hasMcp ? 'YES' : 'NO'}. ${appData.hasMcp ? 'Explain how an AI agent would connect to it via MCP and what tools/actions it exposes.' : 'Explain why building an MCP server for this app would be valuable and what tools it should expose for AI agents.'} Be concise (2-3 sentences).`
    );
    send('step', {
      stepId: 'mcp_detection', status: 'complete', progress: 60,
      output: mcpResult,
      data: { hasMcp: appData.hasMcp }
    });

    // --- Step 7: Self-Serve / Gated Classification ---
    send('step', { stepId: 'access_class', status: 'running', progress: 70 });
    const accessMap = { free_tier: 'Free Tier', trial: 'Trial', paid_required: 'Paid Required', contact_sales: 'Contact Sales' };
    const accessLabel = accessMap[appData.selfServe] || appData.selfServe;
    const accessResult = await callGroq(
      `For "${appData.name}", the developer access model is: ${accessLabel}. Explain: 1) Can a developer get API credentials right now without talking to anyone? 2) What's the onboarding friction? 3) Any costs involved? Be honest and specific.`
    );
    send('step', {
      stepId: 'access_class', status: 'complete', progress: 70,
      output: accessResult,
      data: { classification: appData.selfServe, label: accessLabel }
    });

    // --- Step 8: Buildability Assessment ---
    send('step', { stepId: 'buildability', status: 'running', progress: 80 });
    const buildResult = await callGroq(
      `Assess the buildability of a Composio agent toolkit for "${appData.name}". Verdict: ${appData.buildability.toUpperCase()}. ${appData.blocker !== 'none' ? 'Blocker: ' + appData.blocker + '.' : 'No blockers identified.'} Explain: 1) Why this verdict? 2) What would a Composio toolkit for ${appData.name} enable AI agents to do? 3) Estimated effort (days). Be specific.`
    );
    send('step', {
      stepId: 'buildability', status: 'complete', progress: 80,
      output: buildResult,
      data: { verdict: appData.buildability, blocker: appData.blocker }
    });

    // --- Step 9: Evidence Verification ---
    send('step', { stepId: 'verification', status: 'running', progress: 90 });
    const verifyResult = await callGroq(
      `Verify the research findings for "${appData.name}": Auth=${appData.auth.join(',')}, Access=${appData.selfServe}, API=${appData.apiType}(${appData.apiBreadth}), MCP=${appData.hasMcp}, Buildability=${appData.buildability}. Evidence: ${appData.evidenceUrl}. Are these findings consistent with your knowledge? Flag any discrepancies. Rate confidence: high/medium/low.`
    );
    send('step', {
      stepId: 'verification', status: 'complete', progress: 90,
      output: verifyResult,
      data: { confidence: appData.confidence, evidenceUrl: appData.evidenceUrl }
    });

    // --- Step 10: Final Result ---
    send('step', { stepId: 'final_result', status: 'running', progress: 95 });
    const finalResult = await callGroq(
      `Provide a final 3-sentence executive summary for "${appData.name}" as a Composio integration candidate. Include: auth method (${appData.auth.join('/')}), access model (${appData.selfServe}), buildability (${appData.buildability}), and whether it should be prioritized. End with a clear recommendation: BUILD NOW, PLAN FOR, or DEFER.`
    );
    send('step', {
      stepId: 'final_result', status: 'complete', progress: 100,
      output: finalResult,
      data: {
        name: appData.name,
        category: appData.cat,
        description: appData.desc,
        auth: appData.auth,
        selfServe: appData.selfServe,
        apiType: appData.apiType,
        apiBreadth: appData.apiBreadth,
        hasMcp: appData.hasMcp,
        buildability: appData.buildability,
        blocker: appData.blocker,
        confidence: appData.confidence,
        evidenceUrl: appData.evidenceUrl
      }
    });

    send('complete', { app: appData.name, success: true });
  } catch (err) {
    console.error('[AGENT ERROR]', err.message);
    send('error', { message: err.message || 'Agent execution failed' });
  }

  res.end();
});

/**
 * Call Groq API with a prompt and return the response text.
 * Strips <think> blocks from reasoning-model outputs.
 */
async function callGroq(prompt) {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a technical research analyst evaluating apps for Composio integration. Be factual, concise, and specific. Never fabricate information. If uncertain, say so. Do NOT wrap your answer in <think> tags or include internal reasoning — reply directly.'
      },
      { role: 'user', content: prompt }
    ],
    model: activeModel,
    temperature: 0.3,
    max_tokens: 300,
  });

  let text = completion.choices[0]?.message?.content || 'No response generated.';

  // Strip <think>...</think> blocks (some models like qwen emit these)
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  return text || 'No response generated.';
}

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Start server after model discovery
(async () => {
  await discoverModel();
  app.listen(PORT, () => {
    console.log(`\n[SERVER] Composio Research Agent running at http://localhost:${PORT}`);
    console.log(`[SERVER] Groq API: Connected`);
    console.log(`[SERVER] Active Model: ${activeModel}`);
    console.log(`[SERVER] Apps loaded: ${researchData.length}`);
  });
})();
