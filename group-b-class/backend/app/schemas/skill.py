"""Pydantic schemas for shared skills."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

SkillCategory = Literal["business", "design", "tech", "soft", "lifestyle"]


class SkillRead(BaseModel):
    id: str
    slug: str = Field(..., max_length=64)
    name: str = Field(..., max_length=120)
    description: str
    category: SkillCategory
    popularity_score: int = Field(..., ge=0)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SkillListRead(BaseModel):
    items: list[SkillRead]
    total: int
