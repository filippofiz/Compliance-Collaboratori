-- Schema per UPtoTEN Data Collection
-- Prefisso tabelle: uptoten_
-- Questo permette di condividere il database con altri progetti mantenendo separazione logica

-- Creazione tabella studenti per UPtoTEN
CREATE TABLE IF NOT EXISTS uptoten_students (
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

CREATE TRIGGER set_timestamp_uptoten_students
BEFORE UPDATE ON uptoten_students
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Indici per performance
CREATE INDEX idx_uptoten_students_email ON uptoten_students(email);
CREATE INDEX idx_uptoten_students_codice_fiscale ON uptoten_students(codice_fiscale);
CREATE INDEX idx_uptoten_students_created_at ON uptoten_students(created_at DESC);