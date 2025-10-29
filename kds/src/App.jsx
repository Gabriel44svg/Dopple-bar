import { useState, useEffect } from 'react';
import './App.css';
import KdsLogin from './KdsLogin';
import ChatBarra from './ChatBarra';

// --- CONFIGURACIÓN DE LA ESTACIÓN ---
const KDS_STATION = 'Barra'; // Cambia a 'Cocina' para otra estación

function App() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // --- Función para cargar órdenes según estación ---
  const fetchOrders = () => {
    const token = localStorage.getItem('token');
    fetch(`http://127.0.0.1:8000/api/kds/orders?station=${KDS_STATION}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error al cargar las órdenes:", err));
  };

  // --- Función para cargar resumen según estación ---
  const fetchSummary = () => {
    const token = localStorage.getItem('token');
    fetch(`http://127.0.0.1:8000/api/kds/summary?station=${KDS_STATION}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setSummary(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error al cargar el resumen:", err));
  };

  // --- Cargar datos ---
  const fetchData = () => {
    if (user) {
      fetchOrders();
      fetchSummary();
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // --- Marcar orden como lista ---
  const handleOrderReady = async (orderId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/kds/orders/${orderId}/ready`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Respuesta no exitosa del servidor.');
      }
      console.log(`Orden ${orderId} marcada como lista.`);
      fetchData();
    } catch (error) {
      console.error("Error al marcar la orden como lista:", error);
      alert(`No se pudo marcar la orden como lista: ${error.message}`);
    }
  };

  // --- Manejar click en item individual ---
  const handleItemClick = async (item) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/kds/items/${item.id}/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error al actualizar item.');
      fetchData();
    } catch (error) {
      console.error("Error al actualizar el item:", error);
      alert(`No se pudo actualizar el item: ${error.message}`);
    }
  };

  if (!user) {
    return <KdsLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="kds-layout">
      <button onClick={handleLogout} className="logout-btn">Cerrar sesión</button>
      
      <div className="summary-panel">
        <h2>Resumen Pendiente - {KDS_STATION}</h2>
        <ul>
          {summary.map((item, index) => (
            <li key={index}>
              <span className="quantity">{item.total_pending}x</span> {item.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="kds-container">
        <h1>Comandas Pendientes - {KDS_STATION}</h1>
        <div className="orders-grid">
          {(orders || []).map(order => (
            <div
              key={order.order_id}
              className={`order-ticket ${order.is_priority ? 'priority' : ''}`}
            >
              <h3>{order.table_name}</h3>
              <h4>{order.order_folio}</h4>
              <ul>
                {JSON.parse(order.items || '[]').map((item, index) => (
                  <li
                    key={index}
                    className={`item-status-${item.status.toLowerCase().replace(' ', '-')}`}
                    onClick={() => handleItemClick(item)}
                  >
                    <span className="quantity">{item.quantity}x</span> {item.name}
                    {item.notes && <em className="notes"> - {item.notes}</em>}
                  </li>
                ))}
              </ul>
              <button
                className="ready-btn"
                onClick={() => handleOrderReady(order.order_id)}
              >
                ORDEN COMPLETA
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* --- Chat Barra --- */}
      <ChatBarra />
    </div>
  );
}

export default App;
