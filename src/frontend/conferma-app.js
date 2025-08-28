// Pagina Conferma Firma - App Logic

let supabase = null;

// ===== FUNZIONE LOGGING AUDIT =====
async function logAudit(tipo_azione, descrizione, dati_aggiuntivi = {}) {
    try {
        if (!supabase) return;
        
        const logEntry = {
            collaboratore_id: dati_aggiuntivi.collaboratore_id || null,
            tipo_azione: tipo_azione,
            descrizione: descrizione,
            entita_tipo: 'firma_digitale',
            entita_id: dati_aggiuntivi.firma_id || null,
            valori_nuovi: {
                ...dati_aggiuntivi,
                timestamp: new Date().toISOString(),
                user_agent: navigator.userAgent,
                url: window.location.href
            }
        };
        
        await supabase.from('audit_log').insert([logEntry]);
    } catch (error) {
        console.error('Errore logging audit:', error);
    }
}

// ===== INIZIALIZZAZIONE =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    
    // Event listener per bottone stampa
    const btnPrint = document.getElementById('btnPrint');
    if (btnPrint) {
        btnPrint.addEventListener('click', () => window.print());
    }
});

async function initializeApp() {
    try {
        // Ottieni codice di verifica dall'URL
        const urlParams = new URLSearchParams(window.location.search);
        const verificationCode = urlParams.get('code');
        
        if (!verificationCode) {
            showError('Link di verifica non valido. Codice mancante.');
            return;
        }
        
        // Inizializza Supabase
        if (window.ComplianceConfig && window.ComplianceConfig.supabase) {
            const config = window.ComplianceConfig.supabase;
            supabase = window.supabase.createClient(config.url, config.anonKey);
            console.log('Supabase inizializzato per verifica');
        } else {
            showError('Configurazione mancante.');
            return;
        }
        
        // Verifica il codice
        await verificaFirma(verificationCode);
        
    } catch (error) {
        console.error('Errore inizializzazione:', error);
        showError('Errore durante la verifica: ' + error.message);
    }
}

// ===== VERIFICA FIRMA =====
async function verificaFirma(code) {
    try {
        console.log('Verifica codice:', code);
        
        // Cerca tutte le firme con lo stesso token (non il codice che può variare)
        // Prima cerchiamo la firma con il codice specifico per trovare il token
        const { data: primaFirma, error: firstError } = await supabase
            .from('firme_digitali')
            .select('token_verifica')
            .eq('codice_verifica', code)
            .single();
            
        if (firstError || !primaFirma) {
            showError('Codice di verifica non valido.');
            return;
        }
        
        // Ora cerca tutte le firme con lo stesso token
        const { data: firme, error: searchError } = await supabase
            .from('firme_digitali')
            .select(`
                *,
                documento:documenti(*),
                collaboratore:collaboratori(*)
            `)
            .eq('token_verifica', primaFirma.token_verifica)
            .eq('valida', false); // Solo firme non ancora validate
        
        if (searchError) {
            console.error('Errore ricerca firma:', searchError);
            throw new Error('Errore durante la ricerca della firma');
        }
        
        if (!firme || firme.length === 0) {
            showError('Codice di verifica non valido o già utilizzato.');
            return;
        }
        
        // Prendi tutte le firme con questo codice (multiple per più documenti)
        console.log(`Trovate ${firme.length} firme da validare`);
        
        // Valida tutte le firme
        const updatePromises = firme.map(firma => 
            supabase
                .from('firme_digitali')
                .update({
                    valida: true,
                    email_verificata: true,
                    data_verifica: new Date().toISOString()
                })
                .eq('id', firma.id)
        );
        
        const results = await Promise.all(updatePromises);
        
        // Controlla errori
        const errors = results.filter(r => r.error);
        if (errors.length > 0) {
            console.error('Errori durante validazione:', errors);
            throw new Error('Errore durante la validazione delle firme');
        }
        
        // Aggiorna stato documenti a "firmato"
        const docUpdatePromises = firme.map(firma =>
            supabase
                .from('documenti')
                .update({
                    stato: 'firmato',
                    firmato: true
                })
                .eq('id', firma.documento_id)
        );
        
        await Promise.all(docUpdatePromises);
        
        // Log audit per ogni documento
        const auditPromises = firme.map(firma =>
            supabase
                .from('audit_log')
                .insert([{
                    collaboratore_id: firma.collaboratore_id,
                    tipo_azione: 'email_verified',
                    descrizione: `Email verificata e firma confermata per: ${firma.documento?.titolo || 'Documento'}`,
                    entita_tipo: 'firma_digitale',
                    entita_id: firma.id,
                    valori_nuovi: {
                        firma_validata: true,
                        data_verifica: new Date().toISOString()
                    }
                }])
        );
        
        await Promise.all(auditPromises);
        
        // NON inviare altra email, mostra direttamente i download
        // await inviaEmailDocumentiFirmati(firme);
        
        // Mostra successo con link download
        showSuccess(firme);
        
    } catch (error) {
        console.error('Errore verifica firma:', error);
        showError('Errore durante la verifica: ' + error.message);
    }
}

// ===== INVIO EMAIL CON DOCUMENTI FIRMATI =====
async function inviaEmailDocumentiFirmati(firme) {
    try {
        if (!firme || firme.length === 0) return;
        
        const collaboratore = firme[0].collaboratore;
        
        // Genera lista documenti firmati in HTML
        const documentiHtml = firme.map(f => 
            `<li>${f.documento.titolo} - Firmato il ${new Date(f.created_at).toLocaleString('it-IT')}</li>`
        ).join('');
        
        // Prepara dati per email con Edge Function
        const emailData = {
            type: 'documents_completed',
            to_email: collaboratore.email,
            to_name: `${collaboratore.nome} ${collaboratore.cognome}`,
            data: {
                documenti_list: documentiHtml,
                verification_codes: firme.map(f => f.codice_verifica).join(', '),
                download_link: (() => {
                    let baseUrl = window.location.href;
                    const srcIndex = baseUrl.indexOf('/src/');
                    if (srcIndex !== -1) {
                        baseUrl = baseUrl.substring(0, srcIndex + 5);
                    } else {
                        baseUrl = window.location.origin + '/src/';
                    }
                    return `${baseUrl}frontend/download-documenti.html?token=${firme[0].token_verifica}`;
                })(),
                hash_codes: firme.map(f => f.hash_firma.substring(0, 8) + '...').join(', ')
            }
        };
        
        // Invia tramite Supabase Edge Function
        if (supabase) {
            const { data, error } = await supabase.functions.invoke('send-email', {
                body: emailData
            });
            
            if (error) {
                console.error('Errore invio email documenti firmati:', error);
            } else {
                console.log('Email documenti firmati inviata con successo');
            }
        }
        
    } catch (error) {
        console.error('Errore invio email finale:', error);
    }
}

// ===== UI FUNCTIONS =====
function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}

function showSuccess(firme) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('success').style.display = 'block';
    
    // Info collaboratore (uguale per tutte le firme)
    const collaboratore = firme[0].collaboratore;
    const nomeCompleto = `${collaboratore.nome} ${collaboratore.cognome}`;
    const token = firme[0].token_verifica;
    
    // Messaggi di successo
    document.getElementById('successMessage').innerHTML = `
        <p>La tua firma digitale è stata confermata con successo!</p>
        <p><strong>${nomeCompleto}</strong></p>
        <p>Email verificata: <strong>${firme[0].email_firmatario || collaboratore.email}</strong></p>
    `;
    
    // Dettagli documenti firmati con bottoni download
    const documentiHtml = firme.map(firma => `
        <div class="document-confirmed">
            <h4>📄 ${firma.documento.titolo}</h4>
            <p>Firmato il: ${new Date(firma.created_at).toLocaleString('it-IT')}</p>
            <p>Codice verifica: ${firma.codice_verifica}</p>
            <p>Hash firma: <code style="font-size: 10px; word-break: break-all;">${firma.hash_firma}</code></p>
        </div>
    `).join('');
    
    // Link per scaricare i documenti - passiamo anche l'ID collaboratore
    // Costruisci path corretto basato sulla struttura /src/frontend/
    let baseUrl = window.location.href;
    const srcIndex = baseUrl.indexOf('/src/');
    if (srcIndex !== -1) {
        baseUrl = baseUrl.substring(0, srcIndex + 5); // +5 per includere '/src/'
    } else {
        baseUrl = window.location.origin + '/src/';
    }
    const downloadLink = `${baseUrl}frontend/download-documenti.html?token=${token}&cid=${collaboratore.id}`;
    
    document.getElementById('successDetails').innerHTML = `
        <h3>Documenti Firmati (${firme.length}):</h3>
        ${documentiHtml}
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${downloadLink}" class="btn btn-primary" style="
                display: inline-block;
                background: linear-gradient(135deg, #1890ff, #40a9ff);
                color: white;
                padding: 15px 40px;
                text-decoration: none;
                border-radius: 50px;
                font-size: 18px;
                font-weight: bold;
                box-shadow: 0 4px 15px rgba(24, 144, 255, 0.3);
            ">
                📥 Scarica i Documenti Firmati
            </a>
        </div>
        
        <div class="legal-notice">
            <p><strong>⚖️ Nota Legale:</strong></p>
            <p>Questa firma digitale è legalmente vincolante secondo il Regolamento eIDAS (UE) n. 910/2014.</p>
            <p>L'hash SHA-256 garantisce l'integrità e l'autenticità del documento.</p>
            <p><strong>Conserva i documenti scaricati per i tuoi archivi.</strong></p>
        </div>
    `;
}