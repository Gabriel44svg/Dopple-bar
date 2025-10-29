// admin/src/AttendanceReport.jsx
import { useState, useEffect } from 'react';

function AttendanceReport() {
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    user_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/users').then(res => res.json()).then(data => setUsers(Array.isArray(data) ? data : []));
  }, []);

  const fetchReport = () => {
    const { start_date, end_date, user_id } = filters;
    let url = `http://127.0.0.1:8000/api/attendance/report?start_date=${start_date}&end_date=${end_date}`;
    if (user_id) {
      url += `&user_id=${user_id}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => setRecords(Array.isArray(data) ? data : []));
  };

  const handleFilterChange = (e) => {
    setFilters({...filters, [e.target.name]: e.target.value });
  };

     const handleExport = () => {
    const { start_date, end_date, user_id } = filters;
    let url = `http://127.0.0.1:8000/api/attendance/report/export?start_date=${start_date}&end_date=${end_date}`;
    if (user_id) {
      url += `&user_id=${user_id}`;
    }
    // Abre la URL en una nueva pestaña para iniciar la descarga
    window.open(url, '_blank');
  };


  return (
    <div className="module-container">
      <h2>Reporte de Asistencia</h2>
      <div className="add-form">
        <input type="date" name="start_date" value={filters.start_date} onChange={handleFilterChange} />
        <input type="date" name="end_date" value={filters.end_date} onChange={handleFilterChange} />
        <select name="user_id" value={filters.user_id} onChange={handleFilterChange}>
          <option value="">-- Todos los Empleados --</option>
          {users.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name}</option>)}
        </select>
        <button onClick={fetchReport}>Generar Reporte</button>
      <button onClick={handleExport} className="export-btn">Exportar a CSV</button>
      </div>

      <table>
        <thead><tr><th>Empleado</th><th>Entrada</th><th>Salida</th><th>Horas Trabajadas</th></tr></thead>
        <tbody>
          {records.map((rec) => {
            const clockIn = new Date(rec.clock_in);
            const clockOut = rec.clock_out ? new Date(rec.clock_out) : null;
            let hoursWorked = 'N/A';
            if (clockOut) {
                const diffMs = clockOut - clockIn;
                const diffHours = diffMs / (1000 * 60 * 60);
                hoursWorked = diffHours.toFixed(2);
            }
            return (
                <tr key={rec.record_id}>
                    <td>{rec.full_name}</td>
                    <td>{clockIn.toLocaleString('es-MX')}</td>
                    <td>{clockOut ? clockOut.toLocaleString('es-MX') : 'Aún trabajando'}</td>
                    <td>{hoursWorked}</td>
                </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
export default AttendanceReport;