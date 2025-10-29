// admin/src/MenuManager.jsx
import { useState, useEffect } from 'react';

// --- Componente para el Modal de Edición ---
function EditProductModal({ product, categories, user, onSave, onCancel }) {
  const [formData, setFormData] = useState(product);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, user_id: user.user_id });
  };

  // El rol "Dueño" tiene el ID 1
  const canEditPrice = user.role_id === 1;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Editar Producto: {product.name}</h2>
        <form onSubmit={handleSubmit} className="settings-form">
          <label>Nombre del Producto</label>
          <input name="name" value={formData.name} onChange={handleChange} required />

          <label>Descripción</label>
          <textarea name="description" value={formData.description || ''} onChange={handleChange}></textarea>

          <label>Categoría</label>
          <select name="category_id" value={formData.category_id} onChange={handleChange} required>
            {(categories || []).map(cat => (
              <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
            ))}
          </select>

          <label>Precio</label>
          <input 
            name="price" 
            type="number" 
            step="0.01" 
            value={formData.price} 
            onChange={handleChange} 
            disabled={!canEditPrice} // <-- LÓGICA DE PERMISOS (RF-83)
            title={!canEditPrice ? "Solo el Dueño puede cambiar el precio" : ""}
            required 
          />

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input 
              name="is_recommended" 
              type="checkbox" 
              checked={!!formData.is_recommended} 
              onChange={handleChange} 
            />
            <label>¿Es Recomendado?</label>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="back-btn">Cancelar</button>
            <button type="submit" className="submit-btn">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Componente Principal ---
function MenuManager({ user }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null); // Estado para controlar el modal

  // --- Obtener categorías ---
  const fetchCategories = () => {
    fetch('http://127.0.0.1:8000/api/menu-categories')
      .then(res => res.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error al cargar categorías:", err));
  };

  // --- Obtener productos ---
  const fetchProducts = () => {
    fetch('http://127.0.0.1:8000/api/products')
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error al cargar productos:", err));
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  // --- Crear categoría ---
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newCategory = Object.fromEntries(formData.entries());

    await fetch('http://127.0.0.1:8000/api/menu-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCategory),
    });

    e.target.reset();
    fetchCategories();
  };

  // --- Crear producto ---
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newProduct = Object.fromEntries(formData.entries());

    await fetch('http://127.0.0.1:8000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct),
    });

    e.target.reset();
    fetchProducts();
  };

  // --- Guardar cambios al editar producto ---
  const handleSaveProduct = async (updatedProduct) => {
    await fetch(`http://127.0.0.1:8000/api/products/${updatedProduct.product_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProduct),
    });
    setEditingProduct(null); // Cierra el modal
    fetchProducts(); // Recarga la lista
  };

  // --- Eliminar producto ---
  const handleDeleteProduct = async (productId) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este producto?")) return;
    await fetch(`http://127.0.0.1:8000/api/products/${productId}`, { method: 'DELETE' });
    fetchProducts();
  };

  return (
    <div className="module-container">
      {editingProduct && (
        <EditProductModal 
          product={editingProduct} 
          categories={categories}
          user={user}
          onSave={handleSaveProduct} 
          onCancel={() => setEditingProduct(null)} 
        />
      )}

      <h2>Gestión de Menú</h2>
      <div className="menu-management-layout">
        
        {/* --- Sección Categorías (RF-81) --- */}
        <div className="management-section">
          <h3>Categorías</h3>
          <form onSubmit={handleCategorySubmit} className="add-form">
            <input name="name" placeholder="Nombre de Categoría" required />
            <button type="submit">Crear Categoría</button>
          </form>
          <table>
            <thead><tr><th>Nombre</th></tr></thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.category_id}><td>{cat.name}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- Sección Productos (RF-82) --- */}
        <div className="management-section">
          <h3>Productos</h3>
          <form onSubmit={handleProductSubmit} className="add-form" style={{flexDirection: 'column'}}>
            <input name="name" placeholder="Nombre del Producto" required />
            <input name="price" type="number" step="0.01" placeholder="Precio" required />
            <textarea name="description" placeholder="Descripción del producto..."></textarea>
            <select name="category_id" required>
              <option value="">-- Asignar Categoría --</option>
              {categories.map(cat => (
                <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
              ))}
            </select>
            <button type="submit">Crear Producto</button>
          </form>

          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.product_id}>
                  <td>{p.name}</td>
                  <td>{p.category_name}</td>
                  <td>${p.price.toFixed(2)}</td>
                  <td className="actions">
                    <button onClick={() => setEditingProduct(p)} className="note-btn">Editar</button>
                    <button onClick={() => handleDeleteProduct(p.product_id)} className="reject-btn">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default MenuManager;
