// =====================================================
// SISTEMA DIALOGS PERSONALIZZATI - COMPLIANCE UPTOTEN
// =====================================================
// Sostituisce alert, confirm e prompt del browser
// =====================================================

class DialogSystem {
    constructor() {
        this.activeDialogs = [];
        this.initStyles();
    }

    initStyles() {
        if (document.getElementById('dialog-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'dialog-styles';
        style.textContent = `
            .dialog-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.2s ease-out;
            }
            
            .dialog-container {
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                min-width: 400px;
                max-width: 600px;
                max-height: 80vh;
                overflow: hidden;
                animation: slideUp 0.3s ease-out;
            }
            
            .dialog-header {
                padding: 20px 24px;
                border-bottom: 1px solid #e8e8e8;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .dialog-icon {
                font-size: 24px;
                flex-shrink: 0;
            }
            
            .dialog-title {
                font-size: 18px;
                font-weight: 600;
                color: #333;
                margin: 0;
                flex: 1;
            }
            
            .dialog-close {
                background: none;
                border: none;
                font-size: 24px;
                color: #999;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s;
            }
            
            .dialog-close:hover {
                background: #f0f0f0;
                color: #333;
            }
            
            .dialog-body {
                padding: 24px;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .dialog-message {
                color: #666;
                line-height: 1.6;
                margin: 0;
            }
            
            .dialog-input {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid #d9d9d9;
                border-radius: 6px;
                font-size: 14px;
                margin-top: 16px;
                transition: all 0.3s;
            }
            
            .dialog-input:focus {
                outline: none;
                border-color: #1890ff;
                box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
            }
            
            .dialog-footer {
                padding: 16px 24px;
                background: #fafafa;
                border-top: 1px solid #e8e8e8;
                display: flex;
                justify-content: flex-end;
                gap: 12px;
            }
            
            .dialog-btn {
                padding: 8px 20px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                border: 1px solid transparent;
            }
            
            .dialog-btn-default {
                background: white;
                color: #333;
                border-color: #d9d9d9;
            }
            
            .dialog-btn-default:hover {
                border-color: #1890ff;
                color: #1890ff;
            }
            
            .dialog-btn-primary {
                background: #1890ff;
                color: white;
            }
            
            .dialog-btn-primary:hover {
                background: #40a9ff;
            }
            
            .dialog-btn-danger {
                background: #ff4d4f;
                color: white;
            }
            
            .dialog-btn-danger:hover {
                background: #ff7875;
            }
            
            .dialog-btn-success {
                background: #52c41a;
                color: white;
            }
            
            .dialog-btn-success:hover {
                background: #73d13d;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from {
                    transform: translateY(20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            @keyframes slideDown {
                from {
                    transform: translateY(0);
                    opacity: 1;
                }
                to {
                    transform: translateY(20px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ===== ALERT PERSONALIZZATO =====
    
    alert(message, title = 'Attenzione', icon = 'ℹ️') {
        return new Promise((resolve) => {
            const dialogId = this.createDialog({
                title,
                icon,
                message,
                buttons: [
                    {
                        text: 'OK',
                        type: 'primary',
                        action: () => {
                            this.closeDialog(dialogId);
                            resolve(true);
                        }
                    }
                ]
            });
        });
    }

    // ===== CONFIRM PERSONALIZZATO =====
    
    confirm(message, title = 'Conferma', options = {}) {
        const {
            confirmText = 'Conferma',
            cancelText = 'Annulla',
            confirmType = 'primary',
            icon = '❓'
        } = options;

        return new Promise((resolve) => {
            const dialogId = this.createDialog({
                title,
                icon,
                message,
                buttons: [
                    {
                        text: cancelText,
                        type: 'default',
                        action: () => {
                            this.closeDialog(dialogId);
                            resolve(false);
                        }
                    },
                    {
                        text: confirmText,
                        type: confirmType,
                        action: () => {
                            this.closeDialog(dialogId);
                            resolve(true);
                        }
                    }
                ]
            });
        });
    }

    // ===== PROMPT PERSONALIZZATO =====
    
    prompt(message, title = 'Inserisci', defaultValue = '', options = {}) {
        const {
            placeholder = '',
            confirmText = 'OK',
            cancelText = 'Annulla',
            validation = null,
            type = 'text',
            icon = '✏️'
        } = options;

        return new Promise((resolve) => {
            let inputValue = defaultValue;
            
            const dialogId = this.createDialog({
                title,
                icon,
                message,
                input: {
                    type,
                    placeholder,
                    value: defaultValue,
                    onChange: (value) => {
                        inputValue = value;
                        if (validation) {
                            const error = validation(value);
                            this.updateInputError(dialogId, error);
                        }
                    }
                },
                buttons: [
                    {
                        text: cancelText,
                        type: 'default',
                        action: () => {
                            this.closeDialog(dialogId);
                            resolve(null);
                        }
                    },
                    {
                        text: confirmText,
                        type: 'primary',
                        action: () => {
                            if (validation) {
                                const error = validation(inputValue);
                                if (error) {
                                    this.updateInputError(dialogId, error);
                                    return;
                                }
                            }
                            this.closeDialog(dialogId);
                            resolve(inputValue);
                        }
                    }
                ]
            });
        });
    }

    // ===== DIALOGS SPECIFICI =====
    
    success(message, title = 'Successo') {
        return this.alert(message, title, '✅');
    }

    error(message, title = 'Errore') {
        return this.alert(message, title, '❌');
    }

    warning(message, title = 'Attenzione') {
        return this.alert(message, title, '⚠️');
    }

    info(message, title = 'Informazione') {
        return this.alert(message, title, 'ℹ️');
    }

    deleteConfirm(itemName = 'questo elemento') {
        return this.confirm(
            `Sei sicuro di voler eliminare ${itemName}? Questa azione non può essere annullata.`,
            'Conferma Eliminazione',
            {
                confirmText: 'Elimina',
                confirmType: 'danger',
                icon: '🗑️'
            }
        );
    }

    saveConfirm(hasChanges = true) {
        if (!hasChanges) return Promise.resolve(true);
        
        return this.confirm(
            'Hai modifiche non salvate. Vuoi salvarle prima di continuare?',
            'Modifiche Non Salvate',
            {
                confirmText: 'Salva',
                cancelText: 'Scarta',
                icon: '💾'
            }
        );
    }

    // ===== CREAZIONE E GESTIONE DIALOG =====
    
    createDialog(config) {
        const dialogId = `dialog-${Date.now()}`;
        
        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.id = dialogId;
        
        // Container
        const container = document.createElement('div');
        container.className = 'dialog-container';
        
        // Header
        const header = document.createElement('div');
        header.className = 'dialog-header';
        
        const icon = document.createElement('span');
        icon.className = 'dialog-icon';
        icon.textContent = config.icon || 'ℹ️';
        
        const title = document.createElement('h3');
        title.className = 'dialog-title';
        title.textContent = config.title;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'dialog-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => this.closeDialog(dialogId);
        
        header.appendChild(icon);
        header.appendChild(title);
        if (!config.noClose) {
            header.appendChild(closeBtn);
        }
        
        // Body
        const body = document.createElement('div');
        body.className = 'dialog-body';
        
        const message = document.createElement('p');
        message.className = 'dialog-message';
        message.innerHTML = config.message;
        body.appendChild(message);
        
        // Input (se richiesto)
        if (config.input) {
            const input = document.createElement('input');
            input.className = 'dialog-input';
            input.type = config.input.type || 'text';
            input.placeholder = config.input.placeholder || '';
            input.value = config.input.value || '';
            input.oninput = (e) => {
                if (config.input.onChange) {
                    config.input.onChange(e.target.value);
                }
            };
            
            // Focus automatico su input
            setTimeout(() => {
                input.focus();
                input.select();
            }, 100);
            
            body.appendChild(input);
            
            // Container per errore
            const errorDiv = document.createElement('div');
            errorDiv.className = 'dialog-input-error';
            errorDiv.style.cssText = 'color: #ff4d4f; font-size: 12px; margin-top: 4px; min-height: 16px;';
            body.appendChild(errorDiv);
        }
        
        // Footer con bottoni
        const footer = document.createElement('div');
        footer.className = 'dialog-footer';
        
        config.buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `dialog-btn dialog-btn-${btn.type || 'default'}`;
            button.textContent = btn.text;
            button.onclick = btn.action;
            footer.appendChild(button);
        });
        
        // Assembla dialog
        container.appendChild(header);
        container.appendChild(body);
        container.appendChild(footer);
        overlay.appendChild(container);
        
        // Aggiungi al DOM
        document.body.appendChild(overlay);
        
        // Aggiungi a lista attiva
        this.activeDialogs.push(dialogId);
        
        // Gestione ESC
        const escHandler = (e) => {
            if (e.key === 'Escape' && this.activeDialogs[this.activeDialogs.length - 1] === dialogId) {
                this.closeDialog(dialogId);
            }
        };
        document.addEventListener('keydown', escHandler);
        overlay.escHandler = escHandler;
        
        return dialogId;
    }

    closeDialog(dialogId) {
        const overlay = document.getElementById(dialogId);
        if (!overlay) return;
        
        // Animazione chiusura
        overlay.style.animation = 'fadeOut 0.2s ease-out';
        overlay.querySelector('.dialog-container').style.animation = 'slideDown 0.3s ease-out';
        
        setTimeout(() => {
            // Rimuovi event listener
            if (overlay.escHandler) {
                document.removeEventListener('keydown', overlay.escHandler);
            }
            
            // Rimuovi dal DOM
            overlay.remove();
            
            // Rimuovi da lista attiva
            this.activeDialogs = this.activeDialogs.filter(id => id !== dialogId);
        }, 200);
    }

    updateInputError(dialogId, errorMessage) {
        const dialog = document.getElementById(dialogId);
        if (!dialog) return;
        
        const errorDiv = dialog.querySelector('.dialog-input-error');
        const input = dialog.querySelector('.dialog-input');
        
        if (errorDiv) {
            errorDiv.textContent = errorMessage || '';
        }
        
        if (input) {
            if (errorMessage) {
                input.style.borderColor = '#ff4d4f';
            } else {
                input.style.borderColor = '#d9d9d9';
            }
        }
    }

    // ===== LOADING DIALOG =====
    
    showLoading(message = 'Caricamento in corso...') {
        const dialogId = `loading-${Date.now()}`;
        
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.id = dialogId;
        overlay.style.cursor = 'wait';
        
        const container = document.createElement('div');
        container.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 32px;
            text-align: center;
            min-width: 300px;
        `;
        
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 40px;
            height: 40px;
            border: 4px solid #f0f0f0;
            border-top-color: #1890ff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        `;
        
        const text = document.createElement('p');
        text.textContent = message;
        text.style.cssText = 'color: #666; margin: 0;';
        
        container.appendChild(spinner);
        container.appendChild(text);
        overlay.appendChild(container);
        
        document.body.appendChild(overlay);
        
        // Aggiungi animazione spin
        if (!document.getElementById('spin-animation')) {
            const style = document.createElement('style');
            style.id = 'spin-animation';
            style.textContent = `
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        return dialogId;
    }

    hideLoading(dialogId) {
        this.closeDialog(dialogId);
    }
}

// ===== SINGLETON INSTANCE =====

const dialog = new DialogSystem();

// ===== EXPORT GLOBALI =====

window.dialog = dialog;
window.DialogSystem = DialogSystem;

// Override funzioni native (opzionale)
window.customAlert = dialog.alert.bind(dialog);
window.customConfirm = dialog.confirm.bind(dialog);
window.customPrompt = dialog.prompt.bind(dialog);