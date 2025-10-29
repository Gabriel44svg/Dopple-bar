import { useState, useEffect } from 'react';

function PurchaseOrderManager({ onOrderSelect }) {
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');

  const fetchPurchaseOrders = () => {
    fetch('http://127.0.0.1:8000/api/purchase-orders')
      .then(res => res.json())
      .then(data => setPurchaseOrders(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/suppliers').then(res => res.json()).then(data => setSuppliers(Array.isArray(data) ? data : []));
    fetchPurchaseOrders();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Botón 'Crear Orden' presionado. Ejecutando handleSubmit...");

    const orderData = { supplier_id: parseInt(selectedSupplierId), created_by_user_id: 1 };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'El servidor respondió con un error.');
      }
      alert('¡Orden de compra creada con éxito!');
      setSelectedSupplierId('');
      fetchPurchaseOrders();
    } catch (error) {
      alert(`No se pudo crear la orden: ${error.message}`);
    }
  };

  return (
    <div className="module-container">
      <h2>Órdenes de Compra</h2>
      <form onSubmit={handleSubmit}>
        <div className="add-form">
          <select name="supplier_id" value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)} required>
            <option value="">-- Seleccionar Proveedor --</option>
            {(suppliers || []).map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>)}
          </select>
          <button type="submit" className="submit-btn">Crear Orden de Compra</button>
        </div>
      </form>

      <table style={{marginTop: '2rem'}}>
        <thead><tr><th>ID Orden</th><th>Proveedor</th><th>Fecha</th><th>Estado</th></tr></thead>
        <tbody>
          {(purchaseOrders || []).map((po) => (
            <tr key={po.po_id} onClick={() => onOrderSelect(po.po_id)} style={{cursor: 'pointer'}} className="table-row-hover">
              <td>{po.po_id}</td><td>{po.supplier_name}</td><td>{new Date(po.order_date).toLocaleDateString('es-MX')}</td><td>{po.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default PurchaseOrderManager;