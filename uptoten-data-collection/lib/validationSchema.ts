import { z } from 'zod'

export const studentFormSchema = z.object({
  email: z.string().email('Email non valida').min(1, 'Email obbligatoria'),
  nome_studente: z.string().min(1, 'Nome studente obbligatorio'),
  cognome_studente: z.string().min(1, 'Cognome studente obbligatorio'),
  scuola: z.string().min(1, 'Nome scuola obbligatorio'),
  indirizzo_scuola: z.string().min(1, 'Indirizzo scolastico obbligatorio'),
  nome_genitore: z.string().min(1, 'Nome genitore obbligatorio'),
  cognome_genitore: z.string().min(1, 'Cognome genitore obbligatorio'),
  telefono: z.string()
    .min(1, 'Numero di telefono obbligatorio')
    .regex(/^\+?[0-9\s-()]+$/, 'Formato numero non valido'),
  nome_fatturazione: z.string().optional(),
  email_fatturazione: z.string().email('Email non valida').or(z.literal('')).optional(),
  codice_fiscale: z.string()
    .min(1, 'Codice fiscale obbligatorio')
    .regex(/^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i, 'Codice fiscale non valido'),
  indirizzo_residenza: z.string().min(1, 'Indirizzo obbligatorio'),
  cap: z.string()
    .min(1, 'CAP obbligatorio')
    .regex(/^[0-9]{5}$/, 'CAP deve essere di 5 cifre'),
  citta: z.string().min(1, 'Città obbligatoria'),
  provincia: z.string()
    .min(1, 'Provincia obbligatoria')
    .length(2, 'Provincia deve essere di 2 lettere')
    .toUpperCase(),
  pacchetto_ore: z.string().optional(),
  provenienza: z.string().optional(),
  consenso_regolamento: z.boolean().refine(val => val === true, {
    message: 'Devi accettare il regolamento'
  }),
  consenso_privacy: z.boolean().refine(val => val === true, {
    message: 'Devi accettare la privacy policy'
  })
})

export type StudentFormData = z.infer<typeof studentFormSchema>

export const indirizziScolastici = [
  'Liceo Classico',
  'Liceo Scientifico',
  'Liceo Scientifico - Scienze Applicate',
  'Liceo Linguistico',
  'Liceo delle Scienze Umane',
  'Liceo Artistico',
  'Liceo Musicale e Coreutico',
  'Istituto Tecnico Economico',
  'Istituto Tecnico Tecnologico',
  'Istituto Professionale',
  'Altro'
]

export const pacchettiOre = [
  '10 ore',
  '20 ore',
  '30 ore',
  '40 ore',
  'Personalizzato'
]

export const provenienza = [
  'Google',
  'Social Media',
  'Passaparola',
  'Scuola',
  'Altro'
]