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

// Exemple — à remplacer/enrichir par le groupe selon les entités de son contrat
export type ExampleStatus = "draft" | "active" | "archived";

export interface Example {
  id: string;
  title: string;
  description: string;
  status: ExampleStatus;
  created_at: string;
  updated_at: string;
}

export interface PaginatedList<T> {
  items: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    returned: number;
  };
}
