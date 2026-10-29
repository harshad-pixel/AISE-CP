"""Shared utility functions for the API layer."""
from typing import Any, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Query


def get_or_404(db_query: Query, model_name: str = "Resource") -> Any:
    """Fetch a single record or raise 404."""
    obj = db_query.first()
    if obj is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{model_name} not found",
        )
    return obj


def paginate(query: Query, page: int = 1, per_page: int = 20) -> tuple[list, dict]:
    """
    Paginate a SQLAlchemy query.
    Returns (items, meta) where meta has page, per_page, total, pages, has_next, has_prev.
    """
    page = max(page, 1)
    per_page = max(min(per_page, 100), 1)
    total = query.count()
    pages = (total + per_page - 1) // per_page if total > 0 else 1
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    meta = {
        "page": page,
        "per_page": per_page,
        "total": total,
        "pages": pages,
        "has_next": page < pages,
        "has_prev": page > 1,
    }
    return items, meta


def build_pagination_meta(page: int, per_page: int, total: int) -> dict:
    """Build pagination metadata without executing a query."""
    pages = (total + per_page - 1) // per_page if total > 0 else 1
    return {
        "page": page,
        "per_page": per_page,
        "total": total,
        "pages": pages,
        "has_next": page < pages,
        "has_prev": page > 1,
    }
