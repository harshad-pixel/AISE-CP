"""
Prioritization Service - Multi-criteria requirement scoring & ranking.

Implements a weighted scoring model that combines:
  - Business Value
  - User Impact
  - Urgency
  - Effort (inverted - less effort = higher priority)
  - Risk (inverted - lower risk = higher priority)

Also produces a priority matrix (value vs effort quadrants) and a set of
actionable recommendations.
"""
from sqlalchemy.orm import Session

from app.config import settings
from app.models.requirement import Requirement
from app.services.analyzer_service import AnalyzerService


class PrioritizationService:
    """Compute priority scores, rank requirements, and generate insights."""

    # ------------------------------------------------------------------
    # Core scoring
    # ------------------------------------------------------------------

    @staticmethod
    def compute_score(req: Requirement) -> float:
        """
        Compute a 0-100 priority score for a single requirement using the
        configured weighted model.
        """
        w = settings.weights

        # Effort and risk are inverted: higher effort/risk -> lower priority
        value_component = req.business_value
        impact_component = req.user_impact
        urgency_component = req.urgency
        effort_component = 10.0 - req.effort  # invert
        risk_component = 10.0 - req.risk  # invert

        weighted = (
            value_component * w["business_value"]
            + impact_component * w["user_impact"]
            + urgency_component * w["urgency"]
            + effort_component * w["effort"]
            + risk_component * w["risk"]
        )

        # Scale 0-10 weighted to 0-100
        score = weighted * 10

        # Quality modifier: high-quality requirements get a small boost
        if req.quality_score > 0:
            quality_factor = (req.quality_score - 50) / 100  # -0.5 to +0.5
            score += score * quality_factor * 0.1

        return round(max(0, min(100, score)), 2)

    @staticmethod
    def compute_rice(req: Requirement) -> dict:
        """
        Compute a RICE score (Reach × Impact × Confidence / Effort).
        Uses the stored fields as proxies.
        """
        # Map 0-10 fields to RICE-friendly scales
        reach = req.user_impact * 10  # e.g. 0-100 users
        impact = req.business_value
        confidence = max(req.ai_confidence, 0.1) * 10  # 1-10 scale
        effort_score = max(req.effort, 0.5)  # avoid div by zero
        rice_score = (reach * impact * confidence) / effort_score
        return {
            "reach": round(reach, 1),
            "impact": round(impact, 1),
            "confidence": round(confidence, 1),
            "effort": round(effort_score, 1),
            "rice_score": round(rice_score, 2),
        }

    @staticmethod
    def determine_quadrant(business_value: float, effort: float) -> str:
        """
        Assign a requirement to a priority-matrix quadrant.
        Axes: value (high/low) vs effort (high/low), threshold at 5.
        """
        high_value = business_value >= 5
        low_effort = effort < 5

        if high_value and low_effort:
            return "quick_win"
        if high_value and not low_effort:
            return "strategic"
        if not high_value and low_effort:
            return "fill_in"
        return "time_sink"

    # ------------------------------------------------------------------
    # Batch prioritization
    # ------------------------------------------------------------------

    @staticmethod
    def prioritize(db: Session, requirements: list[Requirement]) -> dict:
        """
        Score, rank, and persist priority for a set of requirements.
        Returns a structured prioritization result.
        """
        if not requirements:
            return PrioritizationService._empty_result()

        # Compute scores
        scored: list[tuple[float, Requirement]] = []
        for req in requirements:
            score = PrioritizationService.compute_score(req)
            req.priority_score = score
            scored.append((score, req))

        # Rank by score descending
        scored.sort(key=lambda x: x[0], reverse=True)
        for rank, (score, req) in enumerate(scored, start=1):
            req.priority_rank = rank

        db.commit()

        # Build matrix
        matrix = []
        for score, req in scored:
            matrix.append({
                "requirement_id": req.id,
                "title": req.title,
                "business_value": req.business_value,
                "effort": req.effort,
                "priority_score": req.priority_score,
                "quadrant": PrioritizationService.determine_quadrant(req.business_value, req.effort),
                "category": req.category,
                "type": req.type,
            })

        # Build summary
        summary = PrioritizationService._build_summary(scored)

        # Build recommendations
        recommendations = PrioritizationService._generate_recommendations(scored, requirements)

        # Build ranked output
        ranked = []
        for score, req in scored:
            ranked.append({
                "id": req.id,
                "title": req.title,
                "category": req.category,
                "type": req.type,
                "priority_score": req.priority_score,
                "priority_rank": req.priority_rank,
                "business_value": req.business_value,
                "user_impact": req.user_impact,
                "urgency": req.urgency,
                "effort": req.effort,
                "risk": req.risk,
                "quality_score": req.quality_score,
                "status": req.status,
                "rice": PrioritizationService.compute_rice(req),
            })

        return {
            "project_id": requirements[0].project_id,
            "ranked_requirements": ranked,
            "weights": settings.weights,
            "matrix": matrix,
            "summary": summary,
            "recommendations": recommendations,
        }

    # ------------------------------------------------------------------
    # Summary & recommendations
    # ------------------------------------------------------------------

    @staticmethod
    def _build_summary(scored: list[tuple[float, Requirement]]) -> dict:
        scores = [s for s, _ in scored]
        reqs = [r for _, r in scored]
        high_risk = [r for r in reqs if r.risk >= 7]

        return {
            "total": len(scored),
            "analyzed": sum(1 for r in reqs if r.quality_score > 0),
            "avg_score": round(sum(scores) / len(scores), 2) if scores else 0,
            "top_priority": {"id": reqs[0].id, "title": reqs[0].title, "score": scores[0]} if scored else None,
            "high_risk_count": len(high_risk),
        }

    @staticmethod
    def _generate_recommendations(
        scored: list[tuple[float, Requirement]],
        all_reqs: list[Requirement],
    ) -> list[str]:
        """Generate actionable recommendations based on the analysis."""
        recs: list[str] = []
        reqs = [r for _, r in scored]

        # Top priority recommendation
        if scored:
            top = reqs[0]
            recs.append(
                f"Start with '#{top.id} {top.title}' — highest priority "
                f"(score: {top.priority_score})."
            )

        # Quick wins
        quick_wins = [
            r for r in reqs
            if r.business_value >= 5 and r.effort < 5
        ]
        if quick_wins:
            titles = ", ".join(f"#{r.id}" for r in quick_wins[:5])
            recs.append(
                f"Quick wins (high value, low effort): {titles}. "
                f"These should be addressed first for fast ROI."
            )

        # High risk items
        high_risk = [r for r in reqs if r.risk >= 7]
        if high_risk:
            titles = ", ".join(f"#{r.id}" for r in high_risk[:5])
            recs.append(
                f"High-risk requirements detected: {titles}. "
                f"Consider prototyping or spike investigations to reduce uncertainty."
            )

        # Ambiguous items
        ambiguous = [r for r in reqs if r.ambiguity_score >= 40]
        if ambiguous:
            titles = ", ".join(f"#{r.id}" for r in ambiguous[:5])
            recs.append(
                f"Ambiguous requirements found: {titles}. "
                f"Refine these with stakeholders to improve clarity before implementation."
            )

        # Incomplete items
        incomplete = [r for r in reqs if r.completeness_score < 50 and r.completeness_score > 0]
        if incomplete:
            titles = ", ".join(f"#{r.id}" for r in incomplete[:5])
            recs.append(
                f"Incomplete requirements: {titles}. "
                f"Add measurable acceptance criteria to improve testability."
            )

        # Time sinks
        time_sinks = [r for r in reqs if r.business_value < 5 and r.effort >= 5]
        if time_sinks:
            titles = ", ".join(f"#{r.id}" for r in time_sinks[:5])
            recs.append(
                f"Potential time sinks (low value, high effort): {titles}. "
                f"Re-evaluate whether these are necessary for the current scope."
            )

        # Dependencies warning
        dep_chain = [r for r in reqs if r.dependencies]
        if dep_chain:
            recs.append(
                f"{len(dep_chain)} requirement(s) have dependencies. "
                f"Review the dependency graph before scheduling to avoid blockers."
            )

        if not recs:
            recs.append("All requirements are well-specified and balanced. Proceed with implementation in priority order.")

        return recs

    @staticmethod
    def _empty_result() -> dict:
        return {
            "project_id": 0,
            "ranked_requirements": [],
            "weights": settings.weights,
            "matrix": [],
            "summary": {
                "total": 0,
                "analyzed": 0,
                "avg_score": 0,
                "top_priority": None,
                "high_risk_count": 0,
            },
            "recommendations": ["No requirements found. Add requirements to begin analysis."],
        }

    # ------------------------------------------------------------------
    # Project-level insights
    # ------------------------------------------------------------------

    @staticmethod
    def generate_insights(db: Session, requirements: list[Requirement]) -> dict:
        """Generate a project-level insights dashboard."""
        if not requirements:
            return {
                "project_id": 0,
                "total_requirements": 0,
                "analyzed_requirements": 0,
                "avg_quality_score": 0,
                "avg_ambiguity_score": 0,
                "avg_completeness_score": 0,
                "category_distribution": {},
                "moscow_distribution": {},
                "status_distribution": {},
                "high_priority_items": [],
                "high_risk_items": [],
                "ambiguous_items": [],
                "recommendations": [],
            }

        total = len(requirements)
        analyzed = [r for r in requirements if r.quality_score > 0]
        analyzed_count = len(analyzed)

        avg_quality = sum(r.quality_score for r in analyzed) / analyzed_count if analyzed_count else 0
        avg_ambiguity = sum(r.ambiguity_score for r in analyzed) / analyzed_count if analyzed_count else 0
        avg_completeness = sum(r.completeness_score for r in analyzed) / analyzed_count if analyzed_count else 0

        category_dist: dict[str, int] = {}
        moscow_dist: dict[str, int] = {}
        status_dist: dict[str, int] = {}
        for r in requirements:
            category_dist[r.category] = category_dist.get(r.category, 0) + 1
            moscow_dist[r.type] = moscow_dist.get(r.type, 0) + 1
            status_dist[r.status] = status_dist.get(r.status, 0) + 1

        high_priority = sorted(requirements, key=lambda r: r.priority_score, reverse=True)[:5]
        high_risk = [r for r in requirements if r.risk >= 7]
        ambiguous = [r for r in requirements if r.ambiguity_score >= 40]

        # Reuse recommendation logic
        scored = [(r.priority_score, r) for r in requirements]
        recs = PrioritizationService._generate_recommendations(scored, requirements)

        return {
            "project_id": requirements[0].project_id,
            "total_requirements": total,
            "analyzed_requirements": analyzed_count,
            "avg_quality_score": round(avg_quality, 1),
            "avg_ambiguity_score": round(avg_ambiguity, 1),
            "avg_completeness_score": round(avg_completeness, 1),
            "category_distribution": category_dist,
            "moscow_distribution": moscow_dist,
            "status_distribution": status_dist,
            "high_priority_items": [
                {"id": r.id, "title": r.title, "priority_score": r.priority_score}
                for r in high_priority
            ],
            "high_risk_items": [
                {"id": r.id, "title": r.title, "risk": r.risk}
                for r in high_risk
            ],
            "ambiguous_items": [
                {"id": r.id, "title": r.title, "ambiguity_score": r.ambiguity_score}
                for r in ambiguous
            ],
            "recommendations": recs,
        }
