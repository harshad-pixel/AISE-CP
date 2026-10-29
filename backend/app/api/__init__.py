"""API route modules."""
from app.api.projects import router as projects_router
from app.api.requirements import router as requirements_router
from app.api.analysis import router as analysis_router

__all__ = ["projects_router", "requirements_router", "analysis_router"]
