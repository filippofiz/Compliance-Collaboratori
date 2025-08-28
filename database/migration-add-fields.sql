-- =====================================================
-- MIGRATION: Aggiunta campi mancanti per completamento dati
-- =====================================================
-- Data: 28/08/2025
-- Descrizione: Aggiunge campi per completamento dati collaboratore
-- =====================================================

-- Aggiungi campi mancanti alla tabella collaboratori
ALTER TABLE collaboratori 
ADD COLUMN IF NOT EXISTS nazionalita VARCHAR(100) DEFAULT 'Italiana',
ADD COLUMN IF NOT EXISTS tipo_collaboratore VARCHAR(50),
ADD COLUMN IF NOT EXISTS iban VARCHAR(34),
ADD COLUMN IF NOT EXISTS tariffa_oraria DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS dati_completati BOOLEAN DEFAULT false;

-- Commento sui nuovi campi
COMMENT ON COLUMN collaboratori.nazionalita IS 'Nazionalità del collaboratore';
COMMENT ON COLUMN collaboratori.tipo_collaboratore IS 'Tipo: tutor, consulente, formatore, altro';
COMMENT ON COLUMN collaboratori.iban IS 'IBAN per pagamenti';
COMMENT ON COLUMN collaboratori.tariffa_oraria IS 'Tariffa oraria concordata';
COMMENT ON COLUMN collaboratori.dati_completati IS 'True quando il collaboratore ha completato tutti i dati richiesti';

-- Rimuovi il vincolo NOT NULL da codice_fiscale (ora è opzionale inizialmente)
ALTER TABLE collaboratori 
ALTER COLUMN codice_fiscale DROP NOT NULL;

-- Rimuovi il vincolo NOT NULL da cognome (ora è opzionale inizialmente)
ALTER TABLE collaboratori 
ALTER COLUMN cognome DROP NOT NULL;

-- Crea indice per ricerche veloci
CREATE INDEX IF NOT EXISTS idx_collaboratori_tipo ON collaboratori(tipo_collaboratore);
CREATE INDEX IF NOT EXISTS idx_collaboratori_dati_completati ON collaboratori(dati_completati);

-- Aggiorna i record esistenti per impostare dati_completati
UPDATE collaboratori 
SET dati_completati = CASE 
    WHEN nome IS NOT NULL 
        AND cognome IS NOT NULL 
        AND email IS NOT NULL 
        AND codice_fiscale IS NOT NULL 
        AND telefono IS NOT NULL 
        AND data_nascita IS NOT NULL 
        AND luogo_nascita IS NOT NULL 
        AND indirizzo IS NOT NULL 
        AND citta IS NOT NULL 
        AND cap IS NOT NULL 
        AND provincia IS NOT NULL 
        AND iban IS NOT NULL
    THEN true 
    ELSE false 
END
WHERE dati_completati IS NULL;

-- Verifica che le modifiche siano state applicate
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'collaboratori' 
    AND column_name IN ('nazionalita', 'tipo_collaboratore', 'iban', 'tariffa_oraria', 'dati_completati')
ORDER BY ordinal_position;