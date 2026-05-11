# mira_class_module_quiz

**Possédé par** : Group B (write), Group D (read seed pour répondre)
**Reprenabilité post-hackathon** : migration vers nouveau service **`forms-api`** (table `form` avec `type='quiz'`, `owner_type='mira_class_module'`)

## Description fonctionnelle

QCM (Questionnaire à Choix Multiples) attaché à un module pédagogique pour vérifier l'acquisition. Le mentor crée 1 QCM par module (optionnel — pas tous les modules en ont un). L'apprenant (Group D) répond → score calculé → si seuil atteint, module marqué "acquis" + skill validée potentiellement.

État du QCM :
- `draft` : en cours d'édition mentor
- `published` : disponible pour les apprenants
- `archived` : retiré (pas affiché)

## Schéma SQL

```sql
CREATE TABLE mira_class_module_quiz (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    module_id UUID NOT NULL,                               -- ref mira_class_module.id
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL DEFAULT '',

    -- Paramètres
    pass_threshold_pct INTEGER NOT NULL DEFAULT 70 CHECK (pass_threshold_pct BETWEEN 0 AND 100),
    time_limit_seconds INTEGER NULL CHECK (time_limit_seconds IS NULL OR time_limit_seconds > 0),
    max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts >= 1 AND max_attempts <= 20),
    shuffle_questions BOOLEAN NOT NULL DEFAULT FALSE,
    shuffle_options BOOLEAN NOT NULL DEFAULT FALSE,
    show_explanations_after BOOLEAN NOT NULL DEFAULT TRUE, -- afficher explanation après réponse

    -- State machine
    status VARCHAR(16) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'published', 'archived'
    )),

    -- IA tracking
    ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    ai_generation_prompt_hash VARCHAR(64) NULL,            -- pour debug si génération buggée

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,

    UNIQUE (module_id) WHERE deleted_at IS NULL              -- 1 quiz par module max
);

CREATE INDEX idx_mira_class_module_quiz_module_id ON mira_class_module_quiz (module_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_mira_class_module_quiz_status ON mira_class_module_quiz (status) WHERE deleted_at IS NULL;
```

## Schéma Pydantic

```python
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

QuizStatus = Literal["draft", "published", "archived"]


class MiraClassModuleQuizBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: str = Field(default="", max_length=2000)
    pass_threshold_pct: int = Field(default=70, ge=0, le=100)
    time_limit_seconds: Optional[int] = Field(None, gt=0)
    max_attempts: int = Field(default=3, ge=1, le=20)
    shuffle_questions: bool = False
    shuffle_options: bool = False
    show_explanations_after: bool = True


class MiraClassModuleQuizCreate(MiraClassModuleQuizBase):
    ai_generated: bool = False


class MiraClassModuleQuizUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    pass_threshold_pct: Optional[int] = Field(None, ge=0, le=100)
    time_limit_seconds: Optional[int] = Field(None, gt=0)
    max_attempts: Optional[int] = Field(None, ge=1, le=20)
    shuffle_questions: Optional[bool] = None
    shuffle_options: Optional[bool] = None
    show_explanations_after: Optional[bool] = None


class MiraClassModuleQuizPublish(BaseModel):
    pass


class MiraClassModuleQuizGenerateRequest(BaseModel):
    """Demande de génération IA basée sur le contenu du module."""
    question_count: int = Field(default=5, ge=3, le=15)
    difficulty: Literal["easy", "medium", "hard"] = "medium"


class MiraClassModuleQuizRead(MiraClassModuleQuizBase):
    id: str
    module_id: str
    status: QuizStatus
    ai_generated: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- **1 quiz max par module** (`UNIQUE module_id` partiel)
- Pour publier (`draft → published`) : au moins 3 questions avec au moins 1 bonne réponse chacune (validation service)
- **Génération IA** (`POST /modules/{id}/quiz/generate`) :
  - Input : contenu du module (titre + description + skills + materials labels) + `question_count` + `difficulty`
  - Appel `LLMClient.generate_quiz(...)` avec OpenRouter (Claude Haiku par défaut)
  - Output : JSON structuré questions + options + correct_answers + explanations
  - Persisté en `draft` avec `ai_generated=TRUE`
  - Mentor peut éditer avant `publish`
- `time_limit_seconds` : optionnel. Si défini, l'apprenant doit finir avant.
- `max_attempts` : limite le nombre de tentatives par apprenant (cf. `student_quiz_attempt`)

## Relations

- **Référence** : `module_id` → `mira_class_module.id`
- **Référencée par** :
  - `mira_class_module_quiz_question.quiz_id` (CASCADE)

## Routes API

```
POST   /v1/modules/{module_id}/quiz                        — créer
GET    /v1/modules/{module_id}/quiz                        — détail (avec questions + options)
PATCH  /v1/quizzes/{id}                                    — update
POST   /v1/quizzes/{id}/publish                            — draft → published
POST   /v1/quizzes/{id}/archive                            — → archived
DELETE /v1/quizzes/{id}                                    — soft delete

# IA
POST   /v1/modules/{module_id}/quiz/generate               — générer un brouillon IA
POST   /v1/quizzes/{id}/preview                            — preview rendu apprenant
```

Public (consommé par Group D) :
```
GET    /v1/modules/{module_id}/quiz/public                 — version published (sans is_correct)
```

## Seed attendu

Pour ~50% des modules seedés : 1 quiz `published` avec 5-10 questions chacun. Mix `ai_generated=TRUE` (60%) et manuel (40%) pour démontrer les 2 modes.

## Reprenabilité

**Mapping** : `forms-api.form` avec :
- `type = 'quiz'`
- `owner_type = 'mira_class_module'`
- `owner_id = module_id`
- `config` (JSONB) contient : `pass_threshold_pct`, `time_limit_seconds`, `max_attempts`, `shuffle_*`, `show_explanations_after`

**Transformations** :
1. Création du service `forms-api` from scratch (cf. PRD V3 architecture)
2. Migration tables hackathon : `mira_class_module_quiz/question/option` → `forms-api.form/question/question_option`
3. Migration `student_quiz_attempt/answer` (Group D) → `forms-api.form_submission/answer`
4. Refactor des routes : `/v1/modules/{id}/quiz` reste mais proxy vers `forms-api` via HMAC interne
5. NATS event `forms.submission.scored` (cross-service) → consommé par learn-api pour validation skill

**Effort** : ~6-8h Claude Code (création service forms-api + migration data + intégrations).
