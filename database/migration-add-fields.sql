-- =====================================================
-- MIGRATION: Aggiunta campo nazionalità
-- =====================================================
-- Data: 28/08/2025
-- Descrizione: Aggiunge solo il campo nazionalità mancante
-- =====================================================

-- Aggiungi solo il campo nazionalità che manca
ALTER TABLE collaboratori 
ADD COLUMN IF NOT EXISTS nazionalita VARCHAR(100) DEFAULT 'Italiana';

-- Commento sul nuovo campo
COMMENT ON COLUMN collaboratori.nazionalita IS 'Nazionalità del collaboratore';

-- Rimuovi il vincolo NOT NULL da codice_fiscale (ora è opzionale inizialmente)
ALTER TABLE collaboratori 
ALTER COLUMN codice_fiscale DROP NOT NULL;

-- Rimuovi il vincolo NOT NULL da cognome (ora è opzionale inizialmente)  
ALTER TABLE collaboratori 
ALTER COLUMN cognome DROP NOT NULL;

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