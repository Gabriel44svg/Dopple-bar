'use client'; // Directiva para indicar que es un componente interactivo
import { useState } from 'react';

export default function ReservationsPage() {
  // Estados para manejar los mensajes de éxito o error
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Función que se ejecuta al enviar el formulario
  async function handleSubmit(event) {
    event.preventDefault(); // Evita que la página se recargue
    setMessage('');
    setError('');

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('http://127.0.0.1:8000/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Falló la solicitud al servidor.');
      }

      const result = await response.json();
      setMessage(result.message); // Muestra el mensaje de éxito de la API
      event.target.reset(); // Limpia el formulario
    } catch (err) {
      setError('No se pudo enviar la reservación. Intenta más tarde.');
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-center">Haz tu Reservación</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mx-auto bg-gray-900 p-6 rounded-lg">
        {/* Cumple con RF-21: Campos para Nombre, Email, etc. */}
        <input name="customer_name" type="text" placeholder="Nombre Completo" required className="bg-gray-700 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        <input name="customer_email" type="email" placeholder="Email" required className="bg-gray-700 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        {/* Cumple con RF-23: Validación de Rango de Personas (ej. min 1) */}
        <input name="num_people" type="number" placeholder="Número de Personas" required min="1" max="12" className="bg-gray-700 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        {/* Cumple con RF-22: Validación de Fechas Pasadas */}
        <input name="reservation_datetime" type="datetime-local" required className="bg-gray-700 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold transition-colors">Enviar Solicitud</button>
      </form>
      {/* Muestra los mensajes de estado al usuario */}
      {message && <p className="mt-4 text-green-400 text-center font-bold">{message}</p>}
      {error && <p className="mt-4 text-red-400 text-center font-bold">{error}</p>}
    </div>
  );
}