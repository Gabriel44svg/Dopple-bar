// admin/src/ManagementMisc.jsx
import { useState, useEffect } from 'react';

function ManagementMisc() {
  const [reasons, setReasons] = useState([]);

  const fetchReasons = () => {
    fetch('http://127.0.0.1:8000/api/management/cancellation-reasons')
      .then(res => res.json())
      .then(data => setReasons(Array.isArray(data) ? data : []));
  };

  useEffect(fetchReasons, []);

  const handleReasonSubmit = async (e) => {
    e.preventDefault();
    const newReason = { reason_text: e.target.reason_text.value };
    await fetch('http://127.0.0.1:8000/api/management/cancellation-reasons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReason),
    });
    e.target.reset();
    fetchReasons();
  };

  return (
    <div className="module-container">
      <h2>Gestión General</h2>
      <div className="management-section">
        <h3>Motivos de Cancelación (RF-90)</h3>
        <form onSubmit={handleReasonSubmit} className="add-form">
          <input name="reason_text" placeholder="Nuevo motivo" required />
          <button type="submit">Añadir Motivo</button>
        </form>
        <ul>
          {reasons.map(r => <li key={r.reason_id}>{r.reason_text}</li>)}
        </ul>
      </div>
    </div>
  );
}
export default ManagementMisc;