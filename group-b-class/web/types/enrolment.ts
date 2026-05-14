/** Aligné sur `app/schemas/enrolment.py` (réponses JSend `data`). */

export type EnrolmentStatus =
  | "applied"
  | "waitlist"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "completed";

export type EnrolmentDecision = "accept" | "reject" | "waitlist";

export interface EnrolmentListItem {
  id: string;
  session_id: string;
  user_id: string;
  status: EnrolmentStatus;
  waitlist_position: number | null;
  enrolled_at: string;
  decision_at: string | null;
  decision_reason: string | null;
}

export interface EnrolmentListResponse {
  items: EnrolmentListItem[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface EnrolmentDecisionRequest {
  decision: EnrolmentDecision;
  reason?: string | null;
}

export interface EnrolmentDecisionResult {
  enrolment_id: string;
  new_status: EnrolmentStatus;
  decision_at: string;
  session_enrolment_count: number;
  session_waitlist_count: number;
}

/** GET /v1/me/enrolments — vue agrégée mentor. */
export interface MentorEnrolmentListItem {
  id: string;
  session_id: string;
  class_id: string;
  class_title: string;
  session_starts_at: string;
  session_status: string;
  location_city: string | null;
  location_country: string | null;
  user_id: string;
  status: EnrolmentStatus;
  waitlist_position: number | null;
  enrolled_at: string;
  decision_at: string | null;
  decision_reason: string | null;
}

export interface MentorEnrolmentListResponse {
  items: MentorEnrolmentListItem[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}
