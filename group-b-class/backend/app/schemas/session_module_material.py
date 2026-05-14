"""Pydantic schemas for session module materials (contracts/group-b-class/mira_class_session_module_material.md)."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

MaterialPhase = Literal["before", "during", "after"]
MaterialType = Literal["file", "link"]

_ALLOWED_FILE_MIMES = frozenset(
    {
        "application/pdf",
        "image/jpeg",
        "image/png",
        "video/mp4",
        "audio/mpeg",
        "application/zip",
    }
)
_MAX_FILE_BYTES = 100 * 1024 * 1024


class SessionModuleMaterialCreate(BaseModel):
    phase: MaterialPhase
    material_type: MaterialType
    material_url: str = Field(..., max_length=500)
    file_size_bytes: int | None = Field(None, ge=0, le=_MAX_FILE_BYTES)
    file_mime_type: str | None = Field(None, max_length=120)
    label: str = Field(..., max_length=200)
    description: str = Field(default="", max_length=2000)
    ordering: int = Field(default=0, ge=0)
    required: bool = False

    @field_validator("material_url")
    @classmethod
    def strip_url(cls, v: str) -> str:
        return v.strip()

    @model_validator(mode="after")
    def validate_url_and_mime(self) -> "SessionModuleMaterialCreate":
        lower = self.material_url.lower()
        if not (lower.startswith("https://") or lower.startswith("http://")):
            raise ValueError("material_url must start with http:// or https://")
        if self.material_type == "file" and self.file_mime_type is not None:
            if self.file_mime_type not in _ALLOWED_FILE_MIMES:
                raise ValueError(f"file_mime_type not allowed for MVP upload: {self.file_mime_type}")
        return self


class SessionModuleMaterialRead(BaseModel):
    id: str
    session_module_id: str
    phase: MaterialPhase
    material_type: MaterialType
    material_url: str
    file_size_bytes: int | None = None
    file_mime_type: str | None = None
    label: str
    description: str
    ordering: int
    required: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SessionModuleMaterialListResponse(BaseModel):
    materials: list[SessionModuleMaterialRead]


class ModuleMaterialCountsResponse(BaseModel):
    """Per-module counts of non-deleted materials (all sessions of the class)."""

    counts: dict[str, int] = Field(default_factory=dict)
