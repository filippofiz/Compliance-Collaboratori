'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  studentFormSchema, 
  StudentFormData,
  indirizziScolastici,
  pacchettiOre,
  provenienza
} from '@/lib/validationSchema'
import { supabase } from '@/lib/supabase'
import { Loader2, Check, AlertCircle } from 'lucide-react'

export default function StudentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      consenso_regolamento: false,
      consenso_privacy: false
    }
  })

  const onSubmit = async (data: StudentFormData) => {
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const { error } = await supabase
        .from('students')
        .insert([data])

      if (error) throw error

      setSubmitStatus('success')
      reset()
      
      setTimeout(() => {
        setSubmitStatus('idle')
      }, 5000)
    } catch (error) {
      console.error('Errore invio form:', error)
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Errore durante l\'invio del form')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-8">
      {/* Alert Messages */}
      {submitStatus === 'success' && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg animate-fade-in">
          <div className="flex items-center">
            <Check className="text-green-600 mr-3" size={20} />
            <p className="text-green-700">Registrazione completata con successo!</p>
          </div>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg animate-fade-in">
          <div className="flex items-center">
            <AlertCircle className="text-red-600 mr-3" size={20} />
            <p className="text-red-700">{errorMessage || 'Si è verificato un errore'}</p>
          </div>
        </div>
      )}

      {/* Sezione Dati Studente */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-[#1c2545] mb-6">Dati Studente</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              {...register('email')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00a666] focus:border-transparent transition-all ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="email@esempio.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Studente <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('nome_studente')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00a666] focus:border-transparent transition-all ${
                errors.nome_studente ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.nome_studente && (
              <p className="text-red-500 text-xs mt-1">{errors.nome_studente.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cognome Studente <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('cognome_studente')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00a666] focus:border-transparent transition-all ${
                errors.cognome_studente ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.cognome_studente && (
              <p className="text-red-500 text-xs mt-1">{errors.cognome_studente.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scuola <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('scuola')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00a666] focus:border-transparent transition-all ${
                errors.scuola ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nome della scuola"
            />
            {errors.scuola && (
              <p className="text-red-500 text-xs mt-1">{errors.scuola.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Indirizzo Scolastico <span className="text-red-500">*</span>
            </label>
            <select
              {...register('indirizzo_scuola')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00a666] focus:border-transparent transition-all ${
                errors.indirizzo_scuola ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Seleziona indirizzo</option>
              {indirizziScolastici.map((indirizzo) => (
                <option key={indirizzo} value={indirizzo}>
                  {indirizzo}
                </option>
              ))}
            </select>
            {errors.indirizzo_scuola && (
              <p className="text-red-500 text-xs mt-1">{errors.indirizzo_scuola.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Sezione Dati Genitore */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-[#1c2545] mb-6">Dati Genitore di Riferimento</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Genitore <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('nome_genitore')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00a666] focus:border-transparent transition-all ${
                errors.nome_genitore ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.nome_genitore && (
              <p className="text-red-500 text-xs mt-1">{errors.nome_genitore.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cognome Genitore <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('cognome_genitore')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00a666] focus:border-transparent transition-all ${
                errors.cognome_genitore ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.cognome_genitore && (
              <p className="text-red-500 text-xs mt-1">{errors.cognome_genitore.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numero di Telefono <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              {...register('telefono')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00a666] focus:border-transparent transition-all ${
                errors.telefono ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="+39 333 1234567"
            />
            {errors.telefono && (
              <p className="text-red-500 text-xs mt-1">{errors.telefono.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Sezione Dati Fatturazione */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-[#1c2545] mb-6">Dati di Fatturazione</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome/Cognome per Fatturazione
            </label>
            <input
              type="text"
              {...register('nome_fatturazione')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a666] focus:border-transparent transition-all"
              placeholder="Se diverso dal genitore"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email per Fatturazione
            </label>
            <input
              type="email"
              {...register('email_fatturazione')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00a666] focus:border-transparent transition-all ${
                errors.email_fatturazione ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Se diversa dalla principale"
            />
            {errors.email_fatturazione && (
              <p className="text-red-500 text-xs mt-1">{errors.email_fatturazione.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Codice Fiscale <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('codice_fiscale')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00a666] focus:border-transparent transition-all uppercase ${
                errors.codice_fiscale ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="RSSMRA85T10A562S"
              maxLength={16}
            />
            {errors.codice_fiscale && (
              <p className="text-red-500 text-xs mt-1">{errors.codice_fiscale.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Indirizzo di Residenza <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('indirizzo_residenza')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00a666] focus:border-transparent transition-all ${
                errors.indirizzo_residenza ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Via/Piazza Nome, numero"
            />
            {errors.indirizzo_residenza && (
              <p className="text-red-500 text-xs mt-1">{errors.indirizzo_residenza.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CAP <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('cap')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00a666] focus:border-transparent transition-all ${
                errors.cap ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="00100"
              maxLength={5}
            />
            {errors.cap && (
              <p className="text-red-500 text-xs mt-1">{errors.cap.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Città <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('citta')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00a666] focus:border-transparent transition-all ${
                errors.citta ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.citta && (
              <p className="text-red-500 text-xs mt-1">{errors.citta.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provincia <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('provincia')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00a666] focus:border-transparent transition-all uppercase ${
                errors.provincia ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="RM"
              maxLength={2}
            />
            {errors.provincia && (
              <p className="text-red-500 text-xs mt-1">{errors.provincia.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Sezione Informazioni Aggiuntive */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-[#1c2545] mb-6">Informazioni Aggiuntive</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pacchetto Ore
            </label>
            <select
              {...register('pacchetto_ore')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a666] focus:border-transparent transition-all"
            >
              <option value="">Seleziona pacchetto</option>
              {pacchettiOre.map((pacchetto) => (
                <option key={pacchetto} value={pacchetto}>
                  {pacchetto}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Come ci avete conosciuto?
            </label>
            <select
              {...register('provenienza')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a666] focus:border-transparent transition-all"
            >
              <option value="">Seleziona</option>
              {provenienza.map((fonte) => (
                <option key={fonte} value={fonte}>
                  {fonte}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sezione Consensi */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-[#1c2545] mb-6">Consensi e Accettazione</h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <input
              type="checkbox"
              {...register('consenso_regolamento')}
              className="mt-1 mr-3 h-4 w-4 text-[#00a666] focus:ring-[#00a666] border-gray-300 rounded"
            />
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">
                Accetto il regolamento di fatturazione <span className="text-red-500">*</span>
              </label>
              {errors.consenso_regolamento && (
                <p className="text-red-500 text-xs mt-1">{errors.consenso_regolamento.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              {...register('consenso_privacy')}
              className="mt-1 mr-3 h-4 w-4 text-[#00a666] focus:ring-[#00a666] border-gray-300 rounded"
            />
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">
                Accetto la privacy policy <span className="text-red-500">*</span>
              </label>
              {errors.consenso_privacy && (
                <p className="text-red-500 text-xs mt-1">{errors.consenso_privacy.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 bg-gradient-to-r from-[#00a666] to-[#00c97a] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin mr-2" size={20} />
              Invio in corso...
            </>
          ) : (
            'Invia Registrazione'
          )}
        </button>
      </div>
    </form>
  )
}