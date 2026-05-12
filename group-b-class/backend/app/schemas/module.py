"""
Schémas Pydantic v2 pour `mira_class_module`.

Alignés sur le modèle ORM Group B et sur les contraintes API demandées.
"""
from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

MiraClassModuleType = Literal["theory", "practice", "exercise", "discussion", "workshop"]

ModuleId = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
ModuleTitle = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=200),
]
ModuleDescription = Annotated[str | None, Field(default=None, max_length=4000)]
ModuleDurationHours = Annotated[float, Field(strict=True, gt=0, le=12.0)]
ModulePosition = Annotated[int, Field(strict=True, ge=0)]
ModuleAiGenerated = Annotated[bool, Field(strict=True)]


class MiraClassModuleCreate(BaseModel):
    """Body de création d'un module."""

    model_config = ConfigDict(extra="forbid")

    title: ModuleTitle
    description: ModuleDescription = None
    type: MiraClassModuleType
    duration_hours: ModuleDurationHours
    ai_generated: ModuleAiGenerated = False


class MiraClassModuleUpdate(BaseModel):
    """Body de PATCH d'un module avec sémantique partielle."""

    model_config = ConfigDict(extra="forbid")

    title: ModuleTitle | None = None
    description: ModuleDescription = None
    type: MiraClassModuleType | None = None
    duration_hours: ModuleDurationHours | None = None


class ModulePositionItem(BaseModel):
    """Position cible d'un module pour une opération de réordonnancement."""

    model_config = ConfigDict(extra="forbid")

    id: ModuleId
    position: ModulePosition


class MiraClassModuleReorder(BaseModel):
    """Body de reorder de modules."""

    model_config = ConfigDict(extra="forbid")

    modules: list[ModulePositionItem] = Field(..., min_length=1)


class MiraClassModuleRead(BaseModel):
    """Vue de réponse complète d'un module."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: ModuleId
    class_id: ModuleId
    position: ModulePosition
    title: ModuleTitle
    description: ModuleDescription = None
    type: MiraClassModuleType
    duration_hours: ModuleDurationHours
    ai_generated: ModuleAiGenerated
    source_outline_id: ModuleId | None
    created_at: datetime
    updated_at: datetime
