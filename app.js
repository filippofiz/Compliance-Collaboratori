// Inizializzazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registrationForm');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const alertBox = document.getElementById('alertBox');
    
    // Gestione invio form
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Reset errori precedenti
        clearErrors();
        hideAlert();
        
        // Validazione form
        if (!validateForm()) {
            showAlert('Per favore correggi gli errori nel form', 'error');
            return;
        }
        
        // Disabilita il bottone e mostra spinner
        submitBtn.disabled = true;
        submitText.textContent = 'Invio in corso...';
        loadingSpinner.classList.remove('hidden');
        
        // Raccolta dati dal form
        const formData = collectFormData();
        
        try {
            // Invio dati a Supabase
            const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                showAlert('Registrazione completata con successo!', 'success');
                form.reset();
                
                // Scroll verso l'alto per mostrare il messaggio di successo
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const error = await response.text();
                console.error('Errore risposta:', error);
                showAlert('Errore durante la registrazione. Riprova più tardi.', 'error');
            }
        } catch (error) {
            console.error('Errore di rete:', error);
            showAlert('Errore di connessione. Verifica la tua connessione internet.', 'error');
        } finally {
            // Ripristina il bottone
            submitBtn.disabled = false;
            submitText.textContent = 'Invia Registrazione';
            loadingSpinner.classList.add('hidden');
        }
    });
    
    // Validazione in tempo reale
    const inputs = form.querySelectorAll('input[required], select[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(input);
        });
        
        input.addEventListener('input', function() {
            if (input.classList.contains('error')) {
                validateField(input);
            }
        });
    });
    
    // Formattazione automatica codice fiscale e provincia
    document.getElementById('codice_fiscale').addEventListener('input', function(e) {
        e.target.value = e.target.value.toUpperCase();
    });
    
    document.getElementById('provincia').addEventListener('input', function(e) {
        e.target.value = e.target.value.toUpperCase();
    });
});

// Funzione per raccogliere i dati del form
function collectFormData() {
    const form = document.getElementById('registrationForm');
    const formData = new FormData(form);
    const data = {};
    
    // Converti FormData in oggetto
    for (let [key, value] of formData.entries()) {
        if (key === 'consenso_regolamento' || key === 'consenso_privacy') {
            data[key] = form.querySelector(`[name="${key}"]`).checked;
        } else {
            data[key] = value.trim() || null;
        }
    }
    
    // Aggiungi timestamp
    data.created_at = new Date().toISOString();
    
    return data;
}

// Funzione per validare il form completo
function validateForm() {
    const form = document.getElementById('registrationForm');
    let isValid = true;
    
    // Valida tutti i campi required
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

// Funzione per validare un singolo campo
function validateField(field) {
    const fieldName = field.name;
    const fieldValue = field.value.trim();
    const errorElement = document.getElementById(`${fieldName}-error`);
    let isValid = true;
    let errorMessage = '';
    
    // Controllo campo vuoto per campi required
    if (field.hasAttribute('required') && !fieldValue) {
        if (field.type === 'checkbox' && !field.checked) {
            errorMessage = 'Questo campo è obbligatorio';
            isValid = false;
        } else if (field.type !== 'checkbox' && !fieldValue) {
            errorMessage = 'Questo campo è obbligatorio';
            isValid = false;
        }
    }
    
    // Validazioni specifiche per campo
    if (fieldValue && isValid) {
        switch (fieldName) {
            case 'email':
            case 'email_fatturazione':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(fieldValue)) {
                    errorMessage = 'Inserisci un indirizzo email valido';
                    isValid = false;
                }
                break;
                
            case 'telefono':
                const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
                if (!phoneRegex.test(fieldValue)) {
                    errorMessage = 'Inserisci un numero di telefono valido';
                    isValid = false;
                }
                break;
                
            case 'codice_fiscale':
                const cfRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;
                if (!cfRegex.test(fieldValue)) {
                    errorMessage = 'Codice fiscale non valido (es: RSSMRA85T10A562S)';
                    isValid = false;
                }
                break;
                
            case 'cap':
                const capRegex = /^[0-9]{5}$/;
                if (!capRegex.test(fieldValue)) {
                    errorMessage = 'Il CAP deve essere di 5 cifre';
                    isValid = false;
                }
                break;
                
            case 'provincia':
                if (fieldValue.length !== 2) {
                    errorMessage = 'La provincia deve essere di 2 lettere (es: RM)';
                    isValid = false;
                }
                break;
        }
    }
    
    // Mostra o nascondi messaggio di errore
    if (!isValid) {
        field.classList.add('error');
        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.classList.add('show');
        }
    } else {
        field.classList.remove('error');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
    }
    
    return isValid;
}

// Funzione per pulire tutti gli errori
function clearErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    const errorFields = document.querySelectorAll('.error');
    
    errorMessages.forEach(msg => {
        msg.textContent = '';
        msg.classList.remove('show');
    });
    
    errorFields.forEach(field => {
        field.classList.remove('error');
    });
}

// Funzione per mostrare alert
function showAlert(message, type) {
    const alertBox = document.getElementById('alertBox');
    alertBox.textContent = message;
    alertBox.className = `alert-box ${type}`;
    
    // Auto-nascondi dopo 5 secondi per messaggi di successo
    if (type === 'success') {
        setTimeout(() => {
            hideAlert();
        }, 5000);
    }
}

// Funzione per nascondere alert
function hideAlert() {
    const alertBox = document.getElementById('alertBox');
    alertBox.classList.add('hidden');
}