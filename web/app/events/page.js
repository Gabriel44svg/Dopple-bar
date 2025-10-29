// web/app/events/page.js
async function getEventsData() {
  const res = await fetch('http://127.0.0.1:8000/api/events', { cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudo cargar los eventos');
  return res.json();
}
export default async function EventsPage() {
  const events = await getEventsData();
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Próximos Eventos</h1>
      <div className="space-y-4">
        {(events || []).map(event => (
          <div key={event.event_id} className="bg-gray-900 rounded-lg flex gap-4">
            {event.cover_image_path && (
              <img src={`http://127.0.0.1:8000${event.cover_image_path}`} alt={event.title} className="event-cover-image" />
            )}
            <div className="p-4">
              <h2 className="text-xl font-bold text-blue-400">{event.title}</h2>
              <p className="text-gray-400">{new Date(event.event_date).toLocaleDateString('es-MX', { dateStyle: 'full' })}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}