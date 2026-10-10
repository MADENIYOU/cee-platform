CREATE SCHEMA IF NOT EXISTS diffusion;

CREATE TABLE diffusion.annonces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur_id uuid REFERENCES core.users(id) ON DELETE SET NULL,
  titre text NOT NULL,
  corps text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  visibilite text NOT NULL CHECK (visibilite IN ('publique','interne')),
  departement_cible text,
  classe_cible text,
  statut text NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon','publié','expiré')),
  epingle boolean NOT NULL DEFAULT false,
  date_expiration timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE diffusion.pieces_jointes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annonce_id uuid NOT NULL REFERENCES diffusion.annonces(id) ON DELETE CASCADE,
  url text NOT NULL,
  type text NOT NULL,
  taille_bytes bigint
);

CREATE TABLE diffusion.pages_vitrine (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  titre text NOT NULL,
  contenu jsonb NOT NULL DEFAULT '{}',
  updated_by uuid REFERENCES core.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE diffusion.videos_presentation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url_youtube text NOT NULL,
  titre text NOT NULL,
  ordre_affichage int NOT NULL DEFAULT 0
);

CREATE TABLE diffusion.formations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_club text NOT NULL,
  titre_formation text NOT NULL,
  description text,
  lien_inscription text
);

CREATE TABLE diffusion.evenements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur_id uuid REFERENCES core.users(id) ON DELETE SET NULL,
  titre text NOT NULL,
  description text,
  date timestamptz NOT NULL,
  lieu text,
  visibilite text NOT NULL CHECK (visibilite IN ('publique','interne')),
  capacite int CHECK (capacite IS NULL OR capacite > 0)
);

CREATE TABLE diffusion.inscriptions_evenements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evenement_id uuid NOT NULL REFERENCES diffusion.evenements(id) ON DELETE CASCADE,
  etudiant_id uuid REFERENCES core.users(id) ON DELETE SET NULL,
  statut text NOT NULL CHECK (statut IN ('confirmé','liste_attente')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON diffusion.annonces (statut, visibilite, created_at DESC);
CREATE INDEX ON diffusion.annonces USING gin (tags);
CREATE INDEX ON diffusion.evenements (date);
