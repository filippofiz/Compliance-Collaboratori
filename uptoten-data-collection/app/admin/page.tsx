'use client'

import { useState, useEffect } from 'react'
import { Student } from '@/lib/supabase'
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react'

export default function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const limit = 10

  useEffect(() => {
    fetchStudents()
  }, [currentPage, search])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/students?page=${currentPage}&limit=${limit}&search=${search}`
      )
      const data = await response.json()
      
      if (data.data) {
        setStudents(data.data)
        setTotalPages(data.pagination.totalPages)
        setTotalRecords(data.pagination.total)
      }
    } catch (error) {
      console.error('Errore caricamento studenti:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const headers = [
      'Email', 'Nome Studente', 'Cognome Studente', 'Scuola', 
      'Indirizzo Scuola', 'Nome Genitore', 'Cognome Genitore',
      'Telefono', 'Codice Fiscale', 'Città', 'Provincia', 
      'Data Registrazione'
    ]
    
    const csvContent = [
      headers.join(','),
      ...students.map(student => [
        student.email,
        student.nome_studente,
        student.cognome_studente,
        student.scuola,
        student.indirizzo_scuola,
        student.nome_genitore,
        student.cognome_genitore,
        student.telefono,
        student.codice_fiscale,
        student.citta,
        student.provincia,
        new Date(student.created_at || '').toLocaleDateString('it-IT')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `studenti_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchStudents()
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#1c2545]">Dashboard Amministratore</h1>
              <p className="text-gray-600 mt-2">Gestione registrazioni studenti</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Totale registrazioni</p>
              <p className="text-2xl font-bold text-[#00a666]">{totalRecords}</p>
            </div>
          </div>

          {/* Search and Export */}
          <div className="flex gap-4 items-center">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cerca per email, nome o cognome..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a666] focus:border-transparent"
                />
              </div>
            </form>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[#00a666] text-white rounded-lg hover:bg-[#00c97a] transition-all"
            >
              <Download size={20} />
              Esporta CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a666]"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Studente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scuola
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Genitore
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contatti
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Registrazione
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {student.nome_studente} {student.cognome_studente}
                            </div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">{student.scuola}</div>
                            <div className="text-sm text-gray-500">{student.indirizzo_scuola}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {student.nome_genitore} {student.cognome_genitore}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">{student.telefono}</div>
                            <div className="text-sm text-gray-500">
                              {student.citta}, {student.provincia}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(student.created_at || '').toLocaleDateString('it-IT')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Pagina {currentPage} di {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}