// Configurazione Supabase
const SUPABASE_URL = 'https://iacdceuvipmkhtievgpb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhY2RjZXV2aXBta2h0aWV2Z3BiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NzQyMDUsImV4cCI6MjA2NjI1MDIwNX0.5WGtOWSzs5UkD9DkD14K3MlIgMPaVRbTQQp9MK1KC4U';

// Prefisso per tutte le tabelle di questo progetto
// Questo permette di condividere lo stesso database Supabase con altri progetti
const TABLE_PREFIX = 'datifatturazione';

// Nome della tabella nel database
const TABLE_NAME = `${TABLE_PREFIX}_students`;