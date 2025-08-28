-- =====================================================
-- MIGRATION: Aggiunta campo nazionalità
-- =====================================================
-- Data: 28/08/2025
-- Descrizione: Aggiunge solo il campo nazionalità mancante
-- =====================================================

-- Aggiungi i campi mancanti
ALTER TABLE collaboratori 
ADD COLUMN IF NOT EXISTS nazionalita VARCHAR(100) DEFAULT 'Italiana',
ADD COLUMN IF NOT EXISTS dati_completati BOOLEAN DEFAULT false;

-- Commenti sui nuovi campi
COMMENT ON COLUMN collaboratori.nazionalita IS 'Nazionalità del collaboratore';
COMMENT ON COLUMN collaboratori.dati_completati IS 'True quando il collaboratore ha completato tutti i dati richiesti';

-- Nota: codice_fiscale e cognome rimangono NOT NULL
-- Il collaboratore li compilerà obbligatoriamente prima della firma

-- Verifica che le modifiche siano state applicate
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'collaboratori' 
    AND column_name = 'nazionalita'
ORDER BY ordinal_position;