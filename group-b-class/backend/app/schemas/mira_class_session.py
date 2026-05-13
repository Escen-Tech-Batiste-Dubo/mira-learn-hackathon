"""Pydantic schemas for mira_class_session (Group B)."""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

SessionType = Literal["physical", "virtual", "hybrid"]
SessionStatus = Literal["planned", "open_enrolment", "full", "in_progress", "completed", "cancelled"]
MeetingProvider = Literal["zoom", "meet", "livekit", "other"]


class MiraClassSessionBase(BaseModel):
    """Shared fields between Create, Update, and Read schemas."""

    type: SessionType = Field(..., description="physical, virtual, or hybrid")
    location_address: Optional[str] = Field(None, max_length=500, description="Required if physical/hybrid")
    location_city: Optional[str] = Field(None, max_length=120)
    location_country: Optional[str] = Field(None, max_length=120)
    location_lat: Optional[float] = Field(None, description="Latitude for world map")
    location_lng: Optional[float] = Field(None, description="Longitude for world map")
    online_meeting_provider: Optional[MeetingProvider] = None
    online_meeting_default_url: Optional[str] = Field(None, max_length=500)
    capacity: int = Field(default=10, ge=1, le=50, description="1-50 attendees")
    waitlist_enabled: bool = Field(default=True)
    waitlist_max_size: int = Field(default=20, ge=0)
    price_cents: int = Field(default=0, ge=0, description="Price in cents")
    starts_at: datetime = Field(..., description="Session start time")
    ends_at: datetime = Field(..., description="Session end time (must be > starts_at)")
    enrolment_deadline: Optional[datetime] = Field(None, description="Default: starts_at - 24h")


class MiraClassSessionCreate(MiraClassSessionBase):
    """POST /v1/classes/{class_id}/sessions request body."""

    pass


class MiraClassSessionUpdate(BaseModel):
    """PATCH /v1/sessions/{id} request body (partial update, all fields optional)."""

    type: Optional[SessionType] = Field(None, description="physical, virtual, or hybrid")
    location_address: Optional[str] = Field(None, max_length=500)
    location_city: Optional[str] = Field(None, max_length=120)
    location_country: Optional[str] = Field(None, max_length=120)
    capacity: Optional[int] = Field(None, ge=1, le=50)
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    enrolment_deadline: Optional[datetime] = None


class MiraClassSessionRead(MiraClassSessionBase):
    """GET /v1/sessions/{id} response (full object with audit timestamps)."""

    id: str
    class_id: str
    status: SessionStatus
    cancellation_reason: Optional[str] = None
    is_promoted: bool = Field(default=False)
    promoted_until: Optional[datetime] = None
    enrolment_count: int = Field(default=0, ge=0, description="Number of accepted enrolments")
    waitlist_count: int = Field(default=0, ge=0, description="Number of waitlisted enrolments")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MiraClassSessionListRead(BaseModel):
    """Lightweight variant for listing (excludes some details)."""

    id: str
    class_id: str
    type: SessionType
    location_city: Optional[str] = None
    location_country: Optional[str] = None
    capacity: int
    status: SessionStatus
    starts_at: datetime
    ends_at: datetime
    enrolment_count: int
    waitlist_count: int
    price_cents: int

    model_config = ConfigDict(from_attributes=True)

