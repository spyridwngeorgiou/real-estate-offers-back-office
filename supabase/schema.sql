-- ============================================================
-- Real Estate Offers Greece — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------
-- ENUMS
-- -----------------------------------------------
CREATE TYPE property_type_enum AS ENUM (
  'apartment', 'maisonette', 'villa', 'single_family',
  'plot', 'commercial', 'office', 'other'
);

CREATE TYPE property_status_enum AS ENUM (
  'listed', 'under_offer', 'sold', 'expired', 'off_market',
  'for_rent', 'rented', 'for_renovation', 'under_renovation'
);

CREATE TYPE offer_status_enum AS ENUM (
  'pending', 'countered', 'accepted', 'rejected', 'withdrawn', 'signed'
);

CREATE TYPE contact_type_enum AS ENUM (
  'buyer', 'seller', 'agent', 'notary', 'lawyer', 'other'
);

-- -----------------------------------------------
-- PROPERTIES
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS properties (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address         text NOT NULL,
  city            text,
  neighborhood    text,
  postal_code     text,
  property_type   property_type_enum NOT NULL DEFAULT 'apartment',
  status          property_status_enum NOT NULL DEFAULT 'listed',
  list_price      integer,
  sqm             numeric(8,2),
  plot_sqm        numeric(8,2),
  bedrooms        smallint,
  bathrooms       numeric(3,1),
  floor           text,
  year_built      smallint,
  energy_rating   text,
  has_parking     boolean NOT NULL DEFAULT false,
  has_storage     boolean NOT NULL DEFAULT false,
  common_expenses integer,
  listing_code    text,
  listing_date    date,
  description     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);

-- -----------------------------------------------
-- CONTACTS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     text NOT NULL,
  contact_type  contact_type_enum NOT NULL DEFAULT 'buyer',
  company       text,
  email         text,
  phone         text,
  mobile        text,
  license_no    text,
  address       text,
  tax_id        text,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(contact_type);

-- -----------------------------------------------
-- OFFERS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS offers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id         uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  buyer_id            uuid REFERENCES contacts(id) ON DELETE SET NULL,
  contractor_id       uuid REFERENCES contacts(id) ON DELETE SET NULL,
  seller_agent_id     uuid REFERENCES contacts(id) ON DELETE SET NULL,
  buyer_agent_id      uuid REFERENCES contacts(id) ON DELETE SET NULL,
  notary_id           uuid REFERENCES contacts(id) ON DELETE SET NULL,
  category            text,
  offer_price         integer NOT NULL,
  earnest_money       integer,
  down_payment        integer,
  financing           text,
  status              offer_status_enum NOT NULL DEFAULT 'pending',
  offer_date          date NOT NULL DEFAULT CURRENT_DATE,
  expires_at          date,
  signing_date        date,
  due_diligence_days  smallint,
  special_terms       text,
  internal_notes      text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offers_property ON offers(property_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_buyer ON offers(buyer_id);

-- -----------------------------------------------
-- COUNTER OFFERS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS counter_offers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id      uuid NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  round         smallint NOT NULL DEFAULT 1,
  counter_price integer NOT NULL,
  counter_date  date,
  expires_at    date,
  notes         text,
  from_party    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_counter_offers_offer ON counter_offers(offer_id);

-- -----------------------------------------------
-- NOTES
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id   uuid NOT NULL,
  text        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_entity ON notes(entity_type, entity_id);

-- -----------------------------------------------
-- FILES
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS files (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id   uuid NOT NULL,
  bucket_path text NOT NULL,
  file_name   text NOT NULL,
  file_size   integer,
  mime_type   text,
  label       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_files_entity ON files(entity_type, entity_id);

-- -----------------------------------------------
-- ACTIVITIES
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  text NOT NULL,
  description text NOT NULL,
  entity_type text,
  entity_id   uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);

-- -----------------------------------------------
-- UPDATED_AT TRIGGER
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -----------------------------------------------
-- ROW LEVEL SECURITY (open for anon - single-user app)
-- -----------------------------------------------
ALTER TABLE properties    ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE counter_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE files         ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities    ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (back-office, single-user)
CREATE POLICY "anon_all_properties"     ON properties     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_contacts"       ON contacts       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_offers"         ON offers         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_counter_offers" ON counter_offers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_notes"          ON notes          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_files"          ON files          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_activities"     ON activities     FOR ALL TO anon USING (true) WITH CHECK (true);

-- -----------------------------------------------
-- STORAGE BUCKET (run in Supabase dashboard or via API)
-- Create a public bucket named "attachments"
-- -----------------------------------------------
-- INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true)
-- ON CONFLICT (id) DO NOTHING;
