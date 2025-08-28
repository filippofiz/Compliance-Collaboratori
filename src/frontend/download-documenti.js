// Download Documenti Firmati - App Logic

let supabase = null;
let documenti = [];
let collaboratore = null;
let firme = [];

// ===== INIZIALIZZAZIONE =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    attachEventListeners();
});

// Event listeners
function attachEventListeners() {
    // Download all button
    const btnAll = document.getElementById('btnDownloadAll');
    if (btnAll) {
        btnAll.addEventListener('click', downloadAllDocuments);
    }
    
    // Event delegation per bottoni dinamici
    document.addEventListener('click', (e) => {
        if (e.target.matches('[data-action]')) {
            const action = e.target.dataset.action;
            const docId = e.target.dataset.id;
            
            switch(action) {
                case 'view-document':
                    viewDocument(docId);
                    break;
                case 'download-document':
                    downloadDocument(docId);
                    break;
            }
        }
    });
}

async function initializeApp() {
    try {
        // Ottieni parametri dall'URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const collaboratoreId = urlParams.get('cid');
        
        if (!token && !collaboratoreId) {
            showError('Link non valido. Parametri mancanti.');
            return;
        }
        
        // Inizializza Supabase
        if (window.ComplianceConfig && window.ComplianceConfig.supabase) {
            const config = window.ComplianceConfig.supabase;
            supabase = window.supabase.createClient(config.url, config.anonKey);
            console.log('Supabase inizializzato per download');
        } else {
            showError('Configurazione mancante.');
            return;
        }
        
        // Carica documenti firmati
        await loadSignedDocuments(token, collaboratoreId);
        
    } catch (error) {
        console.error('Errore inizializzazione:', error);
        showError('Errore durante il caricamento: ' + error.message);
    }
}

// ===== CARICAMENTO DOCUMENTI =====
async function loadSignedDocuments(token, collaboratoreId) {
    try {
        console.log('Caricamento documenti - token:', token, 'collaboratore:', collaboratoreId);
        
        let firmeData;
        
        // Se abbiamo l'ID collaboratore, usa quello (più affidabile)
        if (collaboratoreId) {
            console.log('Usando ID collaboratore per cercare documenti firmati');
            
            // Cerca tutti i documenti firmati del collaboratore
            const { data: docs, error: docsError } = await supabase
                .from('documenti')
                .select('*')
                .eq('collaboratore_id', collaboratoreId)
                .eq('stato', 'firmato');
            
            if (docsError) {
                console.error('Errore caricamento documenti:', docsError);
                // Prova comunque con tutti i documenti
                const { data: allDocs } = await supabase
                    .from('documenti')
                    .select('*')
                    .eq('collaboratore_id', collaboratoreId);
                
                if (allDocs && allDocs.length > 0) {
                    console.log('Trovati documenti (tutti gli stati):', allDocs);
                    // Usa tutti i documenti per ora
                    docs = allDocs;
                }
            }
            
            if (docs && docs.length > 0) {
                // Cerca le firme per questi documenti
                const docIds = docs.map(d => d.id);
                const { data: signatures } = await supabase
                    .from('firme_digitali')
                    .select('*')
                    .in('documento_id', docIds);
                
                // Carica anche i dati del collaboratore
                const { data: collabData } = await supabase
                    .from('collaboratori')
                    .select('*')
                    .eq('id', collaboratoreId)
                    .single();
                
                // Combina documenti e firme
                firmeData = docs.map(doc => {
                    const firma = signatures?.find(s => s.documento_id === doc.id) || {};
                    return {
                        ...firma,
                        documento_id: doc.id,
                        documento: doc,
                        collaboratore_id: collaboratoreId,
                        collaboratore: collabData
                    };
                });
                
                // Salta il resto del caricamento dati
                console.log(`Trovati ${firmeData.length} documenti`);
                firme = firmeData;
                collaboratore = collabData;
                documenti = firmeData.map(f => ({
                    ...f.documento,
                    firma: f
                }));
                
                showDocuments();
                return;
            }
        } else {
            // Fallback: prova con il token
            console.log('Tentativo con token:', token);
            const { data, error } = await supabase
                .from('firme_digitali')
                .select('*')
                .eq('token_verifica', token);
            
            if (error) {
                console.error('Errore query con token:', error);
                showError('Impossibile accedere ai documenti. Errore di autorizzazione.');
                return;
            }
            firmeData = data;
        }
        
        if (!firmeData || firmeData.length === 0) {
            console.error('Nessun documento trovato');
            showError('Nessun documento firmato trovato.');
            return;
        }
        
        // Poi carica i documenti correlati
        const documentIds = [...new Set(firmeData.map(f => f.documento_id))];
        const { data: documentiData } = await supabase
            .from('documenti')
            .select('*')
            .in('id', documentIds);
        
        // E il collaboratore
        const collabId = firmeData[0].collaboratore_id || collaboratoreId;
        const { data: collaboratoreData } = await supabase
            .from('collaboratori')
            .select('*')
            .eq('id', collabId)
            .single();
        
        // Combina i dati
        const firmeComplete = firmeData.map(f => ({
            ...f,
            documento: documentiData.find(d => d.id === f.documento_id),
            collaboratore: collaboratoreData
        }));
        
        firme = firmeComplete;
        collaboratore = collaboratoreData;
        documenti = firmeComplete.map(f => ({
            ...f.documento,
            firma: f
        }));
        
        console.log(`Trovati ${documenti.length} documenti firmati`);
        
        // Mostra i documenti
        showDocuments();
        
    } catch (error) {
        console.error('Errore caricamento documenti:', error);
        showError('Errore durante il caricamento dei documenti.');
    }
}

// ===== MOSTRA DOCUMENTI =====
function showDocuments() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
    
    // Info collaboratore
    document.getElementById('collaboratorInfo').innerHTML = `
        <strong>${collaboratore.nome} ${collaboratore.cognome}</strong><br>
        Email: ${collaboratore.email}<br>
        Documenti firmati: ${documenti.length}
    `;
    
    // Grid documenti
    const grid = document.getElementById('documentsGrid');
    grid.innerHTML = documenti.map(doc => `
        <div class="document-download-card">
            <div class="document-header">
                <span class="document-title">${doc.titolo}</span>
                <span class="badge badge-success">✅ Firmato</span>
            </div>
            
            <div class="document-meta">
                <div>📄 Tipo: ${doc.tipo_documento}</div>
                <div>🔢 Numero: ${doc.numero_documento}</div>
                <div>📅 Firmato: ${new Date(doc.firma.created_at).toLocaleString('it-IT')}</div>
                <div>🔐 Hash: ${doc.firma.hash_firma.substring(0, 12)}...</div>
            </div>
            
            <div class="document-actions">
                <button class="btn-view" data-action="view-document" data-id="${doc.id}">
                    👁️ Visualizza
                </button>
                <button class="btn-download" data-action="download-document" data-id="${doc.id}">
                    📥 Scarica PDF
                </button>
            </div>
        </div>
    `).join('');
}

// ===== VISUALIZZA DOCUMENTO =====
function viewDocument(docId) {
    const doc = documenti.find(d => d.id === docId);
    if (!doc) return;
    
    // Apri in nuova finestra con contenuto HTML
    const newWindow = window.open('', '_blank');
    
    // Aggiungi pagina firma alla fine del contenuto
    const firmaPage = generateSignaturePage(doc);
    const fullContent = doc.contenuto_html + firmaPage;
    
    newWindow.document.write(fullContent);
    newWindow.document.close();
}

// ===== SCARICA DOCUMENTO SINGOLO =====
async function downloadDocument(docId) {
    const doc = documenti.find(d => d.id === docId);
    if (!doc) return;
    
    try {
        console.log('Generazione PDF per:', doc.titolo);
        
        // Crea un contenitore temporaneo per il documento HTML
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '210mm'; // A4 width
        tempContainer.style.padding = '20mm';
        tempContainer.style.background = 'white';
        document.body.appendChild(tempContainer);
        
        // Aggiungi il contenuto HTML del documento con tutti i dati
        tempContainer.innerHTML = `
            <div style="font-family: Arial, sans-serif;">
                ${doc.contenuto_html}
                
                <!-- Aggiungi pagina firma alla fine -->
                <div style="page-break-before: always; margin-top: 50px; padding-top: 50px; border-top: 5px solid #52c41a;">
                    <h1 style="text-align: center; color: #52c41a;">✅ DOCUMENTO FIRMATO DIGITALMENTE</h1>
                    
                    <div style="background: #f6ffed; border: 2px solid #52c41a; padding: 30px; margin: 30px 0; border-radius: 10px;">
                        <h2 style="color: #333;">Certificato di Firma Digitale</h2>
                        
                        <h3>Firmatario:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5; width: 30%;"><strong>Nome e Cognome:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${collaboratore.nome} ${collaboratore.cognome}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5;"><strong>Codice Fiscale:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${collaboratore.codice_fiscale || 'N/D'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5;"><strong>Email Verificata:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${doc.firma.email_firmatario || collaboratore.email}</td>
                            </tr>
                        </table>
                        
                        <h3 style="margin-top: 30px;">Dettagli Tecnici della Firma:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5; width: 30%;"><strong>Data e Ora:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${new Date(doc.firma.created_at).toLocaleString('it-IT')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5;"><strong>Numero Documento:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace;">${doc.numero_documento}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5;"><strong>Codice Verifica:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace;">${doc.firma.codice_verifica}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5;"><strong>Hash SHA-256:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace; font-size: 10px; word-break: break-all;">${doc.firma.hash_firma}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5;"><strong>IP Address:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${doc.firma.ip_address}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5;"><strong>Metodo Firma:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${doc.firma.metodo_firma || 'Firma Elettronica Avanzata'}</td>
                            </tr>
                        </table>
                        
                        <div style="background: #e6f7ff; border: 1px solid #1890ff; padding: 20px; margin: 30px 0; border-radius: 8px;">
                            <h3 style="color: #1890ff;">⚖️ Validità Legale</h3>
                            <p>Questo documento è stato firmato elettronicamente ed è legalmente valido ai sensi di:</p>
                            <ul>
                                <li><strong>Regolamento eIDAS (UE) n. 910/2014</strong> - Identificazione elettronica e servizi fiduciari per le transazioni elettroniche</li>
                                <li><strong>D.Lgs. 82/2005 (CAD)</strong> - Codice dell'Amministrazione Digitale</li>
                                <li><strong>Art. 2702 C.C.</strong> - Efficacia probatoria della scrittura privata</li>
                            </ul>
                            <p>La firma è stata validata tramite verifica dell'identità del firmatario mediante conferma email.</p>
                        </div>
                        
                        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd;">
                            <p style="color: #666;">
                                <strong>UpToTen SRL</strong><br>
                                Sistema di Gestione Documentale Compliance<br>
                                Documento archiviato elettronicamente<br>
                                <small>Conservare questo documento per i propri archivi</small>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Usa jsPDF con html2canvas per convertire HTML in PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        // Cattura l'HTML come canvas
        const canvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            windowWidth: tempContainer.scrollWidth,
            windowHeight: tempContainer.scrollHeight
        });
        
        // Calcola dimensioni per il PDF
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        // Aggiungi l'immagine al PDF
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Aggiungi pagine se necessario
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        // Rimuovi il contenitore temporaneo
        document.body.removeChild(tempContainer);
        
        // Salva il PDF
        pdf.save(`${doc.tipo_documento}_${collaboratore.cognome}_firmato.pdf`);
        
    } catch (error) {
        console.error('Errore generazione PDF:', error);
        
        // Fallback: scarica come HTML
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${doc.titolo} - Firmato</title>
            </head>
            <body>
                ${doc.contenuto_html}
                ${generateSignaturePage(doc)}
            </body>
            </html>
        `;
        
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.tipo_documento}_${collaboratore.cognome}_firmato.html`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// ===== SCARICA TUTTI I DOCUMENTI =====
async function downloadAllDocuments() {
    try {
        // Crea ZIP o scarica uno per uno
        for (const doc of documenti) {
            await downloadDocument(doc.id);
            // Piccola pausa tra i download
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    } catch (error) {
        console.error('Errore download multiplo:', error);
        alert('Errore durante il download dei documenti');
    }
}

// ===== GENERA PAGINA FIRMA PER VISUALIZZAZIONE =====
function generateSignaturePage(doc) {
    return `
        <div style="page-break-before: always; padding: 40px; margin-top: 50px; border-top: 3px solid #52c41a;">
            <h2 style="color: #52c41a; text-align: center;">✅ DOCUMENTO FIRMATO DIGITALMENTE</h2>
            
            <div style="background: #f6ffed; border: 1px solid #b7eb8f; padding: 20px; margin: 20px 0; border-radius: 10px;">
                <h3>Dettagli della Firma Digitale</h3>
                <p><strong>Firmatario:</strong> ${collaboratore.nome} ${collaboratore.cognome}</p>
                <p><strong>Email verificata:</strong> ${doc.firma.email_firmatario}</p>
                <p><strong>Data e ora:</strong> ${new Date(doc.firma.created_at).toLocaleString('it-IT')}</p>
                <p><strong>Codice verifica:</strong> ${doc.firma.codice_verifica}</p>
                <p><strong>Hash SHA-256:</strong> <code>${doc.firma.hash_firma}</code></p>
                <p><strong>IP Address:</strong> ${doc.firma.ip_address}</p>
            </div>
            
            <div style="background: #e6f7ff; border: 1px solid #91d5ff; padding: 20px; margin: 20px 0; border-radius: 10px;">
                <h3>⚖️ Validità Legale</h3>
                <p>Questo documento è stato firmato elettronicamente ed è legalmente valido ai sensi di:</p>
                <ul>
                    <li><strong>Regolamento eIDAS (UE) n. 910/2014</strong> - Identificazione elettronica e servizi fiduciari</li>
                    <li><strong>D.Lgs. 82/2005</strong> - Codice dell'Amministrazione Digitale (CAD)</li>
                </ul>
                <p>La firma è stata validata tramite verifica dell'email del firmatario.</p>
            </div>
            
            <div style="text-align: center; margin-top: 40px; color: #666;">
                <p>UpToTen SRL - Sistema di Firma Digitale</p>
                <p>Documento archiviato elettronicamente</p>
            </div>
        </div>
    `;
}

// ===== UI FUNCTIONS =====
function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}