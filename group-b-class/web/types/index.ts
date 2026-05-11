/**
 * Types partagés frontend.
 *
 * À enrichir par le groupe avec :
 *   - DTOs des entités du contrat (MiraClass, MentorApplication, etc.)
 *   - Types des réponses API spécifiques
 *
 * MIGRATION HINT (post-hackathon) :
 *   En prod Hello Mira, les types DTOs sont **importés depuis `@hlmr-travel/sdk-js`** :
 *     import type { MiraClass, MentorProfile, ... } from "@hlmr-travel/sdk-js";
 *
 *   Ces types sont auto-générés depuis l'OpenAPI des microservices backbone.
 *   → Suppression de ce fichier custom post-migration.
 */

export type MiraClassStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "validated_draft"
  | "enrichment_in_progress"
  | "published"
  | "rejected"
  | "archived";

export type MiraClassFormat = "physical" | "virtual" | "both";
export type MiraClassDeliveryFormat = MiraClassFormat | "async";

export interface TargetCity {
  name: string;
  country_code: string;
}

export interface MiraClass {
  id: string;
  application_id: string | null;
  mentor_user_id: string;
  title: string;
  description: string;
  skills_taught: string[];
  total_hours_collective: number;
  total_hours_individual: number;
  total_hours: number;
  format_envisaged: MiraClassFormat;
  rythm_pattern:
    | "weekly_session"
    | "biweekly_session"
    | "monthly_workshop"
    | "intensive_weekend"
    | "self_paced"
    | null;
  target_cities: TargetCity[];
  recommended_price_per_hour_collective_cents: number;
  recommended_price_per_hour_individual_cents: number;
  status: MiraClassStatus;
  rejection_reason: string | null;
  ai_assisted: boolean;
  source_suggestion_id: string | null;
  submitted_at: string | null;
  validated_at: string | null;
  published_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MiraClassListResponse {
  items: MiraClass[];
  total: number;
}

export type SkillCategory = "business" | "design" | "tech" | "soft" | "lifestyle";

export interface Skill {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: SkillCategory;
  popularity_score: number;
  created_at: string;
  updated_at: string;
}

export interface SkillListResponse {
  items: Skill[];
  total: number;
}

export interface MiraClassCreatePayload {
  title: string;
  description: string;
  skill_ids: string[];
  delivery_format: MiraClassDeliveryFormat;
}
