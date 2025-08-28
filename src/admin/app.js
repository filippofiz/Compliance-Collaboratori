// Compliance Collaboratori - Admin App
// Sistema per gestione compliance con validità legale

// Attendi che la configurazione sia caricata
let supabase = null;
let ADMIN_EMAIL = '';
let ADMIN_PASSWORD = '';
let EMAILJS_SERVICE_ID = '';
let EMAILJS_TEMPLATE_ID = '';
let EMAILJS_PUBLIC_KEY = '';

// Inizializza dopo il caricamento del DOM
window.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    try {
        // Carica configurazione centralizzata
        if (window.ComplianceConfig) {
            const config = window.ComplianceConfig;
            
            // Inizializza Supabase
            if (config.supabase && config.supabase.url !== 'https://YOUR_PROJECT_ID.supabase.co') {
                supabase = window.supabase.createClient(config.supabase.url, config.supabase.anonKey);
                logger.log('Supabase inizializzato');
            } else {
                logger.warn('⚠️ Supabase non configurato - Aggiorna config.js con i tuoi dati');
            }
            
            // EmailJS non più necessario - usiamo Supabase Edge Functions
            
            // Carica credenziali admin
            ADMIN_EMAIL = config.admin.email;
            ADMIN_PASSWORD = config.admin.password;
            
            // Inizializza Auth Manager
            window.authManager = new AuthManager();
            
            // Attach event handlers
            attachEventHandlers();
        } else {
            logger.error('❌ File config.js non trovato o non valido');
        }
    } catch (error) {
        logger.error('Errore inizializzazione:', error);
    }
}

// Stato applicazione
let currentUser = null;
let collaboratoriData = [];
let documentiData = [];
let ricevuteData = [];
let firmeData = [];

// ===== AUTENTICAZIONE =====
class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        const savedUser = localStorage.getItem('complianceUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        document.getElementById('loginForm').style.display = 'flex';
        document.getElementById('dashboard').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('userEmail').textContent = currentUser?.email || 'Admin';
        
        // Carica dati iniziali
        loadDashboardData();
    }

    async login(email, password) {
        // Login semplificato per testing
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            currentUser = { email, role: 'admin' };
            localStorage.setItem('complianceUser', JSON.stringify(currentUser));
            this.showDashboard();
            showNotification('Login effettuato con successo', 'success');
            return true;
        }
        
        // Prova con Supabase se configurato
        if (supabase) {
            try {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (!error && data.user) {
                    currentUser = data.user;
                    localStorage.setItem('complianceUser', JSON.stringify(currentUser));
                    this.showDashboard();
                    return true;
                }
            } catch (error) {
                logger.error('Supabase login error:', error);
            }
        }
        
        showNotification('Credenziali non valide', 'error');
        return false;
    }

    logout() {
        localStorage.removeItem('complianceUser');
        currentUser = null;
        this.showLogin();
    }
}

// ===== GESTIONE DATI =====
async function loadDashboardData() {
    // Mostra loading
    setLoadingState(true);
    
    try {
        if (supabase) {
            // Carica collaboratori (Supabase accede direttamente al nome tabella senza schema prefix nell'API)
            const { data: collaboratori, error: errorCollab } = await supabase
                .from('collaboratori')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (!errorCollab) {
                collaboratoriData = collaboratori || [];
            } else {
                logger.warn('Errore caricamento collaboratori:', errorCollab);
            }
            
            // Carica documenti 
            const { data: documenti, error: errorDoc } = await supabase
                .from('documenti')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (!errorDoc) {
                documentiData = documenti || [];
            } else {
                logger.warn('Errore caricamento documenti:', errorDoc);
            }
            
            // Carica firme digitali
            const { data: firme, error: errorFirme } = await supabase
                .from('firme_digitali')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (!errorFirme) {
                firmeData = firme || [];
            } else {
                logger.warn('Errore caricamento firme:', errorFirme);
                firmeData = [];
            }
            
            // Carica ricevute
            const { data: ricevute, error: errorRic } = await supabase
                .from('ricevute')
                .select('*')
                .order('data_ricevuta', { ascending: false });
            
            if (!errorRic) ricevuteData = ricevute || [];
        } else {
            // Dati mock per testing senza Supabase
            collaboratoriData = getMockCollaboratori();
            documentiData = getMockDocumenti();
            ricevuteData = getMockRicevute();
        }
        
        // Aggiorna UI
        updateStats();
        renderCollaboratori();
        renderDocumenti();
        renderRicevute();
        updateComplianceStatus();
        
    } catch (error) {
        logger.error('Error loading data:', error);
        showNotification('Errore caricamento dati', 'error');
    } finally {
        setLoadingState(false);
    }
}

// ===== TEMPLATE RICEVUTA =====
function generateRicevutaTemplate(collaboratore, mese, anno) {
    const template = {
        numero: `RIC-${anno}-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
        data: new Date().toLocaleDateString('it-IT'),
        collaboratore: {
            nome: collaboratore.nome,
            cognome: collaboratore.cognome,
            cf: collaboratore.codice_fiscale,
            indirizzo: collaboratore.indirizzo,
            citta: collaboratore.citta,
            cap: collaboratore.cap,
            provincia: collaboratore.provincia
        },
        periodo: `${mese}/${anno}`,
        prestazione: 'Attività di tutoraggio didattico',
        importo_lordo: 0, // Da compilare
        ritenuta_acconto: 20, // 20%
        importo_netto: 0, // Calcolato automaticamente
        modalita_pagamento: 'Bonifico bancario',
        iban: collaboratore.iban || ''
    };
    
    return template;
}

function downloadRicevutaTemplate(collaboratoreId) {
    const collaboratore = collaboratoriData.find(c => c.id === collaboratoreId);
    if (!collaboratore) return;
    
    const oggi = new Date();
    const mese = oggi.getMonth() + 1;
    const anno = oggi.getFullYear();
    
    const template = generateRicevutaTemplate(collaboratore, mese, anno);
    
    // Genera HTML per il template
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Ricevuta - ${template.numero}</title>
            <style>
                body { font-family: Arial; max-width: 800px; margin: 0 auto; padding: 20px; }
                h1 { text-align: center; }
                .field { margin: 10px 0; padding: 5px; border-bottom: 1px solid #ddd; }
                .editable { background: #fffacd; }
                .signature-area { border: 2px dashed #999; height: 100px; margin: 20px 0; text-align: center; padding: 40px; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <h1>RICEVUTA PER PRESTAZIONE OCCASIONALE</h1>
            <p>Ricevuta n. ${template.numero} del ${template.data}</p>
            
            <h3>Il/La sottoscritto/a</h3>
            <div class="field">${template.collaboratore.nome} ${template.collaboratore.cognome}</div>
            <div class="field">C.F.: ${template.collaboratore.cf}</div>
            <div class="field">Residente in: ${template.collaboratore.indirizzo}, ${template.collaboratore.cap} ${template.collaboratore.citta} (${template.collaboratore.provincia})</div>
            
            <h3>Dichiara di aver ricevuto</h3>
            <div class="field">Per: ${template.prestazione}</div>
            <div class="field">Periodo: ${template.periodo}</div>
            <div class="field editable">Importo lordo: € <input type="number" placeholder="0.00" onchange="calcNetto(this)"></div>
            <div class="field">Ritenuta d'acconto (20%): € <span id="ritenuta">0.00</span></div>
            <div class="field"><strong>Importo netto: € <span id="netto">0.00</span></strong></div>
            
            <div class="field">Modalità pagamento: ${template.modalita_pagamento}</div>
            <div class="field">IBAN: ${template.iban}</div>
            
            <p><strong>IMPORTANTE:</strong> Il sottoscritto dichiara che la presente prestazione rientra nei limiti di €5.000 annui previsti dall'art. 67 TUIR.</p>
            
            <div class="signature-area">
                <p>Firma del prestatore</p>
                <p class="no-print">(Firmare dopo la stampa)</p>
            </div>
            
            <script>
                function calcNetto(input) {
                    const lordo = parseFloat(input.value) || 0;
                    const ritenuta = lordo * 0.20;
                    const netto = lordo - ritenuta;
                    document.getElementById('ritenuta').textContent = ritenuta.toFixed(2);
                    document.getElementById('netto').textContent = netto.toFixed(2);
                }
            </script>
        </body>
        </html>
    `;
    
    // Download del file HTML
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ricevuta_template_${template.numero}.html`;
    a.click();
    
    showNotification('Template ricevuta scaricato. Compilare, stampare, firmare e ricaricare.', 'success');
}

// ===== UPLOAD RICEVUTA FIRMATA =====
async function uploadRicevutaFirmata(file, collaboratoreId, datiRicevuta) {
    try {
        // Calcola hash del file per garantire non modificabilità
        const fileHash = await calculateFileHash(file);
        
        // Upload su Supabase Storage
        if (supabase) {
            const fileName = `ricevute/${collaboratoreId}/${Date.now()}_${file.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('compliance-docs')
                .upload(fileName, file);
            
            if (uploadError) throw uploadError;
            
            // Salva record in database con hash
            const ricevuta = {
                collaboratore_id: collaboratoreId,
                numero_ricevuta: datiRicevuta.numero,
                data_ricevuta: new Date(),
                mese_riferimento: datiRicevuta.mese,
                anno_riferimento: datiRicevuta.anno,
                importo_lordo: datiRicevuta.importo_lordo,
                ritenuta_acconto: 20,
                importo_ritenuta: datiRicevuta.importo_lordo * 0.20,
                importo_netto: datiRicevuta.importo_lordo * 0.80,
                file_url: fileName,
                file_hash: fileHash,
                firmata: true,
                data_firma: new Date()
            };
            
            const { data, error } = await supabase
                .from('ricevute')
                .insert([ricevuta]);
            
            if (error) throw error;
            
            // Log audit
            await logAudit('upload_ricevuta', `Caricata ricevuta ${datiRicevuta.numero}`, { fileHash });
            
            showNotification('Ricevuta caricata con successo', 'success');
            return true;
        }
        
    } catch (error) {
        logger.error('Error uploading:', error);
        showNotification('Errore caricamento ricevuta', 'error');
        return false;
    }
}

// ===== UTILITY HASH (per validità legale) =====
async function calculateFileHash(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// ===== AUDIT LOG =====
async function logAudit(action, description, metadata = {}) {
    if (supabase) {
        await supabase.from('audit_log').insert([{
            utente_admin: currentUser?.email,
            tipo_azione: action,
            descrizione: description,
            valori_nuovi: metadata,
            ip_address: null, // IP catturato solo lato server
            user_agent: navigator.userAgent
        }]);
    }
}

async function getClientIP() {
    // Non possiamo usare servizi esterni per IP a causa del CSP
    // In produzione l'IP dovrebbe essere catturato lato server
    return null;
}

// ===== UI RENDERING =====
function renderCollaboratori() {
    const tbody = document.getElementById('collaboratoriTableBody');
    if (!tbody) return;
    
    if (collaboratoriData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px;">Nessun collaboratore registrato</td></tr>';
        return;
    }
    
    tbody.innerHTML = collaboratoriData.map(c => {
        // Sanitizza i dati del collaboratore prima di usarli
        const collab = window.sanitizeObject ? window.sanitizeObject(c) : c;
        // Determina stato firma documenti
        const statoFirma = getStatoFirmaCollaboratore(collab.id);
        
        return `
        <tr>
            <td>${collab.nome} ${collab.cognome}</td>
            <td>${collab.email}</td>
            <td>${collab.tipo_collaboratore || 'Tutor'}</td>
            <td>${collab.tipo_contratto || 'Occasionale'}</td>
            <td>€${collab.limite_annuale || 5000}</td>
            <td>€${collab.importo_anno_corrente || 0}</td>
            <td>${statoFirma.badge}</td>
            <td><span class="badge badge-${collab.stato === 'attivo' ? 'success' : 'warning'}">${collab.stato || 'pending'}</span></td>
            <td>
                <button data-action="download-template" data-id="${collab.id}" class="btn btn-sm">📥 Template</button>
                <button data-action="view-collaboratore" data-id="${collab.id}" class="btn btn-sm">👁️</button>
            </td>
        </tr>
        `;
    }).join('');
}

// Nuova funzione per determinare lo stato firma - PRENDE IL PEGGIORE
function getStatoFirmaCollaboratore(collaboratoreId) {
    // Trova documenti del collaboratore
    const docs = documentiData.filter(d => d.collaboratore_id === collaboratoreId);
    
    if (docs.length === 0) {
        return {
            stato: 'nessun_documento',
            badge: '<span class="badge badge-secondary">Nessun documento</span>'
        };
    }
    
    // Analizza lo stato di ogni documento
    let hasDaFirmare = false;
    let hasInAttesa = false;
    let hasFirmati = false;
    
    for (const doc of docs) {
        // Cerca firme per questo documento
        const firma = firmeData?.find(f => 
            f.documento_id === doc.id && 
            f.collaboratore_id === collaboratoreId
        );
        
        if (!firma) {
            // Nessuna firma = da firmare
            hasDaFirmare = true;
        } else if (firma.valida === false) {
            // Firma presente ma non validata = in attesa conferma
            hasInAttesa = true;
        } else if (firma.valida === true) {
            // Firma validata = completato
            hasFirmati = true;
        }
    }
    
    // Ritorna lo stato PEGGIORE (priorità: da firmare > attesa > completato)
    if (hasDaFirmare) {
        // Se anche solo 1 documento è da firmare
        return {
            stato: 'da_firmare',
            badge: '<span class="badge badge-danger">📝 Da firmare</span>'
        };
    } else if (hasInAttesa) {
        // Se tutti firmati ma almeno 1 in attesa conferma
        return {
            stato: 'attesa_conferma',
            badge: '<span class="badge badge-warning">⏳ Attesa conferma</span>'
        };
    } else if (hasFirmati && docs.length > 0) {
        // Solo se TUTTI sono firmati e confermati
        return {
            stato: 'completato',
            badge: '<span class="badge badge-success">✅ Completato</span>'
        };
    } else {
        // Caso anomalo
        return {
            stato: 'sconosciuto',
            badge: '<span class="badge badge-secondary">? Verifica</span>'
        };
    }
}

function renderDocumenti() {
    const tbody = document.getElementById('documentiTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = documentiData.map(doc => {
        const collab = collaboratoriData.find(c => c.id === doc.collaboratore_id);
        
        // Determina stato specifico del documento
        const statoDoc = getStatoDocumento(doc);
        
        return `
            <tr>
                <td>${collab ? collab.nome + ' ' + collab.cognome : 'N/A'}</td>
                <td>${doc.tipo_documento}</td>
                <td>${doc.titolo}</td>
                <td>${statoDoc.badge}</td>
                <td>${doc.data_firma ? new Date(doc.data_firma).toLocaleDateString('it-IT') : '-'}</td>
                <td>${doc.valido_al ? new Date(doc.valido_al).toLocaleDateString('it-IT') : '-'}</td>
                <td>
                    <button data-action="view-document" data-id="${doc.id}" class="btn btn-sm">👁️</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Funzione per stato del singolo documento
function getStatoDocumento(doc) {
    // Cerca firma per questo documento
    const firma = firmeData?.find(f => f.documento_id === doc.id);
    
    if (!firma) {
        // Nessuna firma
        return {
            stato: 'da_firmare',
            badge: '<span class="badge badge-danger">📝 Da firmare</span>'
        };
    } else if (firma.valida === false) {
        // Firma presente ma non validata
        return {
            stato: 'attesa_conferma',
            badge: '<span class="badge badge-warning">⏳ Attesa conferma</span>'
        };
    } else if (firma.valida === true) {
        // Firma validata
        return {
            stato: 'firmato',
            badge: '<span class="badge badge-success">✅ Firmato</span>'
        };
    } else {
        // Stato anomalo
        return {
            stato: 'sconosciuto',
            badge: '<span class="badge badge-secondary">? Verifica</span>'
        };
    }
}

function renderRicevute() {
    const tbody = document.getElementById('ricevuteTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = ricevuteData.map(ric => {
        const collab = collaboratoriData.find(c => c.id === ric.collaboratore_id);
        return `
            <tr>
                <td>${ric.numero_ricevuta}</td>
                <td>${collab ? collab.nome + ' ' + collab.cognome : 'N/A'}</td>
                <td>${new Date(ric.data_ricevuta).toLocaleDateString('it-IT')}</td>
                <td>${ric.mese_riferimento}/${ric.anno_riferimento}</td>
                <td>€${ric.importo_lordo}</td>
                <td>€${ric.importo_ritenuta}</td>
                <td>€${ric.importo_netto}</td>
                <td><span class="badge badge-${ric.stato_pagamento === 'pagato' ? 'success' : 'warning'}">${ric.stato_pagamento}</span></td>
                <td>
                    <button data-action="view-ricevuta" data-id="${ric.id}" class="btn btn-sm">👁️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function updateStats() {
    document.getElementById('totalCollaboratori').textContent = collaboratoriData.filter(c => c.stato === 'attivo').length;
    document.getElementById('documentiDaFirmare').textContent = documentiData.filter(d => d.stato === 'da_firmare').length;
    
    // Calcola collaboratori vicini al limite
    const limitiVicini = collaboratoriData.filter(c => {
        const utilizzato = c.importo_anno_corrente || 0;
        const limite = c.limite_annuale || 5000;
        return utilizzato > limite * 0.8; // Oltre 80% del limite
    });
    document.getElementById('limitiVicini').textContent = limitiVicini.length;
    
    // Ricevute del mese corrente
    const oggi = new Date();
    const ricevuteMese = ricevuteData.filter(r => {
        return r.mese_riferimento === oggi.getMonth() + 1 && r.anno_riferimento === oggi.getFullYear();
    });
    document.getElementById('ricevuteMese').textContent = ricevuteMese.length;
}

function updateComplianceStatus() {
    // Aggiorna tab compliance
    const complianceList = document.getElementById('complianceList');
    if (!complianceList) return;
    
    const problemi = [];
    
    // Check documenti non firmati e limite €5000
    collaboratoriData.forEach(collab => {
        const firmato = firmeData.some(f => f.collaboratore_id === collab.id);
        if (!firmato) {
            problemi.push({
                tipo: 'documenti',
                messaggio: `${collab.nome} ${collab.cognome} - Documenti non firmati`,
                id: collab.id
            });
        }
        
        if (collab.importo_anno_corrente >= 4000) {
            const perc = Math.round(collab.importo_anno_corrente / 5000 * 100);
            problemi.push({
                tipo: 'limite',
                messaggio: `${collab.nome} ${collab.cognome} - Limite ${perc}% (€${collab.importo_anno_corrente}/€5000)`,
                id: collab.id
            });
        }
    });
    
    if (problemi.length === 0) {
        complianceList.innerHTML = '<p class="success">✅ Tutti i collaboratori sono in regola</p>';
    } else {
        complianceList.innerHTML = problemi.map(p => `
            <div class="alert ${p.tipo === 'limite' ? 'warning' : 'error'}">
                ${p.messaggio}
                <button data-action="view-collaboratore" data-id="${p.id}" class="btn-small">Dettagli</button>
            </div>
        `).join('');
    }
}

// ===== EVENT HANDLERS =====
function attachEventHandlers() {
    // Login form
    const loginForm = document.getElementById('loginFormElement');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            await window.authManager.login(email, password);
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => window.authManager.logout());
    }
    
    // Nuovo Collaboratore button
    const btnNewCollab = document.getElementById('btnNewCollaboratore');
    if (btnNewCollab) {
        btnNewCollab.addEventListener('click', () => openNewCollaboratore());
    }
    
    // Nuovo Documento button
    const btnNewDoc = document.getElementById('btnNewDocument');
    if (btnNewDoc) {
        btnNewDoc.addEventListener('click', () => createDocument());
    }
    
    // Export Ricevute button
    const btnExport = document.getElementById('btnExportRicevute');
    if (btnExport) {
        btnExport.addEventListener('click', () => exportRicevute());
    }
    
    // Modal Close button
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', () => closeModal());
    }
    
    // Event delegation per bottoni dinamici nelle tabelle
    document.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const id = e.target.dataset.id;
        
        if (action && id) {
            switch(action) {
                case 'download-template':
                    downloadRicevutaTemplate(id);
                    break;
                case 'view-collaboratore':
                    viewCollaboratore(id);
                    break;
                case 'view-document':
                    viewDocument(id);
                    break;
                case 'view-ricevuta':
                    viewRicevuta(id);
                    break;
            }
        }
    });
    
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            
            // Update buttons
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Update panels
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(`${tab}-tab`).classList.add('active');
        });
    });
}

// ===== UTILITY FUNCTIONS =====
function showNotification(message, type = 'info') {
    logger.log(`[${type}] ${message}`);
    
    // Usa il nuovo sistema di notifiche toast
    if (window.errorHandler && window.errorHandler.showNotification) {
        window.errorHandler.showNotification(message, type, 5000);
    } else if (window.dialog) {
        // Fallback a dialog personalizzato
        dialog.alert(message);
    } else {
        // Ultimo fallback
        alert(message);
    }
}

function setLoadingState(loading) {
    document.querySelectorAll('.loading').forEach(el => {
        el.style.display = loading ? 'block' : 'none';
    });
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// ===== MOCK DATA =====
function getMockCollaboratori() {
    return [
        {
            id: '1',
            nome: 'Mario',
            cognome: 'Rossi',
            email: 'mario.rossi@email.com',
            codice_fiscale: 'RSSMRA80A01H501Z',
            tipo_collaboratore: 'tutor',
            tipo_contratto: 'occasionale',
            limite_annuale: 5000,
            importo_anno_corrente: 3500,
            stato: 'attivo',
            iban: 'IT60X0542811101000000123456'
        },
        {
            id: '2',
            nome: 'Laura',
            cognome: 'Bianchi',
            email: 'laura.bianchi@email.com',
            codice_fiscale: 'BNCLRA85M41F205X',
            tipo_collaboratore: 'tutor',
            tipo_contratto: 'occasionale',
            limite_annuale: 5000,
            importo_anno_corrente: 4800,
            stato: 'attivo',
            iban: 'IT60X0542811101000000789012'
        }
    ];
}

function getMockDocumenti() {
    return [
        {
            id: '1',
            collaboratore_id: '1',
            tipo_documento: 'dichiarazione_indipendenza',
            titolo: 'Dichiarazione di Indipendenza',
            stato: 'firmato',
            data_firma: '2025-01-01',
            valido_al: '2025-12-31'
        },
        {
            id: '2',
            collaboratore_id: '2',
            tipo_documento: 'dichiarazione_pluricommittenza',
            titolo: 'Dichiarazione Pluricommittenza',
            stato: 'da_firmare',
            data_firma: null,
            valido_al: null
        }
    ];
}

function getMockRicevute() {
    return [
        {
            id: '1',
            collaboratore_id: '1',
            numero_ricevuta: 'RIC-2025-00001',
            data_ricevuta: '2025-01-15',
            mese_riferimento: 1,
            anno_riferimento: 2025,
            importo_lordo: 500,
            importo_ritenuta: 100,
            importo_netto: 400,
            stato_pagamento: 'pagato'
        }
    ];
}

// ===== FORM NUOVO COLLABORATORE =====
function openNewCollaboratore() {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <h2>Nuovo Collaboratore</h2>
        <form id="newCollaboratoreForm">
            <div style="background: #f0f8ff; padding: 10px; margin-bottom: 20px; border-radius: 5px;">
                <strong>Campi obbligatori:</strong> Nome, Email, Tipo Collaboratore, Tipo Contratto<br>
                <small>Il collaboratore potrà completare/correggere tutti i dati prima della firma</small>
            </div>
            
            <div class="form-group">
                <label>Nome *</label>
                <input type="text" name="nome" required>
            </div>
            <div class="form-group">
                <label>Cognome</label>
                <input type="text" name="cognome">
            </div>
            <div class="form-group">
                <label>Email *</label>
                <input type="email" name="email" required>
            </div>
            <div class="form-group">
                <label>Tipo Collaboratore *</label>
                <select name="tipo_collaboratore" required>
                    <option value="">Seleziona...</option>
                    <option value="tutor">Tutor</option>
                    <option value="consulente">Consulente</option>
                    <option value="formatore">Formatore</option>
                    <option value="altro">Altro</option>
                </select>
            </div>
            <div class="form-group">
                <label>Tipo Contratto *</label>
                <select name="tipo_contratto" required onchange="togglePartitaIva(this)">
                    <option value="">Seleziona...</option>
                    <option value="occasionale">Prestazione Occasionale</option>
                    <option value="partita_iva">Partita IVA</option>
                    <option value="misto">Misto</option>
                </select>
            </div>
            
            <hr style="margin: 20px 0;">
            <h3>Dati Opzionali (compilabili dal collaboratore)</h3>
            
            <div class="form-group">
                <label>Codice Fiscale</label>
                <input type="text" name="codice_fiscale" pattern="[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]">
            </div>
            <div class="form-group" id="partitaIvaGroup" style="display:none;">
                <label>Partita IVA</label>
                <input type="text" name="partita_iva" pattern="[0-9]{11}">
            </div>
            <div class="form-group">
                <label>Telefono</label>
                <input type="tel" name="telefono">
            </div>
            <div class="form-group">
                <label>Indirizzo</label>
                <input type="text" name="indirizzo">
            </div>
            <div class="form-group">
                <label>Città</label>
                <input type="text" name="citta">
            </div>
            <div class="form-group">
                <label>CAP</label>
                <input type="text" name="cap" pattern="[0-9]{5}">
            </div>
            <div class="form-group">
                <label>Provincia</label>
                <input type="text" name="provincia" maxlength="2">
            </div>
            <div class="form-group">
                <label>IBAN</label>
                <input type="text" name="iban" pattern="IT[0-9]{2}[A-Z][0-9]{22}">
            </div>
            <div class="form-group">
                <label>Tariffa Oraria</label>
                <input type="number" name="tariffa_oraria" step="0.01">
            </div>
            <div class="form-actions">
                <button type="button" id="btnCloseModal" class="btn btn-secondary">Annulla</button>
                <button type="submit" class="btn btn-primary">Salva e Invia Documenti</button>
            </div>
        </form>
    `;
    
    modal.style.display = 'flex';
    
    // Attach form handler
    document.getElementById('newCollaboratoreForm').addEventListener('submit', handleNewCollaboratore);
    
    // AUTO-FILL PER TESTING - RIMUOVERE IN PRODUZIONE
    setTimeout(() => {
        const testNum = Math.floor(Math.random() * 1000);
        document.querySelector('[name="nome"]').value = 'Test';
        document.querySelector('[name="cognome"]').value = 'Collaboratore_' + testNum;
        document.querySelector('[name="email"]').value = 'amministrazione@uptoten.it';
        document.querySelector('[name="codice_fiscale"]').value = 'TSTCLL80A01H501' + String.fromCharCode(65 + (testNum % 26));
        document.querySelector('[name="tipo_collaboratore"]').value = 'tutor';
        document.querySelector('[name="tipo_contratto"]').value = ['occasionale', 'partita_iva', 'misto'][testNum % 3];
        
        // Se partita IVA, compila anche quello
        const tipoContratto = document.querySelector('[name="tipo_contratto"]').value;
        if (tipoContratto === 'partita_iva' || tipoContratto === 'misto') {
            togglePartitaIva(document.querySelector('[name="tipo_contratto"]'));
            document.querySelector('[name="partita_iva"]').value = '12345678' + String(testNum).padStart(3, '0');
        }
        
        document.querySelector('[name="telefono"]').value = '333123' + String(testNum).padStart(4, '0');
        document.querySelector('[name="indirizzo"]').value = 'Via Test ' + testNum;
        document.querySelector('[name="citta"]').value = 'Roma';
        document.querySelector('[name="cap"]').value = '00100';
        document.querySelector('[name="provincia"]').value = 'RM';
        document.querySelector('[name="iban"]').value = 'IT60X0542811101000000' + String(testNum).padStart(6, '0');
        document.querySelector('[name="data_inizio"]').value = new Date().toISOString().split('T')[0];
        document.querySelector('[name="tariffa_oraria"]').value = '30';
        
        logger.log('🧪 FORM AUTO-COMPILATO PER TESTING');
    }, 100);
}

function togglePartitaIva(select) {
    const pivaGroup = document.getElementById('partitaIvaGroup');
    if (select.value === 'partita_iva' || select.value === 'misto') {
        pivaGroup.style.display = 'block';
    } else {
        pivaGroup.style.display = 'none';
    }
}

async function handleNewCollaboratore(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const collaboratore = Object.fromEntries(formData);
    
    // Pulisci i dati: converti stringhe vuote in null per campi numerici
    if (collaboratore.tariffa_oraria === '') collaboratore.tariffa_oraria = null;
    if (collaboratore.limite_ore_mensili === '') collaboratore.limite_ore_mensili = null;
    if (collaboratore.partita_iva === '') collaboratore.partita_iva = null;
    if (collaboratore.telefono === '') collaboratore.telefono = null;
    if (collaboratore.indirizzo === '') collaboratore.indirizzo = null;
    if (collaboratore.citta === '') collaboratore.citta = null;
    if (collaboratore.cap === '') collaboratore.cap = null;
    if (collaboratore.provincia === '') collaboratore.provincia = null;
    if (collaboratore.iban === '') collaboratore.iban = null;
    
    // Gestisci campi NOT NULL con valori temporanei se non forniti
    // Questi verranno completati dal collaboratore prima della firma
    if (!collaboratore.cognome || collaboratore.cognome === '') {
        collaboratore.cognome = 'DA_COMPLETARE';
    }
    if (!collaboratore.codice_fiscale || collaboratore.codice_fiscale === '') {
        // Genera CF temporaneo univoco basato su timestamp
        const timestamp = Date.now().toString();
        collaboratore.codice_fiscale = 'TEMP' + timestamp.substring(timestamp.length - 12) + 'X';
    }
    
    // Imposta valori default
    collaboratore.stato = 'pending';
    collaboratore.limite_annuale = 5000;
    collaboratore.importo_anno_corrente = 0;
    collaboratore.dati_completati = false; // Flag per indicare dati da completare
    
    try {
        // Salva su Supabase
        if (supabase) {
            const { data, error } = await supabase
                .from('collaboratori')
                .insert([collaboratore])
                .select();
            
            if (error) throw error;
            
            if (data && data[0]) {
                logger.log('Collaboratore creato:', data[0]);
                
                // Genera e invia documenti
                logger.log('Invio documenti per:', data[0].email);
                await generateAndSendDocuments(data[0]);
                
                // Ricarica dati
                await loadDashboardData();
                closeModal();
                showNotification('Collaboratore creato e documenti inviati!', 'success');
            }
        } else {
            // Fallback senza Supabase
            collaboratore.id = Date.now().toString();
            collaboratoriData.push(collaboratore);
            renderCollaboratori();
            closeModal();
            showNotification('Collaboratore creato (modalità demo)', 'warning');
        }
    } catch (error) {
        logger.error('Error:', error);
        showNotification('Errore: ' + error.message, 'error');
    }
}

// ===== GENERAZIONE E INVIO DOCUMENTI =====
async function generateAndSendDocuments(collaboratore) {
    logger.log('Generazione documenti per:', collaboratore.nome, collaboratore.cognome);
    
    // Usa il generatore di template HTML
    const docTemplates = new window.DocumentTemplates();
    const documentiHTML = docTemplates.generateDocumentiCollaboratore(collaboratore);
    
    const documenti = [];
    
    // Prepara i documenti con contenuto HTML personalizzato
    for (const doc of documentiHTML) {
        documenti.push({
            tipo: doc.tipo,
            titolo: doc.titolo,
            contenuto: doc.contenuto, // HTML completo e stilizzato
            obbligatorio: doc.obbligatorio
        });
    }
    
    // Salva documenti su Supabase con contenuto HTML
    if (supabase) {
        for (const doc of documenti) {
            const docRecord = {
                collaboratore_id: collaboratore.id,
                tipo_documento: doc.tipo,
                titolo: doc.titolo,
                contenuto_html: doc.contenuto,
                stato: 'da_firmare',
                numero_documento: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                valido_dal: new Date(),
                valido_al: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            };
            
            logger.log('Tentativo salvataggio documento:', doc.tipo);
            const { data: savedDoc, error } = await supabase
                .from('documenti')
                .insert([docRecord])
                .select()
                .single();
            
            if (error) {
                logger.error('❌ Errore salvataggio documento:', doc.tipo, error);
            } else {
                logger.log('✅ Documento salvato:', savedDoc.id, savedDoc.titolo);
                // Aggiungi l'ID salvato al documento per riferimento
                doc.id = savedDoc.id;
            }
        }
    }
    
    // Invia email con link ai documenti
    await sendDocumentsEmail(collaboratore, documenti);
}

function generateDichiarazioneIndipendenza(collab) {
    return `
        <h2>DICHIARAZIONE DI INDIPENDENZA</h2>
        <p>Il/La sottoscritto/a <strong>${collab.nome} ${collab.cognome}</strong>, 
        C.F. <strong>${collab.codice_fiscale}</strong>, dichiara sotto la propria responsabilità:</p>
        <ul>
            <li>Di svolgere l'attività in modo autonomo e indipendente</li>
            <li>Di non essere soggetto a vincoli di subordinazione</li>
            <li>Di organizzare autonomamente la propria attività lavorativa</li>
            <li>Di non essere inserito nell'organizzazione aziendale del committente</li>
        </ul>
        <p>Data: ${new Date().toLocaleDateString('it-IT')}</p>
    `;
}

function generateDichiarazionePluricommittenza(collab) {
    return `
        <h2>DICHIARAZIONE PLURICOMMITTENZA</h2>
        <p>Il/La sottoscritto/a <strong>${collab.nome} ${collab.cognome}</strong>,
        P.IVA <strong>${collab.partita_iva}</strong>, dichiara:</p>
        <ul>
            <li>Di prestare la propria opera professionale per più committenti</li>
            <li>Che nessun committente rappresenta più del 80% del fatturato annuo</li>
            <li>Di operare con propria organizzazione e a proprio rischio</li>
        </ul>
        <p>Data: ${new Date().toLocaleDateString('it-IT')}</p>
    `;
}

function generatePrivacy(collab) {
    return `
        <h2>INFORMATIVA PRIVACY</h2>
        <p>Ai sensi del Regolamento UE 2016/679 (GDPR), La informiamo che i dati personali 
        di <strong>${collab.nome} ${collab.cognome}</strong> saranno trattati per:</p>
        <ul>
            <li>Gestione del rapporto di collaborazione</li>
            <li>Adempimenti fiscali e contributivi</li>
            <li>Comunicazioni amministrative</li>
        </ul>
        <p><strong>Consenso al trattamento:</strong> Il sottoscritto acconsente al trattamento dei dati.</p>
        <p>Data: ${new Date().toLocaleDateString('it-IT')}</p>
    `;
}

function generateRichiestaAntipedofilia(collab) {
    return `
        <h2>RICHIESTA CERTIFICATO ANTIPEDOFILIA</h2>
        <p>In ottemperanza al D.Lgs. 39/2014, il/la sottoscritto/a <strong>${collab.nome} ${collab.cognome}</strong>
        si impegna a fornire il certificato del casellario giudiziale per attività con minori.</p>
        <p>Data: ${new Date().toLocaleDateString('it-IT')}</p>
    `;
}

async function sendDocumentsEmail(collaboratore, documenti) {
    // Prepara il messaggio con la lista documenti formattata
    const documentiHtml = documenti.map(d => `• ${d.titolo}`).join('<br>');
    // Costruisci il link corretto basato sulla struttura attuale
    // Ottieni l'URL base fino a src/
    let baseUrl = window.location.href;
    // Rimuovi tutto dopo 'src/' incluso eventuali sottocartelle
    const srcIndex = baseUrl.indexOf('/src/');
    if (srcIndex !== -1) {
        baseUrl = baseUrl.substring(0, srcIndex + 5); // +5 per includere '/src/'
    } else {
        // Fallback se non troviamo /src/ nel percorso
        baseUrl = window.location.origin + '/src/';
    }
    const portalLink = `${baseUrl}frontend/firma.html?id=${collaboratore.id}`;
    
    const emailParams = {
        to_email: collaboratore.email,
        to_name: `${collaboratore.nome} ${collaboratore.cognome}`,
        subject: 'UpToTen - Documenti Compliance da Firmare',
        message: `
            <p>Sono stati generati ${documenti.length} documenti di compliance che richiedono la tua firma digitale:</p>
            <ul style="list-style: none; padding-left: 0;">
                ${documenti.map(d => `<li style="margin: 10px 0;">📄 <strong>${d.titolo}</strong></li>`).join('')}
            </ul>
            <p><strong>Importante:</strong> ${collaboratore.tipo_contratto === 'partita_iva' ? 
                'I documenti includono la dichiarazione di pluricommittenza richiesta per collaboratori con Partita IVA.' : 
                'I documenti sono necessari per l\'avvio della collaborazione.'}</p>
        `,
        portal_link: portalLink
    };
    
    // Usa Supabase Edge Function per inviare email
    if (supabase) {
        try {
            const { data, error } = await supabase.functions.invoke('send-email', {
                body: {
                    type: 'documents_ready',
                    to_email: collaboratore.email,
                    to_name: `${collaboratore.nome} ${collaboratore.cognome}`,
                    data: {
                        portal_link: portalLink,
                        documenti: documenti.map(d => `<li>${d.titolo}</li>`).join('')
                    }
                }
            });
            
            if (error) throw error;
            
            logger.log('✅ Email inviata con successo tramite Supabase Edge Function');
            logger.log('Response:', data);
            
            // Log in audit
            await supabase.from('audit_log').insert([{
                utente_admin: currentUser?.email,
                tipo_azione: 'email_sent',
                descrizione: `Email documenti inviata a ${collaboratore.email}`,
                entita_tipo: 'collaboratore',
                entita_id: collaboratore.id,
                valori_nuovi: { documenti: documenti.map(d => d.titolo) }
            }]);
            
            showNotification(`Email inviata a ${collaboratore.email}`, 'success');
        } catch (error) {
            logger.error('❌ Errore invio email:', error);
            
            // Fallback a simulazione se Edge Function non disponibile
            logger.log('📧 Email simulata (Edge Function non disponibile)');
            logger.log('Destinatario:', collaboratore.email);
            logger.log('Documenti:', documenti.map(d => d.titolo));
            logger.log('Link portale:', portalLink);
            
            showNotification('Email simulata - Configura Supabase Edge Function per invio reale', 'warning');
        }
    } else {
        // Nessun Supabase configurato
        logger.log('📧 Email simulata (Supabase non configurato)');
        logger.log('Destinatario:', collaboratore.email);
        logger.log('Documenti:', documenti.map(d => d.titolo));
        logger.log('Link portale:', portalLink);
        
        showNotification('Email simulata - Configura Supabase per invio reale', 'warning');
    }
}

// ===== FUNZIONI STUB (da implementare) =====
function viewCollaboratore(id) {
    logger.log('View collaboratore:', id);
    const collaboratore = collaboratoriData.find(c => c.id === id);
    if (!collaboratore) return;
    
    const dettagli = `
        Nome: ${collaboratore.nome} ${collaboratore.cognome}
        CF: ${collaboratore.codice_fiscale}
        Email: ${collaboratore.email}
        Tipo: ${collaboratore.tipo_contratto}
        Importo Anno: €${collaboratore.importo_anno_corrente}
        Status: ${collaboratore.documenti_firmati ? '✅ Firmati' : '⚠️ Da firmare'}
    `;
    
    if (window.dialogSystem) {
        window.dialogSystem.alert(dettagli, 'Dettagli Collaboratore', 'info');
    } else {
        alert(dettagli);
    }
}

function viewDocument(id) {
    logger.log('View documento:', id);
    const documento = documentiData.find(d => d.id === id);
    if (!documento) return;
    
    const docWindow = window.open('', '_blank');
    docWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${documento.titolo}</title>
            <style>body { font-family: Arial; padding: 20px; }</style>
        </head>
        <body>
            <h2>${documento.titolo}</h2>
            <p>Tipo: ${documento.tipo}</p>
            <hr>
            <div>${documento.contenuto_html || 'Contenuto non disponibile'}</div>
        </body>
        </html>
    `);
}

function viewRicevuta(id) {
    logger.log('View ricevuta:', id);
    const ricevuta = ricevuteData.find(r => r.id === id);
    if (!ricevuta) return;
    
    const collaboratore = collaboratoriData.find(c => c.id === ricevuta.collaboratore_id);
    const dettagli = `
        Ricevuta #${ricevuta.numero_ricevuta}
        Collaboratore: ${collaboratore?.nome} ${collaboratore?.cognome}
        Data: ${new Date(ricevuta.data_ricevuta).toLocaleDateString('it-IT')}
        Importo: €${ricevuta.importo}
        Descrizione: ${ricevuta.descrizione}
    `;
    
    if (window.dialogSystem) {
        window.dialogSystem.alert(dettagli, 'Dettagli Ricevuta', 'info');
    } else {
        alert(dettagli);
    }
}

function exportRicevute() {
    logger.log('Export ricevute');
    // Prepara CSV
    const headers = ['Numero', 'Data', 'Collaboratore', 'CF', 'Importo', 'Descrizione'];
    const rows = ricevuteData.map(r => {
        const collab = collaboratoriData.find(c => c.id === r.collaboratore_id);
        return [
            r.numero_ricevuta,
            new Date(r.data_ricevuta).toLocaleDateString('it-IT'),
            `${collab?.nome} ${collab?.cognome}`,
            collab?.codice_fiscale,
            r.importo,
            r.descrizione
        ];
    });
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ricevute_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification('Ricevute esportate', 'success');
}

function createDocument() {
    logger.log('Create document');
    // Form creazione documento
    const formHTML = `
        <select id="docCollab">
            <option value="">Seleziona collaboratore...</option>
            ${collaboratoriData.map(c => 
                `<option value="${c.id}">${c.nome} ${c.cognome}</option>`
            ).join('')}
        </select>
        <select id="docTipo">
            <option value="modulo_occasionale">Modulo Occasionale</option>
            <option value="contratto_piva">Contratto P.IVA</option>
            <option value="clausola_riservatezza">Clausola Riservatezza</option>
        </select>
        <input type="text" id="docTitolo" placeholder="Titolo documento">
    `;
    
    if (window.dialogSystem) {
        window.dialogSystem.confirm(formHTML, 'Nuovo Documento', {
            onConfirm: async () => {
                const collaboratore_id = document.getElementById('docCollab').value;
                const tipo = document.getElementById('docTipo').value;
                const titolo = document.getElementById('docTitolo').value;
                
                if (collaboratore_id && tipo && titolo) {
                    const { error } = await supabase
                        .from('documenti')
                        .insert([{ collaboratore_id, tipo, titolo }]);
                    
                    if (!error) {
                        showNotification('Documento creato', 'success');
                        loadDashboardData();
                    }
                }
            }
        });
    } else {
        showNotification('Funzione in sviluppo', 'info');
    }
}

// Export funzioni globali per onclick negli HTML
window.openNewCollaboratore = openNewCollaboratore;
window.closeModal = closeModal;
window.togglePartitaIva = togglePartitaIva;
window.viewCollaboratore = viewCollaboratore;
window.viewDocument = viewDocument;
window.viewRicevuta = viewRicevuta;
window.downloadRicevutaTemplate = downloadRicevutaTemplate;
window.exportRicevute = exportRicevute;
window.createDocument = createDocument;

// Export per testing
window.complianceApp = {
    downloadRicevutaTemplate,
    uploadRicevutaFirmata,
    calculateFileHash,
    openNewCollaboratore,
    generateAndSendDocuments
};