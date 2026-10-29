"""
Analyzer Service - Orchestrates AI analysis of requirements.

Combines NLPService text analysis with cross-requirement checks (conflict
detection, duplicate / similarity detection, dependency validation) and
persists results to the database.
"""
from typing import Optional

from sqlalchemy.orm import Session

from app.models.requirement import Requirement
from app.models.analysis import AnalysisResult
from app.services.nlp_service import NLPService


class AnalyzerService:
    """High-level analysis orchestration for requirements."""

    # ------------------------------------------------------------------
    # Single-requirement analysis
    # ------------------------------------------------------------------

    @staticmethod
    def analyze_requirement(db: Session, requirement: Requirement) -> dict:
        """
        Run the full analysis pipeline on one requirement and persist results.
        Returns the analysis summary dict.
        """
        text = f"{requirement.title} {requirement.description}"
        result = NLPService.analyze(
            text=text,
            title=requirement.title,
            acceptance_criteria=requirement.acceptance_criteria or "",
        )

        # Update requirement with analysis-derived fields
        requirement.quality_score = result["quality_score"]
        requirement.ambiguity_score = result["ambiguity_score"]
        requirement.completeness_score = result["completeness_score"]
        requirement.ai_confidence = result["confidence"]

        # Auto-classify category if it's still the default or looks misclassified
        if requirement.category == "functional" and result["category"] != "functional":
            requirement.category = result["category"]

        # Apply urgency boost if detected and user hasn't set a high value
        if result["urgency_boost"] > 0 and requirement.urgency < 7:
            requirement.urgency = min(requirement.urgency + result["urgency_boost"], 10.0)

        # Merge AI-extracted keywords into tags
        existing_tags = requirement.tags or []
        new_keywords = [k for k in result["keywords"] if k not in existing_tags]
        requirement.tags = existing_tags + new_keywords[:5]

        # Persist a quality analysis result
        analysis = AnalysisResult(
            requirement_id=requirement.id,
            analysis_type="quality",
            result_data=result,
            summary=AnalyzerService._build_summary(result),
            confidence=result["confidence"],
        )
        db.add(analysis)
        db.commit()
        db.refresh(requirement)

        return result

    @staticmethod
    def _build_summary(result: dict) -> str:
        """Generate a human-readable summary of the analysis."""
        parts = []
        parts.append(f"Category: {result['category']} (confidence {result['category_confidence']})")
        parts.append(f"Quality score: {result['quality_score']}/100")

        if result["ambiguous_terms"]:
            parts.append(f"Ambiguous terms found: {', '.join(result['ambiguous_terms'])}")
        if result["missing_aspects"]:
            parts.append(f"Missing aspects: {', '.join(result['missing_aspects'])}")
        if result["urgency_signals"]:
            parts.append(f"Urgency signals: {', '.join(result['urgency_signals'])}")
        if result["dependencies"]:
            parts.append(f"Dependencies detected: {', '.join(result['dependencies'])}")

        return " | ".join(parts)

    # ------------------------------------------------------------------
    # Cross-requirement analysis
    # ------------------------------------------------------------------

    @staticmethod
    def detect_conflicts(db: Session, requirements: list[Requirement]) -> list[dict]:
        """
        Detect potential conflicts between requirements using keyword overlap
        with opposing intent words (e.g. must / must not).
        """
        conflicts: list[dict] = []
        opposites = [
            ("must", "must not"),
            ("shall", "shall not"),
            ("allow", "deny"),
            ("enable", "disable"),
            ("include", "exclude"),
            ("allow", "block"),
        ]

        for i, req_a in enumerate(requirements):
            for req_b in requirements[i + 1:]:
                text_a = f"{req_a.title} {req_a.description}".lower()
                text_b = f"{req_b.title} {req_b.description}".lower()
                sim = NLPService.text_similarity(
                    f"{req_a.title} {req_a.description}",
                    f"{req_b.title} {req_b.description}",
                )
                if sim < 0.15:
                    continue

                for pos, neg in opposites:
                    if pos in text_a and neg in text_b or neg in text_a and pos in text_b:
                        conflicts.append({
                            "requirement_a": {"id": req_a.id, "title": req_a.title},
                            "requirement_b": {"id": req_b.id, "title": req_b.title},
                            "similarity": sim,
                            "issue": f"Potential conflict: '{pos}' vs '{neg}' between similar requirements",
                        })
                        analysis = AnalysisResult(
                            requirement_id=req_a.id,
                            analysis_type="conflict",
                            result_data={
                                "conflicting_with": req_b.id,
                                "similarity": sim,
                                "issue": f"Potential conflict: '{pos}' vs '{neg}'",
                            },
                            summary=f"Conflict detected with requirement #{req_b.id}: {req_b.title}",
                            confidence=0.6,
                        )
                        db.add(analysis)
                        break

        if conflicts:
            db.commit()
        return conflicts

    @staticmethod
    def detect_duplicates(db: Session, requirements: list[Requirement], threshold: float = 0.65) -> list[dict]:
        """
        Detect likely duplicate requirements based on text similarity.
        """
        duplicates: list[dict] = []

        for i, req_a in enumerate(requirements):
            for req_b in requirements[i + 1:]:
                text_a = f"{req_a.title} {req_a.description}"
                text_b = f"{req_b.title} {req_b.description}"
                sim = NLPService.text_similarity(text_a, text_b)

                if sim >= threshold:
                    duplicates.append({
                        "requirement_a": {"id": req_a.id, "title": req_a.title},
                        "requirement_b": {"id": req_b.id, "title": req_b.title},
                        "similarity": sim,
                        "recommendation": "Consider merging these requirements",
                    })
                    analysis = AnalysisResult(
                        requirement_id=req_a.id,
                        analysis_type="similarity",
                        result_data={
                            "similar_to": req_b.id,
                            "similarity": sim,
                            "recommendation": "Consider merging",
                        },
                        summary=f"High similarity ({sim:.0%}) with requirement #{req_b.id}",
                        confidence=sim,
                    )
                    db.add(analysis)

        if duplicates:
            db.commit()
        return duplicates

    # ------------------------------------------------------------------
    # Batch analysis
    # ------------------------------------------------------------------

    @staticmethod
    def analyze_requirements(
        db: Session,
        requirements: list[Requirement],
        deep_analysis: bool = False,
    ) -> dict:
        """
        Analyze a batch of requirements.  Runs per-requirement analysis,
        optionally followed by conflict and duplicate detection.
        """
        results = []
        for req in requirements:
            result = AnalyzerService.analyze_requirement(db, req)
            results.append({"requirement_id": req.id, "title": req.title, "analysis": result})

        conflicts = []
        duplicates = []
        if deep_analysis and len(requirements) > 1:
            conflicts = AnalyzerService.detect_conflicts(db, requirements)
            duplicates = AnalyzerService.detect_duplicates(db, requirements)

        return {
            "total_analyzed": len(results),
            "analyses": results,
            "conflicts": conflicts,
            "duplicates": duplicates,
        }

    # ------------------------------------------------------------------
    # Retrieve stored analyses
    # ------------------------------------------------------------------

    @staticmethod
    def get_analysis_history(db: Session, requirement_id: int) -> list[AnalysisResult]:
        """Return all stored analysis results for a requirement, newest first."""
        return (
            db.query(AnalysisResult)
            .filter(AnalysisResult.requirement_id == requirement_id)
            .order_by(AnalysisResult.created_at.desc())
            .all()
        )
