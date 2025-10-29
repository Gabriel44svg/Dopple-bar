// web/components/Footer.js
async function getSettingsData() {
  const res = await fetch('http://127.0.0.1:8000/api/settings', { cache: 'no-store' });
  if (!res.ok) return {}; // Devuelve objeto vacío si falla
  return res.json();
}

export default async function Footer() {
  const settings = await getSettingsData();
  return (
    <footer className="bg-gray-900 text-gray-400 text-center p-4 mt-8 border-t border-gray-700">
      <p>{settings.address || 'Dirección no disponible'}</p>
      <p>{settings.opening_hours || 'Horarios no disponibles'}</p>
    </footer>
  );
}