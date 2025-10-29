import { useState, useEffect } from 'react';

function EventManager() {
  const [events, setEvents] = useState([]);

  const fetchEvents = () => {
    fetch('http://127.0.0.1:8000/api/events')
      .then(res => res.json())
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]));
  };

  useEffect(fetchEvents, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target); // soporta archivos

    await fetch('http://127.0.0.1:8000/api/events', {
      method: 'POST',
      body: formData, // No poner headers, FormData los maneja
    });

    e.target.reset();
    fetchEvents();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este evento?")) return;

    await fetch(`http://127.0.0.1:8000/api/events/${id}`, {
      method: "DELETE",
    });

    fetchEvents();
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="module-container">
      <h2>Gestión de Eventos</h2>

      <form 
        onSubmit={handleSubmit} 
        className="add-form" 
        style={{ flexDirection: 'column', gap: '1rem' }}
      >
        <input name="title" placeholder="Título del Evento" required />
        <textarea name="description" placeholder="Descripción"></textarea>
        <input name="event_date" type="date" min={today} required />
        <label>Imagen de Portada (Opcional)</label>
        <input name="file" type="file" accept="image/*" />
        <button type="submit">Crear Evento</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Evento</th>
            <th>Fecha</th>
            <th>Imagen</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id || event.event_id}>
              <td>{event.title}</td>
              <td>{new Date(event.event_date).toLocaleDateString('es-MX')}</td>
              <td>
                {event.cover_image_path ? (
                  <img 
                    src={`http://127.0.0.1:8000${event.cover_image_path}`} 
                    alt={event.title} 
                    style={{ width: "80px", height: "auto", borderRadius: "6px" }} 
                  />
                ) : (
                  "Sin imagen"
                )}
              </td>
              <td>
                <button 
                  onClick={() => handleDelete(event.id || event.event_id)} 
                  style={{ background: "red", color: "white", border: "none", padding: "5px 10px", cursor: "pointer" }}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EventManager;
