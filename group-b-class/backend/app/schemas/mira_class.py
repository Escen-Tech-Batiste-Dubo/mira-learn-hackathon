"""Pydantic schemas for Mira Classes."""
from datetime import datetime
from typing import Literal, Optional, List
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

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
DeliveryFormat = Literal["physical", "virtual", "both", "async"]
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


class MiraClassCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=20, max_length=4000)
    skill_ids: list[UUID] = Field(..., min_length=1, max_length=8)
    delivery_format: DeliveryFormat

    @field_validator("title", "description")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Ce champ est obligatoire.")
        return stripped

    @field_validator("skill_ids")
    @classmethod
    def unique_skill_ids(cls, value: list[UUID]) -> list[UUID]:
        unique: list[UUID] = []
        seen: set[UUID] = set()
        for skill_id in value:
            if skill_id not in seen:
                unique.append(skill_id)
                seen.add(skill_id)
        return unique


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

class MiraClassUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3)
    description: Optional[str] = Field(None, min_length=20)
    skill_ids: Optional[List[UUID]] = None
    delivery_format: Optional[DeliveryFormat] = None