"""Pydantic schemas for Requirement endpoints."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class RequirementBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: str = ""
    category: str = "functional"
    type: str = "should_have"
    business_value: float = Field(default=5.0, ge=0, le=10)
    user_impact: float = Field(default=5.0, ge=0, le=10)
    urgency: float = Field(default=5.0, ge=0, le=10)
    effort: float = Field(default=5.0, ge=0, le=10)
    risk: float = Field(default=5.0, ge=0, le=10)
    tags: list[str] = []
    dependencies: list[int] = []
    acceptance_criteria: str = ""
    status: str = "draft"


class RequirementCreate(RequirementBase):
    project_id: int


class RequirementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    type: Optional[str] = None
    business_value: Optional[float] = Field(default=None, ge=0, le=10)
    user_impact: Optional[float] = Field(default=None, ge=0, le=10)
    urgency: Optional[float] = Field(default=None, ge=0, le=10)
    effort: Optional[float] = Field(default=None, ge=0, le=10)
    risk: Optional[float] = Field(default=None, ge=0, le=10)
    tags: Optional[list[str]] = None
    dependencies: Optional[list[int]] = None
    acceptance_criteria: Optional[str] = None
    status: Optional[str] = None


class RequirementResponse(RequirementBase):
    id: int
    project_id: int
    priority_score: float
    priority_rank: int
    quality_score: float
    ambiguity_score: float
    completeness_score: float
    ai_confidence: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RequirementBulkCreate(BaseModel):
    project_id: int
    requirements: list[RequirementCreate]
