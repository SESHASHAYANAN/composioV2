# Composio App Research Agent

AI-driven research pipeline that analyzes 100 apps for integration readiness as Composio agent toolkits.

## Project Structure

```
composio/
├── backend/                    # Research agent pipeline
│   ├── data/
│   │   ├── apps_input.json     # Input: 100 apps with metadata
│   │   └── research_results.json # Output: structured research data
│   ├── agent/
│   │   ├── researcher.py       # Core research logic per app
│   │   └── analyzer.py         # Pattern analysis across all apps
│   ├── main.py                 # Pipeline orchestrator
│   └── requirements.txt
├── frontend/
│   └── index.html              # Single-page HTML case study deliverable
└── README.md
```

## How to Run the Research Agent

### Prerequisites
- Python 3.10+
- Internet access for web research

### Setup
```bash
cd backend
pip install -r requirements.txt
```

### Run Research Pipeline
```bash
python main.py                  # Full pipeline: research → analyze → export
python main.py --verify         # Run with verification pass
python main.py --app "Salesforce"  # Research a single app
```

### View Results
Open `frontend/index.html` in any browser — it's a self-contained single-page case study.

## Methodology

1. **Automated Research**: The agent searches developer docs, API references, and pricing pages for each app.
2. **Data Extraction**: Structured fields (auth, API surface, self-serve status, MCP, buildability) are extracted.
3. **Pattern Analysis**: Cross-app patterns are computed (auth distribution, category trends, blockers).
4. **Verification**: 20% sample manually verified against real docs; accuracy metrics reported honestly.

## What the Agent Does vs Where Humans Were Needed

| Step | Agent | Human |
|------|-------|-------|
| Finding API docs | ✅ Web search + URL reading | Fallback for obscure apps |
| Auth method identification | ✅ Pattern matching on docs | Verification of edge cases |
| Self-serve assessment | ✅ Pricing page analysis | Nuance (e.g., "free but limited") |
| API breadth estimation | ⚠️ Endpoint count heuristic | Judgment on quality vs quantity |
| MCP server detection | ✅ Search for existing MCP repos | Manual confirmation |
| Buildability verdict | ⚠️ Rule-based scoring | Final judgment call |
| Pattern analysis | ✅ Statistical aggregation | Narrative insight |
