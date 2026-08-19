"""
Composio App Researcher - Core research logic per app.

Handles web search, documentation analysis, and data extraction
for individual app research tasks.
"""


def research_app(app_name, hint_url, category):
    """
    Research a single app for integration readiness.

    Args:
        app_name: Name of the app to research
        hint_url: Developer docs URL hint
        category: App category

    Returns:
        dict with research findings
    """
    result = {
        "name": app_name,
        "cat": category,
        "desc": "",
        "auth": [],
        "selfServe": "unknown",
        "apiType": "unknown",
        "apiBreadth": "unknown",
        "hasMcp": False,
        "buildability": "unknown",
        "blocker": "none",
        "evidenceUrl": hint_url,
        "confidence": "low",
    }

    # In production, this would:
    # 1. Search web for "{app_name} API documentation authentication"
    # 2. Read the developer docs page
    # 3. Extract auth methods via pattern matching
    # 4. Check pricing page for self-serve status
    # 5. Search for existing MCP servers
    # 6. Score buildability based on findings

    return result


def detect_auth_methods(doc_text):
    """
    Detect authentication methods from documentation text.

    Scans for keywords indicating OAuth2, API Key, Basic Auth,
    Token-based auth, or other methods.
    """
    methods = []
    text_lower = doc_text.lower()

    if "oauth" in text_lower or "oauth2" in text_lower:
        methods.append("OAuth2")
    if "api key" in text_lower or "api_key" in text_lower:
        methods.append("API Key")
    if "basic auth" in text_lower:
        methods.append("Basic")
    if "bearer token" in text_lower or "access token" in text_lower:
        methods.append("Token")

    return methods if methods else ["Unknown"]


def assess_self_serve(doc_text, pricing_text=""):
    """
    Determine if the app offers self-serve developer access.

    Returns one of: free_tier, trial, paid_required, contact_sales
    """
    text = (doc_text + " " + pricing_text).lower()

    if "free plan" in text or "free tier" in text or "free forever" in text:
        return "free_tier"
    elif "free trial" in text or "trial" in text:
        return "trial"
    elif "contact sales" in text or "contact us" in text:
        return "contact_sales"
    elif "pricing" in text:
        return "paid_required"

    return "unknown"


def score_buildability(auth, self_serve, api_breadth, has_docs):
    """
    Score an app's readiness to become an agent toolkit.

    Returns one of: ready, feasible, challenging, blocked
    """
    if not has_docs:
        return "blocked"

    if self_serve in ("contact_sales",) and api_breadth == "limited":
        return "blocked"

    if self_serve in ("contact_sales",):
        return "challenging"

    if api_breadth in ("limited",) or not auth:
        return "feasible"

    return "ready"
