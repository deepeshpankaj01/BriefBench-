import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from graph import run_langgraph_workflow

app = FastAPI(
    title="BriefBench LangGraph Research Agent Service",
    description="Python microservice executing state-machine based research workflows for BriefBench.",
    version="2.1.0"
)

class AgentRunPayload(BaseModel):
    taskId: str
    taskTitle: str
    objective: str
    companyName: str
    meetingContext: Optional[Dict[str, Any]] = None
    requirements: Optional[Dict[str, Any]] = None
    evidenceSnapshot: Dict[str, Any]
    executionLimits: Optional[Dict[str, Any]] = None
    faultInjection: Optional[Dict[str, Any]] = None

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "briefbench-langgraph-agent",
        "version": "2.1.0",
        "framework": "LANGGRAPH_PYTHON"
    }

@app.get("/info")
def agent_info():
    return {
        "name": "BriefBench LangGraph Research Agent",
        "framework": "LANGGRAPH_PYTHON",
        "version": "2.1.0",
        "author": "BriefBench Core Team",
        "description": "State-machine agent with discrete planning, evidence analysis, synthesis, validation, and recovery nodes."
    }

@app.post("/agent/run")
def run_agent(payload: AgentRunPayload):
    try:
        result = run_langgraph_workflow(payload.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
