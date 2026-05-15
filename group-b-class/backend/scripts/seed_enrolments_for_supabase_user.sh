#!/usr/bin/env bash
set -euo pipefail

# Insère 3 candidatures fictives (applied / accepted / waitlist) pour un user_id Supabase.
# UUID : Supabase Dashboard → Authentication → Users, ou JWT sub côté client.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="${SCRIPT_DIR}/seed_enrolments_for_supabase_user.sql"

if [[ -z "${LEARNER_USER_ID:-}" ]]; then
  echo "Définis ton UUID Supabase (auth), par exemple :" >&2
  echo "  LEARNER_USER_ID='xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' ${0}" >&2
  exit 1
fi

if ! [[ "${LEARNER_USER_ID}" =~ ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$ ]]; then
  echo "LEARNER_USER_ID doit être un UUID valide." >&2
  exit 1
fi

docker exec -i pg-hackathon-group-b psql -U postgres -d postgres \
  -v "learner_id=${LEARNER_USER_ID}" \
  < "${SQL_FILE}"

echo "OK — 3 enrolments + 3 sessions (44444444-0002-…) pour user_id=${LEARNER_USER_ID}"
