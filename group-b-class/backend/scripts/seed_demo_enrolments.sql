-- ═══════════════════════════════════════════════════════════════════════════
-- Données de démo : session Barcelone + candidatures fictives (Antoine Martin)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Prérequis : migrations Alembic appliquées (classe seed 33333333-… pour Antoine).
--
-- Exécution (depuis la machine hôte, conteneur docker-compose du groupe B) :
--   docker exec -i pg-hackathon-group-b psql -U postgres -d postgres < backend/scripts/seed_demo_enrolments.sql
--
-- Idempotence : supprime la session démo fixe puis la recrée avec ses enrolments.
-- Les user_id sont des UUID fictifs (pas de FK vers auth.users en Postgres local).
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DELETE FROM mira_class_enrolment WHERE session_id = '44444444-0001-0000-0000-000000000001';
DELETE FROM mira_class_session WHERE id = '44444444-0001-0000-0000-000000000001';

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
) VALUES (
    '44444444-0001-0000-0000-000000000001',
    '33333333-0001-0000-0000-000000000001',
    'physical',
    'Carrer de Mallorca 272, 08037 Barcelona',
    'Barcelone',
    'Espagne',
    8,
    TRUE,
    20,
    24900,
    'open_enrolment',
    TIMESTAMPTZ '2026-07-05 09:00:00+00',
    TIMESTAMPTZ '2026-07-26 18:00:00+00',
    TIMESTAMPTZ '2026-07-04 09:00:00+00',
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
    '55555555-0001-0000-0000-000000000001',
    '44444444-0001-0000-0000-000000000001',
    'a1111111-1111-4111-8111-111111110001',
    'applied',
    NULL,
    '{"motivation":"Démo candidature en attente de décision"}'::jsonb,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '2 hours'
),
(
    '55555555-0001-0000-0000-000000000002',
    '44444444-0001-0000-0000-000000000001',
    'a1111111-1111-4111-8111-111111110002',
    'applied',
    NULL,
    '{"motivation":"Seconde candidature démo"}'::jsonb,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '1 hour'
),
(
    '55555555-0001-0000-0000-000000000003',
    '44444444-0001-0000-0000-000000000001',
    'a1111111-1111-4111-8111-111111110003',
    'waitlist',
    1,
    '{}'::jsonb,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '30 minutes'
),
(
    '55555555-0001-0000-0000-000000000004',
    '44444444-0001-0000-0000-000000000001',
    'a1111111-1111-4111-8111-111111110004',
    'accepted',
    NULL,
    '{}'::jsonb,
    NOW(),
    'b7246959-6255-4197-b140-cb4f1a290138',
    NULL,
    NOW() - INTERVAL '3 days'
);

UPDATE mira_class_session
SET
    enrolment_count = (
        SELECT COUNT(*)::integer
        FROM mira_class_enrolment e
        WHERE e.session_id = '44444444-0001-0000-0000-000000000001'
          AND e.status = 'accepted'
    ),
    waitlist_count = (
        SELECT COUNT(*)::integer
        FROM mira_class_enrolment e
        WHERE e.session_id = '44444444-0001-0000-0000-000000000001'
          AND e.status = 'waitlist'
    )
WHERE id = '44444444-0001-0000-0000-000000000001';

COMMIT;
