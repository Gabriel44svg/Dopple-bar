// admin/src/CustomerDetail.jsx
import { useState, useEffect } from 'react';

function CustomerDetail({ customer, onBack }) {
  const [history, setHistory] = useState([]);
  const [tags, setTags] = useState([]); // estado para etiquetas

  const fetchTags = () => {
    fetch(`http://127.0.0.1:8000/api/customers/${customer.customer_id}/tags`)
      .then(res => res.json())
      .then(data => setTags(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    // Cargar historial y etiquetas
    fetch(`http://127.0.0.1:8000/api/customers/${customer.customer_id}/history`)
      .then(res => res.json())
      .then(data => setHistory(Array.isArray(data) ? data : []));
    fetchTags();
  }, [customer.customer_id]);

  const handleAddTag = async (e) => {
    e.preventDefault();
    const tagName = e.target.tagName.value.trim();
    if (!tagName) return;

    await fetch(`http://127.0.0.1:8000/api/customers/${customer.customer_id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag_name: tagName }),
    });

    e.target.reset();
    fetchTags(); // Recargar lista de etiquetas
  };

  return (
    <div className="module-container">
      <button onClick={onBack} className="back-btn" style={{ float: 'right' }}>Volver</button>
      <h2>Perfil de: {customer.full_name}</h2>
      <p><strong>Teléfono:</strong> {customer.phone}</p>
      <p><strong>Email:</strong> {customer.email}</p>

      {/* --- Módulo de Etiquetas --- */}
      <div className="tags-section" style={{ marginTop: '1rem' }}>
        <h3>Etiquetas</h3>
        <div className="tags-list" style={{ marginBottom: '0.5rem' }}>
          {tags.length > 0 ? (
            tags.map(tag => (
              <span key={tag.tag_id} className="tag">
                {tag.tag_name}
              </span>
            ))
          ) : (
            <p>No hay etiquetas</p>
          )}
        </div>
        <form onSubmit={handleAddTag} className="add-form" style={{ marginTop: '0.5rem' }}>
          <input name="tagName" placeholder="Añadir etiqueta (ej. VIP)" />
          <button type="submit">Añadir</button>
        </form>
      </div>

      {/* --- Historial --- */}
      <h3 style={{ marginTop: '1.5rem' }}>Historial de Consumo</h3>
      {history.length > 0 ? (
        history.map(order => (
          <div key={order.order_id} className="history-card">
            <h4>
              Orden: {order.order_folio} -{" "}
              {new Date(order.created_at).toLocaleDateString("es-MX")}
            </h4>
            <ul>
              {order.items.map((item, index) => (
                <li key={index}>
                  {item.quantity}x {item.name} - $
                  {item.price_at_time_of_order.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <p>No hay historial disponible</p>
      )}
    </div>
  );
}

export default CustomerDetail;
