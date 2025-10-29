// admin/src/TableMap.jsx
import { useState, useEffect } from 'react';

function TableMap({ onTableSelect, onOrderCreated }) { // <-- Acepta la nueva función
  const [tables, setTables] = useState([]);

  const fetchTables = () => {
    fetch('http://127.0.0.1:8000/api/tables')
      .then(res => res.json())
      .then(data => setTables(Array.isArray(data) ? data : []));
  };

  useEffect(fetchTables, []);

  const handleTableClick = async (table) => {
    if (table.status === 'Ocupada') {
      alert(`La ${table.table_name} ya está ocupada.`);
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: table.table_id, user_id: 1 })
      });
      if (!response.ok) throw new Error("No se pudo crear la orden.");

      const newOrder = await response.json();
      fetchTables(); // Recarga las mesas para ver el cambio de color
      onOrderCreated(); // <-- AVISA AL DASHBOARD PARA QUE RECARGUE LAS ÓRDENES ACTIVAS
      onTableSelect(newOrder);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleTakeAwayOrder = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: null, user_id: 1 })
      });
      if (!response.ok) throw new Error("No se pudo crear la orden para llevar.");
      const newOrder = await response.json();
      onOrderCreated(); // <-- AVISA AL DASHBOARD
      onTableSelect(newOrder);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="module-container">
      <h2>Punto de Venta (POS)</h2>
      <div className="tables-container">
        <button onClick={handleTakeAwayOrder} className="table take-away">Para Llevar</button>
        {(tables || []).map(table => (
          <button 
            key={table.table_id} 
            className={`table ${table.status.toLowerCase()}`}
            onClick={() => handleTableClick(table)}
          >
            {table.table_name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TableMap;