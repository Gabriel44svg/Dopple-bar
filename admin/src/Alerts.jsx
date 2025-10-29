// admin/src/Alerts.jsx
import { useState, useEffect } from 'react';

function Alerts() {
  const [alerts, setAlerts] = useState([]);

  const fetchAlerts = () => {
    fetch('http://127.0.0.1:8000/api/alerts/unread')
      .then(res => res.json())
      .then(data => setAlerts(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Revisa cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (alertId) => {
    await fetch(`http://127.0.0.1:8000/api/alerts/${alertId}/read`, { method: 'PUT' });
    fetchAlerts(); // Recarga las alertas
  };

  if (alerts.length === 0) return null; // No muestra nada si no hay alertas

  return (
    <div className="alerts-container">
      {alerts.map(alert => (
        <div key={alert.alert_id} className="alert alert-warning">
          <span>{alert.message}</span>
          <button onClick={() => handleMarkAsRead(alert.alert_id)}>&times;</button>
        </div>
      ))}
    </div>
  );
}
export default Alerts;