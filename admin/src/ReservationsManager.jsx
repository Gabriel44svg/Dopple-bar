import { useState, useEffect } from 'react';

function ReservationsManager() {
  const [allReservations, setAllReservations] = useState([]); // Todas las reservaciones
  const [filter, setFilter] = useState('All'); // Filtro general

  // --- FUNCIONES ---
  const fetchReservations = () => {
    fetch('http://127.0.0.1:8000/api/reservations')
      .then(res => res.json())
      .then(data => setAllReservations(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching reservations:", err));
  };

  const handleUpdateStatus = (reservation, newStatus) => {
    fetch(`http://127.0.0.1:8000/api/reservations/${reservation.reservation_id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    .then(res => res.json())
    .then(() => fetchReservations())
    .catch(err => console.error("Error updating status:", err));
  };

  useEffect(fetchReservations, []);

  // --- FILTRADO GENERAL ---
  const filteredReservations = allReservations.filter(res => {
    if (filter === 'All') return true;
    return res.status === filter;
  });

  // --- FILTRADO ESPECÍFICO PARA HOY ---
  const today_str = new Date().toISOString().split('T')[0];
  const todaysReservations = allReservations.filter(res =>
    res.status === 'Confirmada' && res.reservation_datetime.startsWith(today_str)
  );

  return (
    <div className="module-container">
      <div className="module-header">
        <h2>Gestión de Reservaciones</h2>

        {/* --- BOTONES DE FILTRO GENERAL --- */}
        <div className="filter-buttons">
          <button onClick={() => setFilter('All')} className={filter === 'All' ? 'active' : ''}>Todas</button>
          <button onClick={() => setFilter('Pendiente')} className={filter === 'Pendiente' ? 'active' : ''}>Pendientes</button>
          <button onClick={() => setFilter('Confirmada')} className={filter === 'Confirmada' ? 'active' : ''}>Confirmadas</button>
          <button onClick={() => setFilter('Rechazada')} className={filter === 'Rechazada' ? 'active' : ''}>Rechazadas</button>
        </div>
      </div>

      {/* --- DASHBOARD DE HOY --- */}
      <h2>Reservaciones Confirmadas para Hoy</h2>
      <div className="card-container">
        {todaysReservations.map(res => (
          <div key={res.reservation_id} className="card">
            <h3>{res.customer_name}</h3>
            <p><strong>Personas:</strong> {res.num_people}</p>
            <p><strong>Fecha:</strong> {new Date(res.reservation_datetime).toLocaleString('es-MX')}</p>
            <p><strong>Estado:</strong> <span className={`status status-${res.status.toLowerCase()}`}>{res.status}</span></p>
          </div>
        ))}
      </div>

      {/* --- LISTA FILTRADA GENERAL --- */}
      <h2>Reservaciones (Filtro: {filter})</h2>
      <div className="card-container">
        {filteredReservations.map(res => (
          <div key={res.reservation_id} className="card">
            <h3>{res.customer_name}</h3>
            <p><strong>Personas:</strong> {res.num_people}</p>
            <p><strong>Fecha:</strong> {new Date(res.reservation_datetime).toLocaleString('es-MX')}</p>
            <p><strong>Estado:</strong> <span className={`status status-${res.status.toLowerCase()}`}>{res.status}</span></p>

            {res.status === 'Pendiente' && (
              <div className="actions">
                <button onClick={() => handleUpdateStatus(res, 'Confirmada')} className="approve-btn">Aprobar</button>
                <button onClick={() => handleUpdateStatus(res, 'Rechazada')} className="reject-btn">Rechazar</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReservationsManager;
