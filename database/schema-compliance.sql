-- =====================================================
-- SCHEMA DATABASE COMPLIANCE COLLABORATORI UPTOTEN
-- =====================================================
-- Sistema per gestione compliance con firma digitale
-- Validità legale secondo Regolamento eIDAS (UE) n. 910/2014
-- =====================================================

-- Crea schema dedicato
CREATE SCHEMA IF NOT EXISTS compliance;

-- Abilita estensioni necessarie
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABELLA: collaboratori
-- =====================================================
CREATE TABLE IF NOT EXISTS compliance.collaboratori (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Dati anagrafici
    nome VARCHAR(100) NOT NULL,
    cognome VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    data_nascita DATE,
    luogo_nascita VARCHAR(100),
    
    -- Dati fiscali
    codice_fiscale VARCHAR(16) UNIQUE NOT NULL,
    partita_iva VARCHAR(11),
    
    -- Dati residenza
    indirizzo VARCHAR(255),
    cap VARCHAR(5),
    citta VARCHAR(100),
    provincia VARCHAR(2),
    
    -- Tipo contratto e stato
    tipo_contratto VARCHAR(50) CHECK (tipo_contratto IN ('occasionale', 'partita_iva', 'misto')) DEFAULT 'occasionale',
    stato VARCHAR(50) DEFAULT 'attivo' CHECK (stato IN ('attivo', 'sospeso', 'cessato')),
    
    -- Tracking limite €5.000 per occasionali
    importo_anno_corrente DECIMAL(10,2) DEFAULT 0.00,
    limite_annuale DECIMAL(10,2) DEFAULT 5000.00,
    anno_riferimento INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    
    -- Documenti e compliance
    documenti_inviati BOOLEAN DEFAULT false,
    documenti_firmati BOOLEAN DEFAULT false,
    data_ultimo_invio TIMESTAMP WITH TIME ZONE,
    data_ultima_firma TIMESTAMP WITH TIME ZONE,
    
    -- Metadati
    note TEXT,
    tags JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- =====================================================
-- TABELLA: documenti
-- =====================================================
CREATE TABLE IF NOT EXISTS compliance.documenti (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collaboratore_id UUID NOT NULL REFERENCES compliance.collaboratori(id) ON DELETE CASCADE,
    
    -- Dettagli documento
    tipo VARCHAR(100) NOT NULL,
    titolo VARCHAR(255) NOT NULL,
    descrizione TEXT,
    
    -- Contenuto
    contenuto_html TEXT,
    contenuto_pdf BYTEA,
    template_utilizzato VARCHAR(100),
    
    -- Stato documento
    stato VARCHAR(50) DEFAULT 'bozza' CHECK (stato IN ('bozza', 'inviato', 'letto', 'firmato', 'archiviato')),
    
    -- Tracking invio
    inviato_il TIMESTAMP WITH TIME ZONE,
    letto_il TIMESTAMP WITH TIME ZONE,
    firmato_il TIMESTAMP WITH TIME ZONE,
    
    -- Hash per integrità
    hash_documento VARCHAR(64), -- SHA-256
    
    -- Versioning
    versione INTEGER DEFAULT 1,
    documento_precedente_id UUID,
    
    -- Metadati
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELLA: firme_digitali
-- =====================================================
CREATE TABLE IF NOT EXISTS compliance.firme_digitali (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    documento_id UUID NOT NULL REFERENCES compliance.documenti(id) ON DELETE CASCADE,
    collaboratore_id UUID NOT NULL REFERENCES compliance.collaboratori(id) ON DELETE CASCADE,
    
    -- Dati firma
    nome_firmatario VARCHAR(200) NOT NULL,
    email_firmatario VARCHAR(255) NOT NULL,
    codice_fiscale_firmatario VARCHAR(16),
    
    -- Validazione firma
    metodo_firma VARCHAR(50) DEFAULT 'email_verification',
    firma_grafica TEXT, -- Base64 della firma se presente
    
    -- Tracking tecnico
    ip_address INET,
    user_agent TEXT,
    dispositivo VARCHAR(100),
    browser VARCHAR(100),
    
    -- Hash e sicurezza
    hash_documento_firmato VARCHAR(64), -- SHA-256 al momento della firma
    certificato_firma TEXT,
    
    -- Conferma email
    token_conferma VARCHAR(255) UNIQUE,
    email_confermata BOOLEAN DEFAULT false,
    confermata_il TIMESTAMP WITH TIME ZONE,
    
    -- Validità
    valida BOOLEAN DEFAULT false,
    validata_il TIMESTAMP WITH TIME ZONE,
    scadenza TIMESTAMP WITH TIME ZONE,
    
    -- Metadati
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELLA: ricevute
-- =====================================================
CREATE TABLE IF NOT EXISTS compliance.ricevute (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collaboratore_id UUID NOT NULL REFERENCES compliance.collaboratori(id) ON DELETE CASCADE,
    
    -- Dati ricevuta
    numero_ricevuta VARCHAR(50) UNIQUE NOT NULL,
    data_ricevuta DATE NOT NULL,
    
    -- Importi
    importo_lordo DECIMAL(10,2) NOT NULL,
    ritenuta_acconto DECIMAL(10,2) DEFAULT 0.00,
    importo_netto DECIMAL(10,2) NOT NULL,
    
    -- Descrizione prestazione
    descrizione_prestazione TEXT NOT NULL,
    periodo_riferimento VARCHAR(100),
    
    -- Pagamento
    stato_pagamento VARCHAR(50) DEFAULT 'da_pagare' CHECK (stato_pagamento IN ('da_pagare', 'pagato', 'annullato')),
    data_pagamento DATE,
    metodo_pagamento VARCHAR(50),
    riferimento_pagamento VARCHAR(100),
    
    -- Documenti collegati
    pdf_ricevuta BYTEA,
    hash_ricevuta VARCHAR(64),
    
    -- Metadati
    note TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELLA: audit_log
-- =====================================================
CREATE TABLE IF NOT EXISTS compliance.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Chi e quando
    collaboratore_id UUID REFERENCES compliance.collaboratori(id) ON DELETE SET NULL,
    utente_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Cosa
    tipo_azione VARCHAR(100) NOT NULL,
    descrizione TEXT NOT NULL,
    
    -- Dettagli entità modificata
    entita_tipo VARCHAR(50),
    entita_id UUID,
    valori_precedenti JSONB,
    valori_nuovi JSONB,
    
    -- Tracking tecnico
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    -- Risultato
    successo BOOLEAN DEFAULT true,
    messaggio_errore TEXT,
    
    -- Metadati
    metadata JSONB
);

-- =====================================================
-- TABELLA: email_logs (opzionale, per conservazione permanente)
-- =====================================================
CREATE TABLE IF NOT EXISTS compliance.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collaboratore_id UUID REFERENCES compliance.collaboratori(id) ON DELETE SET NULL,
    
    -- Dettagli email
    tipo_email VARCHAR(50) NOT NULL,
    destinatario VARCHAR(255) NOT NULL,
    oggetto VARCHAR(255) NOT NULL,
    contenuto_html TEXT,
    
    -- Tracking invio
    provider VARCHAR(50) DEFAULT 'resend',
    provider_message_id VARCHAR(255),
    stato VARCHAR(50) DEFAULT 'inviato',
    
    -- Eventi
    inviato_il TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    consegnato_il TIMESTAMP WITH TIME ZONE,
    aperto_il TIMESTAMP WITH TIME ZONE,
    cliccato_il TIMESTAMP WITH TIME ZONE,
    bounce_il TIMESTAMP WITH TIME ZONE,
    bounce_tipo VARCHAR(50),
    bounce_messaggio TEXT,
    
    -- Metadati
    tags JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDICI PER PERFORMANCE
-- =====================================================

-- Indici collaboratori
CREATE INDEX idx_collaboratori_email ON compliance.collaboratori(email);
CREATE INDEX idx_collaboratori_cf ON compliance.collaboratori(codice_fiscale);
CREATE INDEX idx_collaboratori_tipo ON compliance.collaboratori(tipo_contratto);
CREATE INDEX idx_collaboratori_stato ON compliance.collaboratori(stato);
CREATE INDEX idx_collaboratori_created ON compliance.collaboratori(created_at DESC);

-- Indici documenti
CREATE INDEX idx_documenti_collaboratore ON compliance.documenti(collaboratore_id);
CREATE INDEX idx_documenti_stato ON compliance.documenti(stato);
CREATE INDEX idx_documenti_tipo ON compliance.documenti(tipo);
CREATE INDEX idx_documenti_created ON compliance.documenti(created_at DESC);

-- Indici firme
CREATE INDEX idx_firme_documento ON compliance.firme_digitali(documento_id);
CREATE INDEX idx_firme_collaboratore ON compliance.firme_digitali(collaboratore_id);
CREATE INDEX idx_firme_token ON compliance.firme_digitali(token_conferma);
CREATE INDEX idx_firme_created ON compliance.firme_digitali(created_at DESC);

-- Indici ricevute
CREATE INDEX idx_ricevute_collaboratore ON compliance.ricevute(collaboratore_id);
CREATE INDEX idx_ricevute_numero ON compliance.ricevute(numero_ricevuta);
CREATE INDEX idx_ricevute_data ON compliance.ricevute(data_ricevuta DESC);
CREATE INDEX idx_ricevute_stato ON compliance.ricevute(stato_pagamento);

-- Indici audit_log
CREATE INDEX idx_audit_collaboratore ON compliance.audit_log(collaboratore_id);
CREATE INDEX idx_audit_tipo ON compliance.audit_log(tipo_azione);
CREATE INDEX idx_audit_timestamp ON compliance.audit_log(timestamp DESC);
CREATE INDEX idx_audit_entita ON compliance.audit_log(entita_tipo, entita_id);

-- =====================================================
-- TRIGGER PER UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION compliance.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collaboratori_updated_at 
    BEFORE UPDATE ON compliance.collaboratori
    FOR EACH ROW EXECUTE FUNCTION compliance.update_updated_at_column();

CREATE TRIGGER update_documenti_updated_at 
    BEFORE UPDATE ON compliance.documenti
    FOR EACH ROW EXECUTE FUNCTION compliance.update_updated_at_column();

CREATE TRIGGER update_ricevute_updated_at 
    BEFORE UPDATE ON compliance.ricevute
    FOR EACH ROW EXECUTE FUNCTION compliance.update_updated_at_column();

-- =====================================================
-- TRIGGER PER TRACKING LIMITE €5.000
-- =====================================================

CREATE OR REPLACE FUNCTION compliance.check_limite_occasionale()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo per collaboratori con contratto occasionale
    IF EXISTS (
        SELECT 1 FROM compliance.collaboratori 
        WHERE id = NEW.collaboratore_id 
        AND tipo_contratto = 'occasionale'
    ) THEN
        -- Aggiorna importo totale anno corrente
        UPDATE compliance.collaboratori
        SET importo_anno_corrente = (
            SELECT COALESCE(SUM(importo_lordo), 0)
            FROM compliance.ricevute
            WHERE collaboratore_id = NEW.collaboratore_id
            AND EXTRACT(YEAR FROM data_ricevuta) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND stato_pagamento != 'annullato'
        )
        WHERE id = NEW.collaboratore_id;
        
        -- Controlla se supera il limite
        IF (SELECT importo_anno_corrente FROM compliance.collaboratori WHERE id = NEW.collaboratore_id) > 5000 THEN
            -- Log warning in audit
            INSERT INTO compliance.audit_log (
                collaboratore_id,
                tipo_azione,
                descrizione,
                entita_tipo,
                entita_id,
                valori_nuovi
            ) VALUES (
                NEW.collaboratore_id,
                'limite_superato',
                'Superato limite €5.000 per prestazione occasionale',
                'ricevuta',
                NEW.id,
                jsonb_build_object('importo_totale', (SELECT importo_anno_corrente FROM compliance.collaboratori WHERE id = NEW.collaboratore_id))
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_limite_after_ricevuta
    AFTER INSERT OR UPDATE ON compliance.ricevute
    FOR EACH ROW EXECUTE FUNCTION compliance.check_limite_occasionale();

-- =====================================================
-- FUNZIONI UTILITY
-- =====================================================

-- Funzione per generare numero ricevuta
CREATE OR REPLACE FUNCTION compliance.genera_numero_ricevuta()
RETURNS VARCHAR AS $$
DECLARE
    anno VARCHAR;
    progressivo INTEGER;
    numero VARCHAR;
BEGIN
    anno := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_ricevuta FROM 5) AS INTEGER)), 0) + 1
    INTO progressivo
    FROM compliance.ricevute
    WHERE numero_ricevuta LIKE anno || '-%';
    
    numero := anno || '-' || LPAD(progressivo::VARCHAR, 5, '0');
    
    RETURN numero;
END;
$$ LANGUAGE plpgsql;

-- Funzione per calcolare hash SHA-256
CREATE OR REPLACE FUNCTION compliance.generate_hash(content TEXT)
RETURNS VARCHAR AS $$
BEGIN
    RETURN encode(digest(content, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VISTE UTILI
-- =====================================================

-- Vista compliance status
CREATE OR REPLACE VIEW compliance.v_compliance_status AS
SELECT 
    c.id,
    c.nome,
    c.cognome,
    c.email,
    c.tipo_contratto,
    c.stato,
    c.importo_anno_corrente,
    c.limite_annuale,
    CASE 
        WHEN c.tipo_contratto = 'occasionale' AND c.importo_anno_corrente > c.limite_annuale * 0.8 
        THEN 'warning'
        WHEN c.tipo_contratto = 'occasionale' AND c.importo_anno_corrente > c.limite_annuale 
        THEN 'danger'
        ELSE 'ok'
    END AS limite_status,
    COUNT(DISTINCT d.id) AS totale_documenti,
    COUNT(DISTINCT CASE WHEN d.stato = 'firmato' THEN d.id END) AS documenti_firmati,
    COUNT(DISTINCT CASE WHEN d.stato != 'firmato' THEN d.id END) AS documenti_mancanti,
    MAX(d.firmato_il) AS ultima_firma,
    c.created_at,
    c.updated_at
FROM compliance.collaboratori c
LEFT JOIN compliance.documenti d ON c.id = d.collaboratore_id
GROUP BY c.id;

-- Vista ricevute con dettagli collaboratore
CREATE OR REPLACE VIEW compliance.v_ricevute_complete AS
SELECT 
    r.*,
    c.nome,
    c.cognome,
    c.codice_fiscale,
    c.tipo_contratto,
    c.email,
    c.importo_anno_corrente,
    c.limite_annuale
FROM compliance.ricevute r
JOIN compliance.collaboratori c ON r.collaboratore_id = c.id;

-- =====================================================
-- POLICIES RLS (Row Level Security) - DA CONFIGURARE
-- =====================================================

-- Per ora disabilitiamo RLS per testing
ALTER TABLE compliance.collaboratori DISABLE ROW LEVEL SECURITY;
ALTER TABLE compliance.documenti DISABLE ROW LEVEL SECURITY;
ALTER TABLE compliance.firme_digitali DISABLE ROW LEVEL SECURITY;
ALTER TABLE compliance.ricevute DISABLE ROW LEVEL SECURITY;
ALTER TABLE compliance.audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE compliance.email_logs DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- DATI DI TEST (OPZIONALE)
-- =====================================================

-- Decommentare per inserire dati di esempio
/*
INSERT INTO compliance.collaboratori (nome, cognome, email, codice_fiscale, tipo_contratto) VALUES
    ('Mario', 'Rossi', 'mario.rossi@example.com', 'RSSMRA80A01H501Z', 'occasionale'),
    ('Laura', 'Bianchi', 'laura.bianchi@example.com', 'BNCLRA85M41H501X', 'partita_iva'),
    ('Giuseppe', 'Verdi', 'giuseppe.verdi@example.com', 'VRDGPP75L01H501Y', 'misto');
*/

-- =====================================================
-- GRANT PERMESSI (IMPORTANTE PER PRODUZIONE)
-- =====================================================

-- Permessi per anon users (pubblico)
GRANT USAGE ON SCHEMA compliance TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA compliance TO anon;

-- Permessi per authenticated users
GRANT USAGE ON SCHEMA compliance TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA compliance TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA compliance TO authenticated;

-- Permessi per service role (admin)
GRANT ALL ON SCHEMA compliance TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA compliance TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA compliance TO service_role;

-- =====================================================
-- COMMENTI PER DOCUMENTAZIONE
-- =====================================================

COMMENT ON SCHEMA compliance IS 'Schema per gestione compliance collaboratori UpToTen con firma digitale';
COMMENT ON TABLE compliance.collaboratori IS 'Anagrafica collaboratori (tutor, consulenti, formatori)';
COMMENT ON TABLE compliance.documenti IS 'Documenti di compliance da firmare';
COMMENT ON TABLE compliance.firme_digitali IS 'Firme digitali con validità legale eIDAS';
COMMENT ON TABLE compliance.ricevute IS 'Ricevute prestazioni con tracking limite €5.000';
COMMENT ON TABLE compliance.audit_log IS 'Log completo di tutte le azioni per compliance GDPR';
COMMENT ON TABLE compliance.email_logs IS 'Log permanente email inviate (conservazione legale)';

-- =====================================================
-- FINE SCHEMA
-- =====================================================