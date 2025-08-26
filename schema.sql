-- Schema per UPtoTEN Data Collection / Dati di Fatturazione
-- Prefisso tabelle: datifatturazione_
-- Questo permette di condividere il database Supabase con altri progetti mantenendo separazione logica
-- Ogni progetto usa il proprio prefisso univoco per evitare conflitti

-- Creazione tabella studenti per Dati Fatturazione
CREATE TABLE IF NOT EXISTS datifatturazione_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  nome_studente VARCHAR(100) NOT NULL,
  cognome_studente VARCHAR(100) NOT NULL,
  scuola VARCHAR(255) NOT NULL,
  indirizzo_scuola VARCHAR(100) NOT NULL,
  nome_genitore VARCHAR(100) NOT NULL,
  cognome_genitore VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  nome_fatturazione VARCHAR(200),
  email_fatturazione VARCHAR(255),
  codice_fiscale VARCHAR(16) NOT NULL,
  indirizzo_residenza VARCHAR(255) NOT NULL,
  cap VARCHAR(5) NOT NULL,
  citta VARCHAR(100) NOT NULL,
  provincia VARCHAR(2) NOT NULL,
  pacchetto_ore VARCHAR(50),
  provenienza VARCHAR(100),
  consenso_regolamento BOOLEAN NOT NULL DEFAULT FALSE,
  consenso_privacy BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_datifatturazione_students
BEFORE UPDATE ON datifatturazione_students
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Indici per performance
CREATE INDEX idx_datifatturazione_students_email ON datifatturazione_students(email);
CREATE INDEX idx_datifatturazione_students_cf ON datifatturazione_students(codice_fiscale);
CREATE INDEX idx_datifatturazione_students_created ON datifatturazione_students(created_at DESC);

-- Commenti sulla tabella per documentazione
COMMENT ON TABLE datifatturazione_students IS 'Tabella per registrazione anagrafica studenti UPtoTEN';
COMMENT ON COLUMN datifatturazione_students.id IS 'ID univoco generato automaticamente';
COMMENT ON COLUMN datifatturazione_students.email IS 'Email principale di contatto';
COMMENT ON COLUMN datifatturazione_students.codice_fiscale IS 'Codice fiscale per fatturazione';
COMMENT ON COLUMN datifatturazione_students.created_at IS 'Data e ora di registrazione';
COMMENT ON COLUMN datifatturazione_students.updated_at IS 'Data e ora ultimo aggiornamento';