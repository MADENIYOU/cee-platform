CREATE SCHEMA IF NOT EXISTS core;
CREATE TABLE IF NOT EXISTS core.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  departement text,
  classe text
);
INSERT INTO core.users (id, nom, departement, classe)
VALUES ('00000000-0000-0000-0000-000000000001', 'Utilisateur Test', 'Génie Informatique', 'L3 GLSI')
ON CONFLICT DO NOTHING;
