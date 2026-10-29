"""Pydantic schemas for analysis and prioritization endpoints."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AnalysisRequest(BaseModel):
    requirement_ids: Optional[list[int]] = None  # None = analyze all in project
    project_id: int
    deep_analysis: bool = False  # if True, also run conflict & similarity detection


class AnalysisResponse(BaseModel):
    id: int
    requirement_id: int
    analysis_type: str
    result_data: dict
    summary: str
    confidence: float
    created_at: datetime

    class Config:
        from_attributes = True


class PriorityMatrixItem(BaseModel):
    requirement_id: int
    title: str
    business_value: float
    effort: float
    priority_score: float
    quadrant: str  # quick_win, strategic, fill_in, time_sink
    category: str
    type: str


class PrioritizationResult(BaseModel):
    project_id: int
    ranked_requirements: list[dict]  # full requirement dicts with score/rank
    weights: dict[str, float]
    matrix: list[PriorityMatrixItem]
    summary: dict  # {total, analyzed, avg_score, top_priority, high_risk_count}
    recommendations: list[str]


class InsightResponse(BaseModel):
    project_id: int
    total_requirements: int
    analyzed_requirements: int
    avg_quality_score: float
    avg_ambiguity_score: float
    avg_completeness_score: float
    category_distribution: dict[str, int]
    moscow_distribution: dict[str, int]
    status_distribution: dict[str, int]
    high_priority_items: list[dict]
    high_risk_items: list[dict]
    ambiguous_items: list[dict]
    recommendations: list[str]
