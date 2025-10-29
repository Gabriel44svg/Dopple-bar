// admin/src/App.jsx
import { useState, useEffect } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';
import OrderView from './OrderView';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [isTrainingMode, setIsTrainingMode] = useState(false); // <-- Nuevo estado

  // Al cargar la app, revisa si hay un usuario guardado
  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    // Guarda el token y los datos del usuario en localStorage
    localStorage.setItem("token", userData.access_token);
    localStorage.setItem("user", JSON.stringify(userData.user));
    setUser(userData.user);
  };

  const handleLogout = () => {
    // Limpia el almacenamiento local para cerrar la sesión
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Si hay una orden activa, le pasamos el estado de entrenamiento
  if (activeOrder) {
    return (
      <OrderView
        order={activeOrder}
        user={user}
        isTraining={isTrainingMode} // <-- Pasa el estado
        onBack={() => setActiveOrder(null)}
      />
    );
  }

  // Si no, mostramos el dashboard con el interruptor
  return (
    <Dashboard
      user={user}
      onLogout={handleLogout}
      onOrderSelect={setActiveOrder}
      isTraining={isTrainingMode} // <-- Pasa el estado
      onToggleTraining={() => setIsTrainingMode(!isTrainingMode)} // <-- Toggle
    />
  );
}

export default App;
