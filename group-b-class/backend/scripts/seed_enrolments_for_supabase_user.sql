-- ═══════════════════════════════════════════════════════════════════════════
-- Candidatures fictives pour TON user_id Supabase (auth.users.id)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Pourquoi plusieurs sessions : l'index unique
--   uniq_mira_class_enrolment_active_user (session_id, user_id)
--   n'autorise qu'une candidature « active » par session et par utilisateur.
--
-- Prérequis : migration 0003 (classe Antoine 33333333-0001-…).
--
-- Exécution (variable psql obligatoire) :
--   LEARNER_USER_ID='xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' \
--     ./backend/scripts/seed_enrolments_for_supabase_user.sh
--
-- Ou à la main :
--   docker exec -i pg-hackathon-group-b psql -U postgres -d postgres \
--     -v learner_id=TON_UUID_SANS_GUILLEMETS < backend/scripts/seed_enrolments_for_supabase_user.sql
-- ═══════════════════════════════════════════════════════════════════════════

\set ON_ERROR_STOP on

BEGIN;

-- Nettoyage idempotent (enrolements + sessions dédiées à ce script)
DELETE FROM mira_class_enrolment WHERE id IN (
    '55555555-0002-0000-0000-000000000001',
    '55555555-0002-0000-0000-000000000002',
    '55555555-0002-0000-0000-000000000003'
);
DELETE FROM mira_class_session WHERE id IN (
    '44444444-0002-0000-0000-000000000001',
    '44444444-0002-0000-0000-000000000002',
    '44444444-0002-0000-0000-000000000003'
);

INSERT INTO mira_class_session (
    id,
    class_id,
    type,
    location_address,
    location_city,
    location_country,
    capacity,
    waitlist_enabled,
    waitlist_max_size,
    price_cents,
    status,
    starts_at,
    ends_at,
    enrolment_deadline,
    enrolment_count,
    waitlist_count
) VALUES
(
    '44444444-0002-0000-0000-000000000001',
    '33333333-0001-0000-0000-000000000001',
    'virtual',
    NULL,
    NULL,
    NULL,
    12,
    TRUE,
    15,
    19900,
    'open_enrolment',
    TIMESTAMPTZ '2026-08-10 14:00:00+00',
    TIMESTAMPTZ '2026-08-24 17:00:00+00',
    TIMESTAMPTZ '2026-08-09 14:00:00+00',
    0,
    0
),
(
    '44444444-0002-0000-0000-000000000002',
    '33333333-0001-0000-0000-000000000001',
    'physical',
    'Av. da Liberdade 180, 1250-146 Lisboa',
    'Lisbonne',
    'Portugal',
    6,
    TRUE,
    10,
    24900,
    'open_enrolment',
    TIMESTAMPTZ '2026-09-02 08:30:00+00',
    TIMESTAMPTZ '2026-09-16 18:00:00+00',
    TIMESTAMPTZ '2026-09-01 08:30:00+00',
    0,
    0
),
(
    '44444444-0002-0000-0000-000000000003',
    '33333333-0001-0000-0000-000000000001',
    'physical',
    '18 Rue de la Paix, 75002 Paris',
    'Paris',
    'France',
    4,
    TRUE,
    8,
    29900,
    'full',
    TIMESTAMPTZ '2026-10-01 09:00:00+00',
    TIMESTAMPTZ '2026-10-15 18:00:00+00',
    TIMESTAMPTZ '2026-09-30 09:00:00+00',
    0,
    0
);

INSERT INTO mira_class_enrolment (
    id,
    session_id,
    user_id,
    status,
    waitlist_position,
    application_data,
    decision_at,
    decision_by_mentor_id,
    decision_reason,
    enrolled_at
) VALUES
(
    '55555555-0002-0000-0000-000000000001',
    '44444444-0002-0000-0000-000000000001',
    :'learner_id'::uuid,
    'applied',
    NULL,
    '{"motivation":"Seed local — test vue apprenants / CRM mentor"}'::jsonb,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '5 days'
),
(
    '55555555-0002-0000-0000-000000000002',
    '44444444-0002-0000-0000-000000000002',
    :'learner_id'::uuid,
    'accepted',
    NULL,
    '{"motivation":"Accepté pour démo dashboard"}'::jsonb,
    NOW() - INTERVAL '2 days',
    'b7246959-6255-4197-b140-cb4f1a290138',
    NULL,
    NOW() - INTERVAL '6 days'
),
(
    '55555555-0002-0000-0000-000000000003',
    '44444444-0002-0000-0000-000000000003',
    :'learner_id'::uuid,
    'waitlist',
    1,
    '{"motivation":"Liste d''attente (session pleine en démo)"}'::jsonb,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '12 hours'
);

UPDATE mira_class_session s
SET
    enrolment_count = COALESCE(e.acc, 0),
    waitlist_count = COALESCE(e.wl, 0)
FROM (
    SELECT
        session_id,
        COUNT(*) FILTER (WHERE status = 'accepted')::integer AS acc,
        COUNT(*) FILTER (WHERE status = 'waitlist')::integer AS wl
    FROM mira_class_enrolment
    WHERE session_id IN (
        '44444444-0002-0000-0000-000000000001',
        '44444444-0002-0000-0000-000000000002',
        '44444444-0002-0000-0000-000000000003'
    )
    GROUP BY session_id
) e
WHERE s.id = e.session_id;

COMMIT;
