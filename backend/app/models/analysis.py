"""Analysis result model - stores AI analysis output for requirements."""
from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    requirement_id = Column(Integer, ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False)

    analysis_type = Column(String(100), nullable=False)  # quality, ambiguity, conflict, dependency, similarity
    result_data = Column(JSON, default=dict)  # structured analysis output
    summary = Column(Text, default="")
    confidence = Column(Float, default=0.0)  # 0-1

    created_at = Column(DateTime, default=datetime.utcnow)

    requirement = relationship("Requirement", back_populates="analyses")

    def __repr__(self):
        return f"<AnalysisResult(id={self.id}, type='{self.analysis_type}')>"
