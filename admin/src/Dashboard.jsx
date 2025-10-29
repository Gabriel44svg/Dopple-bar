// admin/src/Dashboard.jsx
import { useState, useEffect } from 'react';
import TrainingModeToggle from './TrainingModeToggle';
import ReservationsManager from './ReservationsManager';
import TableMap from './TableMap';
import OrderView from './OrderView';
import Clock from './Clock';
import InventoryManager from './InventoryManager';
import SupplierManager from './SupplierManager';
import PurchaseOrderManager from './PurchaseOrderManager';
import Reports from './Reports';
import PurchaseOrderDetail from './PurchaseOrderDetail';
import PromotionsManager from './PromotionsManager';
import SettingsManager from './SettingsManager';
import GalleryManager from './GalleryManager';
import EventManager from './EventManager';
import UserManager from './UserManager';
import AttendanceReport from './AttendanceReport';
import ActiveOrders from './ActiveOrders';
import TableManager from './TableManager';
import RecipeManager from './RecipeManager';
import Alerts from './Alerts';
import DashboardKPIs from './DashboardKPIs';
import MenuManager from './MenuManager';
import ManagementMisc from './ManagementMisc';
import AuditLogViewer from './AuditLogViewer';
import DemandForecaster from './DemandForecaster';
import PriceOptimizer from './PriceOptimizer';
import PromotionSuggester from './PromotionSuggester';
import OccupancyForecaster from './OccupancyForecaster';
import ModelManager from './ModelManager';
import CustomerManager from './CustomerManager';
// import ChatbotIA from './ChatbotIA'; // Comentado: requiere OpenAI de pago
import AdminChatbot from './AdminChatbot';
import AdminChat from './AdminChat';

function Dashboard({ user, onLogout, isTraining, onToggleTraining }) {
  const [activeOrder, setActiveOrder] = useState(null);
  const [selectedPoId, setSelectedPoId] = useState(null);
  const [openOrders, setOpenOrders] = useState([]);

  // Función para recargar órdenes activas
  const fetchOpenOrders = () => {
    fetch('http://127.0.0.1:8000/api/orders/open')
      .then(res => res.json())
      .then(data => setOpenOrders(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error cargando órdenes:", err));
  };

  useEffect(() => {
    fetchOpenOrders();
  }, []);

  // Vista de detalle de orden
  if (activeOrder) {
    return (
      <OrderView
        order={activeOrder}
        user={user}
        onBack={() => { setActiveOrder(null); fetchOpenOrders(); }}
      />
    );
  }

  // Vista de detalle de Purchase Order
  if (selectedPoId) {
    return (
      <PurchaseOrderDetail
        poId={selectedPoId}
        onBack={() => setSelectedPoId(null)}
      />
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Panel de Control</h1>
        {user.role_id !== 3 && (
          <TrainingModeToggle isTraining={isTraining} onToggle={onToggleTraining} />
        )}
        <span>Bienvenido, {user.full_name}</span>
        <button onClick={onLogout} className="logout-btn">
          Cerrar Sesión
        </button>
      </div>

      {/* KPIs y reloj */}
      <DashboardKPIs />
      <Clock />

      {/* Operaciones */}
      <TableMap onTableSelect={setActiveOrder} onOrderCreated={fetchOpenOrders} />
      <ActiveOrders openOrders={openOrders} onOrderSelect={setActiveOrder} />

      {/* Gestión y administración */}
      <ReservationsManager />
      <InventoryManager />
      <SupplierManager />
      <CustomerManager />
      <PurchaseOrderManager onOrderSelect={setSelectedPoId} />
      <PromotionsManager />
      <GalleryManager />
      <EventManager />
      <SettingsManager />
      <ManagementMisc />
      <UserManager />
      <AttendanceReport />
      <RecipeManager />
      <Alerts />
      <MenuManager user={user} />
      <AuditLogViewer />
      <Reports />
      <DemandForecaster />
      <PriceOptimizer />
      <PromotionSuggester />
      <OccupancyForecaster />
      <ModelManager />
      <TableManager />
      <AdminChatbot />
      <AdminChat />
    </div>
  );
}

export default Dashboard;