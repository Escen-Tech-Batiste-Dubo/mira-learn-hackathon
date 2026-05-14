"""
Schémas Pydantic pour l'entité Enrolment (candidatures).

Convention Hello Mira : schémas pour le MVP candidatures :
    - EnrolmentListItem    : item dans la liste des candidatures
    - EnrolmentDecisionRequest : body de PATCH décision mentor
    - EnrolmentDecisionResult  : réponse après décision
    - EnrolmentListResponse    : réponse paginée de liste

MIGRATION HINT (post-hackathon) :
    Pas de changement majeur sur Pydantic. ms-common-api propose des helpers
    pour générer automatiquement Create/Update/Read depuis un schéma Base, mais
    on peut garder le pattern explicite (plus lisible).
"""
from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

EnrolmentStatus = Literal["applied", "waitlist", "accepted", "rejected", "cancelled", "completed"]
DecisionType = Literal["accept", "reject", "waitlist"]


class EnrolmentCreate(BaseModel):
    """Body de POST /v1/sessions/{session_id}/enrolments."""

    application_data: dict[str, Any] = Field(default_factory=dict)


class EnrolmentCancel(BaseModel):
    """Body de POST /v1/enrolments/{enrolment_id}/cancel."""

    cancellation_reason: Optional[str] = Field(None, max_length=1000)


class EnrolmentListItem(BaseModel):
    """Item dans la liste des candidatures d'une session."""

    id: str
    session_id: str
    user_id: str
    status: EnrolmentStatus
    waitlist_position: Optional[int] = None
    enrolled_at: datetime
    decision_at: Optional[datetime] = None
    decision_reason: Optional[str] = None


class EnrolmentRead(BaseModel):
    id: str
    session_id: str
    user_id: str
    status: EnrolmentStatus
    waitlist_position: Optional[int] = None
    application_data: dict[str, Any]
    decision_at: Optional[datetime] = None
    decision_by_mentor_id: Optional[str] = None
    decision_reason: Optional[str] = None
    cancellation_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    completed_at: Optional[datetime] = None
    completion_score_pct: Optional[float] = None
    enrolled_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EnrolmentDecisionRequest(BaseModel):
    """Body de PATCH /v1/enrolments/{enrolment_id}/decision."""

    decision: DecisionType = Field(..., description="Décision mentor: accept, reject ou waitlist")
    reason: Optional[str] = Field(None, max_length=1000, description="Raison optionnelle de la décision")


class EnrolmentDecisionResult(BaseModel):
    """Réponse après décision mentor."""

    enrolment_id: str
    new_status: EnrolmentStatus
    decision_at: datetime
    session_enrolment_count: int = Field(..., description="Nombre d'accepted après décision")
    session_waitlist_count: int = Field(..., description="Nombre de waitlist après décision")


class EnrolmentListResponse(BaseModel):
    """Réponse paginée de GET /v1/sessions/{session_id}/enrolments."""

    items: list[EnrolmentListItem]
    total: int
    page: int
    page_size: int
    has_more: bool


class MentorEnrolmentListItem(BaseModel):
    """Ligne agrégée GET /v1/me/enrolments (toutes sessions du mentor)."""

    id: str
    session_id: str
    class_id: str
    class_title: str
    session_starts_at: datetime
    session_status: str
    location_city: Optional[str] = None
    location_country: Optional[str] = None
    user_id: str
    status: EnrolmentStatus
    waitlist_position: Optional[int] = None
    enrolled_at: datetime
    decision_at: Optional[datetime] = None
    decision_reason: Optional[str] = None


class MentorEnrolmentListResponse(BaseModel):
    """Réponse paginée de GET /v1/me/enrolments."""

    items: list[MentorEnrolmentListItem]
    total: int
    page: int
    page_size: int
    has_more: bool