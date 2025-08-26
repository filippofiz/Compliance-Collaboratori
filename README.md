# UPtoTEN - Sistema di Raccolta Dati Fatturazione

Sistema professionale per la raccolta dati anagrafici degli studenti, realizzato in HTML, CSS e JavaScript vanilla (senza framework).

## 🚀 Caratteristiche

- ✅ **Nessuna dipendenza da Node.js o framework**
- ✅ Form di registrazione con validazione in tempo reale
- ✅ Integrazione diretta con Supabase
- ✅ Dashboard amministrativa per visualizzare le registrazioni
- ✅ Esportazione dati in formato CSV
- ✅ Design responsive e moderno
- ✅ Ricerca e paginazione dei risultati
- ✅ Modal per visualizzare dettagli completi

## 📁 Struttura File

```
Dati di fatturazione/
├── index.html          # Form di registrazione principale
├── admin.html          # Dashboard amministratore
├── styles.css          # Stili comuni
├── admin-styles.css    # Stili dashboard
├── app.js             # Logica form registrazione
├── admin.js           # Logica dashboard
├── config.js          # Configurazione Supabase
└── schema.sql         # Schema database
```

## 🔧 Installazione

### 1. Configurazione Database Supabase

1. Accedi al tuo progetto Supabase
2. Vai su SQL Editor
3. Esegui lo script `schema.sql` per creare la tabella

### 2. Configurazione Applicazione

Il file `config.js` contiene già le credenziali Supabase configurate:
- URL: https://iacdceuvipmkhtievgpb.supabase.co
- La tabella usa il prefisso `datifatturazione_` per mantenere separazione con altri progetti

### 3. Utilizzo

**Form di Registrazione:**
- Apri `index.html` nel browser
- Compila tutti i campi obbligatori
- I dati vengono salvati automaticamente su Supabase

**Dashboard Admin:**
- Apri `admin.html` nel browser
- Visualizza tutte le registrazioni
- Cerca studenti per nome, email, città
- Esporta i dati in CSV
- Visualizza dettagli completi di ogni registrazione

## 🎨 Personalizzazione

### Colori principali (in styles.css):
```css
--primary-dark: #1c2545;    /* Blu scuro */
--primary-green: #00a666;   /* Verde principale */
--gradient-start: #f5f7fa;  /* Gradiente sfondo */
--gradient-end: #c3cfe2;
```

### Campi del Form:
- **Dati Studente**: Email, Nome, Cognome, Scuola, Indirizzo scolastico
- **Dati Genitore**: Nome, Cognome, Telefono
- **Dati Fatturazione**: Codice Fiscale, Indirizzo completo
- **Info Aggiuntive**: Pacchetto ore, Come ci avete conosciuto

## 🔒 Sicurezza

- Validazione lato client per tutti i campi
- Codice fiscale validato con regex italiana
- Controllo formato email
- Checkbox obbligatori per consensi privacy

## 📊 Database

La tabella `datifatturazione_students` contiene:
- Tutti i dati anagrafici degli studenti
- Timestamp automatici di creazione e aggiornamento
- Indici per performance ottimali su email, CF e data

## 🌐 Deploy

Essendo file HTML/JS/CSS statici, puoi pubblicarli su:
- Qualsiasi hosting statico (GitHub Pages, Netlify, Vercel)
- Server web Apache/Nginx
- Apertura diretta dei file HTML nel browser

## 📝 Note Importanti

- **Condivisione Database**: Il progetto usa il prefisso `datifatturazione_` per tutte le tabelle
- **Limite Progetti Gratuiti**: Configurato per condividere lo stesso Supabase con altri progetti
- **Auto-refresh**: La dashboard si aggiorna automaticamente ogni 30 secondi

## 🆘 Supporto

Per assistenza: info@uptoten.it

## 📄 Licenza

© 2025 UPtoTEN - Tutti i diritti riservati