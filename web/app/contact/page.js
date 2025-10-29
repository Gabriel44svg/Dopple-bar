// web/app/contact/page.js
async function getSettingsData() {
  const res = await fetch('http://127.0.0.1:8000/api/settings', { cache: 'no-store' });
  if (!res.ok) return {};
  return res.json();
}

export default async function ContactPage() {
  const settings = await getSettingsData();

  // Codificamos la dirección para que sea segura en una URL
  const encodedAddress = encodeURIComponent(settings.address || "FES Acatlán, Naucalpan de Juárez, México");

  // Creamos la URL para el mapa de Google Maps
  const mapSrc = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-center">Contáctanos</h1>
      <div className="contact-container">
        <div className="contact-info">
          <h3>Nuestra Ubicación</h3>
          <p>{settings.address || 'Dirección no disponible'}</p>
          <h3>Teléfono</h3>
          <p>{settings.phone || 'Teléfono no disponible'}</p>
          <h3>Horarios</h3>
          <p>{settings.opening_hours || 'Horarios no disponibles'}</p>
        </div>
        <div className="map-container">
          <iframe
            width="100%"
            height="450"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={mapSrc}>
          </iframe>
        </div>
      </div>
    </div>
  );
}