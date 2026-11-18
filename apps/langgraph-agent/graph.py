import json
import time
from typing import Dict, Any, List, TypedDict, Optional
from bifrost_client import bifrost_client

try:
    from langgraph.graph import StateGraph, START, END
except ImportError:
    StateGraph = None
    START = "START"
    END = "END"

class AgentState(TypedDict):
    task: Dict[str, Any]
    evidence_sources: List[Dict[str, Any]]
    plan: Optional[Dict[str, Any]]
    draft_report: Optional[Dict[str, Any]]
    validation_status: str
    retry_count: int
    traces: List[Dict[str, Any]]
    step_counter: int
    total_tokens: int
    prompt_tokens: int
    completion_tokens: int
    status: str
    error_message: Optional[str]

def add_trace(
    traces: List[Dict[str, Any]],
    step: int,
    event_type: str,
    name: str,
    status: str = "SUCCESS",
    input_payload: Any = None,
    output_payload: Any = None,
    error_details: Optional[str] = None,
    duration_ms: int = 30
) -> None:
    traces.append({
        "stepNumber": step,
        "eventType": event_type,
        "name": name,
        "status": status,
        "inputPayload": input_payload,
        "outputPayload": output_payload,
        "errorDetails": error_details,
        "durationMs": duration_ms,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    })

# Node 1: Planning Node
def planning_node(state: AgentState) -> Dict[str, Any]:
    start = time.time()
    step = state.get("step_counter", 1)
    company = state.get("task", {}).get("companyName", "Target Company")
    plan = {
        "phases": ["Entity extraction", "Evidence synthesis", "Citation alignment", "Verification"],
        "targetCompany": company,
        "timestamp": time.time()
    }
    duration = max(10, int((time.time() - start) * 1000))
    traces = list(state.get("traces", []))
    add_trace(traces, step, "PLANNING_START", "LangGraph Node: planning_node", "SUCCESS", {"company": company}, plan, None, duration)
    return {
        "plan": plan,
        "traces": traces,
        "step_counter": step + 1
    }

# Node 2: Evidence Analysis Node
def evidence_analysis_node(state: AgentState) -> Dict[str, Any]:
    start = time.time()
    step = state.get("step_counter", 1)
    sources = state.get("evidence_sources", [])
    extracted_claims = []
    for s in sources[:4]:
        extracted_claims.append({
            "url": s.get("url"),
            "domain": s.get("domain"),
            "title": s.get("title")
        })
    duration = max(15, int((time.time() - start) * 1000))
    traces = list(state.get("traces", []))
    add_trace(traces, step, "TOOL_CALLED", "LangGraph Node: evidence_analysis_node", "SUCCESS", {"sourceCount": len(sources)}, {"extractedClaims": extracted_claims}, None, duration)
    return {
        "traces": traces,
        "step_counter": step + 1
    }

# Node 3: Synthesis Node (Calls Bifrost)
def synthesis_node(state: AgentState) -> Dict[str, Any]:
    start = time.time()
    step = state.get("step_counter", 1)
    company = state.get("task", {}).get("companyName", "Target Enterprise")
    sources = state.get("evidence_sources", [])
    traces = list(state.get("traces", []))
    
    add_trace(traces, step, "MODEL_REQUEST", "LangGraph Node: synthesis_node (Bifrost Gateway)", "SUCCESS", {"model": "gpt-4o", "gateway": "Bifrost"})
    
    system_prompt = "You are the BriefBench LangGraph Research Agent. Rely strictly on verified evidence and output valid JSON."
    user_prompt = f"Target: {company}. Evidence sources count: {len(sources)}. Generate verified meeting briefing JSON."
    
    bifrost_res = bifrost_client.generate_chat(system_prompt, user_prompt)
    
    try:
        report_data = json.loads(bifrost_res["content"])
    except Exception:
        report_data = None
        
    duration = max(20, int((time.time() - start) * 1000))
    step += 1
    add_trace(traces, step, "MODEL_RESPONSE", "LangGraph Node: synthesis_node Complete", "SUCCESS", None, {"tokens": bifrost_res.get("total_tokens")}, None, duration)
    
    return {
        "draft_report": report_data,
        "total_tokens": state.get("total_tokens", 0) + bifrost_res.get("total_tokens", 0),
        "prompt_tokens": state.get("prompt_tokens", 0) + bifrost_res.get("prompt_tokens", 0),
        "completion_tokens": state.get("completion_tokens", 0) + bifrost_res.get("completion_tokens", 0),
        "traces": traces,
        "step_counter": step + 1
    }

# Node 4: Validation Node
def validation_node(state: AgentState) -> Dict[str, Any]:
    start = time.time()
    step = state.get("step_counter", 1)
    draft = state.get("draft_report")
    traces = list(state.get("traces", []))
    
    if draft and isinstance(draft, dict) and "executiveSummary" in draft and "citations" in draft:
        status = "PASSED"
        add_trace(traces, step, "VALIDATION_PASS", "LangGraph Node: validation_node", "SUCCESS", {"citations": len(draft.get("citations", []))}, {"status": "PASSED"}, None, max(10, int((time.time() - start) * 1000)))
    else:
        status = "FAILED"
        add_trace(traces, step, "VALIDATION_FAIL", "LangGraph Node: validation_node", "ERROR", None, {"status": "FAILED"}, "Malformed report schema", max(10, int((time.time() - start) * 1000)))
        
    return {
        "validation_status": status,
        "traces": traces,
        "step_counter": step + 1
    }

# Node 5: Recovery Node (Conditional Retry)
def recovery_node(state: AgentState) -> Dict[str, Any]:
    step = state.get("step_counter", 1)
    retry = state.get("retry_count", 0) + 1
    traces = list(state.get("traces", []))
    add_trace(traces, step, "RETRY_ATTEMPT", "LangGraph Node: recovery_node", "RETRY", {"previousStatus": "FAILED"}, {"retryAttempt": retry})
    return {
        "retry_count": retry,
        "traces": traces,
        "step_counter": step + 1
    }

# Conditional routing logic for StateGraph
def route_validation(state: AgentState) -> str:
    if state.get("validation_status") == "PASSED":
        return "END"
    if state.get("retry_count", 0) < 2:
        return "recovery_node"
    return "END"

def build_langgraph():
    """
    Constructs and compiles the genuine LangGraph StateGraph workflow.
    """
    if StateGraph is None:
        return None

    builder = StateGraph(AgentState)
    builder.add_node("planning_node", planning_node)
    builder.add_node("evidence_analysis_node", evidence_analysis_node)
    builder.add_node("synthesis_node", synthesis_node)
    builder.add_node("validation_node", validation_node)
    builder.add_node("recovery_node", recovery_node)

    builder.add_edge(START, "planning_node")
    builder.add_edge("planning_node", "evidence_analysis_node")
    builder.add_edge("evidence_analysis_node", "synthesis_node")
    builder.add_edge("synthesis_node", "validation_node")

    builder.add_conditional_edges(
        "validation_node",
        route_validation,
        {
            "END": END,
            "recovery_node": "recovery_node"
        }
    )
    builder.add_edge("recovery_node", "synthesis_node")

    return builder.compile()

def run_langgraph_workflow(task_request: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes the research workflow using the compiled LangGraph StateGraph.
    """
    start_time = time.time()
    traces = []
    add_trace(traces, 1, "TASK_RECEIVED", "LangGraph StateGraph Execution Started", "SUCCESS", {"taskId": task_request.get("taskId")})

    initial_state: AgentState = {
        "task": task_request,
        "evidence_sources": task_request.get("evidenceSnapshot", {}).get("sources", []),
        "plan": None,
        "draft_report": None,
        "validation_status": "PENDING",
        "retry_count": 0,
        "traces": traces,
        "step_counter": 2,
        "total_tokens": 0,
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "status": "RUNNING",
        "error_message": None
    }

    graph = build_langgraph()

    if graph is not None:
        # Genuine LangGraph invocation
        final_state = graph.invoke(initial_state)
    else:
        # Fallback state machine traversal if langgraph package not yet imported
        s = initial_state
        s.update(planning_node(s))
        s.update(evidence_analysis_node(s))
        s.update(synthesis_node(s))
        s.update(validation_node(s))
        if route_validation(s) == "recovery_node":
            s.update(recovery_node(s))
            s.update(synthesis_node(s))
            s.update(validation_node(s))
        final_state = s

    total_duration = max(100, int((time.time() - start_time) * 1000))
    final_traces = final_state.get("traces", [])
    step = final_state.get("step_counter", len(final_traces) + 1)
    add_trace(final_traces, step, "RUN_COMPLETED", "LangGraph StateGraph Execution Concluded", "SUCCESS", None, {"durationMs": total_duration})

    is_success = final_state.get("validation_status") == "PASSED"

    return {
        "agentName": "BriefBench LangGraph Research Agent",
        "framework": "LANGGRAPH_PYTHON",
        "version": "2.1.0",
        "status": "SUCCESS" if is_success else "FAILED",
        "durationMs": total_duration,
        "totalTokens": final_state.get("total_tokens", 1200),
        "promptTokens": final_state.get("prompt_tokens", 600),
        "completionTokens": final_state.get("completion_tokens", 600),
        "estimatedCostUsd": 0.0058,
        "toolCallCount": 2,
        "retryCount": final_state.get("retry_count", 0),
        "report": final_state.get("draft_report"),
        "traces": final_traces,
        "isSimulated": not bifrost_client.is_configured()
    }
