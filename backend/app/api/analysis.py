"""Analysis and prioritization endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.requirement import Requirement
from app.models.project import Project
from app.schemas.analysis import (
    AnalysisRequest,
    AnalysisResponse,
    PrioritizationResult,
    InsightResponse,
)
from app.services.analyzer_service import AnalyzerService
from app.services.prioritization_service import PrioritizationService
from app.utils.helpers import get_or_404

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.post("/run", response_model=dict)
def run_analysis(payload: AnalysisRequest, db: Session = Depends(get_db)):
    """
    Run AI analysis on requirements within a project.
    If requirement_ids is omitted, analyzes all requirements in the project.
    """
    get_or_404(
        db.query(Project).filter(Project.id == payload.project_id),
        "Project",
    )

    query = db.query(Requirement).filter(Requirement.project_id == payload.project_id)
    if payload.requirement_ids:
        query = query.filter(Requirement.id.in_(payload.requirement_ids))

    requirements = query.order_by(Requirement.id).all()
    if not requirements:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No requirements found for analysis",
        )

    result = AnalyzerService.analyze_requirements(
        db, requirements, deep_analysis=payload.deep_analysis
    )
    return result


@router.post("/prioritize", response_model=PrioritizationResult)
def prioritize_requirements(payload: AnalysisRequest, db: Session = Depends(get_db)):
    """
    Compute priority scores and rank requirements for a project.
    """
    get_or_404(
        db.query(Project).filter(Project.id == payload.project_id),
        "Project",
    )

    query = db.query(Requirement).filter(Requirement.project_id == payload.project_id)
    if payload.requirement_ids:
        query = query.filter(Requirement.id.in_(payload.requirement_ids))

    requirements = query.order_by(Requirement.id).all()
    if not requirements:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No requirements found to prioritize",
        )

    # Ensure analysis has been run so quality scores exist
    unanalyzed = [r for r in requirements if r.quality_score == 0]
    if unanalyzed:
        AnalyzerService.analyze_requirements(db, unanalyzed, deep_analysis=False)

    return PrioritizationService.prioritize(db, requirements)


@router.get("/insights/{project_id}", response_model=InsightResponse)
def get_insights(project_id: int, db: Session = Depends(get_db)):
    """Get aggregated project-level insights for the dashboard."""
    get_or_404(
        db.query(Project).filter(Project.id == project_id),
        "Project",
    )
    requirements = (
        db.query(Requirement)
        .filter(Requirement.project_id == project_id)
        .all()
    )
    return PrioritizationService.generate_insights(db, requirements)


@router.get("/history/{requirement_id}", response_model=list[AnalysisResponse])
def get_analysis_history(requirement_id: int, db: Session = Depends(get_db)):
    """Retrieve stored analysis results for a specific requirement."""
    get_or_404(
        db.query(Requirement).filter(Requirement.id == requirement_id),
        "Requirement",
    )
    return AnalyzerService.get_analysis_history(db, requirement_id)
