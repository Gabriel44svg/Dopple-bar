// admin/src/TableManager.jsx
import { useState, useEffect } from 'react';

function TableManager() {
  const [tables, setTables] = useState([]);

  const fetchTables = () => {
    fetch('http://127.0.0.1:8000/api/tables')
      .then(res => res.json())
      .then(data => setTables(Array.isArray(data) ? data : []));
  };

  useEffect(fetchTables, []);

  const handleAddTable = async (e) => {
    e.preventDefault();
    const tableName = e.target.tableName.value;
    await fetch('http://127.0.0.1:8000/api/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table_name: tableName }),
    });
    e.target.reset();
    fetchTables();
  };

  const handleUpdateStatus = async (tableId, newStatus) => {
    await fetch(`http://127.0.0.1:8000/api/tables/${tableId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
    });
    fetchTables();
  };

  return (
    <div className="module-container">
      <h2>Gestión de Mesas</h2>
      <form onSubmit={handleAddTable} className="add-form">
        <input name="tableName" placeholder="Nombre de la nueva mesa" required />
        <button type="submit">Añadir Mesa</button>
      </form>
      <table>
        <thead><tr><th>Mesa</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          {tables.map(table => (
            <tr key={table.table_id}>
              <td>{table.table_name}</td>
              <td>{table.status}</td>
              <td className="actions">
                <button onClick={() => handleUpdateStatus(table.table_id, 'Libre')} className="approve-btn">Liberar</button>
                <button onClick={() => handleUpdateStatus(table.table_id, 'Ocupada')} className="reject-btn">Ocupar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default TableManager;