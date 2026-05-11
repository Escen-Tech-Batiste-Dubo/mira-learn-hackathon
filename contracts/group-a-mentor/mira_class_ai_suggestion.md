# mira_class_ai_suggestion

**Possédé par** : Group A (write)
**Reprenabilité post-hackathon** : audit log → `bots-api.suggestion_log` ou similaire (à définir)

## Description fonctionnelle

Trace les **suggestions de Mira Classes** générées par l'IA (OpenRouter) pour orienter le candidat mentor pendant sa candidature. Le moteur combine :
- Les skills déclarées par le candidat
- La table `skill_demand_aggregate` (demande étudiants seedée)
- L'offre actuelle (mentors qui offrent déjà des classes sur ces skills)

L'IA calcule les **gaps** (skill très demandée + peu couverte) et propose au candidat des classes alignées sur ses skills qui répondraient à ces gaps. Le candidat peut adopter une suggestion (préremplit la création d'une `mira_class`), la modifier (édition libre), ou la rejeter (génère 2-3 nouvelles).

## Schéma SQL

```sql
CREATE TABLE mira_class_ai_suggestion (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES mentor_application(id) ON DELETE CASCADE,

    -- Contenu suggéré
    suggested_title VARCHAR(200) NOT NULL,
    suggested_description TEXT NOT NULL DEFAULT '',
    suggested_skill_ids JSONB NOT NULL DEFAULT '[]'::jsonb,   -- list de skill.id que la class prodiguerait
    suggested_outline JSONB NOT NULL DEFAULT '[]'::jsonb,
        -- Schéma : [{"position": 1, "title": "...", "estimated_duration_hours": 2.0}, ...]
    suggested_total_hours INTEGER NOT NULL DEFAULT 0,
    suggested_format VARCHAR(16) NOT NULL CHECK (suggested_format IN ('physical', 'virtual', 'both')),

    -- Argumentaire IA
    justification TEXT NOT NULL,                              -- "Tu maîtrises X, 47 étudiants veulent apprendre X, seulement 2 mentors actifs..."
    skill_demand_score NUMERIC(5, 2) NOT NULL,                -- agrégat demande étudiants pour les skills suggérées
    skill_offer_gap_score NUMERIC(5, 2) NOT NULL,             -- gap demande/offre (plus haut = meilleur opportunité mentor)

    -- Lifecycle
    status VARCHAR(32) NOT NULL DEFAULT 'proposed' CHECK (status IN (
        'proposed', 'adopted', 'rejected', 'modified'
    )),
    adopted_into_class_id UUID NULL REFERENCES mira_class(id) ON DELETE SET NULL,
        -- set quand status='adopted' ou 'modified' (référence la mira_class créée à partir de la suggestion)
    rejected_at TIMESTAMP WITH TIME ZONE NULL,
    rejected_reason VARCHAR(64) NULL CHECK (rejected_reason IN (
        'not_my_expertise', 'not_interested', 'too_generic', 'duplicate', 'other'
    )),

    -- IA tracking (audit coût)
    llm_model_used VARCHAR(64) NOT NULL,                      -- ex 'anthropic/claude-3.5-sonnet'
    llm_tokens_consumed INTEGER NULL,
    generation_prompt_hash VARCHAR(64) NULL,                  -- hash du prompt pour debug + déduplication

    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mira_class_ai_suggestion_application_id ON mira_class_ai_suggestion (application_id, generated_at DESC);
CREATE INDEX idx_mira_class_ai_suggestion_status ON mira_class_ai_suggestion (status);
```

## Schéma Pydantic

```python
from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

SuggestionStatus = Literal["proposed", "adopted", "rejected", "modified"]
SuggestionFormat = Literal["physical", "virtual", "both"]
RejectionReason = Literal[
    "not_my_expertise", "not_interested", "too_generic", "duplicate", "other"
]


class SuggestionOutlineItem(BaseModel):
    position: int = Field(..., ge=1)
    title: str = Field(..., max_length=200)
    estimated_duration_hours: Decimal = Field(..., gt=0)


class MiraClassAISuggestionGenerateRequest(BaseModel):
    """Demande de génération de N suggestions."""
    count: int = Field(default=3, ge=1, le=5)
    exclude_suggestion_ids: list[str] = []                    # pour ne pas re-suggérer les rejetées


class MiraClassAISuggestionRead(BaseModel):
    id: str
    application_id: str
    suggested_title: str
    suggested_description: str
    suggested_skill_ids: list[str]
    suggested_outline: list[SuggestionOutlineItem]
    suggested_total_hours: int
    suggested_format: SuggestionFormat
    justification: str
    skill_demand_score: Decimal
    skill_offer_gap_score: Decimal
    status: SuggestionStatus
    adopted_into_class_id: Optional[str]
    rejected_at: Optional[datetime]
    rejected_reason: Optional[RejectionReason]
    llm_model_used: str
    generated_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MiraClassAISuggestionAdopt(BaseModel):
    """Adoption d'une suggestion (préremplit une nouvelle mira_class)."""
    modify_before_adopting: bool = False                      # si True, retourne la suggestion sans créer encore la class


class MiraClassAISuggestionReject(BaseModel):
    reason: RejectionReason
```

## Contraintes métier

- **Génération** : appel HMAC interne au `LLMClient.generate_class_suggestions(application_id, count)`
  - Prompt construit : skills déclarées + `skill_demand_aggregate` + exclusions
  - LLM retourne JSON structuré → mappé sur Pydantic model
  - Persisté avec `status='proposed'`
- **Adoption** : transition `proposed → adopted` ET création parallèle d'une `mira_class` avec préremplissage depuis la suggestion + ses outlines. Lien via `adopted_into_class_id`.
- **Modification** : transition `proposed → modified` (candidat a adopté mais édité). Même comportement que adoption sauf flag tracking.
- **Rejet** : transition `proposed → rejected`, `rejected_reason` obligatoire. La suggestion ne sera plus proposée à ce candidat.
- **Audit coût** : `llm_tokens_consumed` permet de tracker la consommation OpenRouter par candidat (rate limiting éventuel).

## Relations

- **Référence** :
  - `application_id` → `mentor_application.id` (CASCADE)
  - `adopted_into_class_id` → `mira_class.id` (SET NULL)
- **Référencée par** :
  - `mira_class.source_suggestion_id` (référence inverse)

## Routes API

```
POST   /v1/mentors/applications/me/class-suggestions/generate    — générer N suggestions (count default 3)
GET    /v1/mentors/applications/me/class-suggestions             — list de mes suggestions (filtres status)
GET    /v1/mentors/applications/me/class-suggestions/{id}        — détail
POST   /v1/mentors/applications/me/class-suggestions/{id}/adopt  — adopter (crée mira_class + retourne son id)
POST   /v1/mentors/applications/me/class-suggestions/{id}/reject — rejeter (avec reason)
```

## Seed attendu

Pour chaque candidature seedée : 3-5 suggestions IA pré-générées avec :
- 1-2 `adopted` (qui ont créé des `mira_class` réelles dans le seed)
- 1-2 `proposed` (à démontrer dans la démo : le candidat peut les adopter en live)
- 0-2 `rejected` avec `rejected_reason` documenté

## Reprenabilité

**Mapping** : pas de migration directe — c'est un audit log spécifique au moteur de suggestions.

**Transformations** :
1. Post-hackathon, le moteur de suggestions vit dans `bots-api` (extension avec un tool dédié `suggest_mira_classes`)
2. L'historique des suggestions peut être conservé dans une table `bots-api.suggestion_log` ou ignoré (insights produit uniquement)
3. Les `adopted_into_class_id` deviennent des liens stable dans la table `mira_class` (champ `created_from_ai_suggestion=true` ou via `metadata` JSONB)

**Effort** : ~1-2h Claude Code (audit log léger).
