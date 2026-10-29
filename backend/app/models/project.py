"""Project model - groups related requirements together."""
from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    requirements = relationship(
        "Requirement",
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="Requirement.priority_score.desc()",
    )

    def __repr__(self):
        return f"<Project(id={self.id}, name='{self.name}')>"
