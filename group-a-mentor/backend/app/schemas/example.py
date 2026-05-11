"""
Schémas Pydantic pour l'entité Example.

Convention Hello Mira : 4 classes minimum par entité :
    - {Entity}Base    : champs partagés
    - {Entity}Create  : pour POST (création)
    - {Entity}Update  : pour PATCH (update partiel, tous champs optionnels)
    - {Entity}Read    : pour GET (response, incl. id, timestamps)

Optionnel :
    - {Entity}Public  : vue publique restreinte (anonyme)
    - {Entity}Internal: vue interne (HMAC cross-services)

MIGRATION HINT (post-hackathon) :
    Pas de changement majeur sur Pydantic. ms-common-api propose des helpers
    pour générer automatiquement Create/Update/Read depuis un schéma Base, mais
    on peut garder le pattern explicite (plus lisible).
"""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

ExampleStatus = Literal["draft", "active", "archived"]


class ExampleBase(BaseModel):
    """Champs métier partagés Create + Update + Read."""

    title: str = Field(..., max_length=200)
    description: str = Field(default="", max_length=10_000)
    status: ExampleStatus = "draft"


class ExampleCreate(ExampleBase):
    """Body de POST /v1/examples — création."""

    pass


class ExampleUpdate(BaseModel):
    """Body de PATCH /v1/examples/{id} — update partiel (tous champs optionnels)."""

    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    status: Optional[ExampleStatus] = None


class ExampleRead(ExampleBase):
    """Response de GET /v1/examples/{id} — vue authentifiée complète."""

    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
