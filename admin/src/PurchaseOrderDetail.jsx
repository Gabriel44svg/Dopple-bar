import { useState, useEffect } from 'react';

function PurchaseOrderDetail({ poId, onBack }) {
  const [order, setOrder] = useState(null);
  const [allSupplies, setAllSupplies] = useState([]);

  const fetchOrderDetails = () => {
    fetch(`http://127.0.0.1:8000/api/purchase-orders/${poId}`)
      .then(res => res.json())
      .then(data => setOrder(data))
      .catch(err => console.error("Error al cargar detalles de la orden:", err));
  };

  useEffect(() => {
    fetchOrderDetails();
    fetch('http://127.0.0.1:8000/api/inventory/supplies').then(res => res.json()).then(setAllSupplies);
  }, [poId]);

  const handleSubmitItem = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newItem = {
      supply_id: parseInt(formData.get('supply_id')),
      quantity: parseFloat(formData.get('quantity')),
      cost: parseFloat(formData.get('cost')),
    };
    await fetch(`http://127.0.0.1:8000/api/purchase-orders/${poId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
    fetchOrderDetails();
    e.target.reset();
  };

  const handleReceiveOrder = async () => {
    if (!confirm("¿Estás seguro de que quieres marcar esta orden como recibida? Esta acción actualizará el stock.")) {
      return;
    }
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/purchase-orders/${poId}/receive`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'No se pudo recibir la orden.');
      }
      alert('Mercancía recibida y stock actualizado!');
      fetchOrderDetails();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  if (!order) return <p>Cargando orden...</p>;

  return (
    <div className="module-container">
      <button onClick={onBack} className="back-btn" style={{ float: 'right' }}>Volver</button>
      <h2>Detalle de Orden de Compra #{order.po_id}</h2>
      <p><strong>Proveedor:</strong> {order.supplier_name}</p>
      <p><strong>Estado:</strong> {order.status}</p>
      
      {/* --- LÍNEA CORREGIDA --- */}
      {/* Ahora la comparación ignora mayúsculas/minúsculas y espacios en blanco */}
      {order.status && order.status.trim().toLowerCase() === 'pendiente' && (
        <button onClick={handleReceiveOrder} className="submit-btn" style={{ marginTop: '1rem', width: '100%' }}>
          Recibir Mercancía y Actualizar Stock
        </button>
      )}

      {order.status && order.status.trim().toLowerCase() === 'pendiente' && (
        <>
          <h3 style={{ marginTop: '2rem' }}>Añadir Insumo</h3>
          <form onSubmit={handleSubmitItem} className="add-form">
            <select name="supply_id" required>
              <option value="">-- Insumo --</option>
              {allSupplies.map(s => <option key={s.supply_id} value={s.supply_id}>{s.name}</option>)}
            </select>
            <input type="number" name="quantity" placeholder="Cantidad" required />
            <input type="number" step="0.01" name="cost" placeholder="Costo Total" required />
            <button type="submit">Añadir</button>
          </form>
        </>
      )}
      
      <h3 style={{ marginTop: '2rem' }}>Insumos en esta Orden</h3>
      <table>
        <thead>
          <tr>
            <th>Insumo</th>
            <th>Cantidad</th>
            <th>Costo</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map(item => (
            <tr key={item.po_item_id}>
              <td>{item.supply_name}</td>
              <td>{item.quantity}</td>
              <td>${item.cost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default PurchaseOrderDetail;