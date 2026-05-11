# mira_class_session_module_material

**Possédé par** : Group B (write)
**Reprenabilité post-hackathon** : migration vers `classes-api.mira_class_session_module_material`

## Description fonctionnelle

Matériel pédagogique attaché à un **module dans une session** (`mira_class_session_module`). Le mentor uploade des fichiers (PDF, vidéo, slides) ou des liens (URL externe) avec une phase de déblocage :
- `before` : disponible avant le module (pre-class binge)
- `during` : disponible pendant le module (workbook, slides projetées)
- `after` : disponible après (révision, devoir, ressources complémentaires)

Le matériel est attaché au **session_module** (pas au module générique) car le mentor peut adapter son matériel d'une session à l'autre (ex : exemples actualisés, ressources géo-spécifiques).

## Schéma SQL

```sql
CREATE TABLE mira_class_session_module_material (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_module_id UUID NOT NULL REFERENCES mira_class_session_module(id) ON DELETE CASCADE,

    phase VARCHAR(16) NOT NULL CHECK (phase IN ('before', 'during', 'after')),

    material_type VARCHAR(16) NOT NULL CHECK (material_type IN ('file', 'link')),
    material_url VARCHAR(500) NOT NULL,                    -- URL Supabase Storage si file, URL externe si link
    file_size_bytes BIGINT NULL,                           -- pour file uniquement
    file_mime_type VARCHAR(120) NULL,                      -- ex 'application/pdf', 'video/mp4'

    label VARCHAR(200) NOT NULL,                           -- titre visible apprenant
    description TEXT NOT NULL DEFAULT '',                  -- description courte optionnelle
    ordering INTEGER NOT NULL DEFAULT 0,                   -- ordre d'affichage
    required BOOLEAN NOT NULL DEFAULT FALSE,               -- marqué "lecture obligatoire" pour l'apprenant

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_session_module_material_session_module_id ON mira_class_session_module_material (session_module_id, phase, ordering)
    WHERE deleted_at IS NULL;
```

## Schéma Pydantic

```python
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

MaterialPhase = Literal["before", "during", "after"]
MaterialType = Literal["file", "link"]


class MiraClassSessionModuleMaterialBase(BaseModel):
    phase: MaterialPhase
    material_type: MaterialType
    material_url: str = Field(..., max_length=500)
    file_size_bytes: Optional[int] = Field(None, ge=0)
    file_mime_type: Optional[str] = Field(None, max_length=120)
    label: str = Field(..., max_length=200)
    description: str = Field(default="", max_length=2000)
    ordering: int = Field(default=0, ge=0)
    required: bool = False


class MiraClassSessionModuleMaterialCreate(MiraClassSessionModuleMaterialBase):
    pass


class MiraClassSessionModuleMaterialUpdate(BaseModel):
    phase: Optional[MaterialPhase] = None
    label: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    ordering: Optional[int] = Field(None, ge=0)
    required: Optional[bool] = None


class MiraClassSessionModuleMaterialRead(MiraClassSessionModuleMaterialBase):
    id: str
    session_module_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- **Upload via Supabase Storage** : le mentor uploade via endpoint dédié → URL retournée → enregistrée dans `material_url`
- **Visibilité côté apprenant (Group D)** dépend de la **phase** + l'**avancement** du session_module :
  - Phase `before` : visible dès l'inscription (apprenant peut commencer le pre-class binge)
  - Phase `during` : visible quand `session_module.status IN ('in_progress', 'completed')`
  - Phase `after` : visible quand `session_module.status = 'completed'`
- **Validation MIME types** côté upload : whitelist PDF, MP4, JPG, PNG, MP3, ZIP (config service)
- **Taille max** : 100 MB par fichier (hackathon, plus large en V1 prod)

## Relations

- **Référence** : `session_module_id` → `mira_class_session_module.id` (CASCADE)

## Routes API

```
POST   /v1/session-modules/{id}/materials                  — créer (avec upload file ou URL link)
GET    /v1/session-modules/{id}/materials                  — list (filtrable par phase)
GET    /v1/materials/{id}                                  — détail
PATCH  /v1/materials/{id}                                  — update (label, description, phase, ordering)
DELETE /v1/materials/{id}                                  — soft delete

# Upload helper
POST   /v1/uploads/material                                — uploader un fichier vers Supabase Storage, retourne URL signée
```

Public (consommé par Group D) :
```
GET    /v1/session-modules/{id}/materials/available        — list filtrée selon avancement (only visible to current user)
```

## Seed attendu

Pour chaque `mira_class_session_module` seedé : 2-4 materials :
- 1 `phase='before'` (pre-class binge — ex : "Article : 10 mistakes when pitching")
- 1 `phase='during'` (workbook ou slides)
- 1-2 `phase='after'` (révision + devoir si module a un QCM associé)

Mix `material_type` : ~70% link (faux URLs YouTube/Vimeo/Google Docs), ~30% file (PDFs stub uploadés en Storage).

## Reprenabilité

**Mapping** : `classes-api.mira_class_session_module_material` — schéma identique.

**Transformations** :
1. Migration directe schéma
2. **Fichiers Supabase Storage → files-api S3 OVH** : script de copie, mise à jour `material_url` avec URLs signées via `files-api`
3. URLs externes (links) : préservées telles quelles
4. Endpoint `available` : logique de visibilité (phase + status) migrée
5. RGPD : conserver pendant 5 ans (durée masterclass + 1 an), puis purge

**Effort** : ~3h Claude Code (migration storage + endpoint visibilité).
