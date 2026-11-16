from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.intelligence.risk_engine import RiskScoringEngine
from app.schemas.schemas import RiskScoreResponse

router = APIRouter()

class RiskCalculationRequest(BaseModel):
    target: str
    collected_data: Optional[Dict[str, Any]] = None

@router.post("/risk-score", response_model=RiskScoreResponse, tags=["Risk Engine"])
async def calculate_risk_score(req: RiskCalculationRequest):
    target = req.target.strip()
    if not target:
        raise HTTPException(status_code=400, detail="Target cannot be empty")

    data = req.collected_data or {}
    return RiskScoringEngine.calculate(target, data)
