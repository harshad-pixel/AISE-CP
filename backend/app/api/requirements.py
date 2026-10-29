"""Requirement CRUD and bulk-import endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.requirement import Requirement
from app.models.project import Project
from app.schemas.requirement import (
    RequirementCreate,
    RequirementUpdate,
    RequirementResponse,
    RequirementBulkCreate,
)
from app.utils.helpers import get_or_404

router = APIRouter(prefix="/api/requirements", tags=["requirements"])


@router.get("/", response_model=list[RequirementResponse])
def list_requirements(
    project_id: int = Query(None),
    category: str = Query(None),
    status: str = Query(None),
    db: Session = Depends(get_db),
):
    """List requirements with optional filters."""
    query = db.query(Requirement)
    if project_id is not None:
        query = query.filter(Requirement.project_id == project_id)
    if category:
        query = query.filter(Requirement.category == category)
    if status:
        query = query.filter(Requirement.status == status)
    return query.order_by(Requirement.priority_rank.asc()).all()


@router.get("/{requirement_id}", response_model=RequirementResponse)
def get_requirement(requirement_id: int, db: Session = Depends(get_db)):
    """Get a single requirement."""
    return get_or_404(
        db.query(Requirement).filter(Requirement.id == requirement_id),
        "Requirement",
    )


@router.post("/", response_model=RequirementResponse, status_code=status.HTTP_201_CREATED)
def create_requirement(payload: RequirementCreate, db: Session = Depends(get_db)):
    """Create a new requirement."""
    # Validate project exists
    get_or_404(
        db.query(Project).filter(Project.id == payload.project_id),
        "Project",
    )
    requirement = Requirement(**payload.model_dump())
    db.add(requirement)
    db.commit()
    db.refresh(requirement)
    return requirement


@router.post("/bulk", response_model=list[RequirementResponse], status_code=status.HTTP_201_CREATED)
def create_requirements_bulk(payload: RequirementBulkCreate, db: Session = Depends(get_db)):
    """Create multiple requirements at once."""
    get_or_404(
        db.query(Project).filter(Project.id == payload.project_id),
        "Project",
    )
    created = []
    for req_data in payload.requirements:
        requirement = Requirement(**req_data.model_dump())
        db.add(requirement)
        created.append(requirement)
    db.commit()
    for r in created:
        db.refresh(r)
    return created


@router.put("/{requirement_id}", response_model=RequirementResponse)
def update_requirement(requirement_id: int, payload: RequirementUpdate, db: Session = Depends(get_db)):
    """Update a requirement."""
    requirement = get_or_404(
        db.query(Requirement).filter(Requirement.id == requirement_id),
        "Requirement",
    )
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(requirement, key, value)
    db.commit()
    db.refresh(requirement)
    return requirement


@router.delete("/{requirement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_requirement(requirement_id: int, db: Session = Depends(get_db)):
    """Delete a requirement."""
    requirement = get_or_404(
        db.query(Requirement).filter(Requirement.id == requirement_id),
        "Requirement",
    )
    db.delete(requirement)
    db.commit()
