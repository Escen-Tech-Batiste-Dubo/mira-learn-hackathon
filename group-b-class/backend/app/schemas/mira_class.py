"""Pydantic schemas for Mira Classes."""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

MiraClassStatus = Literal[
    "draft",
    "submitted",
    "in_review",
    "validated_draft",
    "enrichment_in_progress",
    "published",
    "rejected",
    "archived",
]
ClassFormat = Literal["physical", "virtual", "both"]
RythmPattern = Literal[
    "weekly_session",
    "biweekly_session",
    "monthly_workshop",
    "intensive_weekend",
    "self_paced",
]


class TargetCity(BaseModel):
    name: str = Field(..., max_length=120)
    country_code: str = Field(..., min_length=2, max_length=2)


class MiraClassRead(BaseModel):
    id: str
    application_id: Optional[str]
    mentor_user_id: str
    title: str
    description: str
    skills_taught: list[str]
    total_hours_collective: int
    total_hours_individual: int
    total_hours: int
    format_envisaged: ClassFormat
    rythm_pattern: Optional[RythmPattern]
    target_cities: list[TargetCity]
    recommended_price_per_hour_collective_cents: int
    recommended_price_per_hour_individual_cents: int
    status: MiraClassStatus
    rejection_reason: Optional[str]
    ai_assisted: bool
    source_suggestion_id: Optional[str]
    submitted_at: Optional[datetime]
    validated_at: Optional[datetime]
    published_at: Optional[datetime]
    archived_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MiraClassListRead(BaseModel):
    items: list[MiraClassRead]
    total: int
