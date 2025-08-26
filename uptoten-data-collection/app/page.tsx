import StudentForm from '@/components/StudentForm'

export default function Home() {
  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="mb-6">
            <h1 className="text-5xl font-bold text-[#1c2545] mb-2 animate-pulse-slow">
              UPtoTEN
            </h1>
            <p className="text-lg text-gray-600">Registrazione Anagrafica</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-8">
            <p className="text-gray-700 leading-relaxed">
              Compila il modulo sottostante per completare la registrazione. 
              Tutti i campi contrassegnati con <span className="text-red-500">*</span> sono obbligatori.
            </p>
          </div>
        </div>

        {/* Form Component */}
        <StudentForm />

        {/* Footer */}
        <footer className="text-center mt-12 pb-6 text-gray-600">
          <p className="text-sm">
            © {new Date().getFullYear()} UPtoTEN - Tutti i diritti riservati
          </p>
          <p className="text-xs mt-2">
            Per assistenza: info@uptoten.it
          </p>
        </footer>
      </div>
    </main>
  )
}
