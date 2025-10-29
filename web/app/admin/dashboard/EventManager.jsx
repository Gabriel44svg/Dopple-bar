"use client";
import { useState, useEffect } from "react";
import { fetchEvents, createEvent, deleteEvent } from "@/lib/api";

export default function EventManager() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [file, setFile] = useState(null);

  // Cargar eventos al inicio
  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddEvent(e) {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("event_date", eventDate);
      if (file) formData.append("file", file);

      await createEvent(formData);
      setTitle("");
      setDescription("");
      setEventDate("");
      setFile(null);
      loadEvents();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar este evento?")) return;
    try {
      await deleteEvent(id);
      loadEvents();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Gestión de Eventos</h2>

      <form onSubmit={handleAddEvent} style={{ marginBottom: "2rem" }}>
        <input
          type="text"
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
        />
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button type="submit">Crear Evento</button>
      </form>

      <ul>
        {events.map((ev) => (
          <li key={ev.event_id}>
            <strong>{ev.title}</strong> ({ev.event_date})  
            <button onClick={() => handleDelete(ev.event_id)}>❌ Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
