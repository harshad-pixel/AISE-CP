"""
Seed script - populates the database with a sample project and requirements.

Run with:  python -m app.seed
"""
import json
from pathlib import Path

from app.database import SessionLocal, init_db, engine
from app.models.project import Project
from app.models.requirement import Requirement
from app.services.analyzer_service import AnalyzerService
from app.services.prioritization_service import PrioritizationService


SEED_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "seed_requirements.json"


def seed_database():
    """Create a demo project with sample requirements and run analysis."""
    init_db()

    db = SessionLocal()
    try:
        # Check if already seeded
        existing = db.query(Project).filter(Project.name == "E-Commerce Platform Demo").first()
        if existing:
            print(f"Demo project already exists (id={existing.id}). Skipping seed.")
            return

        # Create project
        project = Project(
            name="E-Commerce Platform Demo",
            description="A demo e-commerce platform to showcase the AI Requirement Analyzer & Prioritization System.",
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        print(f"Created project: {project.name} (id={project.id})")

        # Load seed requirements
        with open(SEED_FILE, "r", encoding="utf-8") as f:
            seed_reqs = json.load(f)

        for req_data in seed_reqs:
            req = Requirement(project_id=project.id, **req_data)
            db.add(req)

        db.commit()
        print(f"Created {len(seed_reqs)} requirements")

        # Run analysis
        requirements = db.query(Requirement).filter(Requirement.project_id == project.id).all()
        print("Running AI analysis...")
        AnalyzerService.analyze_requirements(db, requirements, deep_analysis=True)
        print(f"Analyzed {len(requirements)} requirements")

        # Run prioritization
        print("Computing priorities...")
        result = PrioritizationService.prioritize(db, requirements)
        print(f"Prioritized {result['summary']['total']} requirements")
        print(f"Top priority: {result['summary']['top_priority']['title']} (score: {result['summary']['top_priority']['score']})")

        print("\n--- Recommendations ---")
        for i, rec in enumerate(result["recommendations"], 1):
            print(f"  {i}. {rec}")

        print("\nSeed complete!")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
