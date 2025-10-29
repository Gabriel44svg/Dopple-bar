// admin/src/Reports.jsx
import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// --- Registrar los componentes de Chart.js ---
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Reports() {
  const [topProducts, setTopProducts] = useState([]);
  const [promoReport, setPromoReport] = useState([]);
  const [cashFlow, setCashFlow] = useState([]);
  const [profitReport, setProfitReport] = useState([]);
  const [frequentCustomers, setFrequentCustomers] = useState([]); // <-- Nuevo estado
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  // --- Función para cargar todos los reportes ---
  const fetchReports = () => {
    const date = reportDate;

    // Productos más vendidos
    fetch(`http://127.0.0.1:8000/api/reports/top-products?start_date=${date}&end_date=${date}`)
      .then(res => res.json())
      .then(data => setTopProducts(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error al cargar top products:", err));

    // Promociones
    fetch(`http://127.0.0.1:8000/api/reports/promotions?start_date=${date}&end_date=${date}`)
      .then(res => res.json())
      .then(data => setPromoReport(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error al cargar reporte de promos:", err));

    // Corte de caja
    fetch(`http://127.0.0.1:8000/api/reports/cash-flow?start_date=${date}&end_date=${date}`)
      .then(res => res.json())
      .then(data => setCashFlow(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error al cargar cash-flow:", err));

    // Rentabilidad
    fetch(`http://127.0.0.1:8000/api/reports/profitability?start_date=${date}&end_date=${date}`)
      .then(res => res.json())
      .then(data => setProfitReport(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error al cargar rentabilidad:", err));

    // Clientes frecuentes (RF-146)
    fetch(`http://127.0.0.1:8000/api/reports/frequent-customers?start_date=${date}&end_date=${date}`)
      .then(res => res.json())
      .then(data => setFrequentCustomers(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error al cargar clientes frecuentes:", err));
  };

  useEffect(fetchReports, [reportDate]);

  // Total de ventas del día
  const totalSales = cashFlow.reduce((sum, item) => sum + item.total_amount, 0);

  // Exportar a CSV
  const handleExport = (data, filename) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Datos para el gráfico de productos más vendidos
  const chartData = {
    labels: topProducts.map(p => p.name),
    datasets: [{
      label: 'Unidades Vendidas',
      data: topProducts.map(p => p.total_sold),
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
    }]
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h2>Reportes del Día</h2>
        <input 
          type="date" 
          value={reportDate} 
          onChange={e => setReportDate(e.target.value)} 
        />
      </div>

      {/* Corte de Caja */}
      <div className="report-widget">
        <h3>Corte de Caja del {new Date(reportDate).toLocaleDateString('es-MX')}</h3>
        <table>
          <tbody>
            {(cashFlow || []).map((item, i) => (
              <tr key={`cash-${i}`}>
                <td>Total {item.payment_method}:</td>
                <td>${item.total_amount.toFixed(2)}</td>
              </tr>
            ))}
            <tr style={{fontWeight: 'bold', borderTop: '1px solid #555'}}>
              <td>Venta Total del Día:</td>
              <td>${totalSales.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Productos Más Vendidos */}
      <div className="report-widget" style={{marginTop: '2rem'}}>
        <h3>Productos Más Vendidos</h3>
        <div style={{height: '300px', marginBottom: '2rem'}}>
          <Bar data={chartData} options={{ maintainAspectRatio: false }} />
        </div>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Unidades Vendidas</th>
            </tr>
          </thead>
          <tbody>
            {(topProducts || []).map((product, index) => (
              <tr key={`product-${index}`}>
                <td>{product.name}</td>
                <td>{product.total_sold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Promociones */}
      <div className="report-widget" style={{marginTop: '2rem'}}>
        <h3>Desempeño de Promociones</h3>
        <table>
          <thead>
            <tr>
              <th>Promoción</th>
              <th>Veces Usada</th>
              <th>Descuento Total Otorgado</th>
            </tr>
          </thead>
          <tbody>
            {(promoReport || []).map((promo, index) => (
              <tr key={`promo-${index}`}>
                <td>{promo.name}</td>
                <td>{promo.times_used}</td>
                <td>${promo.total_discount ? promo.total_discount.toFixed(2) : '0.00'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rentabilidad */}
      <div className="report-widget" style={{marginTop: '2rem'}}>
        <div className="module-header">
          <h3>Reporte de Rentabilidad</h3>
          <button 
            onClick={() => handleExport(profitReport, 'reporte_rentabilidad.csv')} 
            className="export-btn"
          >
            Exportar a CSV
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Unidades Vendidas</th>
              <th>Precio Venta</th>
              <th>Costo Receta</th>
              <th>Margen Ganancia</th>
              <th>Ganancia Total</th>
            </tr>
          </thead>
          <tbody>
            {(profitReport || []).map((item, i) => (
              <tr key={i}>
                <td>{item.name}</td>
                <td>{item.units_sold}</td>
                <td>${(item.sale_price || 0).toFixed(2)}</td>
                <td>${(item.recipe_cost || 0).toFixed(2)}</td>
                <td>${(item.profit_margin || 0).toFixed(2)}</td>
                <td>${(item.total_profit || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Clientes Frecuentes (RF-146) */}
      <div className="report-widget" style={{marginTop: '2rem'}}>
        <h3>Clientes Frecuentes</h3>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Número de Visitas</th>
              <th>Gasto Total</th>
            </tr>
          </thead>
          <tbody>
            {(frequentCustomers || []).map((customer, i) => (
              <tr key={i}>
                <td>{customer.full_name}</td>
                <td>{customer.visit_count}</td>
                <td>${(customer.total_spent || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default Reports;
