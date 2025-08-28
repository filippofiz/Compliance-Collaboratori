// =====================================================
// GESTIONE ERRORI E NOTIFICHE - COMPLIANCE UPTOTEN
// =====================================================
// Sistema avanzato per gestione errori e notifiche utente
// =====================================================

class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.notificationQueue = [];
        this.isProcessing = false;
        
        // Configura gestione errori globale
        this.setupGlobalErrorHandling();
        
        // Inizializza sistema notifiche quando DOM è pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initNotificationSystem();
            });
        } else {
            // DOM già caricato
            this.initNotificationSystem();
        }
    }

    // ===== GESTIONE ERRORI GLOBALE =====
    
    setupGlobalErrorHandling() {
        // Cattura errori JavaScript non gestiti
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript_error',
                message: event.message,
                file: event.filename,
                line: event.lineno,
                column: event.colno,
                error: event.error,
                timestamp: new Date().toISOString()
            });
            
            // Previeni comportamento default solo per errori non critici
            if (!this.isCriticalError(event.error)) {
                event.preventDefault();
            }
        });
        
        // Cattura promise rejections non gestite
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'unhandled_rejection',
                reason: event.reason,
                promise: event.promise,
                timestamp: new Date().toISOString()
            });
            
            event.preventDefault();
        });
    }

    // ===== CLASSIFICAZIONE ERRORI =====
    
    isCriticalError(error) {
        if (!error) return false;
        
        const criticalPatterns = [
            /SecurityError/i,
            /NetworkError/i,
            /TypeError.*null/i,
            /ReferenceError/i
        ];
        
        return criticalPatterns.some(pattern => 
            pattern.test(error.message || error.toString())
        );
    }

    classifyError(error) {
        const errorString = error.message || error.toString();
        
        if (/network|fetch|connection|offline/i.test(errorString)) {
            return 'network';
        } else if (/auth|unauthorized|forbidden|401|403/i.test(errorString)) {
            return 'auth';
        } else if (/validation|invalid|required/i.test(errorString)) {
            return 'validation';
        } else if (/database|supabase|sql/i.test(errorString)) {
            return 'database';
        } else if (/email|resend|smtp/i.test(errorString)) {
            return 'email';
        } else {
            return 'general';
        }
    }

    // ===== GESTIONE ERRORI =====
    
    handleError(errorInfo, userMessage = null) {
        // Log errore
        this.logError(errorInfo);
        
        // Classifica errore
        const errorType = this.classifyError(errorInfo);
        
        // Genera messaggio user-friendly
        const message = userMessage || this.getUserFriendlyMessage(errorType, errorInfo);
        
        // Mostra notifica appropriata
        this.showNotification(message, errorType === 'network' ? 'warning' : 'error');
        
        // Se critico, offri opzioni di recovery
        if (this.isCriticalError(errorInfo.error)) {
            this.offerRecoveryOptions(errorType);
        }
        
        // Invia a monitoring (se configurato)
        this.sendToMonitoring(errorInfo);
        
        return errorInfo;
    }

    getUserFriendlyMessage(errorType, errorInfo) {
        const messages = {
            network: '⚠️ Problema di connessione. Verifica la tua connessione internet e riprova.',
            auth: '🔐 Sessione scaduta. Effettua nuovamente il login.',
            validation: '❌ Dati non validi. Controlla i campi evidenziati.',
            database: '🗄️ Errore database. Stiamo lavorando per risolvere il problema.',
            email: '📧 Impossibile inviare l\'email. Riprova più tardi.',
            general: '⚠️ Si è verificato un errore. Riprova o contatta il supporto.'
        };
        
        return messages[errorType] || messages.general;
    }

    offerRecoveryOptions(errorType) {
        const recoveryOptions = {
            network: [
                { label: 'Riprova', action: () => location.reload() },
                { label: 'Lavora Offline', action: () => this.enableOfflineMode() }
            ],
            auth: [
                { label: 'Vai al Login', action: () => this.redirectToLogin() },
                { label: 'Annulla', action: () => {} }
            ],
            database: [
                { label: 'Ricarica Pagina', action: () => location.reload() },
                { label: 'Contatta Supporto', action: () => this.openSupport() }
            ]
        };
        
        const options = recoveryOptions[errorType];
        if (options) {
            this.showRecoveryDialog(options);
        }
    }

    // ===== LOGGING =====
    
    logError(errorInfo) {
        // Aggiungi a log interno
        this.errorLog.push({
            ...errorInfo,
            timestamp: errorInfo.timestamp || new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
        
        // Mantieni dimensione log sotto controllo
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }
        
        // Log in console per debugging
        console.error('Error logged:', errorInfo);
        
        // Salva in localStorage per persistenza
        try {
            localStorage.setItem('errorLog', JSON.stringify(this.errorLog.slice(-20)));
        } catch (e) {
            // localStorage potrebbe essere pieno
            console.warn('Cannot save error log to localStorage:', e);
        }
    }

    getErrorLog() {
        return this.errorLog;
    }

    clearErrorLog() {
        this.errorLog = [];
        localStorage.removeItem('errorLog');
    }

    // ===== SISTEMA NOTIFICHE =====
    
    initNotificationSystem() {
        // Crea container notifiche se non esiste
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
    }

    showNotification(message, type = 'info', duration = 5000, actions = null) {
        const notification = {
            id: Date.now(),
            message,
            type,
            duration,
            actions
        };
        
        // Aggiungi a coda
        this.notificationQueue.push(notification);
        
        // Processa coda
        this.processNotificationQueue();
        
        return notification.id;
    }

    processNotificationQueue() {
        if (this.isProcessing || this.notificationQueue.length === 0) return;
        
        this.isProcessing = true;
        const notification = this.notificationQueue.shift();
        
        this.displayNotification(notification);
        
        setTimeout(() => {
            this.isProcessing = false;
            this.processNotificationQueue();
        }, 300); // Delay tra notifiche
    }

    displayNotification(notification) {
        const container = document.getElementById('notification-container');
        
        // Crea elemento notifica
        const notifElement = document.createElement('div');
        notifElement.className = `notification notification-${notification.type}`;
        notifElement.id = `notification-${notification.id}`;
        notifElement.style.cssText = `
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 16px 20px;
            margin-bottom: 10px;
            min-width: 300px;
            max-width: 500px;
            pointer-events: all;
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideIn 0.3s ease-out;
            border-left: 4px solid ${this.getNotificationColor(notification.type)};
        `;
        
        // Icona
        const icon = this.getNotificationIcon(notification.type);
        const iconElement = document.createElement('span');
        iconElement.style.cssText = 'font-size: 20px; flex-shrink: 0;';
        iconElement.textContent = icon;
        
        // Messaggio
        const messageElement = document.createElement('div');
        messageElement.style.cssText = 'flex: 1; color: #333; font-size: 14px;';
        messageElement.textContent = notification.message;
        
        // Pulsante chiusura
        const closeButton = document.createElement('button');
        closeButton.style.cssText = `
            background: none;
            border: none;
            color: #999;
            cursor: pointer;
            font-size: 18px;
            padding: 0;
            margin-left: 12px;
        `;
        closeButton.innerHTML = '&times;';
        closeButton.onclick = () => this.removeNotification(notification.id);
        
        // Assembla notifica
        notifElement.appendChild(iconElement);
        notifElement.appendChild(messageElement);
        notifElement.appendChild(closeButton);
        
        // Aggiungi azioni se presenti
        if (notification.actions && notification.actions.length > 0) {
            const actionsContainer = document.createElement('div');
            actionsContainer.style.cssText = 'display: flex; gap: 8px; margin-top: 12px;';
            
            notification.actions.forEach(action => {
                const button = document.createElement('button');
                button.textContent = action.label;
                button.style.cssText = `
                    padding: 6px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background: white;
                    cursor: pointer;
                    font-size: 12px;
                `;
                button.onclick = () => {
                    action.callback();
                    this.removeNotification(notification.id);
                };
                actionsContainer.appendChild(button);
            });
            
            notifElement.appendChild(actionsContainer);
        }
        
        // Aggiungi al container
        container.appendChild(notifElement);
        
        // Auto-rimuovi dopo durata
        if (notification.duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, notification.duration);
        }
    }

    removeNotification(notificationId) {
        const element = document.getElementById(`notification-${notificationId}`);
        if (element) {
            element.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                element.remove();
            }, 300);
        }
    }

    getNotificationColor(type) {
        const colors = {
            success: '#52c41a',
            error: '#f5222d',
            warning: '#faad14',
            info: '#1890ff'
        };
        return colors[type] || colors.info;
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    // ===== UTILITY METHODS =====
    
    enableOfflineMode() {
        localStorage.setItem('offlineMode', 'true');
        this.showNotification('Modalità offline attivata', 'info');
        // Implementa logica offline
    }

    redirectToLogin() {
        window.location.href = '/login';
    }

    openSupport() {
        window.open('mailto:support@uptoten.it?subject=Errore%20Sistema%20Compliance', '_blank');
    }

    sendToMonitoring(errorInfo) {
        // Se configurato Sentry o altro sistema di monitoring
        if (typeof Sentry !== 'undefined') {
            Sentry.captureException(errorInfo.error || errorInfo);
        }
        
        // Log to server (se endpoint disponibile)
        if (window.supabase) {
            try {
                window.supabase
                    .from('error_logs')
                    .insert([{
                        error_type: errorInfo.type,
                        message: errorInfo.message || errorInfo.toString(),
                        stack: errorInfo.stack,
                        metadata: errorInfo,
                        user_agent: navigator.userAgent,
                        url: window.location.href
                    }])
                    .then(() => {})
                    .catch(() => {}); // Silently fail
            } catch (e) {
                // Ignore monitoring errors
            }
        }
    }

    // ===== RECOVERY DIALOG =====
    
    showRecoveryDialog(options) {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            z-index: 10000;
            min-width: 300px;
        `;
        
        const title = document.createElement('h3');
        title.textContent = 'Come vuoi procedere?';
        title.style.cssText = 'margin: 0 0 16px 0; color: #333;';
        dialog.appendChild(title);
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'display: flex; gap: 12px; justify-content: flex-end;';
        
        options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option.label;
            button.style.cssText = `
                padding: 8px 16px;
                border: 1px solid #ddd;
                border-radius: 6px;
                background: white;
                cursor: pointer;
                font-size: 14px;
            `;
            button.onclick = () => {
                option.action();
                dialog.remove();
            };
            buttonContainer.appendChild(button);
        });
        
        dialog.appendChild(buttonContainer);
        document.body.appendChild(dialog);
    }
}

// ===== WRAPPER FUNCTIONS PER RETROCOMPATIBILITÀ =====

function showNotification(message, type = 'info', duration = 5000) {
    if (!window.errorHandler) {
        window.errorHandler = new ErrorHandler();
    }
    return window.errorHandler.showNotification(message, type, duration);
}

function handleError(error, userMessage = null) {
    if (!window.errorHandler) {
        window.errorHandler = new ErrorHandler();
    }
    return window.errorHandler.handleError(error, userMessage);
}

// ===== CSS ANIMATIONS =====

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .error-message {
        color: #f5222d;
        font-size: 12px;
        margin-top: 4px;
    }
    
    .error {
        border-color: #f5222d !important;
    }
`;
document.head.appendChild(style);

// Inizializza automaticamente
window.errorHandler = new ErrorHandler();

// Esporta globalmente
window.ErrorHandler = ErrorHandler;