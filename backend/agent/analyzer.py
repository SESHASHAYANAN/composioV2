"""
Composio App Analyzer - Pattern analysis across all research results.

Aggregates findings from individual app research to identify
cross-cutting patterns, trends, and strategic insights.
"""

import json


def analyze_auth_patterns(results):
    """Analyze authentication method distribution across all apps."""
    auth_counts = {}
    dual_auth = 0

    for app in results:
        auths = app.get("auth", [])
        if len(auths) >= 2:
            dual_auth += 1
        for auth in auths:
            auth_counts[auth] = auth_counts.get(auth, 0) + 1

    return {
        "distribution": auth_counts,
        "dual_auth_count": dual_auth,
        "dual_auth_pct": round(dual_auth / len(results) * 100, 1),
        "dominant": max(auth_counts, key=auth_counts.get) if auth_counts else None,
    }


def analyze_access_patterns(results):
    """Analyze self-serve vs gated access patterns by category."""
    by_category = {}

    for app in results:
        cat = app.get("cat", "Unknown")
        ss = app.get("selfServe", "unknown")

        if cat not in by_category:
            by_category[cat] = {"free_tier": 0, "trial": 0, "paid_required": 0, "contact_sales": 0}

        if ss in by_category[cat]:
            by_category[cat][ss] += 1

    return by_category


def identify_easy_wins(results):
    """Identify apps that are easiest to build as agent toolkits."""
    return [
        app["name"]
        for app in results
        if app.get("buildability") == "ready"
        and app.get("selfServe") in ("free_tier", "trial")
        and app.get("confidence") == "high"
    ]


def identify_outreach_needed(results):
    """Identify apps that require partnership or sales outreach."""
    return [
        {"name": app["name"], "blocker": app.get("blocker", "unknown")}
        for app in results
        if app.get("buildability") in ("blocked", "challenging")
    ]


def generate_summary(results):
    """Generate a high-level summary of all findings."""
    total = len(results)
    ready = sum(1 for a in results if a.get("buildability") == "ready")
    feasible = sum(1 for a in results if a.get("buildability") == "feasible")
    mcp = sum(1 for a in results if a.get("hasMcp"))
    free = sum(1 for a in results if a.get("selfServe") == "free_tier")

    return {
        "total_apps": total,
        "ready_to_build": ready,
        "feasible_with_work": feasible,
        "have_mcp": mcp,
        "free_tier_access": free,
        "ready_pct": round(ready / total * 100, 1),
        "mcp_pct": round(mcp / total * 100, 1),
    }
