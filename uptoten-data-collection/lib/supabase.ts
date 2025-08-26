import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Student = {
  id?: string
  email: string
  nome_studente: string
  cognome_studente: string
  scuola: string
  indirizzo_scuola: string
  nome_genitore: string
  cognome_genitore: string
  telefono: string
  nome_fatturazione?: string
  email_fatturazione?: string
  codice_fiscale: string
  indirizzo_residenza: string
  cap: string
  citta: string
  provincia: string
  pacchetto_ore?: string
  provenienza?: string
  consenso_regolamento: boolean
  consenso_privacy: boolean
  created_at?: string
  updated_at?: string
}