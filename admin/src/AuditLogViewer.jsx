// admin/src/AuditLogViewer.jsx
import { useState, useEffect } from 'react';

function AuditLogViewer() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/audit-logs')
      .then(res => res.json())
      .then(data => setLogs(Array.isArray(data) ? data : []));
  }, []);

  return (
    <div className="module-container">
      <h2>Bitácora de Auditoría</h2>
      <table>
        <thead>
          <tr>
            <th>Fecha y Hora</th>
            <th>Usuario</th>
            <th>Acción</th>
            <th>Detalles</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.log_id}>
              <td>{new Date(log.log_timestamp).toLocaleString('es-MX')}</td>
              <td>{log.user_name || 'Sistema'}</td>
              <td>{log.action}</td>
              <td><pre>{JSON.stringify(JSON.parse(log.details || '{}'), null, 2)}</pre></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default AuditLogViewer;