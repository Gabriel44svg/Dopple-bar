import { useState, useEffect } from 'react';

function DashboardKPIs() {
  const [kpis, setKpis] = useState({
    total_sales: 0,
    order_count: 0,
    average_ticket: 0,
  });

  // Nuevos estados para KPIs adicionales
  const [reservationsKpi, setReservationsKpi] = useState({ percentage_change: 0 });
  const [wasteKpi, setWasteKpi] = useState({ percentage_change: 0 });

  useEffect(() => {
    // KPI de ventas, órdenes y ticket promedio
    fetch('http://127.0.0.1:8000/api/reports/daily-kpis')
      .then(res => res.json())
      .then(data => setKpis(data));

    // KPI de reservaciones
    fetch('http://127.0.0.1:8000/api/reports/reservations-kpi')
      .then(res => res.json())
      .then(data => setReservationsKpi(data));

    // KPI de mermas
    fetch('http://127.0.0.1:8000/api/reports/waste-kpi')
      .then(res => res.json())
      .then(data => setWasteKpi(data));
  }, []);

  return (
    <div className="kpi-container">
      <div className="kpi-card">
        <h3>Ventas Totales del Día</h3>
        <span>${kpis.total_sales.toFixed(2)}</span>
      </div>
      <div className="kpi-card">
        <h3>Nº de Órdenes</h3>
        <span>{kpis.order_count}</span>
      </div>
      <div className="kpi-card">
        <h3>Ticket Promedio</h3>
        <span>${kpis.average_ticket.toFixed(2)}</span>
      </div>

      {/* KPI de Reservaciones */}
      <div className="kpi-card">
        <h3>Reservaciones (vs Mes Pasado)</h3>
        <span style={{ color: reservationsKpi.percentage_change >= 0 ? 'lightgreen' : 'salmon' }}>
          {reservationsKpi.percentage_change.toFixed(1)}%
        </span>
      </div>

      {/* KPI de Mermas */}
      <div className="kpi-card">
        <h3>Mermas (vs Mes Pasado)</h3>
        <span style={{ color: wasteKpi.percentage_change <= 0 ? 'lightgreen' : 'salmon' }}>
          {wasteKpi.percentage_change.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

export default DashboardKPIs;
