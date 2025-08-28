// Error Monitoring System - UpToTen Compliance
// Sistema integrato per monitoraggio errori in produzione

class ErrorMonitor {
    constructor() {
        this.errors = [];
        this.maxErrors = 100; // Mantieni solo ultimi 100 errori in memoria
        this.sessionId = this.generateSessionId();
        this.startTime = new Date();
        this.errorCount = 0;
        this.criticalErrors = 0;
        this.warningCount = 0;
        
        // Inizializza se abbiamo Supabase
        this.supabase = null;
        if (window.ComplianceConfig && window.supabase) {
            const config = window.ComplianceConfig;
            this.supabase = window.supabase.createClient(config.supabase.url, config.supabase.anonKey);
        }
        
        this.init();
    }
    
    init() {
        // Cattura errori globali
        window.addEventListener('error', (event) => {
            this.captureError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                severity: 'error'
            });
        });
        
        // Cattura promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.captureError({
                type: 'unhandled_promise',
                message: event.reason?.message || String(event.reason),
                stack: event.reason?.stack,
                severity: 'error'
            });
        });
        
        // Monitora console.error (preservando funzionalità originale)
        const originalError = console.error;
        console.error = (...args) => {
            this.captureError({
                type: 'console',
                message: args.map(arg => this.stringifyArg(arg)).join(' '),
                severity: 'error'
            });
            originalError.apply(console, args);
        };
        
        // Monitora errori AJAX
        this.monitorFetch();
        this.monitorXHR();
        
        // Report periodico (ogni 5 minuti)
        setInterval(() => this.sendReport(), 300000);
        
        // Report quando la pagina si chiude
        window.addEventListener('beforeunload', () => {
            this.sendReport(true);
        });
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    stringifyArg(arg) {
        if (typeof arg === 'object') {
            try {
                return JSON.stringify(arg, null, 2);
            } catch {
                return String(arg);
            }
        }
        return String(arg);
    }
    
    monitorFetch() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = Date.now();
            const [url, options = {}] = args;
            
            try {
                const response = await originalFetch(...args);
                const duration = Date.now() - startTime;
                
                // Log errori HTTP
                if (!response.ok) {
                    this.captureError({
                        type: 'http',
                        message: `HTTP ${response.status}: ${response.statusText}`,
                        url: url,
                        method: options.method || 'GET',
                        status: response.status,
                        duration: duration,
                        severity: response.status >= 500 ? 'critical' : 'warning'
                    });
                }
                
                // Log performance issues
                if (duration > 5000) {
                    this.captureError({
                        type: 'performance',
                        message: `Slow request: ${duration}ms`,
                        url: url,
                        duration: duration,
                        severity: 'warning'
                    });
                }
                
                return response;
            } catch (error) {
                this.captureError({
                    type: 'network',
                    message: error.message,
                    url: url,
                    method: options.method || 'GET',
                    severity: 'critical'
                });
                throw error;
            }
        };
    }
    
    monitorXHR() {
        const XHR = XMLHttpRequest.prototype;
        const originalOpen = XHR.open;
        const originalSend = XHR.send;
        
        XHR.open = function(method, url, ...args) {
            this._errorMonitor = { method, url, startTime: null };
            return originalOpen.apply(this, [method, url, ...args]);
        };
        
        XHR.send = function(...args) {
            if (this._errorMonitor) {
                this._errorMonitor.startTime = Date.now();
                
                this.addEventListener('load', () => {
                    const duration = Date.now() - this._errorMonitor.startTime;
                    
                    if (this.status >= 400) {
                        window.errorMonitor?.captureError({
                            type: 'xhr',
                            message: `XHR ${this.status}: ${this.statusText}`,
                            url: this._errorMonitor.url,
                            method: this._errorMonitor.method,
                            status: this.status,
                            duration: duration,
                            severity: this.status >= 500 ? 'critical' : 'warning'
                        });
                    }
                });
                
                this.addEventListener('error', () => {
                    window.errorMonitor?.captureError({
                        type: 'xhr',
                        message: 'XHR Network Error',
                        url: this._errorMonitor.url,
                        method: this._errorMonitor.method,
                        severity: 'critical'
                    });
                });
            }
            
            return originalSend.apply(this, args);
        };
    }
    
    captureError(errorInfo) {
        // Aggiungi metadati
        const error = {
            ...errorInfo,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            userAgent: navigator.userAgent,
            url: window.location.href,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
        
        // Aggiungi a memoria locale
        this.errors.push(error);
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }
        
        // Aggiorna contatori
        this.errorCount++;
        if (error.severity === 'critical') {
            this.criticalErrors++;
        } else if (error.severity === 'warning') {
            this.warningCount++;
        }
        
        // Log locale per debug
        if (window.logger) {
            window.logger.error('Error captured:', error);
        }
        
        // Invia immediatamente se critico
        if (error.severity === 'critical') {
            this.sendReport();
        }
    }
    
    async sendReport(isUnload = false) {
        if (this.errors.length === 0) return;
        
        const report = {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            sessionDuration: Date.now() - this.startTime.getTime(),
            totalErrors: this.errorCount,
            criticalErrors: this.criticalErrors,
            warnings: this.warningCount,
            errors: [...this.errors],
            systemInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine,
                screen: {
                    width: screen.width,
                    height: screen.height,
                    colorDepth: screen.colorDepth
                }
            }
        };
        
        // Prova a inviare a Supabase
        if (this.supabase) {
            try {
                // Usa sendBeacon se stiamo chiudendo la pagina
                if (isUnload && navigator.sendBeacon) {
                    const blob = new Blob([JSON.stringify(report)], { type: 'application/json' });
                    navigator.sendBeacon('/api/error-report', blob);
                } else {
                    // Salva in tabella error_logs se esiste
                    await this.supabase
                        .from('error_logs')
                        .insert([{
                            session_id: report.sessionId,
                            error_count: report.totalErrors,
                            critical_count: report.criticalErrors,
                            warning_count: report.warnings,
                            errors_data: report.errors,
                            system_info: report.systemInfo,
                            session_duration: report.sessionDuration
                        }]);
                }
                
                // Clear dopo invio riuscito
                this.errors = [];
            } catch (err) {
                console.warn('Failed to send error report:', err);
                // Mantieni errori per prossimo tentativo
            }
        }
        
        // Salva anche in localStorage come backup
        try {
            const storedReports = JSON.parse(localStorage.getItem('errorReports') || '[]');
            storedReports.push(report);
            // Mantieni solo ultimi 10 report
            if (storedReports.length > 10) {
                storedReports.shift();
            }
            localStorage.setItem('errorReports', JSON.stringify(storedReports));
        } catch {
            // Ignore localStorage errors
        }
    }
    
    getStats() {
        return {
            sessionId: this.sessionId,
            uptime: Date.now() - this.startTime.getTime(),
            totalErrors: this.errorCount,
            criticalErrors: this.criticalErrors,
            warnings: this.warningCount,
            recentErrors: this.errors.slice(-10),
            errorRate: this.errorCount / ((Date.now() - this.startTime.getTime()) / 60000) // errori per minuto
        };
    }
    
    clearErrors() {
        this.errors = [];
        this.errorCount = 0;
        this.criticalErrors = 0;
        this.warningCount = 0;
    }
    
    // Metodo per logging manuale
    logError(message, data = {}, severity = 'error') {
        this.captureError({
            type: 'manual',
            message: message,
            data: data,
            severity: severity
        });
    }
}

// Inizializza monitor globale
if (typeof window !== 'undefined') {
    window.errorMonitor = new ErrorMonitor();
    
    // Esponi metodo pubblico per logging manuale
    window.logError = (message, data, severity) => {
        window.errorMonitor.logError(message, data, severity);
    };
    
    // Console helper per stats
    window.getErrorStats = () => {
        const stats = window.errorMonitor.getStats();
        console.table(stats);
        return stats;
    };
}