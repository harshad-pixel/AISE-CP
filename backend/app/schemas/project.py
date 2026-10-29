"""Pydantic schemas for Project endpoints."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str = ""


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ProjectResponse(ProjectBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RequirementBrief(BaseModel):
    id: int
    title: str
    priority_score: float
    priority_rank: int
    status: str
    category: str

    class Config:
        from_attributes = True


class ProjectWithRequirements(ProjectResponse):
    requirements: list[RequirementBrief] = []

    class Config:
        from_attributes = True
