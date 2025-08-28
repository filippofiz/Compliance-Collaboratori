// =====================================================
// CONFIGURAZIONE CENTRALIZZATA - COMPLIANCE UPTOTEN
// =====================================================
// Unico punto di configurazione per tutto il sistema
// =====================================================

(function() {
    'use strict';
    
    // Determina ambiente
    const isDevelopment = () => {
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            return hostname === 'localhost' || 
                   hostname === '127.0.0.1' || 
                   hostname.includes('.local');
        }
        return false;
    };
    
    // Configurazione base
    const config = {
        // Ambiente
        env: isDevelopment() ? 'development' : 'production',
        debug: isDevelopment(),
        
        // Supabase
        supabase: {
            url: 'https://iacdceuvipmkhtievgpb.supabase.co',
            anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhY2RjZXV2aXBta2h0aWV2Z3BiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NzQyMDUsImV4cCI6MjA2NjI1MDIwNX0.5WGtOWSzs5UkD9DkD14K3MlIgMPaVRbTQQp9MK1KC4U',
            // Service key solo per Edge Functions, MAI nel frontend!
            serviceKey: null
        },
        
        // Admin
        admin: {
            email: 'admin@uptoten.it',
            password: 'uptoten2024' // In produzione usare auth reale
        },
        
        // API Endpoints
        api: {
            baseUrl: isDevelopment() ? 'http://localhost:3000' : 'https://uptoten.it',
            timeout: 30000,
            retryAttempts: 3
        },
        
        // Email (tramite Edge Functions)
        email: {
            enabled: true,
            provider: 'resend', // 'resend' o 'emailjs'
            from: 'compliance@uptoten.it',
            replyTo: 'support@uptoten.it'
        },
        
        // Limiti e soglie
        limits: {
            occasionaleAnnuale: 5000,
            warningPercentage: 80,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            sessionDuration: 8 * 60 * 60 * 1000, // 8 ore
            tokenExpiry: 24 * 60 * 60 * 1000 // 24 ore
        },
        
        // Features flags
        features: {
            notifications: true,
            pdfGeneration: true,
            emailVerification: true,
            autoSave: true,
            offlineMode: false
        },
        
        // UI Settings
        ui: {
            theme: 'light',
            language: 'it',
            dateFormat: 'DD/MM/YYYY',
            currency: 'EUR',
            animations: true
        },
        
        // Percorsi
        paths: {
            admin: '/src/admin/',
            frontend: '/src/frontend/',
            shared: '/src/shared/',
            lib: '/src/lib/',
            assets: '/assets/',
            pdfTemplates: '/assets/pdf-templates/'
        },
        
        // Storage keys
        storage: {
            userKey: 'complianceUser',
            themeKey: 'complianceTheme',
            languageKey: 'complianceLanguage',
            cachePrefix: 'compliance_cache_'
        },
        
        // Validazione
        validation: {
            codiceFiscaleRegex: /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i,
            partitaIvaRegex: /^[0-9]{11}$/,
            emailRegex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            capRegex: /^[0-9]{5}$/,
            ibanRegex: /^IT[0-9]{2}[A-Z][0-9]{22}$/
        },
        
        // Cache
        cache: {
            enabled: true,
            ttl: 5 * 60 * 1000, // 5 minuti default
            maxSize: 50 * 1024 * 1024, // 50MB
            strategy: 'lru' // least recently used
        },
        
        // Monitoring
        monitoring: {
            enabled: !isDevelopment(),
            errorReporting: true,
            performanceTracking: true,
            userTracking: false // GDPR compliance
        }
    };
    
    // Funzioni utility
    const utils = {
        // Ottieni URL base dell'applicazione
        getBaseUrl() {
            if (typeof window !== 'undefined') {
                const { protocol, hostname, port } = window.location;
                return `${protocol}//${hostname}${port ? ':' + port : ''}`;
            }
            return config.api.baseUrl;
        },
        
        // Costruisci URL assoluto
        buildUrl(path) {
            const base = this.getBaseUrl();
            return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
        },
        
        // Ottieni percorso asset
        getAssetPath(filename) {
            return `${config.paths.assets}${filename}`;
        },
        
        // Verifica se siamo in development
        isDevelopment() {
            return config.env === 'development';
        },
        
        // Ottieni configurazione Supabase sicura
        getSupabaseConfig() {
            return {
                url: config.supabase.url,
                anonKey: config.supabase.anonKey
                // Mai esporre serviceKey nel frontend!
            };
        },
        
        // Formatta data secondo locale
        formatDate(date) {
            const d = new Date(date);
            return d.toLocaleDateString(config.ui.language === 'it' ? 'it-IT' : 'en-US');
        },
        
        // Formatta valuta
        formatCurrency(amount) {
            return new Intl.NumberFormat(config.ui.language === 'it' ? 'it-IT' : 'en-US', {
                style: 'currency',
                currency: config.ui.currency
            }).format(amount);
        },
        
        // Storage sicuro
        storage: {
            set(key, value) {
                try {
                    const prefixedKey = config.storage.cachePrefix + key;
                    const data = {
                        value,
                        timestamp: Date.now()
                    };
                    localStorage.setItem(prefixedKey, JSON.stringify(data));
                    return true;
                } catch (e) {
                    console.warn('Storage error:', e);
                    return false;
                }
            },
            
            get(key, maxAge = null) {
                try {
                    const prefixedKey = config.storage.cachePrefix + key;
                    const stored = localStorage.getItem(prefixedKey);
                    
                    if (!stored) return null;
                    
                    const data = JSON.parse(stored);
                    
                    // Controlla scadenza
                    if (maxAge && Date.now() - data.timestamp > maxAge) {
                        this.remove(key);
                        return null;
                    }
                    
                    return data.value;
                } catch (e) {
                    console.warn('Storage error:', e);
                    return null;
                }
            },
            
            remove(key) {
                const prefixedKey = config.storage.cachePrefix + key;
                localStorage.removeItem(prefixedKey);
            },
            
            clear() {
                // Rimuove solo items con nostro prefix
                Object.keys(localStorage)
                    .filter(key => key.startsWith(config.storage.cachePrefix))
                    .forEach(key => localStorage.removeItem(key));
            }
        }
    };
    
    // Inizializza configurazione da environment variables se disponibili
    if (typeof window !== 'undefined' && window.__ENV__) {
        Object.assign(config, window.__ENV__);
    }
    
    // Freeze configurazione per evitare modifiche accidentali
    const frozenConfig = Object.freeze(config);
    
    // Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { config: frozenConfig, utils };
    } else {
        window.ComplianceConfig = frozenConfig;
        window.ComplianceUtils = utils;
    }
})();