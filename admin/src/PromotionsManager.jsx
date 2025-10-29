// admin/src/PromotionsManager.jsx
import { useState, useEffect } from 'react';

function PromotionsManager() {
  const [promotions, setPromotions] = useState([]);

  const fetchPromotions = () => {
    fetch('http://127.0.0.1:8000/api/promotions')
      .then(res => res.json())
      .then(data => setPromotions(Array.isArray(data) ? data : []));
  };

  useEffect(fetchPromotions, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newPromotion = Object.fromEntries(formData.entries());

    await fetch('http://127.0.0.1:8000/api/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPromotion),
    });

    e.target.reset();
    fetchPromotions();
  };

  return (
    <div className="module-container">
      <h2>Gestión de Promociones</h2>
      <form onSubmit={handleSubmit} className="add-form">
        <input name="name" placeholder="Nombre de la Promoción" required />
        <select name="type" required>
          <option value="">-- Tipo --</option>
          <option value="2x1">2x1</option>
          <option value="% descuento">% Descuento</option>
        </select>
        <input name="value" type="number" step="0.01" placeholder="Valor (ej. 15 para 15%)" />
        <input name="start_date" type="date" required />
        <input name="end_date" type="date" required />
        <button type="submit">Crear Promoción</button>
      </form>

      <table>
        <thead>
          <tr><th>Nombre</th><th>Tipo</th><th>Vigencia</th></tr>
        </thead>
        <tbody>
          {promotions.map((promo) => (
            <tr key={promo.promotion_id}>
              <td>{promo.name}</td>
              <td>{promo.type} {promo.value ? `(${promo.value}%)` : ''}</td>
              <td>{new Date(promo.start_date).toLocaleDateString()} - {new Date(promo.end_date).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default PromotionsManager;