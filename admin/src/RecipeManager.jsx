import { useState, useEffect } from 'react';

function RecipeManager() {
  const [products, setProducts] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [recipe, setRecipe] = useState([]);
  const [recipeCost, setRecipeCost] = useState(0); // Costo total de la receta

  useEffect(() => {
    // Cargar productos y insumos para los menús desplegables
    fetch('http://127.0.0.1:8000/api/menu')
      .then(res => res.json())
      .then(setProducts);

    fetch('http://127.0.0.1:8000/api/inventory/supplies')
      .then(res => res.json())
      .then(setSupplies);
  }, []);

  useEffect(() => {
    // Cada vez que se selecciona un producto, carga su receta y costo
    if (selectedProductId) {
      fetch(`http://127.0.0.1:8000/api/products/${selectedProductId}/recipe`)
        .then(res => res.json())
        .then(data => setRecipe(Array.isArray(data) ? data : []));

      fetch(`http://127.0.0.1:8000/api/products/${selectedProductId}/recipe-cost`)
        .then(res => res.json())
        .then(data => setRecipeCost(data.total_cost || 0));
    } else {
      setRecipe([]);
      setRecipeCost(0);
    }
  }, [selectedProductId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newItem = {
      supply_id: parseInt(formData.get('supply_id')),
      quantity_used: parseFloat(formData.get('quantity_used'))
    };

    // Añadir insumo a la receta
    await fetch(`http://127.0.0.1:8000/api/products/${selectedProductId}/recipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });

    e.target.reset();

    // Recargar la receta y el costo
    fetch(`http://127.0.0.1:8000/api/products/${selectedProductId}/recipe`)
      .then(res => res.json())
      .then(data => setRecipe(Array.isArray(data) ? data : []));

    fetch(`http://127.0.0.1:8000/api/products/${selectedProductId}/recipe-cost`)
      .then(res => res.json())
      .then(data => setRecipeCost(data.total_cost || 0));
  };

  return (
    <div className="module-container">
      <h2>Definición de Recetas</h2>

      {/* Selector de producto */}
      <div className="add-form">
        <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} required>
          <option value="">-- Seleccionar Producto --</option>
          {products.map(p => <option key={p.product_id} value={p.product_id}>{p.name}</option>)}
        </select>
      </div>

      {selectedProductId && (
        <>
          {/* Formulario para añadir insumos */}
          <form onSubmit={handleSubmit} className="add-form" style={{marginTop: '1rem'}}>
            <select name="supply_id" required>
              <option value="">-- Seleccionar Insumo --</option>
              {supplies.map(s => <option key={s.supply_id} value={s.supply_id}>{s.name} ({s.unit_of_measure})</option>)}
            </select>
            <input name="quantity_used" type="number" step="0.001" placeholder="Cantidad Usada" required />
            <button type="submit">Añadir Insumo</button>
          </form>

          {/* Costo total de la receta */}
          <div className="order-total" style={{textAlign: 'right', marginTop: '1rem'}}>
            <strong>Costo Total de Receta: ${recipeCost.toFixed(2)}</strong>
          </div>

          {/* Tabla de la receta */}
          <table>
            <thead>
              <tr>
                <th>Insumo en Receta</th>
                <th>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {recipe.map(item => (
                <tr key={item.recipe_id}>
                  <td>{item.supply_name}</td>
                  <td>{item.quantity_used} {item.unit_of_measure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default RecipeManager;
