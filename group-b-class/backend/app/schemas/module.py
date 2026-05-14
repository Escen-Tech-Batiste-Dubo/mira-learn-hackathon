from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

ModuleType = Literal["theory", "practice", "exercise", "discussion", "workshop"]


class MiraClassModuleBase(BaseModel):
    position: int = Field(..., ge=1)
    title: str = Field(..., max_length=200)
    description: str = Field(default="", max_length=10000)
    duration_hours: Decimal = Field(..., gt=0)
    type: ModuleType = "theory"


class MiraClassModuleCreate(MiraClassModuleBase):
    ai_generated: bool = False
    source_outline_id: Optional[str] = None


class MiraClassModuleUpdate(BaseModel):
    position: Optional[int] = Field(None, ge=1)
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=10000)
    duration_hours: Optional[Decimal] = Field(None, gt=0)
    type: Optional[ModuleType] = None


class MiraClassModuleReorder(BaseModel):
    """Réorganisation des modules d'une class."""

    module_ids_in_order: list[str]


class MiraClassModuleRead(MiraClassModuleBase):
    id: str
    class_id: str
    ai_generated: bool
    source_outline_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    quiz_count: int = Field(0, ge=0, description="Nombre de QCM actifs liés au module (MVP : 0 ou 1)")

    model_config = ConfigDict(from_attributes=True)
