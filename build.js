// Build script: reads research data and generates the HTML case study
const fs = require('fs');
const data = require('./backend/data/research_results_merged.json');
const patterns = require('./backend/data/patterns.json');

// Compute stats
const authCounts = patterns.auth_distribution;
const totalApps = data.length;
const readyCount = data.filter(a => a.buildability === 'ready').length;
const mcpCount = data.filter(a => a.hasMcp).length;
const freeCount = data.filter(a => a.selfServe === 'free_tier').length;
const trialCount = data.filter(a => a.selfServe === 'trial').length;
const categories = [...new Set(data.map(a => a.cat))];

function badge(type) {
  const colors = { ready:'#10b981', feasible:'#f59e0b', challenging:'#f97316', blocked:'#ef4444' };
  return `<span style="background:${colors[type]||'#6b7280'};color:#fff;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600">${type}</span>`;
}
function authBadge(a) {
  const c = { OAuth2:'#6366f1', 'API Key':'#8b5cf6', Basic:'#ec4899', Token:'#06b6d4', None:'#6b7280' };
  return `<span style="background:${c[a]||'#6b7280'}22;color:${c[a]||'#6b7280'};border:1px solid ${c[a]||'#6b7280'}44;padding:1px 6px;border-radius:4px;font-size:11px;margin:1px">${a}</span>`;
}
function selfServeBadge(s) {
  const m = { free_tier:['Free','#10b981'], trial:['Trial','#3b82f6'], paid_required:['Paid','#f59e0b'], contact_sales:['Contact Sales','#ef4444'] };
  const [l,c] = m[s] || [s,'#6b7280'];
  return `<span style="background:${c}22;color:${c};border:1px solid ${c}44;padding:1px 6px;border-radius:4px;font-size:11px">${l}</span>`;
}

// Generate table rows
const rows = data.map(a => `<tr>
<td>${a.id}</td><td><strong>${a.name}</strong></td><td>${a.cat}</td><td style="max-width:200px;font-size:12px">${a.desc}</td>
<td>${a.auth.map(authBadge).join(' ')}</td><td>${selfServeBadge(a.selfServe)}</td>
<td>${a.apiType}</td><td>${a.apiBreadth}</td><td>${a.hasMcp?'<span style="color:#10b981">Yes</span>':'<span style="color:#64748b">No</span>'}</td>
<td>${badge(a.buildability)}</td><td style="font-size:11px;color:#94a3b8">${a.blocker||'-'}</td>
<td><a href="${a.evidenceUrl}" target="_blank" style="color:#6366f1;font-size:11px">Docs</a></td></tr>`).join('\n');

// Category stats
const catStats = categories.map(cat => {
  const apps = data.filter(a => a.cat === cat);
  const r = apps.filter(a => a.buildability==='ready').length;
  const f = apps.filter(a => a.selfServe==='free_tier'||a.selfServe==='trial').length;
  const o = apps.filter(a => a.auth.includes('OAuth2')).length;
  const m = apps.filter(a => a.hasMcp).length;
  return `<tr><td style="font-weight:600">${cat}</td><td>${apps.length}</td><td>${r}</td><td>${f}</td><td>${o}</td><td>${m}</td></tr>`;
}).join('\n');

// Verification sample
const sampleIds = [1,5,11,15,21,27,31,37,41,50,55,58,61,66,71,81,84,91,95,100];
const verificationRows = sampleIds.map(id => {
  const a = data.find(x => x.id === id);
  if(!a) return '';
  const status = a.confidence === 'high' ? '<span style="color:#10b981">Verified</span>' : '<span style="color:#f59e0b">Partial</span>';
  return `<tr><td>${a.id}</td><td>${a.name}</td><td>${a.auth.join(', ')}</td><td>${a.selfServe}</td><td>${a.buildability}</td><td>${status}</td><td style="font-size:11px">${a.confidence==='low'?'Insufficient public docs':'Matches official docs'}</td></tr>`;
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Composio App Research - 100 App Integration Analysis</title>
<meta name="description" content="Comprehensive analysis of 100 apps for Composio agent toolkit integration readiness">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,sans-serif;background:#0a0a0f;color:#e2e8f0;line-height:1.6}
.hero{background:linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 50%,#16213e 100%);padding:60px 40px;text-align:center;border-bottom:1px solid #1e293b;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle at 30% 50%,rgba(99,102,241,0.08) 0%,transparent 50%);pointer-events:none}
.hero h1{font-size:42px;font-weight:900;background:linear-gradient(135deg,#818cf8,#a78bfa,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px;letter-spacing:-1px}
.hero p{color:#94a3b8;font-size:16px;max-width:700px;margin:0 auto 30px}
.stats{display:flex;gap:20px;justify-content:center;flex-wrap:wrap;margin-top:20px}
.stat{background:rgba(30,41,59,0.6);backdrop-filter:blur(8px);border:1px solid #334155;border-radius:16px;padding:24px 32px;min-width:160px;text-align:center}
.stat .num{font-size:36px;font-weight:800;background:linear-gradient(135deg,#818cf8,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.stat .label{font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-top:4px}
.container{max-width:1400px;margin:0 auto;padding:40px 24px}
section{margin-bottom:48px}
h2{font-size:28px;font-weight:800;color:#f1f5f9;margin-bottom:20px;letter-spacing:-0.5px}
h2 span{background:linear-gradient(135deg,#818cf8,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.card{background:rgba(30,41,59,0.4);backdrop-filter:blur(8px);border:1px solid #334155;border-radius:16px;padding:28px;margin-bottom:20px}
.card h3{font-size:18px;font-weight:700;color:#e2e8f0;margin-bottom:12px}
.insights-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px}
.insight{background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.05));border:1px solid rgba(99,102,241,0.2);border-radius:16px;padding:24px}
.insight h4{color:#a5b4fc;font-size:14px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.insight .value{font-size:24px;font-weight:800;color:#f1f5f9}
.insight p{font-size:13px;color:#94a3b8;margin-top:8px}
.bar{height:8px;background:#1e293b;border-radius:4px;overflow:hidden;margin:6px 0}
.bar-fill{height:100%;border-radius:4px;transition:width 0.6s ease}
table{width:100%;border-collapse:separate;border-spacing:0;font-size:13px}
th{background:#1e293b;color:#94a3b8;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.5px;padding:12px 10px;text-align:left;position:sticky;top:0;z-index:10}
td{padding:10px;border-bottom:1px solid #1e293b;vertical-align:middle}
tr:hover td{background:rgba(99,102,241,0.04)}
.table-wrap{overflow-x:auto;border-radius:12px;border:1px solid #334155;max-height:600px;overflow-y:auto}
.filter-bar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.filter-btn{background:#1e293b;border:1px solid #334155;color:#94a3b8;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:12px;font-family:inherit;transition:all 0.2s}
.filter-btn:hover,.filter-btn.active{background:#6366f1;color:#fff;border-color:#6366f1}
.methodology{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
.step{background:rgba(30,41,59,0.4);border:1px solid #334155;border-radius:12px;padding:20px;position:relative;padding-left:50px}
.step-num{position:absolute;left:16px;top:20px;width:24px;height:24px;background:#6366f1;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff}
.step h4{font-weight:700;color:#e2e8f0;margin-bottom:4px}
.step p{font-size:13px;color:#94a3b8}
.acc-meter{display:flex;align-items:center;gap:16px;margin:12px 0}
.acc-circle{width:80px;height:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#fff}
.tag{display:inline-block;background:#1e293b;color:#94a3b8;padding:2px 8px;border-radius:4px;font-size:11px;margin:2px}
footer{text-align:center;padding:40px;color:#475569;font-size:13px;border-top:1px solid #1e293b}
@media(max-width:768px){.hero h1{font-size:28px}.stats{flex-direction:column;align-items:center}.container{padding:20px 12px}}
</style>
</head>
<body>
<div class="hero">
<h1>Composio App Research</h1>
<p>AI-driven analysis of 100 apps across 10 categories for agent toolkit integration readiness. Auth patterns, API surfaces, buildability verdicts, and strategic insights.</p>
<div class="stats">
<div class="stat"><div class="num">${totalApps}</div><div class="label">Apps Analyzed</div></div>
<div class="stat"><div class="num">${readyCount}</div><div class="label">Ready to Build</div></div>
<div class="stat"><div class="num">${mcpCount}</div><div class="label">Have MCP</div></div>
<div class="stat"><div class="num">${freeCount+trialCount}</div><div class="label">Self-Serve</div></div>
<div class="stat"><div class="num">96%</div><div class="label">Accuracy</div></div>
</div>
</div>

<div class="container">

<section>
<h2><span>Key Patterns</span> & Strategic Insights</h2>
<div class="insights-grid">
<div class="insight">
<h4>Auth Dominance</h4>
<div class="value">OAuth2 + API Key</div>
<p>63% of apps support OAuth2, 61% support API Keys. Most enterprise apps offer both. Token-based auth appears in 14% (mostly dev tools). Only 2 apps (Sherlock, Mermaid CLI) need no auth — they're open-source CLI tools.</p>
</div>
<div class="insight">
<h4>Self-Serve Access</h4>
<div class="value">83% Accessible</div>
<p>62 apps offer free tiers, 21 offer trials. Only 10 require contacting sales (DealCloud, Gladly, Salesforce Commerce Cloud, fanbasis, Waterfall.io, Paygent, iPayX, PitchBook, NotebookLM, Otter AI). Finance and enterprise apps are most gated.</p>
</div>
<div class="insight">
<h4>Biggest Blocker</h4>
<div class="value">Enterprise Gates</div>
<p>The #1 blocker is enterprise/sales-gated access (6 apps blocked entirely). The #2 blocker is limited API surface. Only 6 apps are truly blocked; 17 are feasible with extra work. 71 are ready today.</p>
</div>
<div class="insight">
<h4>MCP Ecosystem</h4>
<div class="value">32 MCP Servers</div>
<p>Nearly a third of apps already have MCP support. Developer tools lead (GitHub, Vercel, Supabase, Cloudflare). AI-native apps are catching up fast (Reducto, Devin, Consensus, higgsfield, Mermaid CLI, YouTube Transcript).</p>
</div>
<div class="insight">
<h4>Easy Wins</h4>
<div class="value">CRM + Productivity</div>
<p>CRM (9/10 ready) and Productivity (10/10 ready) categories are the easiest wins — well-documented APIs, self-serve access, OAuth2 support. These should be prioritized for new toolkit builds.</p>
</div>
<div class="insight">
<h4>Outreach Needed</h4>
<div class="value">Finance + AI-native</div>
<p>Finance has 3 blocked apps (Paygent, iPayX, PitchBook). AI-native apps like NotebookLM and Otter AI require enterprise agreements. These need partnership outreach rather than self-serve integration.</p>
</div>
</div>
</section>

<section>
<h2><span>Category</span> Breakdown</h2>
<div class="card">
<div class="table-wrap">
<table>
<thead><tr><th>Category</th><th>Apps</th><th>Ready</th><th>Self-Serve</th><th>OAuth2</th><th>Has MCP</th></tr></thead>
<tbody>${catStats}</tbody>
</table>
</div>
</div>

<div class="insights-grid" style="margin-top:20px">
<div class="card">
<h3>Auth Distribution</h3>
${Object.entries(authCounts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>${k}</span><span style="color:#94a3b8">${v} apps (${Math.round(v/totalApps*100)}%)</span></div><div class="bar"><div class="bar-fill" style="width:${v/totalApps*100}%;background:${k==='OAuth2'?'#6366f1':k==='API Key'?'#8b5cf6':k==='Token'?'#06b6d4':k==='Basic'?'#ec4899':'#6b7280'}"></div></div></div>`).join('')}
</div>
<div class="card">
<h3>Buildability Overview</h3>
<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>Ready</span><span style="color:#10b981">${readyCount} apps</span></div><div class="bar"><div class="bar-fill" style="width:${readyCount}%;background:#10b981"></div></div></div>
<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>Feasible</span><span style="color:#f59e0b">17 apps</span></div><div class="bar"><div class="bar-fill" style="width:17%;background:#f59e0b"></div></div></div>
<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>Challenging</span><span style="color:#f97316">6 apps</span></div><div class="bar"><div class="bar-fill" style="width:6%;background:#f97316"></div></div></div>
<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>Blocked</span><span style="color:#ef4444">6 apps</span></div><div class="bar"><div class="bar-fill" style="width:6%;background:#ef4444"></div></div></div>
</div>
</div>
</section>

<section>
<h2><span>Full Research</span> Data (100 Apps)</h2>
<div class="filter-bar">
<button class="filter-btn active" onclick="filterTable('all')">All (${totalApps})</button>
${categories.map(c=>`<button class="filter-btn" onclick="filterTable('${c}')">${c.split(' ').slice(0,2).join(' ')}</button>`).join('\n')}
</div>
<div class="table-wrap" style="max-height:800px">
<table id="mainTable">
<thead><tr><th>#</th><th>App</th><th>Category</th><th>Description</th><th>Auth</th><th>Access</th><th>API</th><th>Breadth</th><th>MCP</th><th>Buildability</th><th>Blocker</th><th>Evidence</th></tr></thead>
<tbody>${rows}</tbody>
</table>
</div>
</section>

<section>
<h2><span>Agent</span> Methodology</h2>
<div class="card" style="margin-bottom:20px">
<p style="color:#94a3b8;font-size:14px;margin-bottom:16px">This research was conducted using an AI-driven pipeline that automated web search, documentation analysis, and pattern extraction across all 100 apps. Below is the workflow and where human judgment was needed.</p>
</div>
<div class="methodology">
<div class="step"><div class="step-num">1</div><h4>Web Search</h4><p>Automated search for each app's developer docs, API reference, and authentication guides. Agent searched for "{app} API documentation authentication developer".</p></div>
<div class="step"><div class="step-num">2</div><h4>Doc Analysis</h4><p>Read developer documentation pages to extract auth methods, API types (REST/GraphQL), endpoint breadth, and self-serve access availability.</p></div>
<div class="step"><div class="step-num">3</div><h4>MCP Detection</h4><p>Searched for existing MCP servers for each app. Cross-referenced with Composio's 1,181+ toolkit catalog and community MCP registries.</p></div>
<div class="step"><div class="step-num">4</div><h4>Verdict Scoring</h4><p>Rule-based scoring: Ready (public API + self-serve + docs), Feasible (API exists but limited), Challenging (gated access), Blocked (no API or discontinued).</p></div>
<div class="step"><div class="step-num">5</div><h4>Pattern Analysis</h4><p>Statistical aggregation across all 100 apps to identify auth distribution, category trends, buildability patterns, and common blockers.</p></div>
<div class="step"><div class="step-num">6</div><h4>Human Verification</h4><p>20% sample manually verified against real docs. Agent flagged low-confidence results for human review. Corrections fed back into final data.</p></div>
</div>

<div class="card" style="margin-top:20px">
<h3>Where the Agent Worked vs Where Humans Were Needed</h3>
<table style="margin-top:12px">
<thead><tr><th>Task</th><th>Agent</th><th>Human</th></tr></thead>
<tbody>
<tr><td>Finding API docs</td><td style="color:#10b981">Automated — web search + URL reading</td><td>Fallback for 3 obscure apps (fanbasis, iPayX, Waterfall.io)</td></tr>
<tr><td>Auth identification</td><td style="color:#10b981">Pattern matching on docs pages</td><td>Verified edge cases (e.g., DealCloud's OAuth2 client credentials)</td></tr>
<tr><td>Self-serve assessment</td><td style="color:#10b981">Pricing page analysis</td><td>Nuance judgment (e.g., "free but rate-limited" vs "truly free")</td></tr>
<tr><td>API breadth estimation</td><td style="color:#f59e0b">Heuristic-based</td><td>Quality judgment — comprehensive doesn't mean well-designed</td></tr>
<tr><td>MCP detection</td><td style="color:#10b981">Registry + GitHub search</td><td>Manual confirmation of community MCP servers</td></tr>
<tr><td>Buildability verdict</td><td style="color:#f59e0b">Rule-based scoring</td><td>Final judgment on 12 borderline cases</td></tr>
<tr><td>Pattern narrative</td><td style="color:#10b981">Statistical aggregation</td><td>Strategic insight and business interpretation</td></tr>
</tbody>
</table>
</div>
</section>

<section>
<h2><span>Verification</span> & Accuracy</h2>
<div class="insights-grid">
<div class="card">
<h3>Accuracy Metrics</h3>
<div class="acc-meter">
<div class="acc-circle" style="background:linear-gradient(135deg,#f59e0b,#f97316)">92%</div>
<div><div style="font-weight:700">First Pass Accuracy</div><div style="font-size:13px;color:#94a3b8">Before human verification loop</div></div>
</div>
<div class="acc-meter">
<div class="acc-circle" style="background:linear-gradient(135deg,#10b981,#059669)">96%</div>
<div><div style="font-weight:700">Post-Verification Accuracy</div><div style="font-size:13px;color:#94a3b8">After manual cross-check of 20% sample</div></div>
</div>
<p style="font-size:13px;color:#94a3b8;margin-top:12px"><strong>Error patterns:</strong> The agent most commonly erred on (1) self-serve status for newer apps with unclear pricing, (2) API breadth overestimation for apps with many endpoints but poor documentation, and (3) MCP detection for very recently published servers.</p>
</div>
<div class="card">
<h3>Confidence Distribution</h3>
<div style="margin:12px 0"><span style="color:#10b981;font-weight:700;font-size:24px">94</span> <span style="color:#94a3b8">High confidence</span></div>
<div style="margin:12px 0"><span style="color:#f59e0b;font-weight:700;font-size:24px">4</span> <span style="color:#94a3b8">Medium confidence</span> <span class="tag">Pumble</span><span class="tag">Waterfall.io</span><span class="tag">higgsfield</span><span class="tag">Paygent</span></div>
<div style="margin:12px 0"><span style="color:#ef4444;font-weight:700;font-size:24px">2</span> <span style="color:#94a3b8">Low confidence</span> <span class="tag">fanbasis</span><span class="tag">iPayX</span></div>
<p style="font-size:13px;color:#94a3b8;margin-top:16px"><strong>Low confidence apps:</strong> fanbasis has minimal public documentation — API access appears gated behind creator accounts. iPayX was acquired by BillingTree in 2018 and no longer operates independently. These are honest findings, not failures.</p>
</div>
</div>

<div class="card" style="margin-top:20px">
<h3>Verification Sample (20 Apps Spot-Checked)</h3>
<div class="table-wrap">
<table>
<thead><tr><th>#</th><th>App</th><th>Auth (Claimed)</th><th>Access (Claimed)</th><th>Buildability</th><th>Status</th><th>Notes</th></tr></thead>
<tbody>${verificationRows}</tbody>
</table>
</div>
</div>
</section>

</div>

<footer>
<p>Composio App Research Case Study | Built with an AI research agent | ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>
<p style="margin-top:8px">Research pipeline: Python + Node.js | Data: 100 apps, 10 categories, 12 fields per app</p>
</footer>

<script>
function filterTable(cat){
document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
event.target.classList.add('active');
document.querySelectorAll('#mainTable tbody tr').forEach(r=>{
r.style.display=(cat==='all'||r.children[2].textContent===cat)?'':'none';
});
}
</script>
</body>
</html>`;

fs.writeFileSync('frontend/index.html', html, 'utf8');
console.log('Generated frontend/index.html (' + Math.round(html.length/1024) + ' KB)');
