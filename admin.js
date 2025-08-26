// Variabili globali
let allStudents = [];
let filteredStudents = [];
let currentPage = 1;
const recordsPerPage = 10;

// Inizializzazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
    
    // Auto-refresh ogni 30 secondi
    setInterval(loadData, 30000);
});

// Setup degli event listeners
function setupEventListeners() {
    // Ricerca
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });
    
    // Bottoni azione
    document.getElementById('refreshBtn').addEventListener('click', loadData);
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    
    // Paginazione
    document.getElementById('prevBtn').addEventListener('click', () => changePage(-1));
    document.getElementById('nextBtn').addEventListener('click', () => changePage(1));
    
    // Modal
    document.getElementById('closeModal').addEventListener('click', closeModal);
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('detailModal');
        if (e.target === modal) closeModal();
    });
}

// Caricamento dati da Supabase
async function loadData() {
    showLoading(true);
    
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*&order=created_at.desc`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            }
        );
        
        if (response.ok) {
            allStudents = await response.json();
            filteredStudents = [...allStudents];
            updateStats();
            currentPage = 1;
            renderTable();
        } else {
            console.error('Errore nel caricamento dati');
            showNoData('Errore nel caricamento dei dati');
        }
    } catch (error) {
        console.error('Errore di rete:', error);
        showNoData('Errore di connessione al database');
    } finally {
        showLoading(false);
    }
}

// Aggiornamento statistiche
function updateStats() {
    // Totale registrazioni
    document.getElementById('totalRecords').textContent = allStudents.length;
    
    // Registrazioni oggi
    const today = new Date().toDateString();
    const todayCount = allStudents.filter(s => 
        new Date(s.created_at).toDateString() === today
    ).length;
    document.getElementById('todayRecords').textContent = todayCount;
    
    // Ultima registrazione
    if (allStudents.length > 0) {
        const lastDate = new Date(allStudents[0].created_at);
        const formattedDate = lastDate.toLocaleString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('lastRegistration').textContent = formattedDate;
    } else {
        document.getElementById('lastRegistration').textContent = '-';
    }
}

// Rendering della tabella
function renderTable() {
    const table = document.getElementById('dataTable');
    const tbody = document.getElementById('tableBody');
    const noDataMsg = document.getElementById('noDataMessage');
    const pagination = document.getElementById('pagination');
    
    // Calcola i record da mostrare
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const pageStudents = filteredStudents.slice(startIndex, endIndex);
    
    if (pageStudents.length === 0) {
        table.classList.add('hidden');
        pagination.classList.add('hidden');
        noDataMsg.classList.remove('hidden');
        return;
    }
    
    // Mostra tabella e paginazione
    table.classList.remove('hidden');
    noDataMsg.classList.add('hidden');
    
    // Pulisci tabella
    tbody.innerHTML = '';
    
    // Popola tabella
    pageStudents.forEach(student => {
        const row = document.createElement('tr');
        const date = new Date(student.created_at).toLocaleDateString('it-IT');
        
        row.innerHTML = `
            <td>${date}</td>
            <td>${student.nome_studente} ${student.cognome_studente}</td>
            <td>${student.email}</td>
            <td>${student.scuola}</td>
            <td>${student.nome_genitore} ${student.cognome_genitore}</td>
            <td>${student.telefono}</td>
            <td>${student.citta}, ${student.provincia}</td>
            <td>
                <button class="view-button" onclick="showDetails('${student.id}')">
                    Dettagli
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Aggiorna paginazione
    updatePagination();
}

// Aggiornamento paginazione
function updatePagination() {
    const totalPages = Math.ceil(filteredStudents.length / recordsPerPage);
    const pagination = document.getElementById('pagination');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    
    if (totalPages <= 1) {
        pagination.classList.add('hidden');
    } else {
        pagination.classList.remove('hidden');
        pageInfo.textContent = `Pagina ${currentPage} di ${totalPages}`;
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;
    }
}

// Cambio pagina
function changePage(direction) {
    const totalPages = Math.ceil(filteredStudents.length / recordsPerPage);
    currentPage += direction;
    
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    renderTable();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Ricerca
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredStudents = [...allStudents];
    } else {
        filteredStudents = allStudents.filter(student => {
            return (
                student.nome_studente.toLowerCase().includes(searchTerm) ||
                student.cognome_studente.toLowerCase().includes(searchTerm) ||
                student.email.toLowerCase().includes(searchTerm) ||
                student.scuola.toLowerCase().includes(searchTerm) ||
                student.nome_genitore.toLowerCase().includes(searchTerm) ||
                student.cognome_genitore.toLowerCase().includes(searchTerm) ||
                student.citta.toLowerCase().includes(searchTerm)
            );
        });
    }
    
    currentPage = 1;
    renderTable();
}

// Mostra dettagli studente
function showDetails(studentId) {
    const student = allStudents.find(s => s.id === studentId);
    if (!student) return;
    
    const modal = document.getElementById('detailModal');
    const details = document.getElementById('modalDetails');
    
    const date = new Date(student.created_at).toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    details.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Data Registrazione:</span>
            <span class="detail-value">${date}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${student.email}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Nome Studente:</span>
            <span class="detail-value">${student.nome_studente}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Cognome Studente:</span>
            <span class="detail-value">${student.cognome_studente}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Scuola:</span>
            <span class="detail-value">${student.scuola}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Indirizzo Scolastico:</span>
            <span class="detail-value">${student.indirizzo_scuola}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Nome Genitore:</span>
            <span class="detail-value">${student.nome_genitore}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Cognome Genitore:</span>
            <span class="detail-value">${student.cognome_genitore}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Telefono:</span>
            <span class="detail-value">${student.telefono}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Codice Fiscale:</span>
            <span class="detail-value">${student.codice_fiscale}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Indirizzo:</span>
            <span class="detail-value">${student.indirizzo_residenza}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Città:</span>
            <span class="detail-value">${student.citta} (${student.provincia}) - ${student.cap}</span>
        </div>
        ${student.pacchetto_ore ? `
        <div class="detail-row">
            <span class="detail-label">Pacchetto Ore:</span>
            <span class="detail-value">${student.pacchetto_ore}</span>
        </div>
        ` : ''}
        ${student.provenienza ? `
        <div class="detail-row">
            <span class="detail-label">Provenienza:</span>
            <span class="detail-value">${student.provenienza}</span>
        </div>
        ` : ''}
    `;
    
    modal.classList.remove('hidden');
}

// Chiudi modal
function closeModal() {
    document.getElementById('detailModal').classList.add('hidden');
}

// Export CSV
function exportToCSV() {
    if (filteredStudents.length === 0) {
        alert('Nessun dato da esportare');
        return;
    }
    
    // Headers CSV
    const headers = [
        'Data Registrazione',
        'Email',
        'Nome Studente',
        'Cognome Studente',
        'Scuola',
        'Indirizzo Scuola',
        'Nome Genitore',
        'Cognome Genitore',
        'Telefono',
        'Codice Fiscale',
        'Indirizzo',
        'CAP',
        'Città',
        'Provincia',
        'Pacchetto Ore',
        'Provenienza'
    ];
    
    // Crea CSV
    let csv = headers.join(',') + '\n';
    
    filteredStudents.forEach(student => {
        const row = [
            new Date(student.created_at).toLocaleDateString('it-IT'),
            student.email,
            student.nome_studente,
            student.cognome_studente,
            student.scuola,
            student.indirizzo_scuola,
            student.nome_genitore,
            student.cognome_genitore,
            student.telefono,
            student.codice_fiscale,
            student.indirizzo_residenza,
            student.cap,
            student.citta,
            student.provincia,
            student.pacchetto_ore || '',
            student.provenienza || ''
        ];
        
        // Escape virgole nei valori
        const escapedRow = row.map(value => {
            if (value && value.toString().includes(',')) {
                return `"${value}"`;
            }
            return value;
        });
        
        csv += escapedRow.join(',') + '\n';
    });
    
    // Crea e scarica il file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const filename = `registrazioni_uptoten_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Mostra/nascondi loading
function showLoading(show) {
    const loading = document.getElementById('loadingIndicator');
    const table = document.getElementById('dataTable');
    const noData = document.getElementById('noDataMessage');
    
    if (show) {
        loading.classList.remove('hidden');
        table.classList.add('hidden');
        noData.classList.add('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

// Mostra messaggio no data
function showNoData(message) {
    const noData = document.getElementById('noDataMessage');
    const table = document.getElementById('dataTable');
    const pagination = document.getElementById('pagination');
    
    noData.innerHTML = `<p>${message || 'Nessuna registrazione trovata'}</p>`;
    noData.classList.remove('hidden');
    table.classList.add('hidden');
    pagination.classList.add('hidden');
}