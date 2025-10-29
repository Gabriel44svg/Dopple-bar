import { useState, useEffect } from 'react';

function SupplyHistory({ supply, onBack }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Solo ejecuta el fetch si tenemos un ID de insumo válido
    if (supply && supply.supply_id) {
      setLoading(true);
      fetch(`http://127.0.0.1:8000/api/inventory/supplies/${supply.supply_id}/history`)
        .then(res => {
          if (!res.ok) return []; // Si hay un error, devuelve lista vacía
          return res.json();
        })
        .then(data => {
          setHistory(Array.isArray(data) ? data : []);
          setLoading(false);
        });
    }
  }, [supply]); // El efecto depende del objeto 'supply' completo

  if (!supply) return null; // Si no hay insumo seleccionado, no muestra nada

  return (
    <div className="module-container">
      <button onClick={onBack} className="back-btn" style={{float: 'right'}}>Volver</button>
      <h2>Historial de: {supply.name}</h2>

      {loading ? <p>Cargando historial...</p> : (
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo de Movimiento</th>
              <th>Cantidad</th>
              <th>Realizado Por</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {history.map((move, index) => (
              <tr key={index}>
                <td>{new Date(move.movement_timestamp).toLocaleString('es-MX')}</td>
                <td>{move.movement_type}</td>
                <td style={{color: move.quantity_change > 0 ? 'lightgreen' : 'salmon', fontWeight: 'bold'}}>{move.quantity_change}</td>
                <td>{move.user_name || 'Sistema'}</td>
                <td>{move.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default SupplyHistory;