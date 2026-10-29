"""
AI Requirement Analyzer & Prioritization System - FastAPI application.

Entry point that assembles all routers, configures CORS, and initialises
the database on startup.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.api import projects_router, requirements_router, analysis_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup."""
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description=(
        "An AI-powered system for analyzing software requirements, "
        "assessing quality, detecting conflicts, and prioritizing "
        "requirements using multi-criteria decision analysis."
    ),
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(projects_router)
app.include_router(requirements_router)
app.include_router(analysis_router)


@app.get("/", tags=["health"])
def root():
    """Health check endpoint."""
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["health"])
def health():
    """Detailed health check."""
    return {"status": "healthy", "database": "connected"}
