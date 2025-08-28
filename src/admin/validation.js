// =====================================================
// MODULO VALIDAZIONE INPUT - COMPLIANCE UPTOTEN
// =====================================================
// Validazione e sanitizzazione input per sicurezza
// Previene SQL injection, XSS e altri attacchi
// =====================================================

class ValidationModule {
    constructor() {
        // Pattern regex per validazione
        this.patterns = {
            email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            codiceFiscale: /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i,
            partitaIva: /^[0-9]{11}$/,
            telefono: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
            cap: /^[0-9]{5}$/,
            nome: /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/,
            importo: /^\d+(\.\d{1,2})?$/,
            data: /^\d{4}-\d{2}-\d{2}$/
        };

        // Messaggi di errore
        this.errorMessages = {
            required: 'Questo campo è obbligatorio',
            email: 'Inserisci un indirizzo email valido',
            codiceFiscale: 'Codice fiscale non valido (16 caratteri)',
            partitaIva: 'Partita IVA non valida (11 cifre)',
            telefono: 'Numero di telefono non valido',
            cap: 'CAP non valido (5 cifre)',
            nome: 'Nome non valido (solo lettere, 2-50 caratteri)',
            minLength: 'Minimo {min} caratteri richiesti',
            maxLength: 'Massimo {max} caratteri consentiti',
            importo: 'Importo non valido',
            data: 'Data non valida (formato: AAAA-MM-GG)'
        };
    }

    // ===== SANITIZZAZIONE =====
    
    /**
     * Sanitizza stringa per prevenire XSS
     */
    sanitizeHTML(str) {
        if (!str) return '';
        
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Sanitizza input per query SQL (escape quotes)
     */
    sanitizeSQL(str) {
        if (!str) return '';
        
        return str
            .replace(/'/g, "''")  // Escape single quotes
            .replace(/\\/g, '\\\\')  // Escape backslashes
            .replace(/\0/g, '\\0')  // Escape null bytes
            .replace(/\n/g, '\\n')  // Escape newlines
            .replace(/\r/g, '\\r')  // Escape carriage returns
            .replace(/\t/g, '\\t');  // Escape tabs
    }

    /**
     * Rimuove caratteri pericolosi mantenendo solo alfanumerici e spazi
     */
    sanitizeAlphanumeric(str) {
        if (!str) return '';
        return str.replace(/[^a-zA-Z0-9\s]/g, '');
    }

    /**
     * Sanitizza nome (permette lettere, spazi, apostrofi, trattini)
     */
    sanitizeName(str) {
        if (!str) return '';
        return str.replace(/[^a-zA-ZÀ-ÿ\s\-']/g, '').trim();
    }

    // ===== VALIDAZIONE CAMPI =====

    /**
     * Valida campo obbligatorio
     */
    validateRequired(value) {
        return value !== null && value !== undefined && value.toString().trim() !== '';
    }

    /**
     * Valida email
     */
    validateEmail(email) {
        if (!email) return false;
        return this.patterns.email.test(email.toLowerCase());
    }

    /**
     * Valida codice fiscale italiano
     */
    validateCodiceFiscale(cf) {
        if (!cf) return false;
        
        cf = cf.toUpperCase().replace(/\s/g, '');
        
        if (!this.patterns.codiceFiscale.test(cf)) {
            return false;
        }

        // Validazione checksum codice fiscale
        const set1 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const set2 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const setpari = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const setdisp = 'BAKPLCQDREVOSFTGUHMINJWZYX';
        const setcontrollo = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        let s = 0;
        for (let i = 1; i <= 13; i += 2) {
            const c = cf.charAt(i);
            s += set1.indexOf(setpari.charAt(set2.indexOf(c)));
        }
        for (let i = 0; i <= 14; i += 2) {
            const c = cf.charAt(i);
            s += set1.indexOf(setdisp.charAt(set2.indexOf(c)));
        }
        
        return cf.charAt(15) === setcontrollo.charAt(s % 26);
    }

    /**
     * Valida partita IVA
     */
    validatePartitaIva(piva) {
        if (!piva) return false;
        
        piva = piva.replace(/\s/g, '');
        
        if (!this.patterns.partitaIva.test(piva)) {
            return false;
        }

        // Algoritmo di Luhn per validazione
        let sum = 0;
        for (let i = 0; i < 11; i++) {
            const digit = parseInt(piva.charAt(i));
            if (i % 2 === 0) {
                sum += digit;
            } else {
                const doubled = digit * 2;
                sum += doubled > 9 ? doubled - 9 : doubled;
            }
        }
        
        return sum % 10 === 0;
    }

    /**
     * Valida numero di telefono
     */
    validateTelefono(tel) {
        if (!tel) return false;
        return this.patterns.telefono.test(tel.replace(/\s/g, ''));
    }

    /**
     * Valida CAP italiano
     */
    validateCap(cap) {
        if (!cap) return false;
        return this.patterns.cap.test(cap);
    }

    /**
     * Valida nome/cognome
     */
    validateNome(nome) {
        if (!nome) return false;
        return this.patterns.nome.test(nome.trim());
    }

    /**
     * Valida importo monetario
     */
    validateImporto(importo) {
        if (!importo && importo !== 0) return false;
        
        const value = typeof importo === 'string' ? importo : importo.toString();
        if (!this.patterns.importo.test(value)) return false;
        
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0 && num <= 999999.99;
    }

    /**
     * Valida data
     */
    validateData(data) {
        if (!data) return false;
        
        if (!this.patterns.data.test(data)) return false;
        
        const date = new Date(data);
        return date instanceof Date && !isNaN(date);
    }

    // ===== VALIDAZIONE FORM COMPLETO =====

    /**
     * Valida form collaboratore
     */
    validateCollaboratoreForm(data) {
        const errors = {};
        
        // Campi obbligatori
        if (!this.validateRequired(data.nome)) {
            errors.nome = this.errorMessages.required;
        } else if (!this.validateNome(data.nome)) {
            errors.nome = this.errorMessages.nome;
        }
        
        if (!this.validateRequired(data.cognome)) {
            errors.cognome = this.errorMessages.required;
        } else if (!this.validateNome(data.cognome)) {
            errors.cognome = this.errorMessages.nome;
        }
        
        if (!this.validateRequired(data.email)) {
            errors.email = this.errorMessages.required;
        } else if (!this.validateEmail(data.email)) {
            errors.email = this.errorMessages.email;
        }
        
        if (!this.validateRequired(data.codice_fiscale)) {
            errors.codice_fiscale = this.errorMessages.required;
        } else if (!this.validateCodiceFiscale(data.codice_fiscale)) {
            errors.codice_fiscale = this.errorMessages.codiceFiscale;
        }
        
        // Campi opzionali ma con validazione se presenti
        if (data.partita_iva && !this.validatePartitaIva(data.partita_iva)) {
            errors.partita_iva = this.errorMessages.partitaIva;
        }
        
        if (data.telefono && !this.validateTelefono(data.telefono)) {
            errors.telefono = this.errorMessages.telefono;
        }
        
        if (data.cap && !this.validateCap(data.cap)) {
            errors.cap = this.errorMessages.cap;
        }
        
        // Validazione tipo contratto
        if (data.tipo_contratto === 'partita_iva' && !data.partita_iva) {
            errors.partita_iva = 'Partita IVA obbligatoria per questo tipo di contratto';
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors: errors
        };
    }

    /**
     * Valida form ricevuta
     */
    validateRicevutaForm(data) {
        const errors = {};
        
        if (!this.validateRequired(data.data_ricevuta)) {
            errors.data_ricevuta = this.errorMessages.required;
        } else if (!this.validateData(data.data_ricevuta)) {
            errors.data_ricevuta = this.errorMessages.data;
        }
        
        if (!this.validateRequired(data.importo_lordo)) {
            errors.importo_lordo = this.errorMessages.required;
        } else if (!this.validateImporto(data.importo_lordo)) {
            errors.importo_lordo = this.errorMessages.importo;
        }
        
        if (!this.validateRequired(data.descrizione_prestazione)) {
            errors.descrizione_prestazione = this.errorMessages.required;
        }
        
        // Controllo coerenza importi
        const lordo = parseFloat(data.importo_lordo || 0);
        const ritenuta = parseFloat(data.ritenuta_acconto || 0);
        const netto = parseFloat(data.importo_netto || 0);
        
        if (Math.abs((lordo - ritenuta) - netto) > 0.01) {
            errors.importo_netto = 'Importo netto non coerente (deve essere lordo - ritenuta)';
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors: errors
        };
    }

    // ===== UTILITY =====

    /**
     * Mostra errori nel form
     */
    showFormErrors(formId, errors) {
        // Rimuovi errori precedenti
        const form = document.getElementById(formId);
        if (!form) return;
        
        form.querySelectorAll('.error-message').forEach(el => el.remove());
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        
        // Mostra nuovi errori
        Object.keys(errors).forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.classList.add('error');
                
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = errors[fieldName];
                field.parentNode.appendChild(errorDiv);
            }
        });
    }

    /**
     * Pulisce e valida tutti i campi di un form
     */
    sanitizeAndValidateForm(formData, formType = 'collaboratore') {
        const sanitized = {};
        
        // Sanitizza ogni campo
        Object.keys(formData).forEach(key => {
            let value = formData[key];
            
            if (typeof value === 'string') {
                // Sanitizzazione base per tutti i campi stringa
                value = this.sanitizeHTML(value);
                
                // Sanitizzazione specifica per tipo campo
                if (key === 'nome' || key === 'cognome') {
                    value = this.sanitizeName(value);
                } else if (key === 'email') {
                    value = value.toLowerCase().trim();
                } else if (key === 'codice_fiscale') {
                    value = value.toUpperCase().replace(/\s/g, '');
                } else if (key === 'partita_iva' || key === 'cap') {
                    value = value.replace(/\s/g, '');
                }
            }
            
            sanitized[key] = value;
        });
        
        // Valida in base al tipo form
        let validation;
        if (formType === 'collaboratore') {
            validation = this.validateCollaboratoreForm(sanitized);
        } else if (formType === 'ricevuta') {
            validation = this.validateRicevutaForm(sanitized);
        } else {
            validation = { isValid: true, errors: {} };
        }
        
        return {
            data: sanitized,
            ...validation
        };
    }
    
    // ===== SANITIZZAZIONE HTML SICURA =====
    
    /**
     * Sanitizza stringa per prevenire XSS quando si usa innerHTML
     * @param {string} str - Stringa da sanitizzare
     * @param {boolean} allowBasicTags - Permetti tag base come b, i, em, strong
     * @returns {string} Stringa sanitizzata
     */
    sanitizeForHTML(str) {
        if (!str) return '';
        
        // Crea elemento temporaneo per encoding automatico
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    /**
     * Sanitizza HTML permettendo alcuni tag sicuri
     * @param {string} html - HTML da sanitizzare
     * @param {Array} allowedTags - Tag permessi
     * @returns {string} HTML sanitizzato
     */
    sanitizeHTML(html, allowedTags = ['b', 'i', 'em', 'strong', 'span']) {
        if (!html) return '';
        
        // Prima escape tutto
        let sanitized = this.sanitizeForHTML(html);
        
        // Poi ri-permetti solo i tag sicuri
        allowedTags.forEach(tag => {
            const regex = new RegExp(`&lt;(\/?)${tag}&gt;`, 'gi');
            sanitized = sanitized.replace(regex, '<$1' + tag + '>');
        });
        
        return sanitized;
    }
    
    /**
     * Sanitizza oggetto per uso sicuro in innerHTML
     * @param {Object} obj - Oggetto da sanitizzare
     * @returns {Object} Oggetto con tutti i valori stringa sanitizzati
     */
    sanitizeObject(obj) {
        const sanitized = {};
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                sanitized[key] = this.sanitizeForHTML(obj[key]);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitized[key] = this.sanitizeObject(obj[key]);
            } else {
                sanitized[key] = obj[key];
            }
        }
        return sanitized;
    }
}

// Esporta globalmente
window.ValidationModule = ValidationModule;
const validator = new ValidationModule();
window.validator = validator;

// Funzioni helper globali per sanitizzazione rapida
window.sanitizeHTML = (str) => validator.sanitizeForHTML(str);
window.sanitizeHTMLWithTags = (str, tags) => validator.sanitizeHTML(str, tags);
window.sanitizeObject = (obj) => validator.sanitizeObject(obj);