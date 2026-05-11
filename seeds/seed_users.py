"""
Seed des 22 comptes utilisateurs test sur les branches Supabase hackathon.

⚠️ IMPORTANT : Supabase Auth N'EST PAS partagée entre la branche `main` et les
preview branches (groupe-a/b/c/d). Chaque branche a son propre Auth.
→ Le seed doit être exécuté 4 fois (1 par groupe) avec leur URL + service_role.

Liste canonique des comptes : `hackathon/contracts/test-accounts.md`.

Usage (1 fois par branche) :
    cd hackathon/seeds
    export SUPABASE_URL=https://<branch-host>.supabase.co
    export SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx
    export SUPABASE_BRANCH_LABEL=groupe-a       # pour nommer test_user_ids_groupe-a.json
    python seed_users.py [--dry-run] [--delete-existing]

Prérequis :
    pip install httpx
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from typing import Literal

import httpx

# ─────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────

# Si SUPABASE_URL n'est pas fourni en env var, utilise main par défaut.
# Pendant le hackathon, chaque branche (main + 4 preview) a son propre Auth,
# donc le seed doit être exécuté 4 fois (1 par groupe-a/b/c/d) avec leur URL/key.
DEFAULT_SUPABASE_URL = ""  # Doit être fourni via env var SUPABASE_URL — credentials distribués par le mentor HLMR
COMMON_PASSWORD = "Hackathon2026!"

UserRole = Literal["mentor", "nomad", "admin"]


@dataclass
class TestUser:
    email: str
    display_name: str
    role: UserRole
    # Métadata métier additionnelle (utile pour debug + filtrage)
    extra: dict | None = None


# ─────────────────────────────────────────────────────────────────
# Liste canonique — synchro avec contracts/test-accounts.md
# ─────────────────────────────────────────────────────────────────

USERS: list[TestUser] = [
    # ─── Mentors validés (5) ───────────────────────────────────
    TestUser("antoine.martin@hackathon.test",  "Antoine Martin",  "mentor", {"persona": "star_mentor",       "expertise": "Pitch investor + Funding strategy",          "rating": 4.8, "classes_given": 12}),
    TestUser("marie.dupont@hackathon.test",    "Marie Dupont",    "mentor", {"persona": "top_designer",      "expertise": "UI Design + Webflow mastery",                "rating": 4.7, "classes_given": 9}),
    TestUser("david.cohen@hackathon.test",     "David Cohen",     "mentor", {"persona": "growth_lead",       "expertise": "Growth Marketing B2B + Go-to-market",        "rating": 4.6, "classes_given": 15}),
    TestUser("sophie.bernard@hackathon.test",  "Sophie Bernard",  "mentor", {"persona": "biz_strategist",    "expertise": "Lean Startup + Business Model Canvas",       "rating": 4.5, "classes_given": 7}),
    TestUser("lucas.garcia@hackathon.test",    "Lucas Garcia",    "mentor", {"persona": "newcomer_mentor",   "expertise": "Product Management + UX research",           "rating": 4.3, "classes_given": 3}),

    # ─── Mentors candidats (3) ─────────────────────────────────
    TestUser("emma.rossi@hackathon.test",      "Emma Rossi",      "mentor", {"persona": "candidate_submitted",      "application_status": "submitted"}),
    TestUser("nathan.kim@hackathon.test",      "Nathan Kim",      "mentor", {"persona": "candidate_with_cv_import",  "application_status": "submitted"}),
    TestUser("chloe.dubois@hackathon.test",    "Chloé Dubois",    "mentor", {"persona": "candidate_in_review",       "application_status": "in_review"}),

    # ─── Mentor rejeté (1) ─────────────────────────────────────
    TestUser("paul.weiss@hackathon.test",      "Paul Weiss",      "mentor", {"persona": "candidate_rejected",        "application_status": "rejected"}),

    # ─── Nomads (10) ───────────────────────────────────────────
    TestUser("anna.lopez@hackathon.test",      "Anna Lopez",      "nomad",  {"persona": "star_nomad",        "target_skills": ["pitch-investor", "funding-strategy"]}),
    TestUser("marco.silva@hackathon.test",     "Marco Silva",     "nomad",  {"persona": "design_path",       "target_skills": ["ui-design", "figma-mastery"]}),
    TestUser("lea.bauer@hackathon.test",       "Léa Bauer",       "nomad",  {"persona": "empty_profile",     "target_skills": []}),
    TestUser("julien.morel@hackathon.test",    "Julien Morel",    "nomad",  {"persona": "multi_completed",   "target_skills": ["lean-canvas", "growth-hacking"]}),
    TestUser("nora.ahmed@hackathon.test",      "Nora Ahmed",      "nomad",  {"persona": "active_quiz",       "target_skills": ["pitch-investor"]}),
    TestUser("pierre.lambert@hackathon.test",  "Pierre Lambert",  "nomad",  {"persona": "waitlist",          "target_skills": ["pitch-investor"]}),
    TestUser("clara.kovac@hackathon.test",     "Clara Kovač",     "nomad",  {"persona": "fresh_signup",      "target_skills": []}),
    TestUser("tom.evans@hackathon.test",       "Tom Evans",       "nomad",  {"persona": "path_completed",    "target_skills": ["public-speaking", "storytelling"]}),
    TestUser("eva.fischer@hackathon.test",     "Eva Fischer",     "nomad",  {"persona": "note_taker",        "target_skills": ["pitch-investor"]}),
    TestUser("samuel.nguyen@hackathon.test",   "Samuel Nguyen",   "nomad",  {"persona": "cancelled_enrol",   "target_skills": ["ui-design"]}),

    # ─── Admins HLMR (3) ───────────────────────────────────────
    TestUser("admin@hackathon.test",           "Admin HLMR",      "admin",  {"persona": "main_admin"}),
    TestUser("reviewer@hackathon.test",        "Reviewer Mira",   "admin",  {"persona": "review_admin"}),
    TestUser("cedric@hackathon.test",          "Cédric Tumminello", "admin", {"persona": "ceo"}),
]


# ─────────────────────────────────────────────────────────────────
# API Supabase Admin
# ─────────────────────────────────────────────────────────────────

def admin_headers(service_role_key: str) -> dict[str, str]:
    return {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
    }


def list_existing_users(supabase_url: str, service_role_key: str) -> list[dict]:
    """Liste tous les users existants (paginé)."""
    url = f"{supabase_url}/auth/v1/admin/users?per_page=200"
    response = httpx.get(url, headers=admin_headers(service_role_key), timeout=30)
    response.raise_for_status()
    return response.json().get("users", [])


def delete_user(supabase_url: str, service_role_key: str, user_id: str) -> None:
    url = f"{supabase_url}/auth/v1/admin/users/{user_id}"
    response = httpx.delete(url, headers=admin_headers(service_role_key), timeout=30)
    response.raise_for_status()


def create_user(supabase_url: str, service_role_key: str, user: TestUser) -> dict:
    """Crée un user via Supabase Admin API."""
    url = f"{supabase_url}/auth/v1/admin/users"
    payload = {
        "email": user.email,
        "password": COMMON_PASSWORD,
        "email_confirm": True,  # bypass confirmation email (hackathon)
        "user_metadata": {
            "role": user.role,
            "display_name": user.display_name,
            **(user.extra or {}),
        },
    }
    response = httpx.post(
        url,
        headers=admin_headers(service_role_key),
        json=payload,
        timeout=30,
    )
    if response.status_code >= 400:
        print(f"  ✗ {user.email} — {response.status_code} : {response.text}")
        response.raise_for_status()
    return response.json()


# ─────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description="Seed test users on a Supabase hackathon branch")
    parser.add_argument("--dry-run", action="store_true", help="Affiche les users sans créer")
    parser.add_argument("--delete-existing", action="store_true",
                        help="Supprime les @hackathon.test existants avant de re-créer (idempotency)")
    args = parser.parse_args()

    supabase_url = os.getenv("SUPABASE_URL", DEFAULT_SUPABASE_URL)
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    branch_label = os.getenv("SUPABASE_BRANCH_LABEL", "main")

    if not service_role_key:
        print("✗ SUPABASE_SERVICE_ROLE_KEY non set. Fournir via env var.")
        return 1

    print(f"Seeding {len(USERS)} test users on {supabase_url} (label={branch_label})\n")

    if args.dry_run:
        for u in USERS:
            print(f"  • {u.email:<40s} role={u.role:<7s} display_name={u.display_name!r}")
        print(f"\nDry run — {len(USERS)} users would be created.")
        return 0

    # Optional cleanup
    if args.delete_existing:
        existing = list_existing_users(supabase_url, service_role_key)
        hackathon_users = [u for u in existing if u["email"].endswith("@hackathon.test")]
        print(f"Found {len(hackathon_users)} existing @hackathon.test users, deleting...")
        for u in hackathon_users:
            delete_user(supabase_url, service_role_key, u["id"])
            print(f"  ✗ deleted {u['email']}")
        print()

    # Bulk create
    created: list[dict] = []
    errors: list[str] = []
    for u in USERS:
        try:
            result = create_user(supabase_url, service_role_key, u)
            user_id = result.get("id") or result.get("user", {}).get("id")
            print(f"  ✓ {u.email:<40s} id={user_id}")
            created.append({"email": u.email, "id": user_id, "role": u.role, "display_name": u.display_name})
        except httpx.HTTPStatusError as exc:
            errors.append(f"{u.email} : {exc.response.text}")

    print(f"\nCreated {len(created)}/{len(USERS)} users.")
    if errors:
        print(f"\n{len(errors)} errors :")
        for e in errors:
            print(f"  - {e}")
        return 1

    # Save the user_id mapping in JSON for later use by seed data scripts
    output_filename = f"test_user_ids_{branch_label}.json"
    output_path = os.path.join(os.path.dirname(__file__), output_filename)
    with open(output_path, "w") as f:
        json.dump(created, f, indent=2, ensure_ascii=False)
    print(f"\nUser IDs saved to {output_path} (for downstream seed data scripts).")

    return 0


if __name__ == "__main__":
    sys.exit(main())
