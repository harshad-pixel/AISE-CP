"""Requirement model - individual requirement with scoring fields."""
from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class Requirement(Base):
    __tablename__ = "requirements"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    title = Column(String(500), nullable=False)
    description = Column(Text, default="")
    category = Column(String(100), default="functional")  # functional, non_functional, technical, business, constraint
    type = Column(String(50), default="must_have")  # must_have, should_have, could_have, wont_have

    # Scoring dimensions (0-10 scale)
    business_value = Column(Float, default=5.0)
    user_impact = Column(Float, default=5.0)
    urgency = Column(Float, default=5.0)
    effort = Column(Float, default=5.0)  # higher = more effort
    risk = Column(Float, default=5.0)  # higher = more risk

    # Computed priority score (0-100)
    priority_score = Column(Float, default=0.0)
    priority_rank = Column(Integer, default=0)

    # AI analysis fields
    quality_score = Column(Float, default=0.0)  # 0-100
    ambiguity_score = Column(Float, default=0.0)  # 0-100 (higher = more ambiguous)
    completeness_score = Column(Float, default=0.0)  # 0-100
    ai_confidence = Column(Float, default=0.0)  # 0-1

    # Metadata
    tags = Column(JSON, default=list)  # list[str]
    dependencies = Column(JSON, default=list)  # list[int] - requirement IDs
    acceptance_criteria = Column(Text, default="")
    status = Column(String(50), default="draft")  # draft, analyzed, approved, in_progress, done

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="requirements")
    analyses = relationship(
        "AnalysisResult",
        back_populates="requirement",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Requirement(id={self.id}, title='{self.title[:40]}...')>"
