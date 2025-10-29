// admin/src/ActiveOrders.jsx
import React from 'react';

function ActiveOrders({ openOrders, onOrderSelect }) {
  // Filtramos las órdenes en dos grupos
  const pendingOrders = openOrders.filter(o => o.status === 'Abierta');
  const readyToPayOrders = openOrders.filter(o => o.status === 'Lista');

  return (
    <div className="module-container">
      {/* Lista de órdenes listas para cobrar */}
      <h2>Órdenes Listas para Cobrar</h2>
      <div className="card-container">
        {readyToPayOrders.map(order => (
          <div key={order.order_id} className="card ready-card" onClick={() => onOrderSelect(order)} style={{cursor: 'pointer'}}>
            <h3>{order.table_name}</h3>
            <p>{order.order_folio}</p>
            <p style={{fontWeight: 'bold'}}>¡Lista para cobrar!</p>
          </div>
        ))}
      </div>

      {/* Lista de órdenes en preparación */}
      <h2 style={{marginTop: '2rem'}}>Órdenes en Preparación</h2>
      <div className="card-container">
        {pendingOrders.map(order => (
          <div key={order.order_id} className="card" onClick={() => onOrderSelect(order)} style={{cursor: 'pointer'}}>
            <h3>{order.table_name}</h3>
            <p>{order.order_folio}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
export default ActiveOrders;