// admin/src/SettingsManager.jsx
import { useState, useEffect } from 'react';

function SettingsManager() {
  // Ampliamos el estado para incluir las nuevas URLs
  const [settings, setSettings] = useState({
    address: '',
    opening_hours: '',
    phone: '',
    social_facebook_url: '',
    social_instagram_url: ''
  });

  useEffect(() => {
    // Carga la configuración actual al iniciar
    fetch('http://127.0.0.1:8000/api/settings')
      .then(res => res.json())
      .then(data => setSettings(prev => ({ ...prev, ...data })));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:8000/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error("No se pudo guardar la configuración.");
      alert('¡Configuración guardada con éxito!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="module-container">
      <h2>Configuración General del Negocio</h2>
      <form onSubmit={handleSubmit} className="settings-form">
        <label>Dirección</label>
        <input name="address" value={settings.address || ''} onChange={handleChange} />

        <label>Horarios</label>
        <input name="opening_hours" value={settings.opening_hours || ''} onChange={handleChange} />

        <label>Teléfono</label>
        <input name="phone" value={settings.phone || ''} onChange={handleChange} />

        {/* --- NUEVOS CAMPOS (RF-06) --- */}
        <label>URL de Facebook</label>
        <input name="social_facebook_url" type="url" value={settings.social_facebook_url || ''} onChange={handleChange} placeholder="https://facebook.com/dopplerbar" />

        <label>URL de Instagram</label>
        <input name="social_instagram_url" type="url" value={settings.social_instagram_url || ''} onChange={handleChange} placeholder="https://instagram.com/dopplerbar" />

        <button type="submit" className="submit-btn">Guardar Cambios</button>
      </form>
    </div>
  );
}
export default SettingsManager;