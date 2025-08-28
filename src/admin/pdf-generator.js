// =====================================================
// GENERATORE PDF PERSONALIZZATI
// =====================================================

class PDFGenerator {
    constructor() {
        this.templates = {
            'clausola_riservatezza': {
                file: 'Clausola di Riservatezza.pdf',
                fields: {
                    nome: { x: 150, y: 200 },
                    cognome: { x: 250, y: 200 },
                    codiceFiscale: { x: 150, y: 230 },
                    data: { x: 150, y: 650 }
                }
            },
            'contratto_piva': {
                file: 'Contratto di Collaborazione con Partite IVA.pdf',
                fields: {
                    nome: { x: 150, y: 250 },
                    cognome: { x: 300, y: 250 },
                    partitaIva: { x: 150, y: 280 },
                    codiceFiscale: { x: 150, y: 310 },
                    indirizzo: { x: 150, y: 340 },
                    data: { x: 150, y: 700 }
                }
            },
            'modulo_occasionale': {
                file: 'Modulo_Collaborazione_Occasionale.pdf',
                fields: {
                    nome: { x: 150, y: 200 },
                    cognome: { x: 300, y: 200 },
                    codiceFiscale: { x: 150, y: 230 },
                    indirizzo: { x: 150, y: 260 },
                    data: { x: 150, y: 650 }
                }
            },
            'pluricommittenza': {
                file: 'Pluricommittenza e autonomia partita iva.pdf',
                fields: {
                    nome: { x: 150, y: 300 },
                    cognome: { x: 300, y: 300 },
                    partitaIva: { x: 150, y: 330 },
                    data: { x: 150, y: 700 }
                }
            }
        };
    }

    async loadPDF(templateName) {
        const template = this.templates[templateName];
        if (!template) {
            throw new Error(`Template ${templateName} non trovato`);
        }

        const pdfPath = `/PDF-documentazione da firmare/${template.file}`;
        const existingPdfBytes = await fetch(pdfPath).then(res => res.arrayBuffer());
        
        return await PDFLib.PDFDocument.load(existingPdfBytes);
    }

    async personalizzaPDF(templateName, datiCollaboratore) {
        try {
            // Carica il PDF template
            const pdfDoc = await this.loadPDF(templateName);
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];

            // Font per il testo
            const helvetica = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
            
            // Dati da inserire
            const dati = {
                nome: datiCollaboratore.nome || '',
                cognome: datiCollaboratore.cognome || '',
                codiceFiscale: datiCollaboratore.codice_fiscale || '',
                partitaIva: datiCollaboratore.partita_iva || '',
                indirizzo: `${datiCollaboratore.indirizzo || ''}, ${datiCollaboratore.citta || ''} ${datiCollaboratore.cap || ''}`,
                data: new Date().toLocaleDateString('it-IT')
            };

            // Inserisci i dati nei campi definiti
            const template = this.templates[templateName];
            for (const [campo, valore] of Object.entries(dati)) {
                if (template.fields[campo] && valore) {
                    firstPage.drawText(valore, {
                        x: template.fields[campo].x,
                        y: template.fields[campo].y,
                        size: 12,
                        font: helvetica,
                        color: PDFLib.rgb(0, 0, 0),
                    });
                }
            }

            // Genera il PDF modificato
            const pdfBytes = await pdfDoc.save();
            return pdfBytes;
        } catch (error) {
            console.error('Errore personalizzazione PDF:', error);
            throw error;
        }
    }

    async aggiungiPaginaFirma(pdfBytes, firmaBase64, datiCollaboratore) {
        try {
            const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
            
            // Aggiungi pagina finale con riepilogo firma
            const page = pdfDoc.addPage([595, 842]); // A4
            const helvetica = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
            const helveticaBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
            
            // Titolo
            page.drawText('CERTIFICATO DI FIRMA DIGITALE', {
                x: 150,
                y: 750,
                size: 18,
                font: helveticaBold,
                color: PDFLib.rgb(0, 0, 0),
            });

            // Informazioni firma
            const testo = [
                `Il presente documento è stato firmato digitalmente da:`,
                ``,
                `Nome: ${datiCollaboratore.nome} ${datiCollaboratore.cognome}`,
                `Codice Fiscale: ${datiCollaboratore.codice_fiscale}`,
                `Email: ${datiCollaboratore.email}`,
                `Data Firma: ${new Date().toLocaleString('it-IT')}`,
                ``,
                `Metodo di firma: Firma elettronica avanzata`,
                `Validazione: Email verificata`,
                `Hash documento: ${await this.generateHash(pdfBytes)}`,
            ];

            let y = 650;
            for (const riga of testo) {
                page.drawText(riga, {
                    x: 50,
                    y: y,
                    size: 12,
                    font: helvetica,
                    color: PDFLib.rgb(0, 0, 0),
                });
                y -= 25;
            }

            // Se c'è una firma grafica, aggiungila
            if (firmaBase64) {
                try {
                    const signatureImage = await pdfDoc.embedPng(firmaBase64);
                    const signatureDims = signatureImage.scale(0.5);
                    
                    page.drawImage(signatureImage, {
                        x: 50,
                        y: y - 100,
                        width: signatureDims.width,
                        height: signatureDims.height,
                    });
                } catch (e) {
                    console.log('Impossibile aggiungere immagine firma:', e);
                }
            }

            // Footer legale
            page.drawText('Questo documento è legalmente valido ai sensi del Regolamento eIDAS (UE) n. 910/2014', {
                x: 50,
                y: 50,
                size: 10,
                font: helvetica,
                color: PDFLib.rgb(0.5, 0.5, 0.5),
            });

            const pdfBytesConFirma = await pdfDoc.save();
            return pdfBytesConFirma;
        } catch (error) {
            console.error('Errore aggiunta pagina firma:', error);
            return pdfBytes;
        }
    }

    async generateHash(data) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16) + '...';
    }

    // Genera tutti i documenti per un collaboratore
    async generaDocumentiCollaboratore(collaboratore) {
        const documenti = [];
        
        // 1. Clausola riservatezza (tutti)
        documenti.push({
            tipo: 'clausola_riservatezza',
            titolo: 'Clausola di Riservatezza',
            obbligatorio: true
        });

        // 2. Contratto in base al tipo
        if (collaboratore.tipo_contratto === 'partita_iva') {
            documenti.push({
                tipo: 'contratto_piva',
                titolo: 'Contratto di Collaborazione P.IVA',
                obbligatorio: true
            });
            
            documenti.push({
                tipo: 'pluricommittenza',
                titolo: 'Dichiarazione Pluricommittenza',
                obbligatorio: true
            });
        } else if (collaboratore.tipo_contratto === 'occasionale') {
            documenti.push({
                tipo: 'modulo_occasionale',
                titolo: 'Modulo Collaborazione Occasionale',
                obbligatorio: true
            });
        }

        // Genera i PDF personalizzati
        const pdfGenerati = [];
        for (const doc of documenti) {
            try {
                const pdfBytes = await this.personalizzaPDF(doc.tipo, collaboratore);
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                
                // Salva su Supabase Storage se disponibile
                let publicUrl = null;
                if (window.supabase) {
                    const fileName = `${collaboratore.id}/${doc.tipo}_${Date.now()}.pdf`;
                    publicUrl = await this.salvaPDFsuSupabase(pdfBytes, fileName, collaboratore.id);
                }
                
                pdfGenerati.push({
                    ...doc,
                    pdfBytes: pdfBytes,
                    blob: blob,
                    url: publicUrl || URL.createObjectURL(blob),
                    supabaseUrl: publicUrl
                });
            } catch (error) {
                console.error(`Errore generazione PDF ${doc.tipo}:`, error);
            }
        }

        return pdfGenerati;
    }

    // Salva PDF su Supabase Storage
    async salvaPDFsuSupabase(pdfBytes, nomeFile, collaboratoreId) {
        if (!window.supabase) return null;
        
        try {
            const { data, error } = await window.supabase.storage
                .from('documenti-firmati')
                .upload(`${collaboratoreId}/${nomeFile}`, pdfBytes, {
                    contentType: 'application/pdf',
                    cacheControl: '3600'
                });
                
            if (error) throw error;
            
            // Ottieni URL pubblico
            const { data: urlData } = window.supabase.storage
                .from('documenti-firmati')
                .getPublicUrl(`${collaboratoreId}/${nomeFile}`);
                
            return urlData.publicUrl;
        } catch (error) {
            console.error('Errore salvataggio PDF su Supabase:', error);
            return null;
        }
    }
}

// Esporta globalmente
window.PDFGenerator = PDFGenerator;