-- Tabella per Error Monitoring System
-- Sistema integrato di monitoraggio errori

CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    error_count INTEGER DEFAULT 0,
    critical_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0,
    errors_data JSONB,
    system_info JSONB,
    session_duration BIGINT, -- durata sessione in millisecondi
    ip_address INET,
    user_agent TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    notes TEXT
);

-- Indici per query efficienti
CREATE INDEX idx_error_logs_session ON error_logs(session_id);
CREATE INDEX idx_error_logs_timestamp ON error_logs(timestamp);
CREATE INDEX idx_error_logs_critical ON error_logs(critical_count) WHERE critical_count > 0;
CREATE INDEX idx_error_logs_resolved ON error_logs(resolved);

-- Vista per errori critici non risolti
CREATE OR REPLACE VIEW v_critical_errors AS
SELECT 
    id,
    session_id,
    timestamp,
    critical_count,
    errors_data,
    system_info
FROM error_logs
WHERE critical_count > 0 
    AND resolved = FALSE
ORDER BY timestamp DESC;

-- Vista per statistiche giornaliere
CREATE OR REPLACE VIEW v_daily_error_stats AS
SELECT 
    DATE(timestamp) as day,
    COUNT(*) as total_sessions,
    SUM(error_count) as total_errors,
    SUM(critical_count) as total_critical,
    SUM(warning_count) as total_warnings,
    AVG(session_duration/1000)::INTEGER as avg_session_seconds,
    MAX(error_count) as max_errors_per_session
FROM error_logs
GROUP BY DATE(timestamp)
ORDER BY day DESC;

-- Funzione per cleanup vecchi log (mantieni solo ultimi 30 giorni)
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM error_logs 
    WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Policy RLS (Row Level Security)
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Policy per permettere insert da tutti (per logging errori)
CREATE POLICY "Allow insert error logs" ON error_logs
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Policy per permettere select solo ad admin
CREATE POLICY "Admin can view all error logs" ON error_logs
    FOR SELECT
    TO authenticated
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM admin_users WHERE active = true
        )
    );

-- Trigger per notifica errori critici
CREATE OR REPLACE FUNCTION notify_critical_errors()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.critical_count > 0 THEN
        -- Invia notifica (può essere gestita da Edge Function)
        PERFORM pg_notify('critical_error', json_build_object(
            'session_id', NEW.session_id,
            'critical_count', NEW.critical_count,
            'timestamp', NEW.timestamp
        )::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_critical_errors
    AFTER INSERT ON error_logs
    FOR EACH ROW
    EXECUTE FUNCTION notify_critical_errors();

-- Commenti per documentazione
COMMENT ON TABLE error_logs IS 'Log degli errori JavaScript e di rete dal frontend';
COMMENT ON COLUMN error_logs.session_id IS 'ID univoco della sessione browser';
COMMENT ON COLUMN error_logs.errors_data IS 'Array JSON con dettagli di tutti gli errori';
COMMENT ON COLUMN error_logs.system_info IS 'Informazioni sistema client (browser, OS, etc)';
COMMENT ON COLUMN error_logs.resolved IS 'Flag per marcare errori come risolti/investigati';