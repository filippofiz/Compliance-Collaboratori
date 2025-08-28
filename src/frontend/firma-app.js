// Portale Firma Documenti - App Logic

let supabase = null;
let collaboratore = null;
let documenti = [];
let documentAcceptance = {}; // Track acceptance per document

// ===== FUNZIONE LOGGING AUDIT =====
async function logAudit(tipo_azione, descrizione, dati_aggiuntivi = {}) {
    try {
        if (!supabase || !collaboratore) return;
        
        const logEntry = {
            collaboratore_id: collaboratore.id,
            tipo_azione: tipo_azione,
            descrizione: descrizione,
            entita_tipo: 'firma_digitale',
            entita_id: dati_aggiuntivi.documento_id || null,
            valori_nuovi: {
                ...dati_aggiuntivi,
                timestamp: new Date().toISOString(),
                user_agent: navigator.userAgent,
                url: window.location.href
            },
            ip_address: null // IP catturato solo lato server
        };
        
        await supabase.from('audit_log').insert([logEntry]);
    } catch (error) {
        console.error('Errore logging audit:', error);
        // Non bloccare il flusso se il log fallisce
    }
}

// ===== INIZIALIZZAZIONE =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    attachEventListeners();
});

// ===== EVENT LISTENERS =====
function attachEventListeners() {
    // Bottone Firma
    const signBtn = document.getElementById('signAllBtn');
    if (signBtn) {
        signBtn.addEventListener('click', signAllDocuments);
    }
    
    // Bottone Retry
    const retryBtn = document.getElementById('btnRetry');
    if (retryBtn) {
        retryBtn.addEventListener('click', (e) => {
            e.preventDefault();
            location.reload();
        });
    }
    
    // Form completamento dati
    const dataForm = document.getElementById('dataCompletionForm');
    if (dataForm) {
        dataForm.addEventListener('submit', handleDataCompletion);
    }
}

async function initializeApp() {
    try {
        // Ottieni ID collaboratore dall'URL
        const urlParams = new URLSearchParams(window.location.search);
        const collaboratoreId = urlParams.get('id');
        
        if (!collaboratoreId) {
            showError('Link non valido. ID collaboratore mancante.');
            return;
        }
        
        // Inizializza Supabase
        if (window.ComplianceConfig && window.ComplianceConfig.supabase) {
            const config = window.ComplianceConfig.supabase;
            supabase = window.supabase.createClient(config.url, config.anonKey);
            console.log('Supabase inizializzato');
        } else {
            console.error('Configurazione non trovata. Window.ComplianceConfig:', window.ComplianceConfig);
            showError('Configurazione mancante. Riprova.');
            return;
        }
        
        // Carica dati
        await loadCollaboratore(collaboratoreId);
        await loadDocumenti(collaboratoreId);
        
        // Log accesso al portale
        await logAudit('portal_access', `Accesso al portale firma documenti`, {
            collaboratore_id: collaboratoreId,
            numero_documenti: documenti.length
        });
        
        // Mostra contenuto
        document.getElementById('loading').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        
    } catch (error) {
        console.error('Errore inizializzazione:', error);
        showError('Errore caricamento dati: ' + error.message);
    }
}

// ===== CARICA DATI =====
async function loadCollaboratore(id) {
    console.log('Caricamento collaboratore con ID:', id);
    
    const { data, error } = await supabase
        .from('collaboratori')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) {
        console.error('Errore caricamento collaboratore:', error);
        throw error;
    }
    
    if (!data) {
        console.error('Collaboratore non trovato per ID:', id);
        throw new Error('Collaboratore non trovato');
    }
    
    collaboratore = data;
    console.log('Collaboratore caricato:', collaboratore);
    
    document.getElementById('nomeCollaboratore').textContent = 
        `${collaboratore.nome} ${collaboratore.cognome || ''}`;
    
    // Pre-compila i campi del form completamento dati
    populateDataForm();
    
    // Controlla se i dati sono completi
    if (isDataComplete()) {
        // Nascondi form completamento e mostra documenti
        document.getElementById('dataCompletionSection').style.display = 'none';
        document.getElementById('documentsSection').style.display = 'block';
        document.getElementById('signSection').style.display = 'block';
        
        // Pre-compila i campi della firma
        document.getElementById('signName').value = `${collaboratore.nome} ${collaboratore.cognome}`;
        document.getElementById('signEmail').value = collaboratore.email;
    } else {
        // Mostra form completamento dati
        document.getElementById('dataCompletionSection').style.display = 'block';
        document.getElementById('documentsSection').style.display = 'none';
        document.getElementById('signSection').style.display = 'none';
    }
}

async function loadDocumenti(collaboratoreId) {
    const { data, error } = await supabase
        .from('documenti')
        .select('*')
        .eq('collaboratore_id', collaboratoreId)
        .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    documenti = data || [];
    const nonFirmati = documenti.filter(d => d.stato !== 'firmato');
    document.getElementById('numDocumenti').textContent = nonFirmati.length;
    
    renderDocumenti();
}

// ===== GESTIONE COMPLETAMENTO DATI =====
function populateDataForm() {
    // Popola il form con i dati esistenti del collaboratore
    document.getElementById('dataNome').value = collaboratore.nome || '';
    document.getElementById('dataCognome').value = collaboratore.cognome || '';
    document.getElementById('dataEmail').value = collaboratore.email || '';
    document.getElementById('dataCF').value = collaboratore.codice_fiscale || '';
    document.getElementById('dataTelefono').value = collaboratore.telefono || '';
    document.getElementById('dataDataNascita').value = collaboratore.data_nascita || '';
    document.getElementById('dataLuogoNascita').value = collaboratore.luogo_nascita || '';
    document.getElementById('dataNazionalita').value = collaboratore.nazionalita || 'Italiana';
    document.getElementById('dataIndirizzo').value = collaboratore.indirizzo || '';
    document.getElementById('dataCitta').value = collaboratore.citta || '';
    document.getElementById('dataCap').value = collaboratore.cap || '';
    document.getElementById('dataProvincia').value = collaboratore.provincia || '';
    document.getElementById('dataIban').value = collaboratore.iban || '';
    document.getElementById('dataPartitaIva').value = collaboratore.partita_iva || '';
    
    // Mostra campo partita IVA se necessario
    if (collaboratore.tipo_contratto === 'partita_iva' || collaboratore.tipo_contratto === 'misto') {
        document.getElementById('partitaIvaSection').style.display = 'block';
        if (collaboratore.tipo_contratto === 'partita_iva') {
            document.getElementById('dataPartitaIva').setAttribute('required', 'required');
        }
    }
}

function isDataComplete() {
    // Controlla se tutti i dati obbligatori sono compilati
    // Ignora valori temporanei come 'DA_COMPLETARE' o codici fiscali che iniziano con 'TEMP'
    const requiredFields = [
        'nome', 'cognome', 'email', 'codice_fiscale', 
        'telefono', 'data_nascita', 'luogo_nascita',
        'indirizzo', 'citta', 'cap', 'provincia', 'iban'
    ];
    
    for (const field of requiredFields) {
        const value = collaboratore[field];
        
        // Controlla se il campo è vuoto o ha valore temporaneo
        if (!value || value.trim() === '' || 
            value === 'DA_COMPLETARE' || 
            (field === 'codice_fiscale' && value.startsWith('TEMP'))) {
            return false;
        }
    }
    
    // Se partita IVA è richiesta, controlla anche quella
    if (collaboratore.tipo_contratto === 'partita_iva' && 
        (!collaboratore.partita_iva || collaboratore.partita_iva.trim() === '')) {
        return false;
    }
    
    // Usa anche il flag dati_completati se presente (dopo migration)
    // if (collaboratore.dati_completati !== undefined) {
    //     return collaboratore.dati_completati;
    // }
    
    return true;
}

async function handleDataCompletion(e) {
    e.preventDefault();
    
    try {
        // Mostra loading
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Salvataggio in corso...';
        
        // Raccogli dati dal form
        const formData = new FormData(e.target);
        const updatedData = {};
        
        for (const [key, value] of formData.entries()) {
            if (value && value.trim() !== '') {
                updatedData[key] = value.trim();
            }
        }
        
        // Aggiungi timestamp aggiornamento
        updatedData.updated_at = new Date().toISOString();
        // Aggiungi dati_completati solo se il campo esiste (dopo migration)
        // updatedData.dati_completati = true;
        
        console.log('Aggiornamento dati collaboratore:', updatedData);
        
        // Salva su Supabase
        const { data, error } = await supabase
            .from('collaboratori')
            .update(updatedData)
            .eq('id', collaboratore.id)
            .select()
            .single();
        
        if (error) throw error;
        
        // Aggiorna dati locali
        collaboratore = data;
        
        // Log audit
        await logAudit('data_completion', 'Completamento dati anagrafici per firma', {
            campi_aggiornati: Object.keys(updatedData)
        });
        
        // Mostra sezione documenti
        document.getElementById('dataCompletionSection').style.display = 'none';
        document.getElementById('documentsSection').style.display = 'block';
        document.getElementById('signSection').style.display = 'block';
        
        // Pre-compila campi firma
        document.getElementById('signName').value = `${collaboratore.nome} ${collaboratore.cognome}`;
        document.getElementById('signEmail').value = collaboratore.email;
        
        // Mostra notifica successo
        showNotification('Dati salvati correttamente. Ora puoi procedere con la firma dei documenti.', 'success');
        
    } catch (error) {
        console.error('Errore salvataggio dati:', error);
        showNotification('Errore nel salvataggio dei dati. Riprova.', 'error');
    } finally {
        // Ripristina bottone
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Salva e Procedi con la Firma';
    }
}

function showNotification(message, type = 'info') {
    // Crea elemento notifica
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Rimuovi dopo 5 secondi
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// ===== RENDERING =====
function renderDocumenti() {
    const container = document.getElementById('documentsList');
    const signedContainer = document.getElementById('signedList');
    
    const daFirmare = documenti.filter(d => d.stato !== 'firmato');
    const firmati = documenti.filter(d => d.stato === 'firmato');
    
    // Documenti da firmare
    if (daFirmare.length > 0) {
        container.innerHTML = daFirmare.map(doc => `
            <div class="document-card">
                <div class="document-header">
                    <h4>${doc.titolo}</h4>
                    <span class="badge badge-pending">Da firmare</span>
                </div>
                
                <div class="document-content-preview">
                    ${doc.contenuto_html || '<p>Contenuto documento non disponibile</p>'}
                </div>
                
                <div class="document-acceptance">
                    <label class="checkbox-label">
                        <input type="checkbox" 
                               id="read_${doc.id}" 
                               onchange="updateAcceptance('${doc.id}', 'read')">
                        Ho letto e compreso il contenuto del documento
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" 
                               id="accept_${doc.id}" 
                               onchange="updateAcceptance('${doc.id}', 'accept')">
                        Accetto i termini e le condizioni descritte
                    </label>
                </div>
            </div>
        `).join('');
        
        // Mostra sezione firma
        document.getElementById('signSection').style.display = 'block';
    } else if (firmati.length > 0) {
        container.innerHTML = '<div class="success-message"><p>✅ Tutti i documenti sono stati firmati!</p></div>';
        document.getElementById('signSection').style.display = 'none';
    }
    
    // Documenti firmati
    if (firmati.length > 0) {
        document.getElementById('signedSection').style.display = 'block';
        signedContainer.innerHTML = firmati.map(doc => `
            <div class="document-card signed">
                <div class="document-info">
                    <h4>${doc.titolo}</h4>
                    <p>Firmato il: ${new Date(doc.data_firma).toLocaleString('it-IT')}</p>
                </div>
                <div class="document-status">
                    <span class="badge badge-signed">✅ Firmato</span>
                </div>
            </div>
        `).join('');
    }
}

// ===== GESTIONE ACCETTAZIONE =====
function updateAcceptance(docId, type) {
    if (!documentAcceptance[docId]) {
        documentAcceptance[docId] = { read: false, accept: false };
    }
    
    const checkbox = document.getElementById(`${type}_${docId}`);
    documentAcceptance[docId][type] = checkbox.checked;
    
    checkCanSign();
}

function checkCanSign() {
    const daFirmare = documenti.filter(d => d.stato !== 'firmato');
    const signBtn = document.getElementById('signAllBtn');
    const signName = document.getElementById('signName').value.trim();
    const signEmail = document.getElementById('signEmail').value.trim();
    
    // Controlla che tutti i documenti siano stati letti e accettati
    let allAccepted = true;
    for (const doc of daFirmare) {
        if (!documentAcceptance[doc.id] || 
            !documentAcceptance[doc.id].read || 
            !documentAcceptance[doc.id].accept) {
            allAccepted = false;
            break;
        }
    }
    
    // Abilita bottone solo se tutto è compilato
    signBtn.disabled = !(allAccepted && signName && signEmail);
}

// ===== FIRMA DOCUMENTI =====
async function signAllDocuments() {
    const signBtn = document.getElementById('signAllBtn');
    const signName = document.getElementById('signName').value.trim();
    const signEmail = document.getElementById('signEmail').value.trim();
    
    if (!signName || !signEmail) {
        alert('Inserisci nome e email per la firma');
        return;
    }
    
    signBtn.disabled = true;
    signBtn.textContent = 'Firma in corso...';
    
    try {
        const daFirmare = documenti.filter(d => d.stato !== 'firmato');
        const timestamp = new Date().toISOString();
        
        // Genera token condiviso per tutti i documenti
        const verificationToken = generateToken();
        
        // IP address non disponibile lato client per motivi di sicurezza
        const ipAddress = null;
        
        // Codice principale per l'email (primo documento)
        let mainVerificationCode = null;
        
        // Firma tutti i documenti
        for (let i = 0; i < daFirmare.length; i++) {
            const doc = daFirmare[i];
            
            // Genera codice unico per ogni documento (ma salva il primo per l'email)
            const verificationCode = generateVerificationCode() + '-' + i;
            if (i === 0) mainVerificationCode = verificationCode;
            
            // Calcola hash per validità legale
            const hashData = `${doc.id}-${collaboratore.id}-${signName}-${signEmail}-${timestamp}`;
            const hash = await calculateHash(hashData);
            
            // Salva firma digitale
            const { data: firmaData, error: firmaError } = await supabase
                .from('firme_digitali')
                .insert([{
                    documento_id: doc.id,
                    collaboratore_id: collaboratore.id,
                    firma_base64: null, // Non usiamo più il canvas
                    hash_firma: hash,
                    ip_address: ipAddress,
                    user_agent: navigator.userAgent,
                    dispositivo: getDeviceInfo(),
                    codice_verifica: verificationCode,
                    nome_firmatario: signName,
                    email_firmatario: signEmail,
                    metodo_firma: 'email_confirmation',
                    email_verificata: false,
                    token_verifica: verificationToken,
                    valida: false // Diventerà true dopo conferma email
                }])
                .select()
                .single();
            
            if (firmaError) throw firmaError;
            
            // Log firma documento
            await logAudit('document_signed', `Documento firmato: ${doc.titolo}`, {
                documento_id: doc.id,
                hash_firma: hash,
                codice_verifica: verificationCode,
                metodo: 'email_confirmation'
            });
            
            // Aggiorna documento come "da_firmare" (sarà "firmato" dopo conferma email)
            const { error: updateError } = await supabase
                .from('documenti')
                .update({
                    stato: 'da_firmare',
                    data_firma: timestamp
                })
                .eq('id', doc.id);
            
            if (updateError) throw updateError;
        }
        
        // Invia email di conferma con il primo codice
        await sendConfirmationEmail(signEmail, signName, mainVerificationCode);
        
        // Log audit
        await supabase.from('audit_log').insert([{
            collaboratore_id: collaboratore.id,
            tipo_azione: 'documents_signed_pending',
            descrizione: `Documenti firmati in attesa di conferma email`,
            valori_nuovi: {
                codice_verifica: mainVerificationCode,
                token_verifica: verificationToken,
                email_conferma: signEmail
            }
        }]);
        
        // Mostra successo
        showConfirmationMessage(signEmail);
        
    } catch (error) {
        console.error('Errore firma:', error);
        alert('Errore durante la firma: ' + error.message);
    } finally {
        signBtn.disabled = false;
        signBtn.textContent = 'Firma Tutti i Documenti';
    }
}

// ===== INVIO EMAIL CONFERMA =====
async function sendConfirmationEmail(email, nome, code) {
    try {
        // Genera link di conferma
        const baseUrl = window.location.href.split('?')[0].replace('firma.html', '');
        const confirmationLink = `${baseUrl}conferma.html?code=${code}`;
        
        // Usa Supabase Edge Function per inviare email
        if (supabase) {
            const { data, error } = await supabase.functions.invoke('send-email', {
                body: {
                    type: 'verification',
                    to_email: email,
                    to_name: nome,
                    data: {
                        confirmation_link: confirmationLink,
                        verification_code: code
                    }
                }
            });
            
            if (error) throw error;
            
            console.log('✅ Email di conferma inviata tramite Supabase Edge Function');
            console.log('Response:', data);
            return true;
        } else {
            console.warn('Supabase non configurato - email simulata');
            console.log(`Email di conferma per ${email} con codice ${code}`);
            console.log(`Link conferma: ${confirmationLink}`);
            alert(`⚠️ Email simulata. Link conferma:\n${confirmationLink}`);
            return false;
        }
    } catch (error) {
        console.error('Errore invio email conferma:', error);
        // Fallback con link diretto
        const confirmationLink = `${window.location.href.split('?')[0].replace('firma.html', '')}conferma.html?code=${code}`;
        alert(`⚠️ Errore invio email. Usa questo link per confermare:\n${confirmationLink}`);
        return false;
    }
}

// ===== UTILITY =====
async function calculateHash(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateVerificationCode() {
    return 'VER-' + Date.now().toString(36).toUpperCase() + 
           '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

function generateToken() {
    // Genera token sicuro per URL
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function getClientIP() {
    // Non possiamo usare servizi esterni per IP a causa del CSP
    // Restituiamo null che verrà gestito lato database
    // In produzione l'IP dovrebbe essere catturato lato server
    return null;
}

function getDeviceInfo() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isMobile ? 'Mobile' : 'Desktop';
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}

function showConfirmationMessage(email) {
    document.getElementById('mainContent').innerHTML = `
        <div class="success-container">
            <h2>✅ Firma Completata!</h2>
            <p>Abbiamo inviato un'email di conferma a:</p>
            <p><strong>${email}</strong></p>
            <p>Clicca sul link nell'email per confermare la tua firma digitale.</p>
            <p>Se non ricevi l'email entro 5 minuti, controlla la cartella spam.</p>
        </div>
    `;
}

// Export globali
window.updateAcceptance = updateAcceptance;
window.signAllDocuments = signAllDocuments;
window.checkCanSign = checkCanSign;