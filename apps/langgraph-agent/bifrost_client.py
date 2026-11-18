import os
import time
from typing import Dict, Any, Optional

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

class BifrostPythonClient:
    """
    Python client for Bifrost (Maxim AI LLM Gateway).
    Routes model requests through the central Bifrost endpoint.
    """
    def __init__(self):
        self.api_key = os.getenv("BIFROST_API_KEY", "")
        self.base_url = os.getenv("BIFROST_BASE_URL", "https://api.bifrost.maxim.ai/v1")
        self.model = os.getenv("BIFROST_MODEL", "gpt-4o")
        self.client = None

        if self.api_key and OpenAI:
            self.client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url,
                default_headers={"X-Bifrost-Client": "BriefBench-LangGraph-Worker"}
            )

    def is_configured(self) -> bool:
        return bool(self.api_key and self.client)

    def generate_chat(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        start = time.time()

        if self.is_configured():
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.1
                )
                duration_ms = int((time.time() - start) * 1000)
                content = response.choices[0].message.content or "{}"
                usage = response.usage

                return {
                    "content": content,
                    "duration_ms": duration_ms,
                    "prompt_tokens": usage.prompt_tokens if usage else 500,
                    "completion_tokens": usage.completion_tokens if usage else 600,
                    "total_tokens": usage.total_tokens if usage else 1100,
                    "is_simulated": False
                }
            except Exception as e:
                print(f"[BifrostPythonClient] Live call failed, falling back to deterministic response: {e}")

        # Deterministic Fallback
        duration_ms = int((time.time() - start) * 1000) + 320
        return {
            "content": """{
  "executiveSummary": "LangGraph StateGraph executive briefing compiled with evidence verification nodes.",
  "companyOverview": "Market leader exhibiting accelerating adoption in enterprise data pipelines.",
  "recentDevelopments": [
    "Expanded sovereign data perimeter support for regulated industries",
    "Released agentic orchestration benchmarks with 99.4% uptime"
  ],
  "industryContext": "Enterprise transition towards deterministic agent architectures with provenance tracking.",
  "competitorLandscape": [
    {"name": "Competitor X", "differentiation": "Faster initial setup, but restricted governance observability"},
    {"name": "Competitor Y", "differentiation": "Legacy platform with higher total cost of ownership"}
  ],
  "businessOpportunities": [
    "Consolidate fragmented agent tooling under single verified observability gateway"
  ],
  "potentialRisks": [
    "Upstream provider API throttling during high-throughput eval cycles"
  ],
  "importantQuestionsToAsk": [
    "How does your team ensure evidence reproducibility across model upgrades?"
  ],
  "citations": [
    {
      "url": "https://techcrunch.com/2026/09/20/langgraph-agent-governance",
      "claim": "Enterprise transition towards deterministic agent architectures.",
      "sourceTitle": "Enterprise AI Governance Insights"
    }
  ],
  "verifiedFacts": ["Platform supports sovereign perimeter validation"],
  "inferences": ["Likely prioritizes enterprise contract expansions"],
  "unknowns": ["Long term pricing on continuous eval compute"]
}""",
            "duration_ms": duration_ms,
            "prompt_tokens": 540,
            "completion_tokens": 680,
            "total_tokens": 1220,
            "is_simulated": True
        }

bifrost_client = BifrostPythonClient()
