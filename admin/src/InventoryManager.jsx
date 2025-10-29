// admin/src/InventoryManager.jsx
import { useState, useEffect } from 'react';

function InventoryManager() {
  const [supplies, setSupplies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [mode, setMode] = useState('add');

  // --- CARGA DE INSUMOS ---
  const fetchSupplies = () => {
    fetch('http://127.0.0.1:8000/api/inventory/supplies')
      .then(res => res.json())
      .then(data => setSupplies(Array.isArray(data) ? data : []));
  };

  // --- CARGA DE CATEGORÍAS ---
  const fetchCategories = () => {
    fetch('http://127.0.0.1:8000/api/menu-categories')
      .then(res => res.json())
      .then(data => setCategories(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    fetchSupplies();
    fetchCategories();
  }, []);

  // --- AÑADIR NUEVO INSUMO ---
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newSupply = {
      ...Object.fromEntries(formData.entries()),
      current_stock: parseFloat(formData.get('current_stock')),
      stock_threshold: parseFloat(formData.get('stock_threshold')),
      price: formData.get('price') ? parseFloat(formData.get('price')) : null,
      category_id: formData.get('category_id') ? parseInt(formData.get('category_id')) : null,
      is_sellable: formData.get('is_sellable') === 'true' ? true : false,
    };

    await fetch('http://127.0.0.1:8000/api/inventory/supplies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSupply),
    });

    e.target.reset();
    fetchSupplies();
  };

  // --- AJUSTAR STOCK EXISTENTE ---
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const supply_id = formData.get('supply_id');
    const new_stock_quantity = parseFloat(formData.get('new_stock_quantity'));
    const reason = formData.get('reason');

    await fetch(`http://127.0.0.1:8000/api/inventory/supplies/${supply_id}/adjust`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_stock_quantity, reason, user_id: 1 }), // user_id de ejemplo
    });

    alert("Stock ajustado con éxito.");
    e.target.reset();
    fetchSupplies();
  };

  // --- ELIMINAR INSUMO ---
  const handleDelete = async (supplyId) => {
    if (!confirm("¿Seguro que quieres eliminar este insumo? Esta acción no se puede deshacer.")) return;
    await fetch(`http://127.0.0.1:8000/api/inventory/supplies/${supplyId}`, { method: 'DELETE' });
    fetchSupplies();
  };

  return (
    <div className="module-container">
      <h2>Gestión de Inventario y Productos</h2>

      {/* BOTONES PARA MODO */}
      <div className="filter-buttons" style={{ marginBottom: '1rem' }}>
        <button onClick={() => setMode('add')} className={mode === 'add' ? 'active' : ''}>Añadir Nuevo</button>
        <button onClick={() => setMode('adjust')} className={mode === 'adjust' ? 'active' : ''}>Ajustar Existente</button>
      </div>

      {/* FORMULARIO SEGÚN MODO */}
      {mode === 'add' ? (
        <form onSubmit={handleAddSubmit} className="add-form">
          <h3>Añadir Nuevo Artículo</h3>
          <input name="name" placeholder="Nombre del Insumo/Producto" required />
          <input name="current_stock" type="number" step="0.01" placeholder="Stock Inicial" required />
          <select name="unit_of_measure" required>
            <option value="">-- Unidad --</option>
            <option value="Pza">Pieza</option>
            <option value="Lt">Litro</option>
            <option value="Kg">Kilo</option>
          </select>
          <input name="stock_threshold" type="number" step="0.01" placeholder="Umbral Mínimo" required />
          <hr />
          <input name="price" type="number" step="0.01" placeholder="Precio de Venta (si aplica)" />
          <select name="category_id">
            <option value="">-- Categoría de Menú (si es vendible) --</option>
            {categories.map(cat => <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input name="is_sellable" type="checkbox" value="true" /> Marcar como Producto Vendible
          </label>
          <button type="submit">Añadir al Inventario</button>
        </form>
      ) : (
        <form onSubmit={handleAdjustSubmit} className="add-form">
          <h3>Ajustar Stock de Artículo Existente</h3>
          <select name="supply_id" required>
            <option value="">-- Seleccionar Artículo --</option>
            {supplies.map(s => <option key={s.supply_id} value={s.supply_id}>{s.name}</option>)}
          </select>
          <input name="new_stock_quantity" type="number" step="0.01" placeholder="Nueva Cantidad Correcta" required />
          <input name="reason" placeholder="Motivo del ajuste (ej. Merma)" required />
          <button type="submit">Ajustar Stock</button>
        </form>
      )}

      {/* TABLA DE INVENTARIO */}
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Stock</th>
            <th>Precio Venta</th>
            <th>Vendible</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {supplies.map((s) => (
            <tr key={s.supply_id}>
              <td>{s.name}</td>
              <td>{s.current_stock} {s.unit_of_measure}</td>
              <td>{s.price ? `$${s.price.toFixed(2)}` : 'N/A'}</td>
              <td>{s.is_sellable ? '✅' : '❌'}</td>
              <td>
                <button onClick={() => handleDelete(s.supply_id)} className="reject-btn">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InventoryManager;
