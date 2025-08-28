// =====================================================
// SISTEMA LOGGING INTELLIGENTE - COMPLIANCE UPTOTEN
// =====================================================
// Logger con livelli per evitare console.log in produzione
// =====================================================

class Logger {
    constructor() {
        // Livelli: debug < info < warn < error < none
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
            none: 4
        };
        
        // Determina livello in base all'ambiente
        this.currentLevel = this.determineLogLevel();
        
        // Colori per console (se supportati)
        this.colors = {
            debug: '\x1b[36m%s\x1b[0m',  // Cyan
            info: '\x1b[32m%s\x1b[0m',   // Green
            warn: '\x1b[33m%s\x1b[0m',   // Yellow
            error: '\x1b[31m%s\x1b[0m'   // Red
        };
        
        // Storage per logs (utile per debugging)
        this.logHistory = [];
        this.maxHistorySize = 100;
    }
    
    determineLogLevel() {
        // Controlla se siamo in development
        if (typeof window !== 'undefined') {
            // Browser environment
            const hostname = window.location.hostname;
            if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('.local')) {
                return this.levels.debug;
            }
            
            // Check URL parameter for debug mode
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('debug') === 'true') {
                return this.levels.debug;
            }
        }
        
        // Default production level
        return this.levels.error;
    }
    
    setLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.currentLevel = this.levels[level];
            this.info(`Log level set to: ${level}`);
        }
    }
    
    shouldLog(level) {
        return this.levels[level] >= this.currentLevel;
    }
    
    formatMessage(level, message, data) {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        
        let formattedMessage = `${prefix} ${message}`;
        
        if (data !== undefined) {
            if (typeof data === 'object') {
                // Sanitizza dati sensibili
                data = this.sanitizeData(data);
                formattedMessage += '\n' + JSON.stringify(data, null, 2);
            } else {
                formattedMessage += ` - ${data}`;
            }
        }
        
        return formattedMessage;
    }
    
    sanitizeData(data) {
        // Rimuove dati sensibili dai log
        const sensitiveKeys = [
            'password', 'token', 'apiKey', 'api_key', 
            'secret', 'authorization', 'cookie', 'session',
            'creditCard', 'cvv', 'ssn', 'codice_fiscale'
        ];
        
        const sanitized = {...data};
        
        for (const key in sanitized) {
            // Controlla se la chiave contiene parole sensibili
            const lowerKey = key.toLowerCase();
            if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
                // Ricorsione per oggetti nested
                sanitized[key] = this.sanitizeData(sanitized[key]);
            }
        }
        
        return sanitized;
    }
    
    addToHistory(level, message, data) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data: data ? this.sanitizeData(data) : undefined
        };
        
        this.logHistory.push(entry);
        
        // Mantieni dimensione storia sotto controllo
        if (this.logHistory.length > this.maxHistorySize) {
            this.logHistory.shift();
        }
    }
    
    // ===== METODI DI LOGGING =====
    
    debug(message, data) {
        if (this.shouldLog('debug')) {
            const formatted = this.formatMessage('debug', message, data);
            // Usa console originale per evitare ricorsione
            if (window._originalConsole && window._originalConsole.log) {
                window._originalConsole.log(formatted);
            } else {
                // Fallback se non abbiamo salvato l'originale
                console.log.call(console, formatted);
            }
            this.addToHistory('debug', message, data);
        }
    }
    
    log(message, data) {
        // Alias per debug
        this.debug(message, data);
    }
    
    info(message, data) {
        if (this.shouldLog('info')) {
            const formatted = this.formatMessage('info', message, data);
            // Usa console originale per evitare ricorsione
            if (window._originalConsole && window._originalConsole.info) {
                window._originalConsole.info(formatted);
            } else {
                console.info.call(console, formatted);
            }
            this.addToHistory('info', message, data);
        }
    }
    
    warn(message, data) {
        if (this.shouldLog('warn')) {
            const formatted = this.formatMessage('warn', message, data);
            // Usa console originale per evitare ricorsione
            if (window._originalConsole && window._originalConsole.warn) {
                window._originalConsole.warn(formatted);
            } else {
                console.warn.call(console, formatted);
            }
            this.addToHistory('warn', message, data);
        }
    }
    
    error(message, data) {
        if (this.shouldLog('error')) {
            const formatted = this.formatMessage('error', message, data);
            // Usa console originale per evitare ricorsione
            if (window._originalConsole && window._originalConsole.error) {
                window._originalConsole.error(formatted);
            } else {
                console.error.call(console, formatted);
            }
            this.addToHistory('error', message, data);
            
            // In produzione, invia errori a monitoring
            if (this.currentLevel > this.levels.debug) {
                this.sendToMonitoring(message, data);
            }
        }
    }
    
    // ===== UTILITY =====
    
    group(label) {
        if (this.shouldLog('debug')) {
            console.group(label);
        }
    }
    
    groupEnd() {
        if (this.shouldLog('debug')) {
            console.groupEnd();
        }
    }
    
    table(data) {
        if (this.shouldLog('debug')) {
            console.table(data);
        }
    }
    
    time(label) {
        if (this.shouldLog('debug')) {
            console.time(label);
        }
    }
    
    timeEnd(label) {
        if (this.shouldLog('debug')) {
            console.timeEnd(label);
        }
    }
    
    clear() {
        console.clear();
        this.logHistory = [];
    }
    
    // ===== EXPORT LOGS =====
    
    getHistory() {
        return this.logHistory;
    }
    
    exportLogs() {
        const logs = this.getHistory();
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs_${new Date().toISOString().replace(/:/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // ===== MONITORING =====
    
    sendToMonitoring(message, data) {
        // Se abbiamo Supabase, salva gli errori
        if (window.supabase) {
            try {
                window.supabase
                    .from('error_logs')
                    .insert([{
                        message,
                        data: this.sanitizeData(data || {}),
                        user_agent: navigator.userAgent,
                        url: window.location.href,
                        timestamp: new Date().toISOString()
                    }])
                    .then(() => {})
                    .catch(() => {});
            } catch (e) {
                // Ignora errori di monitoring
            }
        }
    }
    
    // ===== PERFORMANCE LOGGING =====
    
    measurePerformance(label, fn) {
        const start = performance.now();
        const result = fn();
        const duration = performance.now() - start;
        
        this.debug(`Performance [${label}]: ${duration.toFixed(2)}ms`);
        
        return result;
    }
    
    async measureAsync(label, fn) {
        const start = performance.now();
        const result = await fn();
        const duration = performance.now() - start;
        
        this.debug(`Async Performance [${label}]: ${duration.toFixed(2)}ms`);
        
        return result;
    }
}

// ===== SINGLETON INSTANCE =====

const logger = new Logger();

// ===== CONSOLE OVERRIDE (OPZIONALE) =====

// Sostituisce console.log globale con logger
if (typeof window !== 'undefined') {
    // Salva originali PRIMA di sovrascrivere
    window._originalConsole = {
        log: console.log.bind(console),
        info: console.info.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console)
    };
    
    // Override console methods per intercettare tutti i log
    // IMPORTANTE: usa bind per mantenere il contesto
    console.log = function(...args) {
        logger.debug(args.join(' '));
    };
    console.info = function(...args) {
        logger.info(args.join(' '));
    };
    console.warn = function(...args) {
        logger.warn(args.join(' '));
    };
    console.error = function(...args) {
        logger.error(args.join(' '));
    };
}

// ===== EXPORT =====

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Logger, logger };
} else {
    window.Logger = Logger;
    window.logger = logger;
}