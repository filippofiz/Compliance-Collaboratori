// =====================================================
// TEMPLATE DOCUMENTI HTML PERSONALIZZATI
// =====================================================

class DocumentTemplates {
    constructor() {
        this.baseStyles = `
            <style>
                .doc-container {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 40px;
                    background: white;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                    border-radius: 10px;
                }
                .doc-header {
                    border-bottom: 3px solid #667eea;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .doc-title {
                    color: #2d3748;
                    font-size: 28px;
                    font-weight: bold;
                    margin: 0;
                }
                .doc-subtitle {
                    color: #718096;
                    font-size: 14px;
                    margin-top: 10px;
                }
                .doc-section {
                    margin: 30px 0;
                }
                .doc-section h3 {
                    color: #4a5568;
                    font-size: 20px;
                    margin-bottom: 15px;
                    border-left: 4px solid #667eea;
                    padding-left: 15px;
                }
                .doc-content {
                    line-height: 1.8;
                    color: #2d3748;
                    text-align: justify;
                }
                .highlight {
                    background: linear-gradient(120deg, #f6d365 0%, #fda085 100%);
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-weight: 600;
                }
                .info-box {
                    background: #f7fafc;
                    border-left: 4px solid #4299e1;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 5px;
                }
                .warning-box {
                    background: #fffbeb;
                    border-left: 4px solid #f6ad55;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 5px;
                }
                .signature-box {
                    border: 2px dashed #cbd5e0;
                    padding: 30px;
                    margin: 40px 0;
                    text-align: center;
                    background: #f8fafc;
                    border-radius: 10px;
                }
                .doc-footer {
                    margin-top: 50px;
                    padding-top: 20px;
                    border-top: 2px solid #e2e8f0;
                    text-align: center;
                    color: #718096;
                    font-size: 12px;
                }
                ul.doc-list {
                    list-style: none;
                    padding: 0;
                }
                ul.doc-list li {
                    padding: 10px 0 10px 30px;
                    position: relative;
                }
                ul.doc-list li:before {
                    content: "✓";
                    position: absolute;
                    left: 0;
                    color: #48bb78;
                    font-weight: bold;
                    font-size: 18px;
                }
                .collaborator-data {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                }
                .collaborator-data strong {
                    display: inline-block;
                    min-width: 150px;
                }
                @media print {
                    .doc-container {
                        box-shadow: none;
                        padding: 20px;
                    }
                }
            </style>
        `;
    }

    // Template Clausola di Riservatezza
    generateClausolaRiservatezza(collaboratore) {
        return `
            ${this.baseStyles}
            <div class="doc-container">
                <div class="doc-header">
                    <h1 class="doc-title">📜 Clausola di Riservatezza e Confidenzialità</h1>
                    <p class="doc-subtitle">Documento n. CLR-${Date.now()} • Data: ${new Date().toLocaleDateString('it-IT')}</p>
                </div>

                <div class="collaborator-data">
                    <p><strong>Collaboratore:</strong> ${collaboratore.nome} ${collaboratore.cognome}</p>
                    <p><strong>Codice Fiscale:</strong> ${collaboratore.codice_fiscale}</p>
                    <p><strong>Email:</strong> ${collaboratore.email}</p>
                    <p><strong>Tipo Contratto:</strong> ${collaboratore.tipo_contratto?.replace(/_/g, ' ').toUpperCase()}</p>
                </div>

                <div class="doc-section">
                    <h3>Premessa</h3>
                    <div class="doc-content">
                        <p>Il/La sottoscritto/a <span class="highlight">${collaboratore.nome} ${collaboratore.cognome}</span>, 
                        in qualità di collaboratore della società <strong>UpToTen SRL</strong>, con la presente si impegna a:</p>
                    </div>
                </div>

                <div class="doc-section">
                    <h3>Obblighi di Riservatezza</h3>
                    <div class="doc-content">
                        <ul class="doc-list">
                            <li>Mantenere la massima riservatezza su tutte le informazioni confidenziali ricevute durante la collaborazione</li>
                            <li>Non divulgare a terzi dati sensibili, strategie aziendali, informazioni sui clienti</li>
                            <li>Utilizzare le informazioni riservate esclusivamente per gli scopi della collaborazione</li>
                            <li>Proteggere i dati con la stessa cura utilizzata per le proprie informazioni confidenziali</li>
                            <li>Restituire o distruggere tutti i documenti confidenziali al termine della collaborazione</li>
                        </ul>
                    </div>
                </div>

                <div class="info-box">
                    <strong>📌 Durata dell'obbligo:</strong> Gli obblighi di riservatezza permangono per 5 anni dalla cessazione del rapporto di collaborazione.
                </div>

                <div class="doc-section">
                    <h3>Informazioni Confidenziali</h3>
                    <div class="doc-content">
                        <p>Si considerano confidenziali tutte le informazioni relative a:</p>
                        <ul class="doc-list">
                            <li>Dati personali di studenti e famiglie</li>
                            <li>Metodologie didattiche proprietarie</li>
                            <li>Strategie commerciali e di marketing</li>
                            <li>Informazioni finanziarie e contrattuali</li>
                            <li>Software e piattaforme tecnologiche interne</li>
                        </ul>
                    </div>
                </div>

                <div class="warning-box">
                    <strong>⚠️ Violazione della clausola:</strong> La violazione degli obblighi di riservatezza comporta il risarcimento 
                    di tutti i danni diretti e indiretti causati a UpToTen SRL, oltre alle conseguenze penali previste dalla legge.
                </div>

                <div class="doc-section">
                    <h3>GDPR e Privacy</h3>
                    <div class="doc-content">
                        <p>Il collaboratore si impegna inoltre al rispetto del Regolamento UE 2016/679 (GDPR) per quanto riguarda 
                        il trattamento dei dati personali di cui verrà a conoscenza durante la collaborazione.</p>
                    </div>
                </div>

                <div class="signature-box">
                    <p><strong>Il Collaboratore</strong></p>
                    <p style="font-style: italic; color: #718096;">Documento firmato digitalmente</p>
                    <p><strong>${collaboratore.nome} ${collaboratore.cognome}</strong></p>
                    <p>Data: ${new Date().toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <div class="doc-footer">
                    <p>UpToTen SRL - Via Example, 123 - 00100 Roma - P.IVA 12345678901</p>
                    <p>Documento generato elettronicamente e firmato digitalmente ai sensi del D.Lgs. 82/2005</p>
                </div>
            </div>
        `;
    }

    // Template Contratto Partita IVA
    generateContrattoPartitaIva(collaboratore) {
        return `
            ${this.baseStyles}
            <div class="doc-container">
                <div class="doc-header">
                    <h1 class="doc-title">📄 Contratto di Collaborazione Professionale</h1>
                    <p class="doc-subtitle">Prestazione d'Opera con Partita IVA • Contratto n. PIVA-${Date.now()}</p>
                </div>

                <div class="collaborator-data">
                    <p><strong>Professionista:</strong> ${collaboratore.nome} ${collaboratore.cognome}</p>
                    <p><strong>Partita IVA:</strong> ${collaboratore.partita_iva || 'Da comunicare'}</p>
                    <p><strong>Codice Fiscale:</strong> ${collaboratore.codice_fiscale}</p>
                    <p><strong>Indirizzo:</strong> ${collaboratore.indirizzo || 'N/D'}, ${collaboratore.citta || ''} ${collaboratore.cap || ''}</p>
                </div>

                <div class="doc-section">
                    <h3>Art. 1 - Oggetto del Contratto</h3>
                    <div class="doc-content">
                        <p>UpToTen SRL affida al/alla Professionista <span class="highlight">${collaboratore.nome} ${collaboratore.cognome}</span> 
                        l'incarico di svolgere attività di <strong>${collaboratore.tipo_collaboratore || 'collaborazione professionale'}</strong> 
                        nell'ambito dei servizi educativi e formativi dell'azienda.</p>
                    </div>
                </div>

                <div class="doc-section">
                    <h3>Art. 2 - Natura del Rapporto</h3>
                    <div class="doc-content">
                        <p>La prestazione viene svolta in regime di:</p>
                        <ul class="doc-list">
                            <li>Totale autonomia organizzativa e operativa</li>
                            <li>Assenza di vincoli di subordinazione</li>
                            <li>Libertà di determinare modalità e tempi di esecuzione</li>
                            <li>Utilizzo di mezzi propri per lo svolgimento dell'attività</li>
                        </ul>
                    </div>
                </div>

                <div class="info-box">
                    <strong>💰 Compenso:</strong> Il compenso sarà determinato in base alle ore effettivamente prestate, 
                    con tariffa oraria di €${collaboratore.tariffa_oraria || '30'}/ora + IVA
                </div>

                <div class="doc-section">
                    <h3>Art. 3 - Durata</h3>
                    <div class="doc-content">
                        <p>Il presente contratto ha decorrenza dal <strong>${new Date(collaboratore.data_inizio || Date.now()).toLocaleDateString('it-IT')}</strong> 
                        e avrà durata fino al completamento delle attività concordate, salvo rinnovo.</p>
                    </div>
                </div>

                <div class="doc-section">
                    <h3>Art. 4 - Obblighi del Professionista</h3>
                    <div class="doc-content">
                        <p>Il Professionista si impegna a:</p>
                        <ul class="doc-list">
                            <li>Svolgere l'incarico con diligenza professionale</li>
                            <li>Emettere regolare fattura elettronica</li>
                            <li>Mantenere la riservatezza sulle informazioni acquisite</li>
                            <li>Rispettare le normative sulla sicurezza</li>
                            <li>Fornire certificazione di regolarità contributiva</li>
                        </ul>
                    </div>
                </div>

                <div class="warning-box">
                    <strong>📊 Regime Fiscale:</strong> Il Professionista opera in regime di Partita IVA e provvederà autonomamente 
                    agli adempimenti fiscali e contributivi previsti dalla normativa vigente.
                </div>

                <div class="signature-box">
                    <p><strong>Il Professionista</strong></p>
                    <p style="font-style: italic; color: #718096;">Documento firmato digitalmente</p>
                    <p><strong>${collaboratore.nome} ${collaboratore.cognome}</strong></p>
                    <p>P.IVA: ${collaboratore.partita_iva || 'Da comunicare'}</p>
                </div>

                <div class="doc-footer">
                    <p>UpToTen SRL - Contratto redatto ai sensi dell'art. 2222 e ss. del Codice Civile</p>
                    <p>Documento con firma digitale legalmente valida</p>
                </div>
            </div>
        `;
    }

    // Template Collaborazione Occasionale
    generateModuloOccasionale(collaboratore) {
        const limiteAnnuale = collaboratore.limite_annuale || 5000;
        const importoUtilizzato = collaboratore.importo_anno_corrente || 0;
        const percentualeUtilizzo = ((importoUtilizzato / limiteAnnuale) * 100).toFixed(1);

        return `
            ${this.baseStyles}
            <div class="doc-container">
                <div class="doc-header">
                    <h1 class="doc-title">📋 Modulo Collaborazione Occasionale</h1>
                    <p class="doc-subtitle">Prestazione Occasionale Art. 2222 C.C. • Modulo n. OCC-${Date.now()}</p>
                </div>

                <div class="collaborator-data">
                    <p><strong>Collaboratore:</strong> ${collaboratore.nome} ${collaboratore.cognome}</p>
                    <p><strong>Codice Fiscale:</strong> ${collaboratore.codice_fiscale}</p>
                    <p><strong>Nato a:</strong> ${collaboratore.luogo_nascita || 'Da comunicare'}</p>
                    <p><strong>Residente:</strong> ${collaboratore.indirizzo || 'N/D'}, ${collaboratore.citta || ''}</p>
                </div>

                <div class="warning-box">
                    <strong>⚠️ Limite Annuale:</strong> €${limiteAnnuale.toLocaleString('it-IT')}<br>
                    <strong>Utilizzato:</strong> €${importoUtilizzato.toLocaleString('it-IT')} (${percentualeUtilizzo}%)<br>
                    <strong>Disponibile:</strong> €${(limiteAnnuale - importoUtilizzato).toLocaleString('it-IT')}
                </div>

                <div class="doc-section">
                    <h3>Dichiarazione del Collaboratore</h3>
                    <div class="doc-content">
                        <p>Il/La sottoscritto/a <span class="highlight">${collaboratore.nome} ${collaboratore.cognome}</span> dichiara:</p>
                        <ul class="doc-list">
                            <li>Di svolgere la prestazione in modo del tutto occasionale</li>
                            <li>Di non superare i 30 giorni nell'anno solare con lo stesso committente</li>
                            <li>Di non superare il limite di €5.000 lordi annui con lo stesso committente</li>
                            <li>Di non avere partita IVA per l'attività oggetto della prestazione</li>
                            <li>Di essere consapevole delle sanzioni previste per false dichiarazioni</li>
                        </ul>
                    </div>
                </div>

                <div class="doc-section">
                    <h3>Trattamento Fiscale</h3>
                    <div class="doc-content">
                        <p>Il compenso sarà soggetto a:</p>
                        <ul class="doc-list">
                            <li>Ritenuta d'acconto del 20% (art. 25-ter DPR 600/73)</li>
                            <li>Contribuzione separata INPS se dovuta</li>
                            <li>Esenzione IVA (prestazione occasionale)</li>
                            <li>Comunicazione all'Agenzia delle Entrate tramite Certificazione Unica</li>
                        </ul>
                    </div>
                </div>

                <div class="info-box">
                    <strong>📅 Periodo di Prestazione:</strong> Dal ${new Date(collaboratore.data_inizio || Date.now()).toLocaleDateString('it-IT')} 
                    per prestazioni occasionali secondo necessità.
                </div>

                <div class="doc-section">
                    <h3>Modalità di Pagamento</h3>
                    <div class="doc-content">
                        <p>Il pagamento avverrà tramite bonifico bancario su:</p>
                        <p><strong>IBAN:</strong> ${collaboratore.iban || 'Da comunicare'}</p>
                        <p>entro 30 giorni dalla presentazione della ricevuta per prestazione occasionale.</p>
                    </div>
                </div>

                <div class="signature-box">
                    <p><strong>Il Collaboratore Occasionale</strong></p>
                    <p style="font-style: italic; color: #718096;">Documento firmato digitalmente</p>
                    <p><strong>${collaboratore.nome} ${collaboratore.cognome}</strong></p>
                    <p>C.F.: ${collaboratore.codice_fiscale}</p>
                </div>

                <div class="doc-footer">
                    <p>UpToTen SRL - Modulo redatto ai sensi della normativa vigente sulle prestazioni occasionali</p>
                    <p>Documento firmato digitalmente con valore legale</p>
                </div>
            </div>
        `;
    }

    // Template Dichiarazione Pluricommittenza
    generatePluricommittenza(collaboratore) {
        return `
            ${this.baseStyles}
            <div class="doc-container">
                <div class="doc-header">
                    <h1 class="doc-title">🏢 Dichiarazione di Pluricommittenza</h1>
                    <p class="doc-subtitle">Autonomia Professionale • Dichiarazione n. PLU-${Date.now()}</p>
                </div>

                <div class="collaborator-data">
                    <p><strong>Professionista:</strong> ${collaboratore.nome} ${collaboratore.cognome}</p>
                    <p><strong>Partita IVA:</strong> ${collaboratore.partita_iva || 'Da comunicare'}</p>
                    <p><strong>Codice Fiscale:</strong> ${collaboratore.codice_fiscale}</p>
                </div>

                <div class="doc-section">
                    <h3>Dichiarazione Sostitutiva di Atto Notorio</h3>
                    <div class="doc-content">
                        <p>Ai sensi del DPR 445/2000, il/la sottoscritto/a <span class="highlight">${collaboratore.nome} ${collaboratore.cognome}</span>, 
                        consapevole delle sanzioni penali previste per false dichiarazioni, dichiara:</p>
                    </div>
                </div>

                <div class="doc-section">
                    <h3>Pluralità di Committenti</h3>
                    <div class="doc-content">
                        <ul class="doc-list">
                            <li>Di prestare la propria opera professionale per più committenti</li>
                            <li>Che UpToTen SRL non rappresenta più dell'80% del proprio fatturato annuo</li>
                            <li>Di operare con propria organizzazione e a proprio rischio d'impresa</li>
                            <li>Di non essere inserito nell'organizzazione aziendale del committente</li>
                            <li>Di determinare autonomamente tempi e modalità della prestazione</li>
                        </ul>
                    </div>
                </div>

                <div class="info-box">
                    <strong>⚖️ Normativa di Riferimento:</strong> La presente dichiarazione è resa ai fini della corretta 
                    qualificazione del rapporto di lavoro autonomo ai sensi della L. 81/2017 e successive modifiche.
                </div>

                <div class="doc-section">
                    <h3>Elenco Indicativo Altri Committenti</h3>
                    <div class="doc-content">
                        <p>Il professionista dichiara di collaborare attualmente o nell'anno in corso con:</p>
                        <ul class="doc-list">
                            <li>Altri istituti di formazione e/o educativi</li>
                            <li>Aziende private per consulenza e formazione</li>
                            <li>Enti pubblici per progetti specifici</li>
                            <li>Attività libero-professionale diretta</li>
                        </ul>
                        <p style="font-size: 12px; color: #718096; margin-top: 10px;">
                            *L'elenco è indicativo e non esaustivo, nel rispetto della privacy commerciale del professionista
                        </p>
                    </div>
                </div>

                <div class="warning-box">
                    <strong>📌 Importante:</strong> Il professionista si impegna a comunicare tempestivamente qualsiasi variazione 
                    che possa influire sulla natura del rapporto di collaborazione autonoma.
                </div>

                <div class="doc-section">
                    <h3>Validità della Dichiarazione</h3>
                    <div class="doc-content">
                        <p>La presente dichiarazione ha validità per l'anno solare ${new Date().getFullYear()} e si intende 
                        automaticamente rinnovata salvo comunicazione contraria.</p>
                    </div>
                </div>

                <div class="signature-box">
                    <p><strong>Il Professionista</strong></p>
                    <p style="font-style: italic; color: #718096;">Documento firmato digitalmente</p>
                    <p><strong>${collaboratore.nome} ${collaboratore.cognome}</strong></p>
                    <p>P.IVA: ${collaboratore.partita_iva || 'Da comunicare'}</p>
                    <p>Data: ${new Date().toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <div class="doc-footer">
                    <p>Dichiarazione resa ai sensi del DPR 445/2000</p>
                    <p>Documento con firma digitale avente valore legale</p>
                </div>
            </div>
        `;
    }

    // Genera tutti i documenti per un collaboratore
    generateDocumentiCollaboratore(collaboratore) {
        const documenti = [];

        // 1. Privacy (sempre)
        documenti.push({
            tipo: 'privacy',
            titolo: 'Clausola di Riservatezza e Privacy',
            contenuto: this.generateClausolaRiservatezza(collaboratore),
            obbligatorio: true
        });

        // 2. Dichiarazione indipendenza (sempre)
        documenti.push({
            tipo: 'dichiarazione_indipendenza',
            titolo: 'Dichiarazione di Indipendenza',
            contenuto: this.generateModuloOccasionale(collaboratore), // Usa il modulo occasionale per ora
            obbligatorio: true
        });

        // 3. Documenti specifici per tipo contratto
        if (collaboratore.tipo_contratto === 'partita_iva') {
            documenti.push({
                tipo: 'contratto',
                titolo: 'Contratto di Collaborazione P.IVA',
                contenuto: this.generateContrattoPartitaIva(collaboratore),
                obbligatorio: true
            });
            
            documenti.push({
                tipo: 'dichiarazione_pluricommittenza',
                titolo: 'Dichiarazione Pluricommittenza',
                contenuto: this.generatePluricommittenza(collaboratore),
                obbligatorio: true
            });
        } else if (collaboratore.tipo_contratto === 'occasionale') {
            documenti.push({
                tipo: 'contratto',
                titolo: 'Contratto Collaborazione Occasionale',
                contenuto: this.generateModuloOccasionale(collaboratore),
                obbligatorio: true
            });
        } else if (collaboratore.tipo_contratto === 'misto') {
            // Per contratto misto, genera entrambi
            documenti.push({
                tipo: 'contratto',
                titolo: 'Contratto Misto Occasionale/P.IVA',
                contenuto: this.generateContrattoPartitaIva(collaboratore),
                obbligatorio: true
            });
            
            documenti.push({
                tipo: 'dichiarazione_pluricommittenza',
                titolo: 'Dichiarazione Pluricommittenza',
                contenuto: this.generatePluricommittenza(collaboratore),
                obbligatorio: true
            });
        }

        return documenti;
    }
}

// Esporta globalmente
window.DocumentTemplates = DocumentTemplates;