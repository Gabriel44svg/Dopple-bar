// admin/src/ModelManager.jsx
import { useState } from 'react';

function ModelManager() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRetrain = async () => {
    if (!confirm("El reentrenamiento puede tardar varios minutos y consumirá recursos del servidor. ¿Deseas continuar?")) {
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('http://127.0.0.1:8000/api/models/retrain', { method: 'POST' });
      const data = await response.json();
      setMessage(data.message);
    } catch (err) {
      setMessage("Error al iniciar el proceso.");
    }
    setLoading(false);
  };

  return (
    <div className="module-container">
      <h2>Mantenimiento de Modelos (IA)</h2>
      <p>Actualiza los modelos de IA con los datos más recientes para mejorar la precisión de las predicciones.</p>
      <button onClick={handleRetrain} disabled={loading} className="submit-btn">
        {loading ? 'Re-entrenando...' : 'Re-entrenar Modelo de Demanda'}
      </button>
      {message && <p style={{marginTop: '1rem', color: 'lightgreen'}}>{message}</p>}
    </div>
  );
}
export default ModelManager;